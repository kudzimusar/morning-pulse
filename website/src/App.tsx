
import React, { useState, useEffect, Suspense, useCallback } from 'react';
import { initializeApp, getApp, FirebaseApp } from 'firebase/app';

// --- Component Imports ---
import Header from './components/Header';
import MobileHeader from './components/MobileHeader';
import MobileMenuDrawer from './components/MobileMenuDrawer';
import MobileSearch from './components/MobileSearch';
import MobileNotifications from './components/MobileNotifications';
import ForYouFeed from './components/ForYouFeed';
import AskPulseAI from './components/AskPulseAI';
import BookmarksPage from './components/BookmarksPage';
import NewsGrid from './components/NewsGrid';
import LoadingSkeleton from './components/LoadingSkeleton';
import FirebaseConnector from './components/FirebaseConnector';
import OpinionPage from './components/OpinionPage';
import OpinionSubmissionForm from './components/OpinionSubmissionForm';
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

// --- Service & Utility Imports ---
import {
  onEditorAuthStateChanged,
  logoutEditor,
  signInEditor,
  getUserRoles, // <-- NEW: Single source of truth for roles
  StaffRole,
  requireEditor,      // <-- REFACTORED in authService
  requireSuperAdmin   // <-- REFACTORED in authService
} from './services/authService';
import { NewsStory } from '../types';
import { CountryInfo, getUserCountry, detectUserLocation, saveUserCountry, hasManualCountrySelection } from './services/locationService';
import { initAnalytics, trackPageView } from './services/analyticsService';
import { setupScrollMemory, saveScrollPosition, restoreScrollPosition } from './utils/scrollMemory';


// --- Main App Component ---

const App: React.FC = () => {
  
  // --- State Declarations ---

  // Page & View State
  const [currentPage, setCurrentPage] = useState<string>('news');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Authentication & Authorization State
  const [authStatus, setAuthStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');
  const [userRoles, setUserRoles] = useState<StaffRole[] | null>(null);

  // Data & Content State
  const [newsData, setNewsData] = useState<NewsData>({});
  const [useFirestore, setUseFirestore] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [currentCountry, setCurrentCountry] = useState<CountryInfo>(() => getUserCountry() || { code: 'ZW', name: 'Zimbabwe' });
  const [opinionSlug, setOpinionSlug] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Mobile UI State
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [mobileActiveTab, setMobileActiveTab] = useState<'latest' | 'foryou' | 'askai'>('latest');
  const [mobileNotificationsOpen, setMobileNotificationsOpen] = useState(false);

  // Derived State for Readability
  const hasAdminAccess = userRoles ? userRoles.includes('super_admin') || userRoles.includes('admin') || userRoles.includes('editor') : false;

  // --- Core Hooks ---

  /**
   * [NEW & REWRITTEN] Centralized Authentication Handler
   * Subscribes to Firebase Auth state changes and uses custom claims as the single source of truth.
   */
  useEffect(() => {
    console.log("Setting up auth state listener...");
    const unsubscribe = onEditorAuthStateChanged(async (user) => {
      if (user) {
        setAuthStatus('loading'); // Token might be refreshing
        console.log(`[AUTH_LISTENER] User detected: ${user.uid}. Fetching roles from token...`);
        const roles = await getUserRoles(true); // Force refresh to get latest claims
        setUserRoles(roles);
        setAuthStatus('authenticated');
        console.log(`[AUTH_LISTENER] Roles confirmed: ${roles?.join(', ') || 'none'}`);
      } else {
        console.log("[AUTH_LISTENER] No user detected. Setting to unauthenticated.");
        setUserRoles(null);
        setAuthStatus('unauthenticated');
      }
    });

    return () => {
      console.log("Cleaning up auth state listener.");
      unsubscribe();
    };
  }, []);

  /**
   * Hash-based Router
   * Determines the current page based on the URL hash.
   */
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      const [path, queryString] = hash.split('?');
      console.log(`[ROUTER] Hash changed: ${path}`);
      
      // Save scroll position when navigating away from the news feed
      if (currentPage === 'news' && path !== 'news') {
        saveScrollPosition('news-feed');
      }
      
      // Track page view for analytics
      trackPageView(path, `/${path || 'news'}`);
      
      // Reset category selection when leaving news
      if (path !== 'news' && path !== '') {
        setSelectedCategory(null);
      }
      
      // Determine page based on path
      if (path.startsWith('opinion/submit')) {
        setCurrentPage('opinion-submit');
      } else if (path.startsWith('opinion/')) {
        setOpinionSlug(path.substring('opinion/'.length));
        setCurrentPage('opinion');
      } else if (path === 'admin' || path === 'dashboard') {
         // This logic is now primarily handled by the main render block
         // based on authStatus and hasAdminAccess, but we set the page here.
         setCurrentPage('admin');
      }
      else {
        setOpinionSlug(null);
        // Map path to page, default to 'news'
        const pageMap: { [key: string]: string } = {
          '': 'news',
          'news': 'news',
          'opinion': 'opinion',
          'foryou': 'foryou',
          'askai': 'askai',
          'bookmarks': 'bookmarks',
          'privacy': 'privacy',
          'terms': 'terms',
          'cookies': 'cookies',
          'about': 'about',
          'subscribe': 'subscription',
          'subscription': 'subscription',
          'advertise': 'advertise',
          'editorial': 'editorial',
          'auth': 'auth',
          'signin': 'auth',
          'join': 'join',
          'writer/register': 'writer-register',
          'writer/login': 'writer-login',
          'writer/dashboard': 'writer-dashboard',
          'subscriber/register': 'subscriber-register',
          'subscriber/login': 'subscriber-login',
          'subscriber/dashboard': 'subscriber-dashboard',
          'advertiser/register': 'advertiser-register',
          'advertiser/login': 'advertiser-login',
          'advertiser/dashboard': 'advertiser-dashboard',
          'advertiser/submit-ad': 'advertiser-submit-ad'
        };
        setCurrentPage(pageMap[path] || 'news');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // Initial load

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [currentPage]); // Dependency helps with scroll saving logic

  /**
   * Initial Data Load (Static JSON with Firestore Fallback)
   */
  useEffect(() => {
    initAnalytics();
    setupScrollMemory();

    const loadStaticData = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const response = await fetch(`/morning-pulse/data/news-${today}.json`);
        if (response.ok) {
          const data = await response.json();
          setNewsData(data.categories || {});
          setUseFirestore(false);
        }
      } catch (err) {
        console.warn('Static data fetch failed, falling back to Firestore.', err);
        setUseFirestore(true);
      } finally {
        setLoading(false);
      }
    };
    loadStaticData();
  }, []);

  /**
   * Initial Country Detection
   */
  useEffect(() => {
    const initializeCountry = async () => {
      if (!hasManualCountrySelection()) {
        try {
          const detectedCountry = await detectUserLocation();
          setCurrentCountry(detectedCountry);
          saveUserCountry(detectedCountry, false);
        } catch (error) {
          console.error('Location detection failed:', error);
        }
      }
    };
    initializeCountry();
  }, []);


  // --- Event Handlers ---

  const handleNewsUpdate = useCallback((data: NewsData, timestamp?: Date) => {
    setNewsData(data);
    setLoading(false);
    if (timestamp) setLastUpdated(timestamp);
  }, []);

  const handleError = useCallback((errorMessage: string) => {
    setError(errorMessage);
    setLoading(false);
  }, []);
  
  const handleCountryChange = useCallback((country: CountryInfo) => {
    setCurrentCountry(country);
    saveUserCountry(country, true);
  }, []);

  const handleSignOut = async () => {
    try {
        await logoutEditor();
        // The auth listener will handle state changes
        window.location.hash = 'admin'; // Go back to login screen
    } catch (error) {
        console.error("Sign out error:", error);
    }
  };
  
  // --- Render Logic ---

  const renderContent = () => {
    // Admin routing takes precedence
    if (currentPage === 'admin') {
      if (authStatus === 'loading') {
        return <div className="loading-full-page">Authenticating...</div>;
      }
      if (authStatus === 'authenticated' && hasAdminAccess) {
        return (
           <Suspense fallback={<div className="loading-full-page">Loading Dashboard...</div>}>
              <AdminDashboard />
           </Suspense>
        );
      }
      // If unauthenticated or no admin access, show login
      return <AdminLogin onLoginSuccess={async () => {
          // After login, the auth state listener will automatically fetch roles and update the view.
          // No need for complex logic here.
          console.log("Login successful, auth listener will now take over.");
      }} />;
    }

    // Public pages
    switch (currentPage) {
      case 'news':
        return loading ? <LoadingSkeleton /> : (
          <NewsGrid newsData={newsData} selectedCategory={selectedCategory} userCountry={currentCountry} />
        );
      case 'opinion':
        return <OpinionPage slug={opinionSlug} onNavigateToSubmit={() => window.location.hash = 'opinion/submit'} />;
      case 'opinion-submit':
        return <OpinionSubmissionForm onBack={() => window.location.hash = 'opinion'} onSuccess={() => window.location.hash = 'opinion'} />;
      case 'foryou':
        return <ForYouFeed newsData={newsData} userCountry={currentCountry} />;
      case 'askai':
        return <AskPulseAI newsData={newsData} />;
      case 'bookmarks':
         return <BookmarksPage onBack={() => window.location.hash = 'news'} />;
      case 'about':
        return <AboutPage onBack={() => window.location.hash = 'news'} />;
      case 'privacy':
        return <LegalPage onBack={() => window.location.hash = 'news'} legalType="privacy" />;
      case 'terms':
        return <LegalPage onBack={() => window.location.hash = 'news'} legalType="terms" />;
      case 'cookies':
        return <LegalPage onBack={() => window.location.hash = 'news'} legalType="cookies" />;
      case 'subscription':
        return <SubscriptionPage onBack={() => window.location.hash = 'news'} />;
      case 'advertise':
         return <AdvertisePage onBack={() => window.location.hash = 'news'} />;
      case 'editorial':
        return <EditorialPage onBack={() => window.location.hash = 'news'} />;
      case 'join':
        return <JoinPage />;
      case 'auth':
         return <AuthPage onSuccess={() => window.location.hash = 'news'} onBack={() => window.location.hash = 'news'} />;
      // Other stakeholder routes...
      case 'writer-dashboard': return <WriterDashboard />;
      case 'subscriber-dashboard': return <SubscriberDashboard />;
      case 'advertiser-dashboard': return <AdvertiserDashboard />;
      default:
        return <div className="loading-full-page">Page not found</div>;
    }
  };
  
  // Is the current view an admin-only view?
  const isAdminView = currentPage === 'admin' && authStatus === 'authenticated' && hasAdminAccess;

  return (
    <div className="app">
      {/* Conditionally render headers based on view */}
      {!isAdminView && (
        <>
          <div className="desktop-only">
            <Header 
              onCategorySelect={(cat) => setSelectedCategory(cat)}
              currentCountry={currentCountry}
              onCountryChange={handleCountryChange}
              topHeadlines={[]}
              onSubscribeClick={() => window.location.hash = 'subscribe'}
              userRole={userRoles} // Pass roles
              onDashboardClick={() => window.location.hash = 'admin'}
            />
          </div>
          <MobileHeader 
             onLogoClick={() => window.location.hash = 'news'}
             onSearchClick={() => setMobileSearchOpen(true)}
             onMenuClick={() => setMobileMenuOpen(true)}
             onNotificationsClick={() => setMobileNotificationsOpen(true)}
             onSignInClick={() => window.location.hash = hasAdminAccess ? 'admin' : 'auth'}
             onTabChange={(tab) => window.location.hash = tab}
             activeTab={mobileActiveTab}
             userRole={userRoles}
             isAuthenticated={authStatus === 'authenticated'}
             notificationCount={0}
             topHeadlines={[]}
             onSubscribeClick={() => window.location.hash = 'subscribe'}
             onSignOut={handleSignOut}
             userName={''}
             userEmail={''}
             onTickerClick={() => {}}
          />
        </>
      )}

      {/* Main Content Area */}
      <main>
        {renderContent()}
      </main>
      
      {/* Conditionally render footer and Firestore connector */}
      {!isAdminView && (
        <>
          <div className="desktop-only">
            <Footer />
          </div>
          {useFirestore && currentPage === 'news' && (
            <FirebaseConnector
              onNewsUpdate={handleNewsUpdate}
              onError={handleError}
              userCountry={currentCountry}
            />
          )}
        </>
      )}

      {/* Mobile Drawers (Portal outside main flow) */}
       <MobileMenuDrawer
          isOpen={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          userRole={userRoles}
          currentPage={currentPage}
        />
        <MobileSearch
          isOpen={mobileSearchOpen}
          onClose={() => setMobileSearch-Open(false)}
          newsData={newsData}
          onArticleClick={(article) => {
              if (article.url) window.open(article.url, '_blank', 'noopener,noreferrer');
              setMobileSearchOpen(false);
          }}
        />
        <MobileNotifications
          isOpen={mobileNotificationsOpen}
          onClose={() => setMobileNotificationsOpen(false)}
          notificationCount={0}
          isAuthenticated={authStatus === 'authenticated'}
          userRole={userRoles}
        />
    </div>
  );
};

// --- Helper Types & Functions ---

interface NewsData {
  [category: string]: NewsStory[];
}

// A simple full-page loading placeholder
const FullPageLoader: React.FC<{ message: string }> = ({ message }) => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '1.2em' }}>
    {message}
  </div>
);


export default App;

