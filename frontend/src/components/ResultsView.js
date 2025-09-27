import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import LoadingView from './LoadingView';

const ResultsView = ({ resultData, onStartNewComparison, productA, productB, isRecommendationLoading }) => {
  const [showSourcesToggle, setShowSourcesToggle] = useState(false);
  
  if (resultData.error) {
    return (
      <div className="p-8 text-center bg-white text-black">
        <h2 className="text-4xl font-extrabold text-gray-900 mb-3">Error</h2>
        <p className="text-2xl text-indigo-600 font-semibold">{resultData.error}</p>
      </div>
    );
  }

  const { productAName, productBName } = resultData;

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-4xl font-extrabold text-gray-900 mb-3">Your Smart Comparison</h2>
      <p className="text-2xl text-indigo-600 font-semibold">{productAName} vs {productBName}</p>
      {resultData.recommendation && (
        <p className="text-sm text-gray-500 mt-4 italic">
          AI-powered recommendation based on your preferences is ready below.
        </p>
      )}

      {/* --- Personal Recommendation Section --- */}
      <div className="pt-8 mt-8 border-t border-gray-200">
        <h3 className="text-2xl font-bold text-gray-800 mb-4">Personalized Recommendation</h3>
        
        {isRecommendationLoading && (
          <div className="flex items-center justify-center p-6 bg-gray-50 rounded-lg">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-gray-600">Generating your AI recommendation based on your answers...</p>
          </div>
        )}

        {resultData.recommendation && (
          <div className="mt-4 p-6 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg shadow-md">
            <div className="prose prose-blue max-w-none">
              <pre className="whitespace-pre-wrap font-sans">{resultData.recommendation}</pre>
            </div>
          </div>
        )}

        {!isRecommendationLoading && !resultData.recommendation && (
          <p className="text-gray-600 italic">You didn't answer any preference questions, so no personalized recommendation was generated. Start a new comparison to try it out!</p>
        )}
      </div>

      {/* --- Detailed Sources Section --- */}
      <div className="pt-8 mt-8 border-t border-gray-200">
        <button 
          className="text-indigo-600 font-semibold"
          onClick={() => setShowSourcesToggle(!showSourcesToggle)}
        >
          {showSourcesToggle ? 'Hide Sources' : 'Show Sources'}
        </button>
      </div>

      {showSourcesToggle && (
        <div className="pt-8 mt-8 border-t border-gray-200">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">Sources</h3>
          <ReactMarkdown>{resultData.sources}</ReactMarkdown>
        </div>
      )}
    </div>
  );
};

export default ResultsView; 