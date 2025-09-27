import React, { useState } from 'react';
import GoogleAd from './GoogleAds';

const QuestionView = ({ questions, onSubmit, productA, productB, isComparisonLoading }) => {
    const [answers, setAnswers] = useState({});

    const handleOptionChange = (questionText, option) => {
        setAnswers(prev => ({ ...prev, [questionText]: option }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Ensure all questions are answered
        if (Object.keys(answers).length !== questions.length) {
            alert("Please answer all questions before submitting.");
            return;
        }
        onSubmit(answers);
    };

    const LoadingSpinner = () => (
        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
    );

    if (!questions || questions.length === 0) {
        return (
            <div className="w-full max-w-4xl mx-auto bg-white text-gray-800 dark:bg-gray-800 dark:text-gray-100 p-8 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 space-y-10 my-10 animate-fade-in">
                <div className="text-center">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">Finalizing Comparison...</h2>
                    <p className="text-lg text-gray-600 dark:text-gray-300">
                        The main comparison for <strong>{productA}</strong> vs <strong>{productB}</strong> is ready.
                        Proceed to the results page when you are ready.
                    </p>
                    
                    {/* Banner Ad */}
                    <div className="mt-6">
                      <GoogleAd className="mb-6" />
                    </div>
                    
                    <button
                        onClick={() => onSubmit({})} // Submit with empty answers if no questions were generated
                        disabled={isComparisonLoading}
                        className="mt-8 bg-indigo-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-300 transition-all duration-300 flex items-center justify-center disabled:bg-indigo-400 disabled:cursor-not-allowed"
                    >
                        {isComparisonLoading ? <LoadingSpinner/> : null}
                        {isComparisonLoading ? 'Finalizing...' : 'View Results'}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-4xl mx-auto bg-white text-gray-800 dark:bg-gray-800 dark:text-gray-100 p-8 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 space-y-10 my-10 animate-fade-in">
            <div className="text-center border-b border-gray-200 dark:border-gray-700 pb-8">
                <h2 className="text-4xl font-extrabold text-gray-900 dark:text-gray-100 mb-3">Just a few questions...</h2>
                <p className="text-xl text-gray-600 dark:text-gray-300">
                    To help us tailor the recommendation for <strong>{productA}</strong> vs <strong>{productB}</strong>, please answer the following questions.
                </p>
            </div>
            
            {/* Top Banner Ad */}
            <GoogleAd className="mb-6" />
            
            <form onSubmit={handleSubmit} className="space-y-8">
                {questions.map((q, index) => (
                    <React.Fragment key={index}>
                        <div className="p-6 rounded-xl shadow-inner border bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                            <fieldset>
                                <legend className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">{q.question_text}</legend>
                                <div className="space-y-3">
                                    {q.options.map((option, oIndex) => (
                                        <label key={oIndex} className="flex items-center p-3 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors duration-200 cursor-pointer">
                                            <input
                                                type="radio"
                                                name={`question-${index}`}
                                                value={option}
                                                onChange={() => handleOptionChange(q.question_text, option)}
                                                required
                                                className="h-5 w-5 text-indigo-600 border-gray-300 dark:border-gray-700 focus:ring-indigo-500"
                                            />
                                            <span className="ml-4 text-gray-700 dark:text-gray-200">{option}</span>
                                        </label>
                                    ))}
                                </div>
                            </fieldset>
                        </div>
                        
                                      {/* In-content ad every 2 questions */}
              {(index + 1) % 2 === 0 && (
                <GoogleAd className="my-6" />
              )}
                    </React.Fragment>
                ))}
                <div className="text-center pt-6">
                    <button
                        type="submit"
                        className="bg-indigo-600 text-white font-bold py-3 px-12 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-300 transition-all duration-300 text-lg flex items-center justify-center"
                    >
                        Get My Personalized Recommendation
                    </button>
                </div>
            </form>
            
            {/* Bottom Banner Ad */}
            <GoogleAd className="mt-6" />
        </div>
    );
};

export default QuestionView; 