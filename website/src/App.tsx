// Deployment fix attempt 2
import React, { useState, useEffect } from 'react';
import { initializeApp, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, signInAnonymously, Auth } from 'firebase/auth';
import Header from './components/Header';
import NewsGrid from './components/NewsGrid';
import LoadingSkeleton from './components/LoadingSkeleton';
import FirebaseConnector from './components/FirebaseConnector';
import OpinionPage from './components/OpinionPage';
import OpinionSubmissionForm from './components/OpinionSubmissionForm';
import AdminDashboard from './components/AdminDashboard';
import AdminLogin from './components/AdminLogin';
import Footer from './components/Footer';
import PrivacyPage from './components/PrivacyPage';
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

// Helper function to get page title for analytics
const getPageTitle = (hash: string): string => {
  const pageTitles: Record<string, string> = {
    'news': 'Morning Pulse - Latest News',
    'opinion': 'Morning Pulse - Opinions',
    'opinion-submit': 'Morning Pulse - Submit Opinion',
    'subscription': 'Morning Pulse - Newsletter Signup',
    'about': 'Morning Pulse - About Us',
    'privacy': 'Morning Pulse - Privacy Policy',
    'advertise': 'Morning Pulse - Advertise With Us',
    'editorial': 'Morning Pulse - Editorial Standards',
    'join': 'Morning Pulse - Join Our Team',
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

  // Handle hash-based routing
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');

      // ✅ FIX: Guard clause - prevent processing if already on dashboard
      if (hash === 'dashboard' && view === 'admin' && requireEditor(userRole)) {
        return; // Already on dashboard, don't process again
      }

      // Track page view in Google Analytics
      const pageTitle = getPageTitle(hash);
      trackPageView(pageTitle, `/${hash || 'news'}`);
      
      if (hash === 'opinion' || hash.startsWith('opinion')) {
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
      } else if (hash === 'privacy') {
        setCurrentPage('privacy');
      } else if (hash === 'about') {
        setCurrentPage('about');
      } else if (hash === 'subscribe' || hash === 'subscription') {
        setCurrentPage('subscription');
      } else if (hash === 'advertise') {
        setCurrentPage('advertise');
      } else if (hash === 'editorial') {
        setCurrentPage('editorial');
      } else if (hash === 'writer/register' || hash.startsWith('writer/register')) {
        setCurrentPage('writer-register');
      } else if (hash === 'writer/login' || hash.startsWith('writer/login')) {
        setCurrentPage('writer-login');
      } else if (hash === 'writer/dashboard' || hash.startsWith('writer/dashboard')) {
        setCurrentPage('writer-dashboard');
      } else if (hash === 'subscriber/register' || hash.startsWith('subscriber/register')) {
        setCurrentPage('subscriber-register');
      } else if (hash === 'subscriber/login' || hash.startsWith('subscriber/login')) {
        setCurrentPage('subscriber-login');
      } else if (hash === 'subscriber/dashboard' || hash.startsWith('subscriber/dashboard')) {
        setCurrentPage('subscriber-dashboard');
      } else if (hash === 'advertiser/register' || hash.startsWith('advertiser/register')) {
        setCurrentPage('advertiser-register');
      } else if (hash === 'advertiser/login' || hash.startsWith('advertiser/login')) {
        setCurrentPage('advertiser-login');
      } else if (hash === 'advertiser/dashboard' || hash.startsWith('advertiser/dashboard')) {
        setCurrentPage('advertiser-dashboard');
      } else if (hash === 'advertiser/submit-ad' || hash.startsWith('advertiser/submit-ad')) {
        setCurrentPage('advertiser-submit-ad');
      } else if (hash === 'admin') {
        // ✅ FIX: Make admin a full page, not overlay
        setCurrentPage('admin');
        setShowAdminLogin(false); // Don't use overlay flag
      } else if (hash === 'dashboard') {
        // ✅ NEW: Dashboard route for logged-in editors
        if (requireEditor(userRole)) {
          setView('admin');
          setCurrentPage('news'); // Keep currentPage for context
        }
      } else if (hash.startsWith('join')) {
        // ✅ NEW: Staff invitation join page
        setCurrentPage('join');
        setView('public');
        setShowAdminLogin(false);
      } else {
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
    };

    // Check URL path for /admin
    if (window.location.pathname === '/admin' || window.location.hash === '#admin') {
      setCurrentPage('admin');
      setShowAdminLogin(false);
    }

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [view, userRole]); // Add view and userRole to prevent stale closures

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
    window.location.hash = 'subscribe';
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
      const isRootPath = (hash === '' || hash === 'news') && (pathname === '/' || pathname === '/morning-pulse' || pathname === '/morning-pulse/');
      const isAdminRoute = hash === 'admin' || 
                           hash === 'dashboard' || 
                           hash.includes('dashboard') ||
                           pathname === '/admin' || 
                           pathname.includes('/admin');
      
      // ✅ FIX: Only sign in anonymously if on root path AND not on admin route
      if (!isRootPath || isAdminRoute) {
        console.log('🔐 Skipping anonymous auth - not on root path or on admin route');
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
        
        // ✅ FIX: Only sign in anonymously if no user AND on root path
        if (!auth.currentUser && isRootPath && !isAdminRoute) {
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
                    window.location.hash = '';
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
          
          {/* Full Admin Dashboard */}
          <div style={{ minHeight: 'calc(100vh - 80px)' }}>
            <AdminDashboard />
          </div>
        </>
      ) : (
        <>
          {/* Public Site View */}
          {/* Only show Header when NOT on admin page */}
          {currentPage !== 'admin' && (
            <Header 
              onCategorySelect={handleCategorySelect}
              currentCountry={currentCountry}
              onCountryChange={handleCountryChange}
              topHeadlines={topHeadlines}
              onSubscribeClick={handleSubscribeClick}
              userRole={userRole}
              onDashboardClick={() => handleViewSwitch('admin')}
            />
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
      
      {currentPage === 'opinion' && (
        <OpinionPage 
          onBack={handleBackToNews}
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
        <PrivacyPage onBack={handleBackToNews} />
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

          {/* Footer - only show when NOT on admin page */}
          {currentPage !== 'admin' && <Footer />}
        </>
      )}
    </div>
  );
};

export default App;

