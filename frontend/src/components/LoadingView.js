import React from 'react';
import GoogleAd from './GoogleAds';

const LoadingView = ({ productA, productB }) => {
    return (
        <div className="w-full max-w-4xl mx-auto bg-white text-gray-800 dark:bg-gray-800 dark:text-gray-100 p-8 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 space-y-10 my-10 animate-fade-in">
            <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">Hang tight! Our AI is working...</h2>
                <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
                    We're analyzing sources for your comparison of <strong>{productA}</strong> vs <strong>{productB}</strong>.
                </p>
                <div aria-label="Loading..." role="status" className="flex items-center justify-center space-x-2">
                    <svg className="h-16 w-16 animate-spin stroke-indigo-600" viewBox="0 0 256 256">
                        <line x1="128" y1="32" x2="128" y2="64" strokeLinecap="round" strokeLinejoin="round" strokeWidth="24"></line>
                        <line x1="195.9" y1="60.1" x2="173.3" y2="82.7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="24"></line>
                        <line x1="224" y1="128" x2="192" y2="128" strokeLinecap="round" strokeLinejoin="round" strokeWidth="24"></line>
                        <line x1="195.9" y1="195.9" x2="173.3" y2="173.3" strokeLinecap="round" strokeLinejoin="round" strokeWidth="24"></line>
                        <line x1="128" y1="224" x2="128" y2="192" strokeLinecap="round" strokeLinejoin="round" strokeWidth="24"></line>
                        <line x1="60.1" y1="195.9" x2="82.7" y2="173.3" strokeLinecap="round" strokeLinejoin="round" strokeWidth="24"></line>
                        <line x1="32" y1="128" x2="64" y2="128" strokeLinecap="round" strokeLinejoin="round" strokeWidth="24"></line>
                        <line x1="60.1" y1="60.1" x2="82.7" y2="82.7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="24"></line>
                    </svg>
                    <span className="text-2xl font-semibold text-gray-700 dark:text-gray-200">Loading...</span>
                </div>
                
                {/* Banner Ad during loading */}
                <div className="mt-8">
                  <GoogleAd />
                </div>
            </div>
        </div>
    );
};

export default LoadingView; 