// Google AdSense Configuration
// Replace these placeholder values with your actual Google AdSense publisher ID and ad slot IDs

export const ADSENSE_CONFIG = {
  // Your Google AdSense Publisher ID (starts with ca-pub-)
  PUBLISHER_ID: 'ca-pub-2752395400696467',
  
  // Ad Slot IDs for different ad positions
  AD_SLOTS: {
    BANNER: 'YOUR_BANNER_AD_SLOT',
    SIDEBAR: 'YOUR_SIDEBAR_AD_SLOT', 
    IN_CONTENT: 'YOUR_IN_CONTENT_AD_SLOT',
    FOOTER: 'YOUR_FOOTER_AD_SLOT',
    WELCOME: 'YOUR_WELCOME_AD_SLOT',
    LOADING: 'YOUR_LOADING_AD_SLOT'
  },
  
  // Ad display settings
  SETTINGS: {
    // Enable/disable ads globally
    ENABLED: true,
    
    // Show ads on specific pages
    PAGES: {
      CHAT: true,
      RESULTS: true,
      HISTORY: true,
      SETTINGS: true,
      QUESTIONS: true,
      LOADING: true
    },
    
    // Ad frequency settings
    FREQUENCY: {
      CHAT_MESSAGES: 5, // Show ad every 5 messages
      HISTORY_ITEMS: 3, // Show ad every 3 history items
      QUESTIONS: 2, // Show ad every 2 questions
      USER_PREFERENCES: 3 // Show ad every 3 preference questions
    },
    
    // Responsive settings
    RESPONSIVE: {
      MOBILE_BREAKPOINT: 768,
      DESKTOP_MAX_WIDTH: 728,
      MOBILE_MAX_WIDTH: 320
    }
  }
};

// Helper function to get ad slot ID
export const getAdSlot = (type) => {
  return ADSENSE_CONFIG.AD_SLOTS[type] || ADSENSE_CONFIG.AD_SLOTS.BANNER;
};

// Helper function to check if ads are enabled for a specific page
export const isAdsEnabledForPage = (page) => {
  return ADSENSE_CONFIG.SETTINGS.ENABLED && ADSENSE_CONFIG.SETTINGS.PAGES[page];
};

// Helper function to get frequency setting
export const getAdFrequency = (type) => {
  return ADSENSE_CONFIG.SETTINGS.FREQUENCY[type] || 3;
}; 