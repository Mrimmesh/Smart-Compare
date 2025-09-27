// New App.js 
import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import UserPreferenceQuestions from './components/UserPreferenceQuestions';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import LoadingView from './components/LoadingView';
import QuestionView from './components/QuestionView';
import { supabase } from './supabaseClient'
import Auth from './components/Auth'
import GoogleAd from './components/GoogleAds';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001';

const THEME_OPTIONS = [
  { value: 'auto', label: 'Auto (Device)' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

function applyTheme(theme) {
  if (theme === 'auto') {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  } else if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

// --- Top-Level Component Definitions ---

const HistoryView = ({ onSelectHistoryItem, onDeleteHistoryItem }) => {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data, error } = await supabase
          .from('history')
          .select('*')
          .order('timestamp', { ascending: false });
        if (error) throw error;
        setHistory(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistory();
  }, []);

  if (isLoading) {
    return <div className="p-8 text-center">Loading history...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-500">Error: {error}</div>;
  }

  return (
    <div className="p-8 bg-white dark:bg-gray-800 shadow-xl rounded-2xl border border-gray-200 dark:border-gray-700">
      <h2 className="text-3xl font-bold mb-6 text-gray-800 dark:text-gray-100">Comparison History</h2>
      
      {/* Top Banner Ad */}
      <GoogleAd className="mb-6" />
      
      {history.length === 0 ? (
        <p className="text-gray-700 dark:text-gray-200">No comparisons found in your history.</p>
      ) : (
        <ul className="space-y-4">
          {history.map((item, index) => (
            <React.Fragment key={item.id}>
              <li className="p-5 border rounded-xl flex justify-between items-center transition-all duration-200 hover:shadow-md hover:border-blue-500 hover:scale-[1.02] bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700">
                <div>
                  <span className="font-semibold text-lg text-gray-700 dark:text-gray-100">{item.product1_name} vs {item.product2_name}</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400 ml-4">{new Date(item.timestamp).toLocaleString()}</span>
                </div>
                <div className="flex space-x-3">
                  <button onClick={() => onSelectHistoryItem(item.id)} className="bg-blue-500 text-white px-5 py-2 rounded-lg font-semibold shadow-md hover:bg-blue-600 transition-all duration-200">View</button>
                  <button onClick={() => onDeleteHistoryItem(item.id)} className="bg-red-500 text-white px-5 py-2 rounded-lg font-semibold shadow-md hover:bg-red-600 transition-all duration-200">Delete</button>
                </div>
              </li>
              
              {/* In-content ad every 3 items */}
              {(index + 1) % 3 === 0 && (
                <GoogleAd className="my-6" />
              )}
            </React.Fragment>
          ))}
        </ul>
      )}
      
      {/* Bottom Banner Ad */}
      <GoogleAd className="mt-6" />
    </div>
  );
};

const SettingsView = () => {
    const [customGeminiApiKey, setCustomGeminiApiKey] = useState(() => localStorage.getItem('customGeminiApiKey') || '');
    const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'auto');
    const [isValid, setIsValid] = useState(null);
    const [checking, setChecking] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
      applyTheme(theme);
      localStorage.setItem('theme', theme);
      // Listen for system theme changes if auto
      if (theme === 'auto') {
        const listener = (e) => applyTheme('auto');
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', listener);
        return () => window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', listener);
      }
    }, [theme]);

    // Validate API key when changed
    useEffect(() => {
        if (!customGeminiApiKey) {
            setIsValid(null);
            setError('');
            localStorage.setItem('customGeminiApiValid', 'false');
            return;
        }
        setChecking(true);
        setError('');
        // Try a test request to Gemini /v1/models endpoint with the key
        fetch(`https://generativelanguage.googleapis.com/v1/models`, {
            headers: { 'Authorization': `Bearer ${customGeminiApiKey}` },
        })
            .then(res => {
                if (!res.ok) throw new Error('Invalid Gemini API key');
                return res.json();
            })
            .then(data => {
                if (data && data.models) {
                    setIsValid(true);
                    setError('');
                    localStorage.setItem('customGeminiApiValid', 'true');
                } else {
                    setIsValid(false);
                    setError('Not a valid Gemini API key.');
                    localStorage.setItem('customGeminiApiValid', 'false');
                }
            })
            .catch(() => {
                setIsValid(false);
                setError('Not a valid Gemini API key.');
                localStorage.setItem('customGeminiApiValid', 'false');
            })
            .finally(() => setChecking(false));
    }, [customGeminiApiKey]);

    const handleApiKeyChange = (e) => {
        setCustomGeminiApiKey(e.target.value);
        localStorage.setItem('customGeminiApiKey', e.target.value);
    };

    const handleThemeChange = (e) => {
      setTheme(e.target.value);
    };

    return (
        <div className="p-8 bg-white dark:bg-gray-800 shadow-xl rounded-2xl border border-gray-200 dark:border-gray-700 w-full max-w-2xl">
            <h2 className="text-3xl font-bold mb-8 text-gray-800 dark:text-gray-100 border-b pb-4">Settings</h2>
            
            {/* Top Banner Ad */}
            <GoogleAd className="mb-6" />
            
            <div className="space-y-8">
                <div className="flex items-center justify-between">
                    <label htmlFor="custom-gemini-api-key" className="text-lg font-medium text-gray-700 dark:text-gray-200">Custom Gemini API Key</label>
                    <input
                        id="custom-gemini-api-key"
                        type="text"
                        value={customGeminiApiKey}
                        onChange={e => { setCustomGeminiApiKey(e.target.value); localStorage.setItem('customGeminiApiKey', e.target.value); }}
                        placeholder="Your Gemini API Key"
                        className="mt-1 block w-full max-w-xs pl-4 pr-10 py-2.5 text-base border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-lg shadow-sm bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100"
                    />
                </div>
                
                {/* In-content Ad */}
                <GoogleAd className="my-6" />
                
                <div className="flex items-center justify-between">
                  <label htmlFor="theme-select" className="text-lg font-medium text-gray-700 dark:text-gray-200">Theme</label>
                  <select
                    id="theme-select"
                    value={theme}
                    onChange={handleThemeChange}
                    className="mt-1 block w-full max-w-xs pl-4 pr-10 py-2.5 text-base border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-lg shadow-sm bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100"
                  >
                    {THEME_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>
                {checking && <div className="text-blue-600 dark:text-blue-400">Checking API key...</div>}
                {isValid && <div className="text-green-600 dark:text-green-400">Valid Gemini API key!</div>}
                {isValid === false && <div className="text-red-600 dark:text-red-400">{error}</div>}
                <div className="opacity-50">
                    <p className="text-gray-600 dark:text-gray-400">API Configuration (Coming Soon)</p>
                </div>
            </div>
            
            {/* Bottom Banner Ad */}
            <GoogleAd className="mt-6" />
        </div>
    );
};

const ResultsView = ({ resultData, onStartNewComparison, productA, productB }) => {
  const [showSourcesToggle, setShowSourcesToggle] = useState(false);
  const [userPreferences, setUserPreferences] = useState('');
  const [recommendation, setRecommendation] = useState(null);
  const [isRecommendationLoading, setIsRecommendationLoading] = useState(false);
  const [recommendationError, setRecommendationError] = useState(null);
  const [markdownError, setMarkdownError] = useState(null);

  const handleGetRecommendation = async (e) => {
    e.preventDefault();
    if (!userPreferences.trim()) {
        setRecommendationError("Please describe your needs and preferences before getting a recommendation.");
        return;
    }
    setIsRecommendationLoading(true);
    setRecommendationError(null);
    setRecommendation(null);

    try {
        const response = await fetch(`${API_BASE_URL}/api/get_recommendation`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                product1_name: resultData.product1_name || productA,
                product2_name: resultData.product2_name || productB,
                user_preferences: userPreferences,
                comparison_summary: resultData.comparison_summary,
                form_answers: {},
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Failed to fetch recommendation.');
        }

        const data = await response.json();
        setRecommendation(data.recommendation);
    } catch (err) {
        setRecommendationError(
          typeof err === 'string'
            ? err
            : err?.message
              ? err.message
              : JSON.stringify(err)
        );
    } finally {
        setIsRecommendationLoading(false);
    }
  };

  if (!resultData) {
    return <LoadingView productA={productA} productB={productB} />;
  }
  
  if (resultData.error) { 
     return (
      <div className="p-8 text-center bg-white text-black">
        <h2 className="text-3xl font-semibold mb-6 text-black">Error</h2>
        <p className="text-black bg-gray-100 p-4 rounded-md border border-black">{String(resultData.error)} (Products: {productA || 'N/A'} vs {productB || 'N/A'})</p>
        <button 
            onClick={() => onStartNewComparison()}
            className="mt-8 px-6 py-3 bg-black text-white font-semibold rounded-lg shadow-md hover:bg-gray-800 transition-colors duration-150"
        >
            Start New Comparison
        </button>
      </div>
    );
  }

  // Ensure we have valid comparison data
  if (!resultData.comparison_summary || typeof resultData.comparison_summary !== 'string') {
    return (
      <div className="p-8 text-center bg-white text-black">
        <h2 className="text-3xl font-semibold mb-6 text-black">Invalid Data</h2>
        <p className="text-black bg-gray-100 p-4 rounded-md border border-black">
          The comparison data is not in the expected format. Please try starting a new comparison.
        </p>
        <button 
            onClick={() => onStartNewComparison()}
            className="mt-8 px-6 py-3 bg-black text-white font-semibold rounded-lg shadow-md hover:bg-gray-800 transition-colors duration-150"
        >
            Start New Comparison
        </button>
      </div>
    );
  }

  const {
    comparison_summary,
    video_sources = [],
    article_sources = []
  } = resultData;
  
  // Debug logging to help identify data structure issues
  console.log('ResultsView received data:', {
    comparison_summary: typeof comparison_summary,
    summaryLength: comparison_summary ? comparison_summary.length : 0,
    videoSourcesCount: video_sources.length,
    articleSourcesCount: article_sources.length,
    productAName: resultData.product1_name,
    productBName: resultData.product2_name,
    fullResultData: resultData
  });
  
  // Log a sample of the comparison summary to help debug markdown rendering
  if (comparison_summary && typeof comparison_summary === 'string') {
    console.log('Comparison summary sample (first 500 chars):', comparison_summary.substring(0, 500));
  }
  
  const productAName = resultData.product1_name || productA;
  const productBName = resultData.product2_name || productB;


  return (
    <div className="w-full max-w-4xl mx-auto bg-white text-gray-800 p-8 rounded-2xl shadow-2xl border border-gray-200 space-y-10 my-10">
      <div className="text-center border-b border-gray-200 pb-8">
        <h2 className="text-4xl font-extrabold text-gray-900 mb-3">Your Smart Comparison</h2>
        <p className="text-2xl text-indigo-600 font-semibold">{productAName} vs {productBName}</p>
        {recommendation && (
            <p className="text-sm text-gray-500 mt-4 italic">
                AI-powered recommendation based on your preferences is ready below.
            </p>
        )}
      </div>
      
      {/* Top Banner Ad */}
      <GoogleAd className="mb-6" />

      <div className="prose max-w-none p-6 rounded-xl shadow-inner border bg-gray-50 border-gray-200">
          {comparison_summary ? (
            <div>
              {markdownError ? (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800 font-semibold">Error rendering comparison:</p>
                  <p className="text-red-700">{markdownError}</p>
                  <button 
                    onClick={() => setMarkdownError(null)}
                    className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                  >
                    Try Again
                  </button>
                </div>
              ) : (
                <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={{
                        h2: ({node, ...props}) => <h2 className="text-2xl font-bold my-4 text-gray-800" {...props} />,
                        h3: ({node, ...props}) => <h3 className="text-xl font-bold my-3 text-gray-700" {...props} />,
                        table: ({node, ...props}) => (
                          <div className="overflow-x-auto my-4">
                            <table className="min-w-full border-collapse border border-gray-300 bg-white" {...props} />
                          </div>
                        ),
                        th: ({node, ...props}) => (
                          <th className="border border-gray-300 px-4 py-2 bg-gray-100 font-semibold text-gray-800" {...props} />
                        ),
                        td: ({node, ...props}) => (
                          <td className="border border-gray-300 px-4 py-2 text-gray-700" {...props} />
                        ),
                        tr: ({node, ...props}) => (
                          <tr className="hover:bg-gray-50" {...props} />
                        ),
                        p: ({node, ...props}) => <p className="mb-4 text-gray-700 leading-relaxed" {...props} />,
                        strong: ({node, ...props}) => <strong className="font-semibold text-gray-800" {...props} />,
                        em: ({node, ...props}) => <em className="italic text-gray-600" {...props} />,
                        ul: ({node, ...props}) => <ul className="list-disc list-inside mb-4 space-y-1" {...props} />,
                        ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-4 space-y-1" {...props} />,
                        li: ({node, ...props}) => <li className="text-gray-700" {...props} />,
                        a: ({node, ...props}) => (
                          <a className="text-blue-600 hover:text-blue-800 underline" target="_blank" rel="noopener noreferrer" {...props} />
                        ),
                        hr: ({node, ...props}) => <hr className="my-6 border-gray-300" {...props} />,
                        blockquote: ({node, ...props}) => (
                          <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-600 my-4" {...props} />
                        ),
                    }}
                    onError={(error) => {
                      console.error('ReactMarkdown error:', error);
                      setMarkdownError(error.message || 'Failed to render markdown');
                    }}
                >
                    {typeof comparison_summary === 'string' ? comparison_summary : (comparison_summary ? JSON.stringify(comparison_summary, null, 2) : '')}
                </ReactMarkdown>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <p>No comparison data available.</p>
            </div>
          )}
      </div>
      
      {/* In-content Ad after comparison */}
      <GoogleAd className="my-6" />

      {/* --- Personal Recommendation Section --- */}
      <div className="pt-8 mt-8 border-t border-gray-200">
        <h3 className="text-2xl font-bold text-gray-800 mb-4">Get a Personal Recommendation</h3>
        <p className="text-gray-600 mb-4">
            To get a personalized recommendation from our AI, describe what you're looking for in a product. 
            For example: "I'm a photographer, so camera quality is my top priority, but I also need good battery life for travel."
        </p>
        <form onSubmit={handleGetRecommendation}>
            <textarea
                className="w-full p-4 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                rows="4"
                value={userPreferences}
                onChange={(e) => setUserPreferences(e.target.value)}
                placeholder="Describe your needs, priorities, and how you plan to use the product..."
            />
            <button
                type="submit"
                disabled={isRecommendationLoading}
                className="mt-4 w-full px-6 py-4 bg-green-600 text-white font-bold rounded-xl shadow-md hover:bg-green-700 disabled:bg-gray-400 transition-all duration-200 text-lg"
            >
                {isRecommendationLoading ? 'Getting Your Recommendation...' : 'Ask the AI'}
            </button>
        </form>

        {recommendationError && <p className="mt-4 text-red-500 font-semibold">{String(recommendationError)}</p>}
        
        {recommendation && (
            <div className="mt-8 p-6 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg shadow-md">
                <h4 className="text-xl font-bold text-blue-900 mb-3">Your Personalized Recommendation</h4>
                <div className="prose prose-blue max-w-none">
                    <pre className="whitespace-pre-wrap font-sans">{recommendation || ''}</pre>
                </div>
            </div>
        )}
      </div>

      {/* --- Detailed Sources Section --- */}
      <div className="pt-8 mt-8 border-t border-gray-200">
        <button 
          onClick={() => setShowSourcesToggle(!showSourcesToggle)}
          className="w-full px-6 py-4 bg-gray-100 text-gray-800 font-bold rounded-xl shadow-sm hover:bg-gray-200 border border-gray-300 transition-all duration-200 mb-5 text-lg"
        >
          {showSourcesToggle ? 'Hide' : 'Show'} Detailed Information Sources ({(video_sources || []).length + (article_sources || []).length})
        </button>
        {showSourcesToggle && ((video_sources || []).length > 0 || (article_sources || []).length > 0) && (
          <div className="space-y-6 animate-fade-in">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Information Sources:</h3>
            {(video_sources || []).map((source, index) => (
              <div key={`video-${index}`} className="bg-gray-50 p-5 rounded-xl shadow-md border border-gray-200">
                <h4 className="text-xl font-semibold text-gray-800 mb-2">
                  {source.title || 'Untitled Source'}
                </h4>
                <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider">Type: YouTube Video</p>
                {source.source_url && 
                  <a href={source.source_url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline block mb-3 break-all">
                    {source.source_url}
                  </a>
                }
                <h5 className="text-md font-medium text-gray-800 mt-3 mb-2">Summary:</h5>
                <div className="prose prose-sm max-w-none bg-white p-4 rounded-lg border border-gray-200">
                  <pre className="whitespace-pre-wrap font-sans">{source.summary || 'No summary provided.'}</pre>
                </div>
              </div>
            ))}
            {(article_sources || []).map((source, index) => (
              <div key={`article-${index}`} className="bg-gray-50 p-5 rounded-xl shadow-md border border-gray-200">
                <h4 className="text-xl font-semibold text-gray-800 mb-2">
                  Web Article
                </h4>
                <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider">Type: Web Article</p>
                {source.source_url && 
                  <a href={source.source_url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline block mb-3 break-all">
                    {source.source_url}
                  </a>
                }
                <h5 className="text-md font-medium text-gray-800 mt-3 mb-2">Summary:</h5>
                <div className="prose prose-sm max-w-none bg-white p-4 rounded-lg border border-gray-200">
                  <pre className="whitespace-pre-wrap font-sans">{source.summary || 'No summary provided.'}</pre>
                </div>
              </div>
            ))}
          </div>
        )}
         {showSourcesToggle && ((video_sources || []).length === 0 && (article_sources || []).length === 0) && (
            <p className="text-gray-600 italic">No detailed sources were processed or available for this comparison.</p>
        )}
      </div>
      
      <div className="text-center pt-8 border-t border-gray-200">
        <button 
            onClick={() => onStartNewComparison()}
            className="px-10 py-4 bg-indigo-600 text-white font-bold text-lg rounded-xl shadow-lg hover:bg-indigo-700 transition-all duration-200 transform hover:scale-105"
        >
            Start Another Comparison
        </button>
      </div>
      
      {/* Bottom Banner Ad */}
      <GoogleAd className="mt-6" />
    </div>
  );
};

const ChatMessage = ({ msg }) => {
    const { sender, type, content } = msg;
    const isUser = sender === 'user';
    const bubbleClass = isUser 
        ? 'bg-gray-800 text-white' 
        : 'bg-gray-200 text-gray-800';

    return (
      <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className={`rounded-lg px-4 py-2 max-w-2xl shadow ${bubbleClass}`}>
          {type === 'error' ? <p className="text-red-500 font-semibold">{content}</p> : <p className="text-base">{content}</p>}
        </div>
      </div>
    );
};

const ProductInput = ({ onSubmit, isLoading }) => {
    const [inputValue, setInputValue] = useState('');

    const handleSubmit = (e) => {
      e.preventDefault();
      if (inputValue.trim()) {
        onSubmit(inputValue);
        setInputValue('');
      }
    };

    return (
      <div className="w-full max-w-3xl mx-auto">
          <form onSubmit={handleSubmit} className="p-4 bg-white/80 backdrop-blur-md rounded-xl border border-gray-200 shadow-2xl">
              <div className="flex items-center">
                  <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder="Compare iPhone 15 vs Google Pixel 8..."
                      className="flex-1 p-3 bg-transparent focus:outline-none text-lg"
                      disabled={isLoading}
                  />
                  <button
                      type="submit"
                      className="px-5 py-2 bg-gray-800 text-white font-semibold rounded-lg shadow-md hover:bg-black disabled:opacity-50 transition-all"
                      disabled={isLoading || !inputValue.trim()}
                  >
                      {isLoading ? '...' : 'Send'}
                  </button>
              </div>
          </form>
      </div>
    );
};

// --- Main App Component ---

function App() {
  const [currentView, setCurrentView] = useState('chat');
  const [comparisonData, setComparisonData] = useState(null);
  const [userAnswers, setUserAnswers] = useState(null);
  const [recommendationResult, setRecommendationResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [productA, setProductA] = useState('');
  const [productB, setProductB] = useState('');
  const [chatMessages, setChatMessages] = useState([]); 
  const [currentStep, setCurrentStep] = useState('initial'); 
  const chatEndRef = useRef(null);
  const [questions, setQuestions] = useState([]);
  const [formAnswers, setFormAnswers] = useState({});
  const [comparisonResult, setComparisonResult] = useState(null);
  const [isRecommendationLoading, setIsRecommendationLoading] = useState(false);
  const [user, setUser] = useState(null)
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => {
      listener?.subscription?.unsubscribe?.()
    }
  }, [])

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  const addMessageToChat = (sender, type, content) => {
    setChatMessages(prev => [...prev, { sender, type, content }]);
  };

  const startNewComparisonFlow = () => {
    setCurrentView('chat');
    setComparisonData(null);
    setRecommendationResult(null);
    setIsLoading(false);
    setError(null);
    setProductA('');
    setProductB('');
    setChatMessages([]);
    setCurrentStep('initial');
    setFormAnswers(null);
  };

  const handleSelectHistoryItem = async (id) => {
    try {
      setIsLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('history')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      
      // Handle the summary data - it could be stored as JSON string or object
      let summaryData = data.summary;
      if (typeof summaryData === 'string') {
        try {
          summaryData = JSON.parse(summaryData);
        } catch {
          // If parsing fails, treat as plain string
          summaryData = { comparison_summary: summaryData };
        }
      }
      
      // Ensure we have the correct structure
      const resultData = {
        comparison_summary: summaryData.comparison_summary || summaryData.summary || '',
        product1_name: summaryData.product1_name || data.product1_name,
        product2_name: summaryData.product2_name || data.product2_name,
        video_sources: summaryData.video_sources || [],
        article_sources: summaryData.article_sources || [],
        all_searched_sources: summaryData.all_searched_sources || {}
      };
      
      setComparisonResult(resultData);
      setProductA(data.product1_name);
      setProductB(data.product2_name);
      setCurrentView('results');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteHistoryItem = async (id) => {
    try {
      const { error } = await supabase
        .from('history')
        .delete()
        .eq('id', id);
      if (error) throw error;
      setCurrentView('history');
      setTimeout(() => setCurrentView('history'), 0);
    } catch (err) {
      setError(err.message);
    }
  };

  // Helper to get the custom Gemini API key
  function getGeminiApiKey() {
    const customKey = localStorage.getItem('customGeminiApiKey');
    const isValid = localStorage.getItem('customGeminiApiValid') === 'true';
    return isValid && customKey ? customKey : null;
  }

  const handleInitialSubmit = async (inputValue) => {
    const parts = inputValue.split(/vs|versus/i);
    if (parts.length !== 2) {
        addMessageToChat('system', 'error', 'Please provide two products to compare, separated by "vs" (e.g., "iPhone 15 vs Google Pixel 8").');
        return;
    }
    const [pA, pB] = parts.map(p => p.trim());
    setProductA(pA);
    setProductB(pB);
    addMessageToChat('user', 'text', `Compare ${pA} and ${pB}`);
    
    // Reset previous results
    setComparisonResult(null);
    setRecommendationResult(null);
    setQuestions([]);
    setError(null);
    setFormAnswers(null);

    // --- Fire off the long-running comparison. Don't wait for it. ---
    const apiKey = getGeminiApiKey();
    fetch(`${API_BASE_URL}/api/start_comparison`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': user && user.id ? user.id : '',
        ...(apiKey ? { 'x-gemini-api-key': apiKey } : {}),
      },
      body: JSON.stringify({ product1_name: pA, product2_name: pB }),
    })
    .then(res => {
        if (!res.ok) {
            return res.json().then(err => { throw new Error(err.detail || 'Failed to start comparison.')});
        }
        return res.json();
    })
    .then(data => {
        // Normalize the response to ensure correct structure
        let summaryData = data;
        if (typeof data === 'string') {
          try {
            summaryData = JSON.parse(data);
          } catch {
            summaryData = { comparison_summary: data };
          }
        }
        if (typeof summaryData.comparison_summary === 'object') {
          try {
            summaryData.comparison_summary = JSON.parse(summaryData.comparison_summary);
          } catch {
            summaryData.comparison_summary = String(summaryData.comparison_summary);
          }
        }
        setComparisonResult({
          comparison_summary: summaryData.comparison_summary || summaryData.summary || '',
          product1_name: summaryData.product1_name,
          product2_name: summaryData.product2_name,
          video_sources: summaryData.video_sources || [],
          article_sources: summaryData.article_sources || [],
          all_searched_sources: summaryData.all_searched_sources || {}
        });
    })
    .catch(err => {
        console.error('Error starting comparison:', err);
        setError(err.message || 'An unknown error occurred.');
        setCurrentView('results');
    });

    // --- Fetch questions and then switch view ---
    try {
        const questionsResponse = await fetch(`${API_BASE_URL}/api/generate_questions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ product1_name: pA, product2_name: pB }),
        });
        if (questionsResponse.ok) {
            const questionsData = await questionsResponse.json();
            setQuestions(questionsData.questions || []);
        } else {
            console.error("Failed to fetch questions. Proceeding without them.");
        }
    } catch (err) {
        console.error("Error fetching questions:", err);
    }
    
    // Whether we got questions or not, move to the questions view.
    setCurrentView('questions');
  };

  const handleQuestionSubmit = (answers) => {
    setFormAnswers(answers);
    setCurrentView('results'); // Now, show the results view
  };

  const handleGetRecommendation = async (userPreferences) => {
    if (!comparisonData) {
      setError("Cannot get a recommendation without a comparison result.");
      return;
    }
    
    setIsLoading(true);
    try {
        const response = await fetch(`${API_BASE_URL}/api/get_recommendation`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                product1_name: productA,
                product2_name: productB,
                user_preferences: userPreferences, // The initial simple preference
                comparison_summary: comparisonData.comparison_summary,
                form_answers: {},
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Failed to get recommendation.');
        }

        const data = await response.json();
        setRecommendationResult(data);
    } catch (err) {
        setError(
          typeof err === 'string'
            ? err
            : err?.message
              ? err.message
              : JSON.stringify(err)
        );
    } finally {
        setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUserMenuOpen(false);
  };

  // Determine what main view to render
  let content;
  switch (currentView) {
    case 'chat':
      content = (
        <div className="flex-grow flex flex-col h-full w-full">
            {chatMessages.length === 0 ? (
                 <div className="flex-grow flex flex-col items-center justify-center text-center">
                    <h1 className="text-5xl font-bold text-gray-800">SmartCompare</h1>
                    <p className="text-xl text-gray-500 mt-2">Your AI Product Comparison Assistant</p>
                    
                    {/* Welcome Banner Ad */}
                    <div className="mt-8">
                      <GoogleAd />
                    </div>
                 </div>
            ) : (
                <div className="flex-grow overflow-y-auto p-6 space-y-4">
                    {/* Top Banner Ad for chat with messages */}
                    <GoogleAd className="mb-4" />
                    
                    {chatMessages.map((msg, index) => (
                      <React.Fragment key={index}>
                        <ChatMessage msg={msg} />
                        {/* In-content ad every 5 messages */}
                        {(index + 1) % 5 === 0 && (
                          <GoogleAd className="my-4" />
                        )}
                      </React.Fragment>
                    ))}
                    <div ref={chatEndRef} />
                </div>
            )}
            <div className="py-4">
                {currentStep === 'initial' && <ProductInput onSubmit={handleInitialSubmit} isLoading={isLoading} />}
                {currentStep === 'questions' && <UserPreferenceQuestions onAnswersSubmit={handleQuestionSubmit} isLoading={isLoading} />}
            </div>
        </div>
      );
      break;
    case 'results':
      if (!comparisonResult) {
        return (
          <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 bg-gray-50 overflow-y-auto">
            <LoadingView productA={productA} productB={productB} />
          </main>
        )
      }
      content = <ResultsView resultData={comparisonResult} onStartNewComparison={startNewComparisonFlow} productA={productA} productB={productB} />;
      break;
    case 'history':
      content = <HistoryView onSelectHistoryItem={handleSelectHistoryItem} onDeleteHistoryItem={handleDeleteHistoryItem} />;
      break;
    case 'settings':
      content = <SettingsView />;
      break;
    case 'questions':
      content = <QuestionView 
                  questions={questions} 
                  onSubmit={handleQuestionSubmit} 
                  productA={productA} 
                  productB={productB}
                  isComparisonLoading={!comparisonResult} // Let the view know if the main result is still loading
               />;
      break;
    case 'loading':
      content = <LoadingView productA={productA} productB={productB} />;
      break;
    default:
      content = <div className="p-8 text-center">Unknown view state.</div>;
  }

  if (!user) return <Auth onAuth={setUser} />

  // Get Google profile picture if available (all possible fields)
  const avatarUrl =
    user?.user_metadata?.avatar_url ||
    user?.user_metadata?.picture ||
    user?.user_metadata?.avatar ||
    null;
  const userEmail = user?.email;

  return (
    <div className="flex h-screen font-sans bg-white dark:bg-gray-900">
      <Sidebar currentView={currentView} onNavigate={setCurrentView} onNewComparison={startNewComparisonFlow} />
      <main className="flex-grow pl-64 h-screen flex flex-col bg-white dark:bg-gray-900">
        {/* Top bar with user avatar */}
        <div className="w-full flex justify-end items-center px-8 py-4 relative">
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setUserMenuOpen((open) => !open)}
              className="flex items-center focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {/* Avatar with fallback */}
              <span className="relative w-10 h-10 block">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="User avatar"
                    className="w-10 h-10 rounded-full border-2 border-gray-300 shadow-sm absolute top-0 left-0"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div
                    className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-xl font-bold text-gray-600 border-2 border-gray-300 shadow-sm absolute top-0 left-0"
                  >
                    {userEmail ? userEmail[0].toUpperCase() : '?'}
                  </div>
                )}
              </span>
            </button>
            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 animate-fade-in">
                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                  <div className="font-semibold text-gray-800 dark:text-gray-100">{userEmail}</div>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 dark:hover:bg-gray-900 font-semibold rounded-b-lg transition"
                >
                  Log Out
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="flex-grow w-full flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-white dark:bg-gray-900">
          {content}
        </div>
      </main>
    </div>
  );
}

export default App; 