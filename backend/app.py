import json
import os
import re
import sqlite3
import uvicorn
import requests
from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import google.generativeai as genai
from dotenv import load_dotenv
from googleapiclient.discovery import build
import time
import logging
from youtube_search import YoutubeSearch
from newspaper import Article, Config
from newspaper.article import ArticleException
from xml.etree import ElementTree
from contextlib import asynccontextmanager
import asyncio
import threading
import yt_dlp
import tiktoken
import math
from supabase import create_client, Client

# --- Configuration ---
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

load_dotenv()

# --- Concurrency Limiter for LLM ---
LLM_CONCURRENCY = 10 # Max parallel requests to Gemini API to avoid rate limiting
llm_semaphore = asyncio.Semaphore(LLM_CONCURRENCY)

# --- Rate Limiter for RPM ---
REQUEST_LIMIT_PER_MINUTE = 120 # Increased for Gemini 2.0 Flash
_request_timestamps = []
_request_lock = asyncio.Lock()

async def rpm_limiter():
    """Limits requests per minute to avoid 429 errors."""
    async with _request_lock:
        now = time.time()
        # Remove timestamps older than 60 seconds
        _request_timestamps[:] = [t for t in _request_timestamps if now - t < 60]

        if len(_request_timestamps) >= REQUEST_LIMIT_PER_MINUTE:
            # Time to wait is until the oldest request is more than 60 seconds old
            wait_time = _request_timestamps[0] + 60 - now
            if wait_time > 0:
                logger.warning(f"Request rate limit nearly reached. Waiting {wait_time:.2f} seconds to stay within quota.")
                await asyncio.sleep(wait_time)

        # Add the new request timestamp
        _request_timestamps.append(time.time())


# 


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)


# Configure Gemini API Models
llm_model_reasoning = None
llm_model_fast = None

# YouTube Data API Setup
youtube_data_api_key = os.getenv("YOUTUBE_DATA_API_KEY")
youtube_service = None
if youtube_data_api_key:
    try:
        youtube_service = build('youtube', 'v3', developerKey=youtube_data_api_key)
        logger.info("YouTube Data API service initialized successfully.")
    except Exception as e:
        logger.error(f"Error initializing YouTube Data API service: {e}")
else:
    logger.warning("YOUTUBE_DATA_API_KEY not found. Some YouTube video details might be missing.")

# Gemini API Configuration
try:
    gemini_api_key = os.getenv("GEMINI_API_KEY")
    if not gemini_api_key:
        raise ValueError("GEMINI_API_KEY not found in environment variables.")
    genai.configure(api_key=gemini_api_key)
    
    logger.info("\nFetching Available Gemini Models...")
    available_models = [m for m in genai.list_models() if 'generateContent' in m.supported_generation_methods]
    available_model_names = [m.name for m in available_models]
    logger.info(f"Available and supported models: {', '.join(available_model_names)}")

    preferred_reasoning_model = 'models/gemini-2.0-flash'
    preferred_fast_model = 'models/gemini-2.0-flash'

    if preferred_reasoning_model in available_model_names:
        llm_model_reasoning = genai.GenerativeModel(preferred_reasoning_model)
        logger.info(f"Using {preferred_reasoning_model} for reasoning tasks.")
    elif available_models:
        llm_model_reasoning = genai.GenerativeModel(available_models[0].name)
        logger.info(f"Reasoning model fallback: {available_models[0].name}")
    else:
        llm_model_reasoning = None
        logger.error(f"Preferred reasoning model {preferred_reasoning_model} not available. No fallback to deprecated or unsupported models.")

    if preferred_fast_model in available_model_names:
        llm_model_fast = genai.GenerativeModel(preferred_fast_model)
        logger.info(f"Using {preferred_fast_model} for fast subtasks.")
    elif available_models:
        llm_model_fast = genai.GenerativeModel(available_models[0].name)
        logger.info(f"Fast model fallback: {available_models[0].name}")
    else:
        llm_model_fast = None
        logger.error(f"Preferred fast model {preferred_fast_model} not available. No fallback to deprecated or unsupported models.")

    logger.info("------------------------\n")

except Exception as e:
    logger.error(f"Error configuring Gemini or listing models: {e}")


# --- Helper Functions for Data Aggregation ---

def search_youtube_videos(product1_name, product2_name, max_results=3):
    """Searches YouTube for comparison videos."""
    logger.info(f"Searching YouTube using youtube-search for: '{product1_name} vs {product2_name}'")
    search_query = f"{product1_name} vs {product2_name} review comparison"
    videos = []
    try:
        results = YoutubeSearch(search_query, max_results=max_results).to_dict()

        if results:
            for item in results:
                video_id = item.get('id')
                video_title = item.get('title')
                video_url = f"https://www.youtube.com{item.get('url_suffix')}"
                
                # youtube-search does not have a clear way to filter live videos before fetching details.
                # The old library checked for a 'LIVE' duration or type='live'.
                # We will proceed without this check for now.
                
                if video_id and video_title and video_url:
                    videos.append({'id': video_id, 'title': video_title, 'url': video_url})
                else:
                    logger.warning(f"Skipping a YouTube search result due to missing id, title, or url_suffix: {item}")
            logger.info(f"Found {len(videos)} YouTube videos using youtube-search for '{product1_name} vs {product2_name}'.")
        else:
            logger.warning(f"No results found from youtube-search for query: '{search_query}'")
            return []

        return videos

    except Exception as e:
        logger.error(f"Error using youtube-search to find videos for {product1_name} vs {product2_name}: {e}", exc_info=True)
        return []




def get_youtube_transcript(video_id, video_title="Unknown Video"):
    """
    Fetches the transcript for a given YouTube video ID using yt-dlp.
    Handles multiple languages and common errors.
    """
    logger.info(f"Attempting to fetch transcript for video ID: {video_id} ('{video_title}')")
    
    ydl_opts = {
        'writesubtitles': True,
        'writeautomaticsub': True,
        'subtitleslangs': ['en', 'en-US'],
        'skip_download': True,
        'quiet': True,
        'no_warnings': True
    }
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            # Get video info including available subtitles
            info = ydl.extract_info(f"https://www.youtube.com/watch?v={video_id}", download=False)
            
            if not info.get('subtitles') and not info.get('automatic_captions'):
                logger.warning(f"No subtitles found for video '{video_id}'")
                return {
                    "text": "",
                    "error": "No subtitles found for this video",
                    "has_error": True
                }
            
            # Try to get manual subtitles first, then fall back to automatic ones
            subtitles = info.get('subtitles', {})
            auto_captions = info.get('automatic_captions', {})
            
            # Try English subtitles first
            for lang in ['en', 'en-US']:
                if lang in subtitles:
                    subtitle_url = subtitles[lang][0]['url']
                    response = requests.get(subtitle_url)
                    response.raise_for_status()
                    transcript_text = response.text
                    logger.info(f"Successfully fetched manual transcript for video '{video_id}' in {lang}")
                    return {
                        "text": transcript_text,
                        "error": None,
                        "has_error": False
                    }
            
            # If no manual subtitles, try automatic captions
            for lang in ['en', 'en-US']:
                if lang in auto_captions:
                    subtitle_url = auto_captions[lang][0]['url']
                    response = requests.get(subtitle_url)
                    response.raise_for_status()
                    transcript_text = response.text
                    logger.info(f"Successfully fetched automatic transcript for video '{video_id}' in {lang}")
                    return {
                        "text": transcript_text,
                        "error": None,
                        "has_error": False
                    }
            
            logger.warning(f"No English subtitles found for video '{video_id}'")
            return {
                "text": "",
                "error": "No English subtitles found for this video",
                "has_error": True
            }
            
    except yt_dlp.utils.DownloadError as e:
        logger.error(f"yt-dlp download error for video '{video_id}': {e}")
        return {
            "text": "",
            "error": f"Failed to download video info: {str(e)}",
            "has_error": True
        }
    except requests.exceptions.RequestException as e:
        logger.error(f"Failed to fetch subtitle data for video '{video_id}': {e}")
        return {
            "text": "",
            "error": f"Failed to fetch subtitle data: {str(e)}",
            "has_error": True
        }
    except Exception as e:
        logger.error(f"Unexpected error while fetching transcript for '{video_id}': {e}", exc_info=True)
        return {
            "text": "",
            "error": str(e),
            "has_error": True
        }


def fetch_web_article_content(url):
    """
    Attempts to fetch and extract main text content from a given URL using the newspaper4k library.
    """
    logger.info(f"Attempting to fetch content from URL: {url} using newspaper4k")
    try:
        config = Config()
        config.browser_user_agent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        config.request_timeout = 15

        article = Article(url, config=config)
        article.download()
        article.parse()
        text = article.text
        
        if not text.strip():
            logger.warning(f"Newspaper4k extracted empty text from URL: {url}")
            return ""

        text = re.sub(r'\\n\\s*\\n+', '\\n\\n', text)

        max_chars = 25000 
        if len(text) > max_chars:
            logger.warning(f"Truncating article from {url} to {max_chars} characters.")
            text = text[:max_chars]
        
        return text
    
    except ArticleException as ae:
        logger.error(f"Newspaper4k failed to download or parse article from {url}: {ae}")
        return ""
    except Exception as e:
        logger.error(f"Error fetching article content from {url} with newspaper4k: {e}", exc_info=True)
        return ""

# --- Gemini Token Limiter ---
TOKEN_LIMIT_PER_MINUTE = 950000  # Increased for Gemini 2.0 Flash (under 1M for safety)
_token_bucket = TOKEN_LIMIT_PER_MINUTE
_last_reset_time = time.time()
_token_lock = asyncio.Lock()

async def token_limiter(requested_tokens: int):
    global _token_bucket, _last_reset_time
    async with _token_lock:
        now = time.time()
        if now - _last_reset_time >= 60:
            _token_bucket = TOKEN_LIMIT_PER_MINUTE
            _last_reset_time = now
        if _token_bucket >= requested_tokens:
            _token_bucket -= requested_tokens
            return
        else:
            wait_time = 60 - (now - _last_reset_time)
            logger.warning(f"Token quota exceeded. Waiting {wait_time:.2f} seconds.")
            await asyncio.sleep(wait_time)
            return await token_limiter(requested_tokens)

MAX_SOURCES = 9  # Limit total sources (e.g., 4 videos, 5 articles)
CHUNK_SIZE_TOKENS = 4000

def split_text_into_chunks(text, chunk_size_tokens=CHUNK_SIZE_TOKENS):
    """Split text into chunks of approximately chunk_size_tokens."""
    tokens = count_tokens(text)
    if tokens <= chunk_size_tokens:
        return [text]
    # Split by paragraphs for better context
    paragraphs = text.split('\n\n')
    chunks = []
    current_chunk = ''
    for para in paragraphs:
        if count_tokens(current_chunk + para) > chunk_size_tokens and current_chunk:
            chunks.append(current_chunk)
            current_chunk = para
        else:
            current_chunk += ('\n\n' if current_chunk else '') + para
    if current_chunk:
        chunks.append(current_chunk)
    return chunks

async def summarize_text_with_llm(text_content, prompt_instructions, source_type, product_a_name, product_b_name):
    if not llm_model_fast:
        logger.error("LLM fast model not available, cannot summarize text.")
        return "Error: AI model not available."
    if not text_content or not text_content.strip():
        return ""
    try:
        # 1. Split into chunks
        chunks = split_text_into_chunks(text_content)
        chunk_prompts = [
            f"**Role**: You are an expert product comparison analyst.\n"
            f"**Task**: You will be given a block of text from a {source_type}. "
            f"Your goal is to meticulously extract and summarize any and all information that compares '{product_a_name}' and '{product_b_name}'.\n"
            f"**Instructions**:\n{prompt_instructions}\n\n"
            f"**Source Text to Analyze**:\n---\n{chunk}\n---\n\n"
            f"**Output**: Provide only the direct summary of the comparison points as requested."
            for chunk in chunks
        ]
        # 2. Summarize each chunk in parallel (with token limiting)
        async def summarize_chunk(prompt):
            async with llm_semaphore:
                await rpm_limiter()
                tokens = count_tokens(prompt)
                await token_limiter(tokens)
                resp = await llm_model_fast.generate_content_async(prompt, request_options={"timeout": 120})
                return resp.text.strip() if resp and resp.text else ""
        chunk_summaries = await asyncio.gather(*[summarize_chunk(p) for p in chunk_prompts])
        # 3. If more than one chunk, summarize the summaries
        if len(chunk_summaries) > 1:
            summary_prompt = (
                f"**Role**: You are an expert product comparison analyst.\n"
                f"**Task**: You will be given a set of summaries from a {source_type}. "
                f"Your goal is to combine and condense them into a single, clear summary that compares '{product_a_name}' and '{product_b_name}'.\n"
                f"**Instructions**:\n{prompt_instructions}\n\n"
                f"**Summaries to Combine**:\n---\n" + '\n---\n'.join(chunk_summaries) + "\n---\n\n"
                f"**Output**: Provide only the direct summary of the comparison points as requested."
            )
            tokens = count_tokens(summary_prompt)
            await token_limiter(tokens)
            async with llm_semaphore:
                await rpm_limiter()
                resp = await llm_model_fast.generate_content_async(summary_prompt, request_options={"timeout": 120})
            return resp.text.strip() if resp and resp.text else ""
        else:
            return chunk_summaries[0] if chunk_summaries else ""
    except Exception as e:
        logger.error(f"Error during LLM summarization for {source_type}: {e}", exc_info=True)
        return f"Error processing {source_type} content."

# --- Mojeek API Integration ---
MOJEEK_API_KEY = os.getenv("MOJEEK_API_KEY")

import urllib.parse

def mojeek_search(query, num_results=3):
    """
    Queries the Mojeek API for the given query and returns a list of result URLs.
    """
    if not MOJEEK_API_KEY:
        logger.error("MOJEEK_API_KEY not found in environment variables.")
        return []
    try:
        base_url = "https://api.mojeek.com/v1/search"
        params = {
            "q": query,
            "count": num_results,
            "key": MOJEEK_API_KEY
        }
        url = f"{base_url}?{urllib.parse.urlencode(params)}"
        resp = requests.get(url, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        # Mojeek returns results in data['results']
        results = data.get('results', [])
        urls = [r['url'] for r in results if 'url' in r]
        logger.info(f"Mojeek returned {len(urls)} results for query: {query}")
        return urls
    except Exception as e:
        logger.error(f"Error querying Mojeek API: {e}")
        return []

# --- Google Custom Search API Integration ---
GOOGLE_SEARCH_API_KEY = os.getenv("GOOGLE_SEARCH_API_KEY")
GOOGLE_CSE_CX = os.getenv("GOOGLE_CSE_CX")

def google_search(query, num_results=3):
    url = "https://www.googleapis.com/customsearch/v1"
    params = {
        "key": GOOGLE_SEARCH_API_KEY,
        "cx": GOOGLE_CSE_CX,
        "q": query,
        "num": num_results,
    }
    try:
        resp = requests.get(url, params=params, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        results = data.get("items", [])
        urls = [item["link"] for item in results if "link" in item]
        logger.info(f"Google Custom Search returned {len(urls)} results for query: {query}")
        return urls
    except Exception as e:
        logger.error(f"Error querying Google Custom Search API: {e}")
        return []

def search_web_articles(product1_name, product2_name, num_results=3):
    logger.info(f"Searching Google Custom Search for '{product1_name} vs {product2_name}' articles.")
    search_query = f'"{product1_name}" vs "{product2_name}" review comparison'
    return google_search(search_query, num_results=num_results)

async def process_video_for_summary_async(video, product1_name, product2_name):
    """Process a single video and generate a summary."""
    try:
        video_id = video['id']
        video_title = video['title']
        
        # Get transcript asynchronously
        loop = asyncio.get_running_loop()
        transcript_result = await loop.run_in_executor(None, get_youtube_transcript, video_id, video_title)
        
        if transcript_result and not transcript_result['has_error']:
            video_summary_prompt = (
                "Extract the core comparative analysis, including feature breakdowns, performance metrics, price differences, and overall value proposition. "
                "Filter out any introductory paragraphs or conclusions that don't add comparative value. "
                "IMPORTANT: Do not include any technical specifications or processor details from video transcripts as they may be inaccurate. "
                "Focus on real-world usage, camera comparisons, battery life, and user experience aspects."
            )
            summary = await summarize_text_with_llm(
                transcript_result['text'], video_summary_prompt, video_title, product1_name, product2_name
            )
            return {
                "title": video_title,
                "source_url": f"https://www.youtube.com/watch?v={video_id}",
                "summary": summary
            }
        else:
            logger.warning(f"Could not get transcript for video '{video_title}' ({video_id})")
            return None
    except Exception as e:
        logger.error(f"Error processing video {video.get('id', 'unknown')}: {e}", exc_info=True)
        return None

async def process_article_for_summary_async(url, product1_name, product2_name):
    """Asynchronously fetches content and summarizes a single web article."""
    loop = asyncio.get_running_loop()
    content = await loop.run_in_executor(None, fetch_web_article_content, url)
    
    if content:
        article_summary_prompt = (
            "Extract the core comparative analysis, including feature breakdowns, performance metrics, price differences, and overall value proposition. "
            "Filter out any introductory paragraphs or conclusions that don't add comparative value. "
            "IMPORTANT: Technical specifications and processor details should be highlighted in [square brackets] and marked as verified specs. "
            "Prioritize these verified specs over any other sources. "
            "Include a detailed comparison table of specifications if available."
        )
        summary = await summarize_text_with_llm(
            content, article_summary_prompt, "Web Article", product1_name, product2_name
        )
        return {"source_url": url, "summary": summary}
    return None


# --- Pydantic Models ---
class StartComparisonRequest(BaseModel):
    product1_name: str
    product2_name: str

class GenerateQuestionsRequest(BaseModel):
    product1_name: str
    product2_name: str
    
class GetRecommendationRequest(BaseModel):
    product1_name: str
    product2_name: str
    user_preferences: str
    comparison_summary: str
    form_answers: dict # To hold answers from the dynamic form


@app.get('/')
def home():
    return {"message": "SmartShorts Backend is running."}

@app.post('/api/generate_questions')
async def generate_questions(request: GenerateQuestionsRequest):
    """Generates dynamic questions for user preferences using an LLM."""
    if not llm_model_fast:
        raise HTTPException(status_code=503, detail="AI services are not configured.")

    prompt = f"""
    You are an expert market researcher. Your task is to generate 5 to 7 multiple-choice questions to understand a user's preferences when choosing between "{request.product1_name}" and "{request.product2_name}".

    **Instructions:**
    1.  The questions should be clear, concise, and relevant to the key differentiating features of these types of products.
    2.  For each question, provide 3-4 plausible options.
    3.  **Crucially, for every question, you MUST include a final option like "I'm not sure" or "Not a priority".**
    4.  Return the output as a valid JSON object. The object should have a single key "questions", which is an array. Each item in the array should be an object with two keys: "question_text" (the question string) and "options" (an array of strings).

    **Example Output Format:**
    {{
        "questions": [
            {{
                "question_text": "What is your primary use case for this new device?",
                "options": ["Work and productivity", "Gaming and entertainment", "Everyday communication", "I'm not sure"]
            }},
            {{
                "question_text": "How important is battery life to you?",
                "options": ["Very important, I need it to last all day.", "Moderately important.", "Not a major concern.", "Not a priority"]
            }}
        ]
    }}

    Now, generate the JSON for the comparison between {request.product1_name} and {request.product2_name}.
    """
    try:
        await rpm_limiter()
        await token_limiter(count_tokens(prompt))
        response = await llm_model_fast.generate_content_async(prompt, request_options={"timeout": 120})
        
        # Clean the response to get a valid JSON
        cleaned_response = response.text.strip().replace("```json", "").replace("```", "")
        questions_json = json.loads(cleaned_response)

        return questions_json

    except Exception as e:
        logger.error(f"Error generating questions: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to generate questions from AI: {e}")

# --- Supabase Configuration ---
# Add these to your .env:
# SUPABASE_URL=https://your-project-ref.supabase.co
# SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

@app.post('/api/start_comparison')
async def start_comparison(
    request_data: StartComparisonRequest, 
    request: Request
):
    product1_name = request_data.product1_name
    product2_name = request_data.product2_name

    # --- Gemini API dynamic config ---
    custom_gemini_api_key = request.headers.get("x-gemini-api-key")
    if custom_gemini_api_key:
        genai.configure(api_key=custom_gemini_api_key)
        logger.info("Using custom Gemini API key for this request.")
    else:
        genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
        logger.info("Using default Gemini API key.")

    if not llm_model_reasoning or not llm_model_fast:
        raise HTTPException(status_code=503, detail="AI services are not configured. Please provide a GEMINI_API_KEY in your environment file and ensure that the preferred models (gemini-1.5-flash-latest) are available.")

    if not product1_name or not product2_name:
        raise HTTPException(status_code=400, detail="Please provide both product names.")

    logger.info(f"Starting comparison for '{product1_name}' vs '{product2_name}'")
    
    # Step 1: Concurrently search for YouTube videos and web articles
    loop = asyncio.get_running_loop()
    max_videos = 4
    max_articles = 5
    youtube_videos_task = loop.run_in_executor(None, search_youtube_videos, product1_name, product2_name, max_videos)
    article_urls_task = loop.run_in_executor(None, search_web_articles, product1_name, product2_name, max_articles)
    
    youtube_videos = await youtube_videos_task
    article_urls = await article_urls_task

    # Step 2: Create concurrent tasks for fetching and summarizing all content
    processing_tasks = []
    for video in youtube_videos:
        processing_tasks.append(process_video_for_summary_async(video, product1_name, product2_name))
    for url in article_urls:
        processing_tasks.append(process_article_for_summary_async(url, product1_name, product2_name))
    
    # Step 3: Execute all processing tasks in parallel
    processed_results = await asyncio.gather(*processing_tasks)
    
    # Step 4: Separate the results
    video_summaries = [result for result in processed_results if result and "title" in result]
    article_summaries = [result for result in processed_results if result and "title" not in result]

    # Step 5: Aggregate all summaries into one context block
    final_context = "AGGREGATED COMPARISON DATA:\n\n"
    
    # Add video summaries
    final_context += "--- YouTube Video Summaries ---\n"
    if video_summaries:
        for summary in video_summaries:
            final_context += f"Source: {summary['title']} ({summary['source_url']})\nSummary:\n{summary['summary']}\n\n"
    else:
        final_context += "No YouTube video summaries could be generated.\n\n"
    
    # Add article summaries
    final_context += "--- Web Article Summaries ---\n"
    if article_summaries:
        for summary in article_summaries:
            final_context += f"Source: {summary['source_url']}\nSummary:\n{summary['summary']}\n\n"
    else:
        final_context += "No web article summaries could be generated.\n\n"

    # Add all searched sources
    final_context += "--- All Searched Sources ---\n"
    final_context += "YouTube Videos Searched:\n"
    for video in youtube_videos:
        final_context += f"- {video['title']} (https://www.youtube.com/watch?v={video['id']})\n"
    
    final_context += "\nWeb Articles Searched:\n"
    for url in article_urls:
        final_context += f"- {url}\n"

    # Step 6: Generate Comprehensive Summary and Verdict with LLM
    if not llm_model_reasoning:
        raise HTTPException(status_code=500, detail="AI model not available for final analysis.")

    final_summary_prompt = f"""
    You are an expert product comparison analyst. Your task is to synthesize all the information provided below to create a clear, concise, and unbiased comparison summary of two products: {product1_name} and {product2_name}.

    Format your response using GitHub Flavored Markdown (GFM).

    **Output Structure Requirements:**

    1.  **Overall Summary:**
        *   Start with a level 2 heading: `## Overall Summary`.
        *   Provide a paragraph summarizing the key differences, strengths, and weaknesses of each product.
        *   Use bold (`**...**`) for emphasis on key terms (e.g., `**camera quality**`, `**battery life**`).

    2.  **Section Break:**
        *   After the summary paragraph, insert a horizontal rule by typing `---` on a new line.

    3.  **Feature Comparison Table:**
        *   Start with a level 2 heading: `## Feature Comparison`.
        *   Create a Markdown table with three columns: "Feature", "{product1_name}", and "{product2_name}".
        *   For each feature (e.g., Design, Display, Processor, Camera, Battery), create a new row in the table.
        *   If information for a feature is not available, state "N/A".
        *   IMPORTANT: Only include technical specifications from web article sources, not from video transcripts.

    4.  **Sources:**
        *   Start with a level 2 heading: `## Reference Sources`.
        *   Create three subsections with level 3 headings:
            1. `### Primary Technical Sources`
               - List the most reliable technical specification sources
               - Each source should be a bullet point with a brief note about its key contribution
               - Example format: `- [PhoneArena](url) - Detailed hardware specifications and benchmarks`

            2. `### Additional Technical Sources`
               - List secondary technical sources
               - Include a note if the source focuses on specific aspects
               - Example format: `- [TechSite](url) - Camera comparison and display analysis`

            3. `### Video Reviews & User Experiences`
               - List all YouTube videos (both with and without transcripts)
               - Include what type of content each video focuses on
               - Example format: `- [Title](url) - Hands-on comparison, focus on real-world usage`

        *   End with a "Note:" paragraph explaining any discrepancies in specifications and how they were resolved.

    **Information Sources:**

    Below are summaries from various sources (YouTube videos and web articles). Base your final summary on the information provided here.
    For technical specifications, prioritize information from web articles over video transcripts.

    ---
    {final_context}
    ---

    Now, generate the complete Markdown-formatted comparison summary for {product1_name} vs {product2_name}.
    Remember to organize the sources section clearly and professionally, with proper categorization and formatting.
    """
    
    logging.info("Generating final comparison summary with LLM...")
    tokens = count_tokens(final_summary_prompt)
    await token_limiter(tokens)
    async with llm_semaphore:
        await rpm_limiter()
        final_summary_response = await llm_model_reasoning.generate_content_async(final_summary_prompt)

    if not final_summary_response or not final_summary_response.text:
        raise Exception("LLM returned an empty response for the final summary.")
    
    comprehensive_summary = {
        "product1_name": product1_name,
        "product2_name": product2_name,
        "comparison_summary": final_summary_response.text,
        "video_sources": video_summaries,
        "article_sources": article_summaries,
        "all_searched_sources": {
            "youtube_videos": youtube_videos,
            "web_articles": article_urls
        }
    }
    
    # Save to Supabase history
    try:
        user_id = request.headers.get("x-user-id")
        if not user_id:
            logger.warning("No user_id provided in request headers. History will not be saved.")
        else:
            supabase.table("history").insert({
                "user_id": user_id,
                "product1_name": product1_name,
                "product2_name": product2_name,
                "summary": comprehensive_summary,
            }).execute()
            logger.info(f"Saved comparison for '{product1_name}' vs '{product2_name}' to Supabase history.")
    except Exception as e:
        logger.error(f"Supabase error when saving history: {e}")
    
    return comprehensive_summary

@app.post('/api/get_recommendation')
async def get_recommendation(request: GetRecommendationRequest):
    """Generates a personalized recommendation based on user answers."""
    logger.info(f"Generating recommendation for {request.product1_name} vs {request.product2_name}")
    
    if not llm_model_reasoning:
        raise HTTPException(status_code=503, detail="Reasoning model is not available.")

    # Convert the dictionary of answers into a readable string format
    answers_text = "\\n".join([f"- For the question '{q}', the user answered: '{a}'" for q, a in request.form_answers.items()])

    # This is the new, more specific prompt incorporating the user's request.
    prompt = f"""
    You are a helpful product comparison assistant. You have already provided a general comparison summary for two products: {request.product1_name} and {request.product2_name}.

    Here is the summary you provided:
    ---
    {request.comparison_summary}
    ---

    Now, the user has answered some questions to specify their preferences. Here are their answers:
    ---
    {answers_text}
    ---

    Based ONLY on the user's specific answers provided above, provide a personalized recommendation.
    You MUST follow these instructions:
    1.  Start by clearly and boldly stating which product you recommend (e.g., "**I recommend the {request.product1_name}.**").
    2.  In the next paragraph, justify your recommendation by connecting it DIRECTLY to the user's answers. You must explicitly mention their answer and explain how it leads to your recommendation.
        For example, you MUST say: "**Because you said you prioritize 'The best possible features regardless of price', the {request.product1_name} is the better choice as it offers superior performance...**"
        Another example: "**You mentioned your top priority is 'A balance between features and affordability'. Based on that, I recommend the {request.product2_name} because...**"
    3.  Keep the recommendation concise. The user already has the full comparison, so focus only on the personalized part.
    4.  The output must be a single block of text. Do not use markdown other than bolding the final recommended product name.
    """

    try:
        await rpm_limiter()
        async with llm_semaphore:
            response = await llm_model_reasoning.generate_content_async(prompt)
        
        recommendation_text = response.text.strip()
        logger.info(f"Successfully generated recommendation for {request.product1_name} vs {request.product2_name}")
        return {"recommendation": recommendation_text}

    except Exception as e:
        logger.error(f"Error generating recommendation with LLM: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate recommendation due to an internal error: {e}")

def count_tokens(text):
    try:
        encoder = tiktoken.encoding_for_model("gpt-4")  # Approximate for Gemini
        return len(encoder.encode(text))
    except Exception:
        # Fallback: rough estimate (1 token ≈ 4 chars)
        return max(1, len(text) // 4) 

# --- Main Execution ---
if __name__ == '__main__':
    uvicorn.run("app:app", host="0.0.0.0", port=5001, reload=True) 