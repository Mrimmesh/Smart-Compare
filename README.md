# Smart-Compare

A comprehensive product comparison platform that leverages AI to provide detailed comparisons between products using YouTube videos, web articles, and user preferences.

## 🚀 Features

- **AI-Powered Analysis**: Uses Google Gemini 2.0 Flash for intelligent content summarization and comparison
- **Multi-Source Data**: Aggregates information from YouTube videos and web articles
- **Dynamic Question Generation**: Creates personalized preference questions for better recommendations
- **Real-time Processing**: Asynchronous processing for fast response times
- **User History**: Saves comparison history using Supabase
- **Modern UI**: Built with React and Tailwind CSS

## 🏗️ Architecture

### Backend (FastAPI)
- **AI Integration**: Google Gemini 2.0 Flash for content analysis
- **YouTube Integration**: Video search and transcript extraction using yt-dlp
- **Web Scraping**: Article content extraction using newspaper4k
- **Search APIs**: Google Custom Search and Mojeek API integration
- **Rate Limiting**: Built-in rate limiting for API calls
- **Database**: Supabase for user history and data persistence

### Frontend (React)
- **Modern UI**: Clean, responsive design with Tailwind CSS
- **Dynamic Forms**: AI-generated preference questions
- **Real-time Updates**: Live progress indicators and loading states
- **Google Ads Integration**: Monetization support

## 📋 Prerequisites

- Python 3.8+
- Node.js 16+
- Google Gemini API key
- YouTube Data API key (optional)
- Google Custom Search API key
- Mojeek API key (optional)
- Supabase account

## 🛠️ Installation

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create a `.env` file in the backend directory:
```env
GEMINI_API_KEY=your_gemini_api_key
YOUTUBE_DATA_API_KEY=your_youtube_api_key
GOOGLE_SEARCH_API_KEY=your_google_search_api_key
GOOGLE_CSE_CX=your_custom_search_engine_id
MOJEEK_API_KEY=your_mojeek_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

5. Run the backend server:
```bash
python app.py
```

The backend will be available at `http://localhost:5001`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the frontend directory:
```env
REACT_APP_API_URL=http://localhost:5001
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Start the development server:
```bash
npm start
```

The frontend will be available at `http://localhost:3000`

## 🔧 API Endpoints

### POST `/api/start_comparison`
Starts a product comparison analysis.

**Request Body:**
```json
{
  "product1_name": "iPhone 15",
  "product2_name": "Samsung Galaxy S24"
}
```

**Response:**
```json
{
  "product1_name": "iPhone 15",
  "product2_name": "Samsung Galaxy S24",
  "comparison_summary": "## Overall Summary\n...",
  "video_sources": [...],
  "article_sources": [...],
  "all_searched_sources": {...}
}
```

### POST `/api/generate_questions`
Generates dynamic preference questions for users.

**Request Body:**
```json
{
  "product1_name": "iPhone 15",
  "product2_name": "Samsung Galaxy S24"
}
```

### POST `/api/get_recommendation`
Gets personalized recommendations based on user preferences.

**Request Body:**
```json
{
  "product1_name": "iPhone 15",
  "product2_name": "Samsung Galaxy S24",
  "user_preferences": "Detailed user preferences...",
  "comparison_summary": "Previous comparison summary...",
  "form_answers": {"question1": "answer1", "question2": "answer2"}
}
```

## 🎯 Usage

1. **Start a Comparison**: Enter two product names to begin the analysis
2. **Wait for Processing**: The system will search and analyze multiple sources
3. **Answer Questions**: Complete the AI-generated preference questionnaire
4. **Get Recommendation**: Receive a personalized product recommendation
5. **View History**: Access your previous comparisons

## 🔍 How It Works

1. **Data Collection**: Searches YouTube for comparison videos and web articles
2. **Content Extraction**: Extracts transcripts from videos and text from articles
3. **AI Analysis**: Uses Gemini 2.0 Flash to summarize and analyze content
4. **Question Generation**: Creates personalized preference questions
5. **Recommendation**: Provides tailored recommendations based on user preferences

## 📊 Performance Features

- **Concurrent Processing**: Parallel processing of multiple sources
- **Rate Limiting**: Built-in protection against API rate limits
- **Token Management**: Efficient token usage for AI requests
- **Caching**: Optimized data retrieval and processing

## 🛡️ Security

- **CORS Configuration**: Properly configured for cross-origin requests
- **API Key Management**: Secure handling of API keys
- **Input Validation**: Pydantic models for request validation
- **Error Handling**: Comprehensive error handling and logging

## 📝 Environment Variables

### Backend (.env)
- `GEMINI_API_KEY`: Google Gemini API key (required)
- `YOUTUBE_DATA_API_KEY`: YouTube Data API key (optional)
- `GOOGLE_SEARCH_API_KEY`: Google Custom Search API key (required)
- `GOOGLE_CSE_CX`: Google Custom Search Engine ID (required)
- `MOJEEK_API_KEY`: Mojeek API key (optional)
- `SUPABASE_URL`: Supabase project URL (required)
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key (required)

### Frontend (.env)
- `REACT_APP_API_URL`: Backend API URL
- `REACT_APP_SUPABASE_URL`: Supabase project URL
- `REACT_APP_SUPABASE_ANON_KEY`: Supabase anonymous key

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Google Gemini for AI capabilities
- YouTube for video content
- Supabase for database services
- FastAPI for the backend framework
- React for the frontend framework

## 📞 Support

If you have any questions or need help, please open an issue on GitHub.

---

**Note**: This project requires API keys for full functionality. Make sure to set up all required environment variables before running the application.
