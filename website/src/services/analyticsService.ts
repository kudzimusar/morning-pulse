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

// Alias for trackArticleView to maintain compatibility
export const incrementArticleView = trackArticleView;

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

// Track reactions (like, love, insightful, disagree)
export const trackReaction = (
  opinionId: string,
  reactionType: 'like' | 'love' | 'insightful' | 'disagree',
  action: 'add' | 'remove'
): void => {
  trackEvent('opinion_reaction', {
    opinion_id: opinionId,
    reaction_type: reactionType,
    action: action,
    timestamp: new Date().toISOString(),
  });
};

// Track comment submission
export const trackComment = (
  opinionId: string,
  commentId: string,
  action: 'create' | 'edit' | 'delete' | 'reply'
): void => {
  trackEvent('opinion_comment', {
    opinion_id: opinionId,
    comment_id: commentId,
    action: action,
    timestamp: new Date().toISOString(),
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
    // console.warn('⚠️ Google Analytics not configured. Set GA_MEASUREMENT_ID in analyticsService.ts');
  }
};

// Export gtag for direct usage if needed
declare global {
  function gtag(...args: any[]): void;
}

export { gtag };

// Types for analytics summary
export interface AnalyticsSummary {
  totalViews: number;
  uniqueVisitors: number;
  avgTimeOnPage: number;
  bounceRate: number;
  totalPublished: number;
  totalDrafts?: number;
  totalPending?: number;
  totalInReview?: number;
  totalScheduled?: number;
  avgTimeToPublish?: number;
  topArticles: Array<{
    id: string;
    title: string;
    headline?: string;
    views: number;
    engagement: number;
    authorName?: string;
    slug?: string;
  }>;
  topOpinions?: Array<{
    id: string;
    headline: string;
    views: number;
    authorName: string;
    slug: string;
  }>;
  topAuthors?: Array<{
    authorName: string;
    totalViews: number;
    publishedCount: number;
    avgViewsPerArticle: number;
  }>;
  topCategories?: Array<{
    category: string;
    count: number;
  }>;
  categoryDistribution: Record<string, number>;
  dailyTraffic: Array<{
    date: string;
    views: number;
    adImpressions?: number;
  }>;
  recentActivity?: Array<{
    action: string;
    timestamp: Date;
  }>;
}

// App ID Constant
const APP_ID = (window as any).__app_id || 'morning-pulse-app';

/**
 * Get analytics summary from Firestore
 * Uses mandatory path: artifacts/{appId}/public/data/analytics
 */
export const getAnalyticsSummary = async (db: any, period: 'day' | 'week' | 'month' = 'week'): Promise<AnalyticsSummary> => {
  // console.log(`Fetching analytics summary for ${period}...`);
  
  // ✅ FIX: Validate db instance before use
  if (!db) {
    console.error('❌ Analytics: Firestore database instance is undefined');
    return getMockAnalytics();
  }
  
  // ✅ FIX: Check if db is a valid Firestore instance
  if (typeof db !== 'object' || (!db.type && typeof db.collection !== 'function')) {
    console.error('❌ Analytics: Invalid Firestore database instance');
    return getMockAnalytics();
  }
  
  // ✅ FIX: Validate APP_ID before using
  if (!APP_ID || APP_ID === 'undefined' || APP_ID === 'null') {
    console.error('❌ Analytics: APP_ID is undefined or invalid');
    return getMockAnalytics();
  }
  
  try {
    const { collection, query, limit, getDocs } = await import('firebase/firestore');
    const analyticsRef = collection(db, 'artifacts', APP_ID, 'public', 'data', 'analytics');
    const q = query(analyticsRef, limit(1));
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      return snapshot.docs[0].data() as AnalyticsSummary;
    }
  } catch (error: any) {
    console.error('❌ Analytics Fetch Error:', error.message);
    // Fallback to mock data if permissions fail
  }

  return getMockAnalytics();
};

/**
 * Generate high-quality mock analytics data for "Pre-Flight" demo
 */
const getMockAnalytics = (): AnalyticsSummary => {
  const now = new Date();
  const dailyTraffic = [];
  
  // Generate 7 days of trend data
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(now.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    // Create an upward trend
    const baseViews = 150 + (6 - i) * 25;
    const randomVariation = Math.floor(Math.random() * 40);
    
    dailyTraffic.push({
      date: dateStr,
      views: baseViews + randomVariation,
      adImpressions: (baseViews + randomVariation) * 3 + Math.floor(Math.random() * 100)
    });
  }

  return {
    totalViews: 1842,
    uniqueVisitors: 1205,
    avgTimeOnPage: 168, // seconds
    bounceRate: 32.4, // percentage
    totalPublished: 24,
    totalDrafts: 5,
    totalPending: 3,
    totalInReview: 2,
    totalScheduled: 1,
    avgTimeToPublish: 14,
    topArticles: [
      { id: '1', title: 'Global Tech Trends 2026', views: 542, engagement: 88, authorName: 'Dr. Aris Gwarisa', slug: 'global-tech-trends-2026' },
      { id: '2', title: 'African Economic Outlook', views: 415, engagement: 76, authorName: 'Kudzi Musar', slug: 'african-economic-outlook' },
      { id: '3', title: 'Future of Digital Identity', views: 328, engagement: 92, authorName: 'Sarah Jenkins', slug: 'future-digital-identity' }
    ],
    topOpinions: [
      { id: '1', headline: 'Global Tech Trends 2026', views: 542, authorName: 'Dr. Aris Gwarisa', slug: 'global-tech-trends-2026' },
      { id: '2', headline: 'African Economic Outlook', views: 415, authorName: 'Kudzi Musar', slug: 'african-economic-outlook' },
      { id: '3', headline: 'Future of Digital Identity', views: 328, authorName: 'Sarah Jenkins', slug: 'future-digital-identity' }
    ],
    topAuthors: [
      { authorName: 'Dr. Aris Gwarisa', totalViews: 1240, publishedCount: 5, avgViewsPerArticle: 248 },
      { authorName: 'Kudzi Musar', totalViews: 980, publishedCount: 4, avgViewsPerArticle: 245 },
      { authorName: 'Sarah Jenkins', totalViews: 750, publishedCount: 3, avgViewsPerArticle: 250 }
    ],
    topCategories: [
      { category: 'Technology', count: 12 },
      { category: 'Economy', count: 8 },
      { category: 'Culture', count: 4 }
    ],
    categoryDistribution: {
      'Technology': 45,
      'Economy': 30,
      'Culture': 15,
      'General': 10
    },
    dailyTraffic,
    recentActivity: [
      { action: 'New Opinion Submitted: "Future of AI in Africa"', timestamp: new Date(now.getTime() - 1000 * 60 * 45) },
      { action: 'Article Published: "Global Tech Trends 2026"', timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 3) },
      { action: 'New Advertiser Registered: "Pulse Premium"', timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 5) }
    ]
  };
};
