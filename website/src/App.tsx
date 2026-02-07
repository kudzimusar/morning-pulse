// Deployment fix attempt 2
import React, { useState, useEffect } from 'react';
import { initializeApp, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, signInAnonymously, Auth, onAuthStateChanged } from 'firebase/auth';
import Header from './components/Header';
import MobileHeader from './components/MobileHeader';
import MobileMenuDrawer from './components/MobileMenuDrawer';
import MobileSearch from './components/MobileSearch';
import MobileNotifications from './components/MobileNotifications';
import ForYouFeed from './components/ForYouFeed';
import AskPulseAI from './components/AskPulseAI';
import BookmarksPage from './components/BookmarksPage';

// ✅ FIX: AdminDashboard wrapper component to add delay for AuthContext completion
const AdminDashboardWrapper: React.FC<{ userRole: any }> = ({ userRole }) => {
  const [isReady, setIsReady] = useState(false);
  
  useEffect(() => {
    // ✅ FIX: Add small delay to ensure AuthContext has finished updating userRoles
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 150); // 150ms delay to ensure auth state is fully resolved
    
    return () => clearTimeout(timer);
  }, [userRole]);
  
  if (!isReady) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 'calc(100vh - 80px)',
        fontSize: '18px',
        color: '#666'
      }}>
        Initializing Dashboard...
      </div>
    );
  }
  
  return (
    <div style={{ minHeight: 'calc(100vh - 80px)' }}>
      <React.Suspense fallback={
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 'calc(100vh - 80px)',
          fontSize: '18px',
          color: '#666'
        }}>
          Loading Dashboard...
        </div>
      }>
        <AdminDashboard />
      </React.Suspense>
    </div>
  );
};
import NewsGrid from './components/NewsGrid';
import LoadingSkeleton from './components/LoadingSkeleton';
import FirebaseConnector from './components/FirebaseConnector';
import OpinionPage from './components/OpinionPage';
import OpinionSubmissionForm from './components/OpinionSubmissionForm';
// ✅ FIX: Lazy load AdminDashboard to break circular dependencies
import AdminLogin from './components/AdminLogin';
const AdminDashboard = React.lazy(() => import('./components/AdminDashboard'));
import Footer from './components/Footer';
import LegalPage from './components/LegalPage';
import AboutPage from './components/AboutPage';
import SubscriptionPage from './components/SubscriptionPage';
import AdvertisePage from './components/AdvertisePage';
import EditorialPage from './components/EditorialPage';
import WriterRegistration from './components/WriterRegistration';
import WriterLogin from './components/WriterLogin';
import WriterDashboard from './components/WriterDashboard';
import SubscriberRegistration from './components/SubscriberRegistration';
import SubscriberLogin from './components/SubscriberLogin';
import SubscriberDashboard from './components/SubscriberDashboard';
import AdvertiserRegistration from './components/AdvertiserRegistration';
import AdvertiserLogin from './components/AdvertiserLogin';
import AdvertiserDashboard from './components/AdvertiserDashboard';
import AdSubmissionForm from './components/AdSubmissionForm';
import JoinPage from './components/JoinPage';
import AuthPage from './components/AuthPage';
// Import admin auth service (will only be used when admin mode is enabled)
import { 
  getCurrentEditor, 
  onEditorAuthStateChanged, 
  getStaffRole, 
  StaffRole,
  requireEditor,
  logoutEditor
} from './services/authService';
import { NewsStory } from '../types';
import { CountryInfo, getUserCountry, detectUserLocation, saveUserCountry, hasManualCountrySelection } from './services/locationService';
import { initAnalytics, trackPageView, trackArticleView } from './services/analyticsService';
import { setupScrollMemory, saveScrollPosition, restoreScrollPosition } from './utils/scrollMemory';

// Helper function to get page title for analytics
const getPageTitle = (hash: string): string => {
  const pageTitles: Record<string, string> = {
    'news': 'Morning Pulse - Latest News',
    'opinion': 'Morning Pulse - Opinions',
    'opinion-submit': 'Morning Pulse - Submit Opinion',
    'subscription': 'Morning Pulse - Newsletter Signup',
    'about': 'Morning Pulse - About Us',
    'privacy': 'Morning Pulse - Privacy Policy',
    'terms': 'Morning Pulse - Terms of Service',
    'cookies': 'Morning Pulse - Cookie Policy',
    'advertise': 'Morning Pulse - Advertise With Us',
    'editorial': 'Morning Pulse - Editorial Standards',
    'join': 'Morning Pulse - Join Our Team',
    'auth': 'Morning Pulse - Sign In',
    'signin': 'Morning Pulse - Sign In',
    'signup': 'Morning Pulse - Sign Up',
    'writer-register': 'Morning Pulse - Writer Registration',
    'writer-login': 'Morning Pulse - Writer Login',
    'writer-dashboard': 'Morning Pulse - Writer Dashboard',
    'subscriber-register': 'Morning Pulse - Subscriber Registration',
    'subscriber-login': 'Morning Pulse - Subscriber Login',
    'subscriber-dashboard': 'Morning Pulse - Subscriber Dashboard',
    'advertiser-register': 'Morning Pulse - Advertiser Registration',
    'advertiser-login': 'Morning Pulse - Advertiser Login',
    'advertiser-dashboard': 'Morning Pulse - Advertiser Dashboard',
    'advertiser-submit-ad': 'Morning Pulse - Submit Advertisement',
    'admin': 'Morning Pulse - Admin Login',
    'dashboard': 'Morning Pulse - Admin Dashboard',
  };

  return pageTitles[hash] || 'Morning Pulse';
};

// Get Firebase config (same pattern as FirebaseConnector)
const getFirebaseConfig = (): any => {
  if (typeof window !== 'undefined' && (window as any).__firebase_config) {
    const config = (window as any).__firebase_config;
    if (typeof config === 'object' && config !== null && config.apiKey && config.apiKey !== 'YOUR_API_KEY') {
      return config;
    }
  }
  const configStr = import.meta.env.VITE_FIREBASE_CONFIG;
  if (configStr && typeof configStr === 'string' && configStr.trim() && configStr !== 'null') {
    try {
      let parsed = JSON.parse(configStr);
      if (typeof parsed === 'string') {
        parsed = JSON.parse(parsed);
      }
      return parsed;
    } catch (e) {
      console.error('Failed to parse VITE_FIREBASE_CONFIG:', e);
    }
  }
  // Hardcoded fallback
  return {
    apiKey: "AIzaSyCAh6j7mhTtiQGN5855Tt-hCRVrNXbNxYE",
    authDomain: "gen-lang-client-0999441419.firebaseapp.com",
    projectId: "gen-lang-client-0999441419",
    storageBucket: "gen-lang-client-0999441419.firebasestorage.app",
    messagingSenderId: "328455476104",
    appId: "1:328455476104:web:396deccbc5613e353f603d",
    measurementId: "G-60S2YK429K"
  };
};

interface NewsData {
  [category: string]: NewsStory[];
}

const App: React.FC = () => {
  // ✅ FIX: Admin authentication state MUST be declared before useEffects that reference them
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [userRole, setUserRole] = useState<StaffRole>(null);
  const [adminAuthLoading, setAdminAuthLoading] = useState(false);
  const [view, setView] = useState<'public' | 'admin'>('public');
  
  // Reader authentication state
  const [isReaderAuthenticated, setIsReaderAuthenticated] = useState(false);
  const [readerInfo, setReaderInfo] = useState<{ name: string; email: string } | null>(null);
  
  // ✅ FIX: Admin mode check - make it dynamic based on hash and view
  // This ensures isAdminMode reflects the current state, not just env var
  const isAdminMode = import.meta.env.VITE_ENABLE_ADMIN === 'true' || 
                      (typeof window !== 'undefined' && (
                        window.location.hash.includes('dashboard') || 
                        window.location.hash.includes('admin') ||
                        view === 'admin'
                      ));
  
  // ✅ FIX: Clear localStorage ONCE on mount, not on every render
  useEffect(() => {
    try {
      const hasCleared = sessionStorage.getItem('localStorageCleared');
      if (!hasCleared) {
        localStorage.clear();
        sessionStorage.setItem('localStorageCleared', 'true');
        console.log('✅ Cleared localStorage at app initialization (once)');
      }
    } catch (clearError) {
      console.warn('⚠️ Could not clear localStorage:', clearError);
    }

    // Initialize Google Analytics 4
    initAnalytics();
    
  }, []); // Empty deps = run only once per session

  // Regular state declarations
  const [newsData, setNewsData] = useState<NewsData>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useFirestore, setUseFirestore] = useState(true);
  const [currentPage, setCurrentPage] = useState<string>('news');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [currentCountry, setCurrentCountry] = useState<CountryInfo>(() => {
    // Initialize from localStorage if available, otherwise default
    return getUserCountry() || { code: 'ZW', name: 'Zimbabwe' };
  });
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [opinionSlug, setOpinionSlug] = useState<string | null>(null); // NEW: Current opinion slug for routing
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [mobileActiveTab, setMobileActiveTab] = useState<'latest' | 'foryou' | 'askai'>('latest');
  const [mobileNotificationsOpen, setMobileNotificationsOpen] = useState(false);

  // Initialize country: check for manual selection first, then auto-detect
  useEffect(() => {
    const initializeCountry = async () => {
      const manualSelection = hasManualCountrySelection();
      
      if (manualSelection) {
        // User has manually selected a country, use it
      const savedCountry = getUserCountry();
      if (savedCountry) {
          setCurrentCountry(savedCountry);
          console.log(`✅ Using saved country preference: ${savedCountry.name}`);
        return;
        }
      }
      
      // No manual selection, auto-detect
      try {
        console.log('🔍 Auto-detecting user location...');
        const detectedCountry = await detectUserLocation();
        setCurrentCountry(detectedCountry);
        // Save as auto-detected (manualSelection: false)
        saveUserCountry(detectedCountry, false);
        console.log(`✅ Auto-detected country: ${detectedCountry.name}`);
      } catch (error) {
        console.error('❌ Location detection failed:', error);
        // Keep default (Zimbabwe)
      }
    };

    initializeCountry();
  }, []);

  // Handle ?story=slug URL parameter (from share page redirects)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const storySlug = urlParams.get('story');
    
    if (storySlug) {
      console.log(`📰 Share redirect detected: story=${storySlug}`);
      // Navigate to opinion page with slug
      // Clear the query parameter to avoid re-triggering
      window.history.replaceState({}, '', window.location.pathname + window.location.hash);
      // Set hash to opinion page with slug
      window.location.hash = `opinion/${storySlug}`;
      // The hash change will be handled by the hash-based routing useEffect
    }
  }, []); // Run only once on mount

  // Helper function to parse hash parameters (e.g., #news?category=Business)
  const parseHashParams = (hash: string): { path: string; params: URLSearchParams } => {
    const [path, queryString] = hash.split('?');
    const params = new URLSearchParams(queryString || '');
    return { path, params };
  };

  // Category mapping: Footer section names -> Actual category names in data
  const mapFooterCategoryToDataCategory = (footerCategory: string): string | null => {
    const categoryMap: Record<string, string> = {
      'Business': 'Business (Zim)',
      'Technology': 'Tech & AI',
      'World News': 'World News',
      'Politics': 'Local (Zim)', // Map Politics to Local for now
      'Sports': 'Sports',
      'Health': 'Health',
      'Environment': 'Environment',
    };
    return categoryMap[footerCategory] || null;
  };

      // Handle hash-based routing
      useEffect(() => {
        const handleHashChange = () => {
          const hash = window.location.hash.replace('#', '');
          const { path, params } = parseHashParams(hash);
          
          // ✅ FIX: Early return for foryou/askai to prevent race conditions
          if (path === 'foryou') {
            setCurrentPage('foryou');
            setMobileActiveTab('foryou');
            setSelectedCategory(null);
            return; // Early return to prevent further processing
          }
          if (path === 'askai') {
            setCurrentPage('askai');
            setMobileActiveTab('askai');
            setSelectedCategory(null);
            return; // Early return to prevent further processing
          }
          
          // Update mobile active tab based on hash
          if (path === 'news' || path === '' || !path) {
            setMobileActiveTab('latest');
          }

      // ✅ FIX: Guard clause - prevent processing if already on dashboard
      if (path === 'dashboard' && view === 'admin' && requireEditor(userRole)) {
        return; // Already on dashboard, don't process again
      }

      // Scroll Memory - Save position when navigating away from news
      if (currentPage === 'news' && path !== 'news' && path !== '') {
        saveScrollPosition('news-feed');
      }
      
      // Track page view in Google Analytics
      const pageTitle = getPageTitle(path);
      trackPageView(pageTitle, `/${path || 'news'}`);
      
      // Handle category parameter for news page
      if (path === 'news' || path === '') {
        // Restore scroll position when returning to news feed
        setTimeout(() => {
          restoreScrollPosition('news-feed');
        }, 100);
        setCurrentPage('news');
        setMobileActiveTab('latest');
        const categoryParam = params.get('category');
        if (categoryParam) {
          const mappedCategory = mapFooterCategoryToDataCategory(categoryParam);
          if (mappedCategory) {
            setSelectedCategory(mappedCategory);
          } else {
            setSelectedCategory(null);
          }
        } else {
          setSelectedCategory(null);
        }
      } else {
        // Clear category when navigating away from news page
        setSelectedCategory(null);
      }
      
      if (path === 'opinion' || hash.startsWith('opinion')) {
        if (hash === 'opinion/submit' || hash.startsWith('opinion/submit')) {
          setCurrentPage('opinion-submit');
          setOpinionSlug(null);
        } else if (hash.startsWith('opinion/')) {
          // NEW: Extract slug from hash (e.g., #opinion/zimbabwe-economic-crisis)
          const slug = hash.substring('opinion/'.length);
          if (slug && slug !== 'submit') {
            setOpinionSlug(slug);
            setCurrentPage('opinion');
          } else {
            setOpinionSlug(null);
            setCurrentPage('opinion');
          }
        } else {
          // Just #opinion (list view)
          setOpinionSlug(null);
          setCurrentPage('opinion');
        }
      } else if (path === 'privacy') {
        setCurrentPage('privacy');
      } else if (path === 'terms') {
        setCurrentPage('terms');
      } else if (path === 'cookies') {
        setCurrentPage('cookies');
      } else if (path === 'about') {
        setCurrentPage('about');
      } else if (path === 'subscribe' || path === 'subscription') {
        setCurrentPage('subscription');
      } else if (path === 'advertise') {
        setCurrentPage('advertise');
      } else if (path === 'editorial') {
        setCurrentPage('editorial');
      } else if (path === 'writer/register' || hash.startsWith('writer/register')) {
        setCurrentPage('writer-register');
      } else if (path === 'writer/login' || hash.startsWith('writer/login')) {
        setCurrentPage('writer-login');
      } else if (path === 'writer/dashboard' || hash.startsWith('writer/dashboard')) {
        setCurrentPage('writer-dashboard');
      } else if (path === 'subscriber/register' || hash.startsWith('subscriber/register')) {
        setCurrentPage('subscriber-register');
      } else if (path === 'subscriber/login' || hash.startsWith('subscriber/login')) {
        setCurrentPage('subscriber-login');
      } else if (path === 'subscriber/dashboard' || hash.startsWith('subscriber/dashboard')) {
        setCurrentPage('subscriber-dashboard');
      } else if (path === 'advertiser/register' || hash.startsWith('advertiser/register')) {
        setCurrentPage('advertiser-register');
      } else if (path === 'advertiser/login' || hash.startsWith('advertiser/login')) {
        setCurrentPage('advertiser-login');
      } else if (path === 'advertiser/dashboard' || hash.startsWith('advertiser/dashboard')) {
        setCurrentPage('advertiser-dashboard');
      } else if (path === 'bookmarks') {
        setCurrentPage('bookmarks');
      } else if (path === 'advertiser/submit-ad' || hash.startsWith('advertiser/submit-ad')) {
        setCurrentPage('advertiser-submit-ad');
      } else if (path === 'admin') {
        // ✅ FIX: Make admin a full page, not overlay
        setCurrentPage('admin');
        setShowAdminLogin(false); // Don't use overlay flag
      } else if (path === 'dashboard') {
        // ✅ NEW: Dashboard route for logged-in editors
        if (requireEditor(userRole)) {
          setView('admin');
          setCurrentPage('news'); // Keep currentPage for context
        }
      } else if (path === 'auth' || path === 'signin' || path === 'signup') {
        // ✅ NEW: Unified authentication page for regular readers
        setCurrentPage('auth');
        setMobileActiveTab('latest');
        setView('public');
        setShowAdminLogin(false);
        console.log('🔗 [ROUTING] Auth page detected, hash:', hash);
      } else if (path === 'join' || hash.startsWith('join?')) {
        // ✅ NEW: Staff invitation join page
        // Handle both #join?token=... and #join
        setCurrentPage('join');
        setView('public');
        setShowAdminLogin(false);
        console.log('🔗 [ROUTING] Join page detected, hash:', hash);
      } else if (path === 'foryou' || path === 'askai') {
        // ✅ FIX: Don't reset foryou/askai routes - they're already handled above
        // This prevents the else block from overriding them
        // Do nothing - already handled in the earlier if/else chain
      } else if (!path || path === '') {
        // Only default to news if path is empty or undefined
        setCurrentPage('news');
        setShowAdminLogin(false);
        // ✅ FIX: Don't reset view if editor is logged in - let them stay in admin view
        // Only switch to public view if not an editor
        if (!requireEditor(userRole)) {
          setView('public');
        }
        // If editor is logged in and view is already admin, keep it
        // If editor is logged in but view is public, switch to admin
        if (requireEditor(userRole) && view === 'public') {
          setView('admin');
          console.log('✅ Auto-switching to admin view for logged-in editor');
        }
      }
      // ✅ FIX: Removed catch-all else that was resetting to 'news'
      // Unknown routes will now preserve their currentPage state
    };

    // Check URL path for /admin
    if (window.location.pathname === '/admin' || window.location.hash === '#admin') {
      setCurrentPage('admin');
      setShowAdminLogin(false);
    }

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
    // ✅ FIX: Use function refs to access latest view/userRole without re-running effect
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - only run on mount, hash changes handled by event listener

  // ✅ EMERGENCY FIX: Single useEffect for admin view switching with STRICT GUARD
  useEffect(() => {
    const hasEditorAccess = requireEditor(userRole);
    
    // 🛡️ STRICT GUARD: If we KNOW the user is an editor, DO NOT let the view switch to public
    if (hasEditorAccess) {
      if (view !== 'admin') {
        console.log('🛡️ Guard: Keeping user in Admin view');
        setView('admin');
      }
      if (!window.location.hash.includes('dashboard')) {
        window.location.hash = 'dashboard';
      }
      return; // Exit here - do not proceed to public logic
    }

    // Only allow public view if they are NOT an editor
    const targetView = 'public';
    if (view !== targetView) {
      console.log(`🚀 Switching view to: ${targetView}`);
      setView(targetView);
    }
  }, [userRole, view]); // Watch both to ensure stability

  // Check editor role when admin mode is enabled
  useEffect(() => {
    if (!isAdminMode) {
      setUserRole(null);
      setAdminAuthLoading(false);
      return;
    }

    let unsubscribe: (() => void) | null = null;

    // Delay initialization to ensure Firebase is ready and prevent blocking main app
    const timeoutId = setTimeout(() => {
      setAdminAuthLoading(true);

      const checkRole = async (user: any) => {
        if (!user) {
          setUserRole(null);
          setAdminAuthLoading(false);
          setView('public'); // Reset to public view when no user
          return;
        }

        try {
          const role = await getStaffRole(user.uid);
          setUserRole(role);
          
          // ✅ FIX: Switch to admin view when editor logs in
          if (requireEditor(role)) {
            setView('admin');
            window.location.hash = 'dashboard';
            console.log('✅ Editor authenticated, switching to admin dashboard');
            console.log('✅ Roles:', role);
          } else {
            setView('public');
          }
        } catch (err) {
          console.error('Error checking role:', err);
          setUserRole(null);
          setView('public');
        } finally {
          setAdminAuthLoading(false);
        }
      };

      try {
        // Subscribe to auth state changes first (handles initial state)
        unsubscribe = onEditorAuthStateChanged((user) => {
          console.log('🔄 Auth state changed, user:', user?.uid || 'null');
          checkRole(user);
        });
        
        // ✅ FIX: Also check current user immediately (in case login already happened)
        const currentUser = getCurrentEditor();
        if (currentUser) {
          console.log('🔍 Checking current user immediately...');
          checkRole(currentUser);
        } else {
          setAdminAuthLoading(false);
        }
      } catch (error) {
        console.error('Error initializing admin auth:', error);
        setAdminAuthLoading(false);
      }
    }, 500); // Delay to ensure main app loads first
    
    return () => {
      clearTimeout(timeoutId);
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [isAdminMode]);

  // ✅ NEW: Listen for reader authentication state changes
  useEffect(() => {
    const checkReaderAuth = async () => {
      try {
        const { getCurrentReader } = await import('./services/readerService');
        const { getAuth, onAuthStateChanged } = await import('firebase/auth');
        
        const auth = getAuth();
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
          if (user && !user.isAnonymous) {
            // Check if user is a reader
            try {
              const reader = await getCurrentReader();
              if (reader) {
                setIsReaderAuthenticated(true);
                setReaderInfo({
                  name: reader.name,
                  email: reader.email
                });
                // If user doesn't have staff role, ensure they have reader role
                if (!userRole || (Array.isArray(userRole) && userRole.length === 0)) {
                  setUserRole(['reader']);
                }
              } else {
                // User is authenticated but not a reader - might be staff
                // Don't clear state if they're staff
                if (!userRole || (Array.isArray(userRole) && userRole.length === 0)) {
                  setIsReaderAuthenticated(false);
                  setReaderInfo(null);
                }
              }
            } catch (error) {
              console.error('Error checking reader:', error);
              // Don't clear state if user has staff role
              if (!userRole || (Array.isArray(userRole) && userRole.length === 0)) {
                setIsReaderAuthenticated(false);
                setReaderInfo(null);
              }
            }
          } else {
            // User is not authenticated or is anonymous
            setIsReaderAuthenticated(false);
            setReaderInfo(null);
          }
        });
        
        return unsubscribe;
      } catch (error) {
        console.error('Error setting up reader auth listener:', error);
        return () => {};
      }
    };

    const cleanupPromise = checkReaderAuth();
    return () => {
      cleanupPromise.then(unsub => unsub && unsub());
    };
  }, [userRole]);

  // Try to load static data first (Mode B), fallback to Firestore (Mode A)
  useEffect(() => {
    const loadStaticData = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const url = `/morning-pulse/data/news-${today}.json`;
        console.log('🔍 Attempting to load static news from:', url);
        const response = await fetch(url);
        console.log('📡 Static news response status:', response.status);
        if (response.ok) {
          const data = await response.json();
          const categoryCount = Object.keys(data.categories || {}).length;
          console.log('✅ Static news loaded successfully:', categoryCount, 'categories');
          setNewsData(data.categories || {});
          setLoading(false);
          setUseFirestore(false);
          return;
        } else {
          console.log('ℹ️ Static news file not found (404), will try Firestore');
        }
      } catch (err) {
        console.log('❌ Static data fetch error:', err);
        console.log('🔄 Falling back to Firestore mode');
      }
      // If static data fails, use Firestore
      setUseFirestore(true);
      setLoading(false);
    };

    loadStaticData();
  }, []);

  // Memoize callbacks to prevent FirebaseConnector re-initialization
  const handleNewsUpdate = React.useCallback((data: NewsData, timestamp?: Date) => {
    setNewsData(data);
    setLoading(false);
    setError(null);
    if (timestamp) {
      setLastUpdated(timestamp);
    }
  }, []);

  const handleError = React.useCallback((errorMessage: string) => {
    // Error handler - errors will be set by FirebaseConnector only if no news found
    setError(errorMessage);
    setLoading(false);
  }, []);

  // Handle country change (when user manually selects)
  const handleCountryChange = React.useCallback((country: CountryInfo) => {
    setCurrentCountry(country);
    // Save as manual selection (overrides auto-detection)
    saveUserCountry(country, true);
    console.log(`✅ Country changed to: ${country.name} (manual selection)`);
  }, []);

  const handleCategorySelect = (category: string | null) => {
    setSelectedCategory(category);
    if (category === 'Opinion') {
      window.location.hash = 'opinion';
    } else {
      window.location.hash = '';
      setCurrentPage('news');
    }
  };

  const handleNavigateToSubmit = () => {
    window.location.hash = 'opinion/submit';
  };

  const handleBackToNews = () => {
    window.location.hash = '';
    setCurrentPage('news');
  };

  const handleSubscribeClick = () => {
    // Navigate to newsletter subscription page
    window.location.hash = 'subscribe';
  };

  // Handle sign out
  const handleSignOut = async () => {
    try {
      const { signOutReader } = await import('./services/readerService');
      const { logoutEditor } = require('./services/authService');
      
      if (userRole && Array.isArray(userRole) && userRole.length > 0) {
        // Check if user is staff
        if (userRole.includes('editor') || userRole.includes('admin') || userRole.includes('super_admin')) {
          await logoutEditor();
        } else {
          // Regular reader
          await signOutReader();
        }
      } else if (isReaderAuthenticated) {
        // Reader authentication
        await signOutReader();
      }
      
      // Clear state
      setIsReaderAuthenticated(false);
      setReaderInfo(null);
      setUserRole(null);
      
      // Redirect to news
      window.location.hash = 'news';
      window.location.reload();
    } catch (error) {
      console.error('Sign out error:', error);
      // Still clear state and redirect even if sign out fails
      setIsReaderAuthenticated(false);
      setReaderInfo(null);
      setUserRole(null);
      window.location.hash = 'news';
      window.location.reload();
    }
  };

  // Handler to switch between public and admin views
  const handleViewSwitch = (newView: 'public' | 'admin') => {
    console.log('🔄 Switching view to:', newView);
    setView(newView);
    if (newView === 'admin') {
      window.location.hash = 'dashboard';
      console.log('✅ Switched to admin dashboard');
    } else {
      window.location.hash = '';
      setCurrentPage('news');
      console.log('✅ Switched to public view');
    }
  };

  // Format last updated timestamp
  const formatLastUpdated = (timestamp: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
    if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    if (diffDays < 7) return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
    
    return timestamp.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Get top headlines for ticker
  const topHeadlines = React.useMemo(() => {
    const allArticles: NewsStory[] = [];
    Object.values(newsData).forEach(categoryArticles => {
      allArticles.push(...categoryArticles);
    });
    return allArticles
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
      .slice(0, 5)
      .map(article => article.headline);
  }, [newsData]);

  // CRITICAL: Sign in anonymously on app load for public access
  // BUT: ONLY on root path, NOT on admin routes
  useEffect(() => {
    const initializeAuth = async () => {
      // ✅ FIX: More robust admin route detection
      const hash = window.location.hash.replace('#', '');
      const pathname = window.location.pathname;
      
      // Allow anonymous auth on root, news, AND opinion pages (but not admin)
      const isPublicRoute = (hash === '' || hash === 'news' || hash === 'opinion' || hash.startsWith('opinion/')) && 
                          (pathname === '/' || pathname === '/morning-pulse' || pathname === '/morning-pulse/');
      const isAdminRoute = hash === 'admin' || 
                           hash === 'dashboard' || 
                           hash.includes('dashboard') ||
                           pathname === '/admin' || 
                           pathname.includes('/admin');
      
      // ✅ FIX: Sign in anonymously on public routes (not just root)
      if (!isPublicRoute || isAdminRoute) {
        console.log('🔐 Skipping anonymous auth - not on public route or on admin route');
        return;
      }
      
      try {
        const config = getFirebaseConfig();
        let app: FirebaseApp;
        try {
          app = getApp();
        } catch (e) {
          app = initializeApp(config);
        }
        const auth = getAuth(app);
        
        // ✅ FIX: Sign in anonymously on public routes (not just root)
        if (!auth.currentUser && isPublicRoute && !isAdminRoute) {
          console.log('🔐 App: Signing in anonymously for public access...');
          await signInAnonymously(auth);
          console.log('✅ App: Anonymous authentication successful');
        }
      } catch (error: any) {
        console.error('❌ App: Anonymous authentication failed:', error);
        if (error.code === 'auth/configuration-not-found') {
          console.error('CRITICAL: Enable Anonymous Auth in Firebase Console > Authentication > Sign-in Method.');
        }
      }
    };
    
    initializeAuth();
  }, []);

  return (
    <div className="app">
      {/* Admin Dashboard View - Full Page */}
      {/* ✅ FIX: Add delay to ensure AuthContext has finished updating userRoles */}
      {view === 'admin' && requireEditor(userRole) ? (
        <>
          {/* Admin Dashboard Header */}
          <div style={{
            backgroundColor: '#000',
            color: '#fff',
            padding: '16px 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '2px solid #fff'
          }}>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>
              Editorial Dashboard
            </h1>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <button
                onClick={() => handleViewSwitch('public')}
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'transparent',
                  color: '#fff',
                  border: '1px solid #fff',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                View Public Site
              </button>
              <button
                onClick={async () => {
                  try {
                    await logoutEditor();
                    setView('public');
                    setUserRole(null);
                    // Redirect to home with base path
                    const baseUrl = window.location.origin + '/morning-pulse';
                    window.location.href = `${baseUrl}/#/`;
                  } catch (err) {
                    console.error('Logout error:', err);
                  }
                }}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#dc2626',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Logout
              </button>
            </div>
          </div>
          
          {/* ✅ FIX: Full Admin Dashboard - Lazy loaded with secondary loading state */}
          <AdminDashboardWrapper userRole={userRole} />
        </>
      ) : (
        <>
          {/* Public Site View */}
          {/* Desktop Header - Hidden on Mobile */}
          {currentPage !== 'admin' && (
            <>
              <div className="desktop-only">
                <Header 
                  onCategorySelect={handleCategorySelect}
                  currentCountry={currentCountry}
                  onCountryChange={handleCountryChange}
                  topHeadlines={topHeadlines}
                  onSubscribeClick={handleSubscribeClick}
                  userRole={userRole}
                  onDashboardClick={() => handleViewSwitch('admin')}
                />
              </div>
              {/* Mobile Header - Shown on Mobile Only */}
              <MobileHeader
                onLogoClick={() => {
                  window.location.hash = 'news';
                  setCurrentPage('news');
                  setMobileActiveTab('latest');
                }}
                onSearchClick={() => setMobileSearchOpen(true)}
                onMenuClick={() => setMobileMenuOpen(true)}
                onNotificationsClick={() => setMobileNotificationsOpen(true)}
                onSignInClick={() => {
                  console.log('🔐 Sign In clicked', { userRole, isAuthenticated: !!userRole });
                  // Connect to existing auth system
                  if (userRole && Array.isArray(userRole) && userRole.length > 0) {
                    // User is logged in - navigate to appropriate dashboard/profile
                    if (userRole.includes('editor') || userRole.includes('admin') || userRole.includes('super_admin')) {
                      window.location.hash = 'dashboard';
                    } else if (userRole.includes('writer')) {
                      window.location.hash = 'writer/dashboard';
                    } else if (userRole.includes('advertiser')) {
                      window.location.hash = 'advertiser/dashboard';
                    } else if (userRole.includes('subscriber')) {
                      window.location.hash = 'subscriber/dashboard';
                    } else if (userRole.includes('reader')) {
                      // Reader - stay on news feed with personalized content
                      window.location.hash = 'news';
                    } else {
                      window.location.hash = 'profile';
                    }
                  } else {
                    // User not logged in - navigate to unified auth page
                    console.log('➡️ Navigating to #auth');
                    window.location.hash = 'auth';
                  }
                }}
                onTabChange={(tab) => {
                  setMobileActiveTab(tab);
                  if (tab === 'latest') {
                    window.location.hash = 'news';
                    setCurrentPage('news');
                  } else if (tab === 'foryou') {
                    window.location.hash = 'foryou';
                    setCurrentPage('foryou');
                  } else if (tab === 'askai') {
                    window.location.hash = 'askai';
                    setCurrentPage('askai');
                  }
                }}
                activeTab={mobileActiveTab}
                userRole={userRole}
                isAuthenticated={userRole && Array.isArray(userRole) && userRole.length > 0}
                notificationCount={0} // TODO: Implement notification count
                topHeadlines={topHeadlines}
                onSubscribeClick={handleSubscribeClick}
                onTickerClick={(headline) => {
                  // Find article by headline and navigate to it
                  const allArticles: NewsStory[] = [];
                  Object.values(newsData).forEach(categoryArticles => {
                    allArticles.push(...categoryArticles);
                  });
                  const matchingArticle = allArticles.find(article => 
                    article.headline === headline || article.headline.includes(headline)
                  );
                  if (matchingArticle && matchingArticle.url) {
                    window.open(matchingArticle.url, '_blank', 'noopener,noreferrer');
                  } else {
                    // Fallback: navigate to news feed
                    window.location.hash = 'news';
                    setCurrentPage('news');
                    setMobileActiveTab('latest');
                  }
                }}
              />
              
              {/* Mobile Menu Drawer */}
              <MobileMenuDrawer
                isOpen={mobileMenuOpen}
                onClose={() => setMobileMenuOpen(false)}
                userRole={userRole}
                currentPage={currentPage}
              />
              
              {/* Mobile Search */}
              <MobileSearch
                isOpen={mobileSearchOpen}
                onClose={() => setMobileSearchOpen(false)}
                newsData={newsData}
                onArticleClick={(article) => {
                  if (article.url) {
                    window.open(article.url, '_blank', 'noopener,noreferrer');
                  }
                  setMobileSearchOpen(false);
                }}
              />
              
              {/* Mobile Notifications */}
              <MobileNotifications
                isOpen={mobileNotificationsOpen}
                onClose={() => setMobileNotificationsOpen(false)}
                notificationCount={0} // TODO: Implement real notification count
                isAuthenticated={userRole && Array.isArray(userRole) && userRole.length > 0}
                userRole={userRole}
              />
            </>
          )}
          
          {/* Admin Login - Full Page View (like other pages) */}
          {currentPage === 'admin' && (
            <AdminLogin 
              onLoginSuccess={async () => {
                // ✅ FIX: Directly check role and update view state immediately
                try {
                  const { getCurrentEditor, getStaffRole, requireEditor } = await import('./services/authService');
                  const currentUser = getCurrentEditor();
                  
                  if (currentUser) {
                    console.log('🔍 Checking role immediately after login...');
                    const role = await getStaffRole(currentUser.uid);
                    console.log('✅ Role fetched immediately:', role);
                    
                    setUserRole(role);
                    
                    // ✅ FIX: Immediately switch to admin view if role is valid
                    if (requireEditor(role)) {
                      console.log('🚀 IMMEDIATE: Setting view to admin NOW');
                      setView('admin');
                      window.location.hash = 'dashboard';
                    } else {
                      console.warn('⚠️ User does not have editor role');
                      setView('public');
                    }
                  } else {
                    console.warn('⚠️ No current user after login');
                    // Fallback: let auth state listener handle it
                    window.location.hash = 'dashboard';
                  }
                } catch (error) {
                  console.error('❌ Error in onLoginSuccess:', error);
                  // Fallback: let auth state listener handle it
                  window.location.hash = 'dashboard';
                }
              }}
            />
          )}
      
      {/* ✅ FIX: Only load FirebaseConnector when NOT in admin view to stop infinite loop */}
      {/* ✅ PRIORITY: Check view FIRST to immediately stop news fetching when admin logs in */}
      {useFirestore && currentPage === 'news' && view === 'public' && !requireEditor(userRole) && (
        <FirebaseConnector
          onNewsUpdate={handleNewsUpdate}
          onError={handleError}
          userCountry={currentCountry}
        />
      )}
      
      {currentPage === 'foryou' && view === 'public' && !requireEditor(userRole) && (
        <ForYouFeed 
          newsData={newsData}
          userCountry={currentCountry}
          userId={userRole && Array.isArray(userRole) && userRole.length > 0 ? 'authenticated' : null}
          isAuthenticated={userRole && Array.isArray(userRole) && userRole.length > 0}
          userRole={userRole}
        />
      )}
      
      {currentPage === 'askai' && view === 'public' && !requireEditor(userRole) && (
        <AskPulseAI newsData={newsData} />
      )}
      
      {currentPage === 'bookmarks' && (
        <BookmarksPage onBack={() => {
          window.location.hash = 'news';
          setCurrentPage('news');
        }} />
      )}
      
      {currentPage === 'opinion' && (
        <OpinionPage 
          onNavigateToSubmit={handleNavigateToSubmit}
          slug={opinionSlug} // NEW: Pass slug for single opinion view
        />
      )}

      {currentPage === 'opinion-submit' && (
        <OpinionSubmissionForm 
          onBack={() => {
            window.location.hash = 'opinion';
            setCurrentPage('opinion');
          }}
          onSuccess={handleBackToNews}
        />
      )}

      {currentPage === 'privacy' && (
        <LegalPage onBack={handleBackToNews} legalType="privacy" />
      )}

      {currentPage === 'terms' && (
        <LegalPage onBack={handleBackToNews} legalType="terms" />
      )}

      {currentPage === 'cookies' && (
        <LegalPage onBack={handleBackToNews} legalType="cookies" />
      )}

      {currentPage === 'about' && (
        <AboutPage onBack={handleBackToNews} />
      )}

      {currentPage === 'subscription' && (
        <SubscriptionPage onBack={handleBackToNews} />
      )}

      {currentPage === 'advertise' && (
        <AdvertisePage onBack={handleBackToNews} />
      )}

      {currentPage === 'editorial' && (
        <EditorialPage onBack={handleBackToNews} />
      )}

      {currentPage === 'auth' && (
        <AuthPage 
          onSuccess={() => {
            // Refresh user role and redirect
            window.location.hash = 'news';
            window.location.reload();
          }}
          onBack={() => {
            window.location.hash = 'news';
            setCurrentPage('news');
          }}
        />
      )}

      {currentPage === 'join' && (
        <JoinPage />
      )}

      {currentPage === 'writer-register' && (
        <WriterRegistration 
          onSuccess={() => {
            window.location.hash = 'writer/login';
          }}
          onBack={() => {
            window.location.hash = 'news';
          }}
        />
      )}

      {currentPage === 'writer-login' && (
        <WriterLogin 
          onSuccess={() => {
            window.location.hash = 'writer/dashboard';
          }}
          onBack={() => {
            window.location.hash = 'news';
          }}
        />
      )}

      {currentPage === 'writer-dashboard' && (
        <WriterDashboard />
      )}

      {currentPage === 'subscriber-register' && (
        <SubscriberRegistration 
          onSuccess={() => {
            window.location.hash = 'subscriber/login';
          }}
          onBack={() => {
            window.location.hash = 'news';
          }}
        />
      )}

      {currentPage === 'subscriber-login' && (
        <SubscriberLogin 
          onSuccess={() => {
            window.location.hash = 'subscriber/dashboard';
          }}
          onBack={() => {
            window.location.hash = 'news';
          }}
        />
      )}

      {currentPage === 'subscriber-dashboard' && (
        <SubscriberDashboard />
      )}

      {currentPage === 'advertiser-register' && (
        <AdvertiserRegistration 
          onSuccess={() => {
            window.location.hash = 'advertiser/login';
          }}
          onBack={() => {
            window.location.hash = 'news';
          }}
        />
      )}

      {currentPage === 'advertiser-login' && (
        <AdvertiserLogin 
          onSuccess={() => {
            window.location.hash = 'advertiser/dashboard';
          }}
          onBack={() => {
            window.location.hash = 'news';
          }}
        />
      )}

      {currentPage === 'advertiser-dashboard' && (
        <AdvertiserDashboard />
      )}

      {currentPage === 'advertiser-submit-ad' && (
        <AdSubmissionForm 
          onSuccess={() => {
            window.location.hash = 'advertiser/dashboard';
          }}
          onBack={() => {
            window.location.hash = 'advertiser/dashboard';
          }}
        />
      )}
      
      {currentPage === 'news' && (
        <>
          {loading && (
            <LoadingSkeleton />
          )}

          {error && Object.keys(newsData).length === 0 && (
            <div className="error-container">
              <p>Error: {error}</p>
            </div>
          )}

          {!loading && !error && Object.keys(newsData).length === 0 && (
            <div className="no-news-container" style={{
              textAlign: 'center',
              padding: '60px 20px',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              margin: '40px auto',
              maxWidth: '600px'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📰</div>
              <h2 style={{ marginBottom: '12px', color: '#333' }}>No News Available</h2>
              <p style={{ color: '#666', marginBottom: '24px' }}>
                We're currently updating our news feed. Please check back in a few minutes.
              </p>
              <button 
                onClick={() => window.location.reload()} 
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: '500'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#0056b3'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#007bff'}
              >
                Refresh Page
              </button>
            </div>
          )}

          {!loading && Object.keys(newsData).length > 0 && (
            <>
              {lastUpdated && (
                <div className="last-updated-container">
                  <p className="last-updated-text">
                    Last Updated: {formatLastUpdated(lastUpdated)}
                  </p>
                </div>
              )}
              <NewsGrid 
                newsData={newsData} 
                selectedCategory={selectedCategory}
                userCountry={currentCountry}
              />
            </>
          )}
        </>
      )}

          {/* Footer - only show when NOT on admin page - Hidden on Mobile */}
          {currentPage !== 'admin' && (
            <div className="desktop-only">
              <Footer />
            </div>
          )}
          
        </>
      )}
    </div>
  );
};

export default App;

