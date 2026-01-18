/**
 * Google Analytics 4 Integration Service
 * Advanced analytics tracking for user engagement and business metrics
 */

// Google Analytics Measurement ID (replace with your actual GA4 ID)
const GA_MEASUREMENT_ID = 'G-XXXXXXXXXX'; // TODO: Replace with actual GA4 ID

// Initialize Google Analytics
export const initializeGA = (): void => {
  // Load Google Analytics script
  const script1 = document.createElement('script');
  script1.async = true;
  script1.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script1);

  const script2 = document.createElement('script');
  script2.innerHTML = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${GA_MEASUREMENT_ID}', {
      page_title: document.title,
      page_location: window.location.href,
      send_page_view: true
    });
  `;
  document.head.appendChild(script2);

  console.log('✅ Google Analytics 4 initialized');
};

// Track page views
export const trackPageView = (pageTitle: string, pagePath: string): void => {
  if (typeof gtag !== 'undefined') {
    gtag('config', GA_MEASUREMENT_ID, {
      page_title: pageTitle,
      page_path: pagePath,
    });
  }
};

// Track custom events
export const trackEvent = (
  eventName: string,
  parameters: Record<string, any> = {}
): void => {
  if (typeof gtag !== 'undefined') {
    gtag('event', eventName, {
      ...parameters,
      timestamp: new Date().toISOString(),
    });
  }
};

// Track article views
export const trackArticleView = (
  articleId: string,
  articleTitle: string,
  authorName?: string,
  category?: string
): void => {
  trackEvent('article_view', {
    article_id: articleId,
    article_title: articleTitle,
    author_name: authorName || 'Unknown',
    category: category || 'Uncategorized',
    content_type: 'opinion',
  });
};

// Track scroll depth
export const trackScrollDepth = (depth: number): void => {
  // Only track significant scroll milestones (25%, 50%, 75%, 90%, 100%)
  const milestones = [25, 50, 75, 90, 100];
  const milestone = milestones.find(m => depth >= m && depth < m + 5);

  if (milestone) {
    trackEvent('scroll_depth', {
      scroll_depth: milestone,
      page_location: window.location.href,
    });
  }
};

// Track time on page
let pageStartTime: number = Date.now();
let scrollDepthTracked: Set<number> = new Set();

export const initializePageTracking = (): void => {
  pageStartTime = Date.now();
  scrollDepthTracked = new Set();

  // Track scroll depth
  const handleScroll = (): void => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = Math.round((scrollTop / docHeight) * 100);

    trackScrollDepth(scrollPercent);
  };

  // Throttle scroll events
  let scrollTimer: NodeJS.Timeout;
  window.addEventListener('scroll', () => {
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(handleScroll, 100);
  });
};

export const trackTimeOnPage = (): void => {
  const timeSpent = Math.round((Date.now() - pageStartTime) / 1000); // seconds

  trackEvent('time_on_page', {
    time_spent_seconds: timeSpent,
    time_spent_minutes: Math.round(timeSpent / 60 * 100) / 100,
    page_location: window.location.href,
  });
};

// Track newsletter subscriptions
export const trackNewsletterSubscription = (
  interests?: string[],
  source?: string
): void => {
  trackEvent('newsletter_signup', {
    interests: interests?.join(', ') || 'none',
    signup_source: source || 'website',
    user_type: 'reader',
  });
};

// Track writer actions
export const trackWriterAction = (
  action: string,
  articleId?: string,
  additionalData?: Record<string, any>
): void => {
  trackEvent('writer_action', {
    action_type: action,
    article_id: articleId,
    ...additionalData,
  });
};

// Track editor actions
export const trackEditorAction = (
  action: string,
  articleId?: string,
  additionalData?: Record<string, any>
): void => {
  trackEvent('editor_action', {
    action_type: action,
    article_id: articleId,
    ...additionalData,
  });
};

// Track search queries
export const trackSearch = (
  searchTerm: string,
  category?: string,
  resultsCount?: number
): void => {
  trackEvent('search', {
    search_term: searchTerm,
    category: category || 'all',
    results_count: resultsCount || 0,
  });
};

// Track user engagement
export const trackEngagement = (
  engagementType: 'click' | 'hover' | 'share' | 'bookmark',
  element: string,
  details?: Record<string, any>
): void => {
  trackEvent('user_engagement', {
    engagement_type: engagementType,
    element_name: element,
    ...details,
  });
};

// Track traffic sources (when users arrive)
export const trackTrafficSource = (): void => {
  const urlParams = new URLSearchParams(window.location.search);
  const referrer = document.referrer;
  const source = urlParams.get('utm_source') || urlParams.get('source');
  const medium = urlParams.get('utm_medium') || urlParams.get('medium');
  const campaign = urlParams.get('utm_campaign') || urlParams.get('campaign');

  if (source || medium || campaign || referrer) {
    trackEvent('traffic_source', {
      utm_source: source,
      utm_medium: medium,
      utm_campaign: campaign,
      referrer: referrer,
      page_location: window.location.href,
    });
  }
};

// Track reader-to-subscriber conversion
export const trackReaderToSubscriberConversion = (
  timeToConvert?: number,
  articlesRead?: number
): void => {
  trackEvent('reader_to_subscriber', {
    time_to_convert_days: timeToConvert,
    articles_read_before_subscribe: articlesRead,
    conversion_source: 'newsletter_signup',
  });
};

// Enhanced article view tracking with engagement metrics
export const trackArticleEngagement = (
  articleId: string,
  engagementType: 'start_reading' | 'finish_reading' | 'share' | 'bookmark',
  details?: Record<string, any>
): void => {
  trackEvent('article_engagement', {
    article_id: articleId,
    engagement_type: engagementType,
    ...details,
  });
};

// Track admin dashboard usage
export const trackAdminAction = (
  action: string,
  section: string,
  details?: Record<string, any>
): void => {
  trackEvent('admin_action', {
    action_type: action,
    admin_section: section,
    ...details,
  });
};

// Initialize analytics on page load
export const initAnalytics = (): void => {
  // Only initialize if GA_MEASUREMENT_ID is configured
  if (GA_MEASUREMENT_ID && GA_MEASUREMENT_ID !== 'G-XXXXXXXXXX') {
    initializeGA();
    initializePageTracking();
    trackTrafficSource();

    // Track when users leave the page
    window.addEventListener('beforeunload', trackTimeOnPage);

    console.log('📊 Advanced Analytics initialized with Google Analytics 4');
  } else {
    console.warn('⚠️ Google Analytics not configured. Set GA_MEASUREMENT_ID in analyticsService.ts');
  }
};

// Export gtag for direct usage if needed
declare global {
  function gtag(...args: any[]): void;
}

export { gtag };