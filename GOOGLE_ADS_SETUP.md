# Google AdSense Setup Guide for SmartCompare

This guide will help you set up Google AdSense ads throughout your SmartCompare application.

## Prerequisites

1. **Google AdSense Account**: You need an approved Google AdSense account
2. **Publisher ID**: Your AdSense publisher ID (starts with `ca-pub-`)
3. **Ad Units**: Create ad units in your AdSense dashboard for different positions

## Step 1: Get Your Google AdSense Publisher ID

1. Log into your [Google AdSense account](https://www.google.com/adsense)
2. Go to **Settings** → **Account information**
3. Copy your **Publisher ID** (format: `ca-pub-XXXXXXXXXX`)

## Step 2: Create Ad Units

In your AdSense dashboard, create the following ad units:

### Banner Ad Unit
- **Name**: SmartCompare Banner
- **Size**: Responsive
- **Type**: Display ads
- **Copy the Ad Unit ID** (format: `XXXXXXXXXX`)

### In-Content Ad Unit
- **Name**: SmartCompare In-Content
- **Size**: Responsive
- **Type**: Display ads
- **Copy the Ad Unit ID**

### Footer Ad Unit
- **Name**: SmartCompare Footer
- **Size**: Responsive
- **Type**: Display ads
- **Copy the Ad Unit ID**

### Sidebar Ad Unit (Optional)
- **Name**: SmartCompare Sidebar
- **Size**: 300x250 or Responsive
- **Type**: Display ads
- **Copy the Ad Unit ID**

## Step 3: Update Configuration

### 1. Update HTML Head (frontend/public/index.html)

Replace the placeholder in the Google AdSense script:

```html
<!-- Replace ca-pub-YOUR_PUBLISHER_ID with your actual publisher ID -->
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-YOUR_ACTUAL_PUBLISHER_ID"
 crossorigin="anonymous"></script>
```

### 2. Update Ad Configuration (frontend/src/config/adsConfig.js)

Replace the placeholder values with your actual IDs:

```javascript
export const ADSENSE_CONFIG = {
  // Your actual Google AdSense Publisher ID
  PUBLISHER_ID: 'ca-pub-YOUR_ACTUAL_PUBLISHER_ID',
  
  // Your actual Ad Unit IDs
  AD_SLOTS: {
    BANNER: 'YOUR_ACTUAL_BANNER_AD_SLOT_ID',
    SIDEBAR: 'YOUR_ACTUAL_SIDEBAR_AD_SLOT_ID', 
    IN_CONTENT: 'YOUR_ACTUAL_IN_CONTENT_AD_SLOT_ID',
    FOOTER: 'YOUR_ACTUAL_FOOTER_AD_SLOT_ID',
    WELCOME: 'YOUR_ACTUAL_WELCOME_AD_SLOT_ID',
    LOADING: 'YOUR_ACTUAL_LOADING_AD_SLOT_ID'
  },
  
  // Keep the rest of the configuration as is
  SETTINGS: {
    ENABLED: true,
    // ... rest of settings
  }
};
```

## Step 4: Test Your Implementation

1. **Build and run your application**:
   ```bash
   cd frontend
   npm start
   ```

2. **Check for ads**: Visit different pages and verify that ads appear:
   - Chat page (welcome screen and during conversations)
   - Results page (top, middle, and bottom)
   - History page (top, between items, bottom)
   - Settings page (top, middle, bottom)
   - Questions page (top, between questions, bottom)
   - Loading page (during loading states)

3. **Check browser console**: Look for any AdSense-related errors

## Step 5: AdSense Policy Compliance

Ensure your implementation follows Google AdSense policies:

### ✅ Do's
- Place ads in natural content flow
- Use responsive ad units
- Maintain good user experience
- Follow content policies

### ❌ Don'ts
- Don't place too many ads (max 3 per page)
- Don't place ads too close together
- Don't encourage accidental clicks
- Don't place ads in prohibited locations

## Step 6: Monitor Performance

1. **AdSense Dashboard**: Monitor earnings and performance
2. **Google Analytics**: Track user behavior with ads
3. **A/B Testing**: Test different ad placements

## Configuration Options

### Enable/Disable Ads Globally

In `frontend/src/config/adsConfig.js`:

```javascript
SETTINGS: {
  ENABLED: true, // Set to false to disable all ads
  // ...
}
```

### Enable/Disable Ads for Specific Pages

```javascript
PAGES: {
  CHAT: true,        // Show ads on chat page
  RESULTS: true,     // Show ads on results page
  HISTORY: true,     // Show ads on history page
  SETTINGS: true,    // Show ads on settings page
  QUESTIONS: true,   // Show ads on questions page
  LOADING: true      // Show ads on loading page
}
```

### Adjust Ad Frequency

```javascript
FREQUENCY: {
  CHAT_MESSAGES: 5,      // Show ad every 5 messages
  HISTORY_ITEMS: 3,      // Show ad every 3 history items
  QUESTIONS: 2,          // Show ad every 2 questions
  USER_PREFERENCES: 3    // Show ad every 3 preference questions
}
```

## Troubleshooting

### Ads Not Showing
1. Check if your AdSense account is approved
2. Verify publisher ID and ad unit IDs
3. Check browser console for errors
4. Ensure ads are enabled in configuration

### AdSense Policy Violations
1. Review Google AdSense policies
2. Remove any prohibited content
3. Adjust ad placement if needed
4. Contact AdSense support if necessary

### Performance Issues
1. Check ad loading times
2. Optimize ad placement
3. Monitor user experience
4. Consider reducing ad frequency

## Support

- [Google AdSense Help Center](https://support.google.com/adsense)
- [AdSense Policies](https://support.google.com/adsense/answer/48182)
- [AdSense Community](https://support.google.com/adsense/community)

## Notes

- **Revenue**: It may take 24-48 hours for ads to start generating revenue
- **Approval**: New ad units may take time to be reviewed and approved
- **Testing**: Use AdSense's test mode during development
- **Compliance**: Always follow Google's AdSense policies to avoid account suspension 