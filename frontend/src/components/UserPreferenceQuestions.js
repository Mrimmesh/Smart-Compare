import React, { useState, useEffect } from 'react';
import GoogleAd from './GoogleAds';

const UserPreferenceQuestions = ({ questions, productA, productB, onSubmit, isLoading }) => {
  const [answers, setAnswers] = useState({});

  useEffect(() => {
    const initialAnswers = {};
    // Use q.text as the key for answers, matching backend structure
    questions.forEach(q => initialAnswers[q.id || q.text] = ''); 
    setAnswers(initialAnswers);
  }, [questions]);

  const handleChange = (questionId, value) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const submittedAnswers = {};
    questions.forEach(q => {
      const questionKey = q.text; // Use q.text for the key in submittedAnswers
      submittedAnswers[questionKey] = answers[q.id || q.text] || '';
    });
    onSubmit(submittedAnswers);
  };

  if (!questions || questions.length === 0) {
    return <p className="text-black bg-white">No preference questions to display at this time.</p>;
  }

  return (
    <div className="w-full max-w-2xl mx-auto bg-white text-black dark:bg-gray-800 dark:text-gray-100 p-6 rounded-xl shadow-lg border border-black dark:border-gray-700">
      <h3 className="text-xl font-semibold text-black dark:text-gray-100 mb-6 text-center">
        Help us tailor the recommendation for <span className="font-bold">{productA}</span> vs <span className="font-bold">{productB}</span>!
      </h3>
      
      {/* Banner Ad */}
      <GoogleAd className="mb-6" />
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {questions.map((q, index) => {
          const questionId = q.id || q.text; // Prefer q.id, fallback to q.text for keying
          // Ensure q.text is defined before calling replace
          const displayQuestion = q.text ? q.text.replace(/\{\s*productA\s*\}/gi, productA).replace(/\{\s*productB\s*\}/gi, productB) : "Invalid question";
          
          return (
            <React.Fragment key={index}>
              <div className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow-sm border border-black dark:border-gray-700">
                <label htmlFor={`question-${index}`} className="block text-md font-medium text-black dark:text-gray-100 mb-2">
                  {index + 1}. {displayQuestion}
                </label>
                {q.options && q.options.length > 0 ? (
                  <select 
                    id={`question-${index}`}
                    value={answers[questionId] || ''}
                    onChange={(e) => handleChange(questionId, e.target.value)}
                    className="mt-1 block w-full p-3 border border-black dark:border-gray-700 rounded-md shadow-sm focus:ring-1 focus:ring-black dark:focus:ring-gray-100 focus:border-black dark:focus:border-gray-100 sm:text-sm transition-colors bg-white dark:bg-gray-900 text-black dark:text-gray-100"
                    disabled={isLoading}
                  >
                    <option value="" disabled>Select an option</option>
                    {q.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                ) : (
                  <input 
                    type="text"
                    id={`question-${index}`}
                    value={answers[questionId] || ''}
                    onChange={(e) => handleChange(questionId, e.target.value)}
                    className="mt-1 block w-full p-3 border border-black dark:border-gray-700 rounded-md shadow-sm focus:ring-1 focus:ring-black dark:focus:ring-gray-100 focus:border-black dark:focus:border-gray-100 sm:text-sm transition-colors bg-white dark:bg-gray-900 text-black dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                    placeholder="Your answer..."
                    disabled={isLoading}
                  />
                )}
              </div>
              
              {/* In-content ad every 3 questions */}
              {(index + 1) % 3 === 0 && (
                <GoogleAd className="my-4" />
              )}
            </React.Fragment>
          );
        })}
        <button 
          type="submit"
          disabled={isLoading || Object.values(answers).some(a => a === '')}
          className="w-full mt-6 px-6 py-3 bg-black dark:bg-gray-100 text-white dark:text-gray-900 font-semibold rounded-lg shadow-md hover:bg-gray-800 dark:hover:bg-gray-200 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-gray-100 disabled:bg-gray-500 dark:disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors duration-150 flex items-center justify-center"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white dark:text-gray-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Submitting Preferences...
            </>
          ) : "Submit Preferences"
          }
        </button>
      </form>
    </div>
  );
};

export default UserPreferenceQuestions; 