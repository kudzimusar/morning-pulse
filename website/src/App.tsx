import React, { useState, useEffect } from 'react';
import { initializeApp, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, signInAnonymously, Auth } from 'firebase/auth';
import Header from './components/Header';
import NewsGrid from './components/NewsGrid';
import FirebaseConnector from './components/FirebaseConnector';
import OpinionPage from './components/OpinionPage';
import OpinionSubmissionForm from './components/OpinionSubmissionForm';
import AdminOpinionReview from './components/AdminOpinionReview';
import AdminLogin from './components/AdminLogin';
import Footer from './components/Footer';
import PrivacyPage from './components/PrivacyPage';
import AboutPage from './components/AboutPage';
import SubscriptionPage from './components/SubscriptionPage';
import AdvertisePage from './components/AdvertisePage';
import EditorialPage from './components/EditorialPage';
// Import admin auth service (will only be used when admin mode is enabled)
import { 
  getCurrentEditor, 
  onEditorAuthStateChanged, 
  getStaffRole, 
  StaffRole,
  requireEditor,
  logoutEditor
} from './services/authService';
import { NewsStory } from '../../types';
import { CountryInfo, getUserCountry, detectUserLocation, saveUserCountry, hasManualCountrySelection } from './services/locationService';

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
  // ✅ FIX: Admin mode check MUST be declared first (used in useEffect dependency arrays)
  const isAdminMode = import.meta.env.VITE_ENABLE_ADMIN === 'true';
  
  // ✅ FIX: Admin authentication state MUST be declared before useEffects that reference them
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [userRole, setUserRole] = useState<StaffRole>(null);
  const [adminAuthLoading, setAdminAuthLoading] = useState(false);
  const [view, setView] = useState<'public' | 'admin'>('public');

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
      if (hash === 'opinion' || hash.startsWith('opinion')) {
        if (hash === 'opinion/submit' || hash.startsWith('opinion/submit')) {
          setCurrentPage('opinion-submit');
        } else {
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
      } else {
        setCurrentPage('news');
        setShowAdminLogin(false);
        // Only switch to public view if not an editor
        if (!requireEditor(userRole)) {
          setView('public');
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
  }, []);

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
            console.log('✅ Editor authenticated, switching to admin dashboard');
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
          checkRole(user);
        });

        // Also check current editor after a short delay to ensure Firebase is initialized
        setTimeout(() => {
          try {
            const currentEditor = getCurrentEditor();
            if (currentEditor) {
              checkRole(currentEditor);
            } else {
              setAdminAuthLoading(false);
            }
          } catch (error) {
            console.error('Error checking current editor:', error);
            setAdminAuthLoading(false);
          }
        }, 200);
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
    setView(newView);
    if (newView === 'admin') {
      window.location.hash = 'dashboard';
    } else {
      window.location.hash = '';
      setCurrentPage('news');
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
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const config = getFirebaseConfig();
        let app: FirebaseApp;
        try {
          app = getApp();
        } catch (e) {
          app = initializeApp(config);
        }
        const auth = getAuth(app);
        
        if (!auth.currentUser) {
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
            <AdminOpinionReview />
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
              onLoginSuccess={() => {
                // Role will be updated by auth state listener, which will switch view
                // Redirect to dashboard after login
                window.location.hash = 'dashboard';
              }}
            />
          )}
      
      {useFirestore && currentPage === 'news' && (
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
      
      {currentPage === 'news' && (
        <>
          {loading && (
            <div className="loading-container">
              <p>Loading today's news...</p>
            </div>
          )}

          {error && Object.keys(newsData).length === 0 && (
            <div className="error-container">
              <p>Error: {error}</p>
            </div>
          )}

          {!loading && !error && Object.keys(newsData).length === 0 && (
            <div className="no-news-container">
              <p>No news available for today. Please check back later.</p>
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

