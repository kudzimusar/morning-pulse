import React, { useState, useEffect } from 'react';
import { initializeApp, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, signInAnonymously, Auth } from 'firebase/auth';
import Header from './components/Header';
import NewsGrid from './components/NewsGrid';
import FirebaseConnector from './components/FirebaseConnector';
import OpinionPage from './components/OpinionPage';
import OpinionSubmissionForm from './components/OpinionSubmissionForm';
import AdminOpinionReview from './components/AdminOpinionReview';
import Footer from './components/Footer';
import PrivacyPage from './components/PrivacyPage';
import AboutPage from './components/AboutPage';
import SubscriptionPage from './components/SubscriptionPage';
import AdvertisePage from './components/AdvertisePage';
import EditorialPage from './components/EditorialPage';
import { NewsStory } from '../../types';
import { CountryInfo } from './services/locationService';

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
  const [newsData, setNewsData] = useState<NewsData>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useFirestore, setUseFirestore] = useState(true);
  const [currentPage, setCurrentPage] = useState<string>('news');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [currentCountry, setCurrentCountry] = useState<CountryInfo>({ code: 'ZW', name: 'Zimbabwe' });

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
      } else {
        setCurrentPage('news');
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

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
  const handleNewsUpdate = React.useCallback((data: NewsData) => {
    setNewsData(data);
    setLoading(false);
    setError(null);
  }, []);

  const handleError = React.useCallback((errorMessage: string) => {
    setError(errorMessage);
    setLoading(false);
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

  // Check if admin mode is enabled
  const isAdminMode = import.meta.env.VITE_ENABLE_ADMIN === 'true';

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
      <Header 
        onCategorySelect={handleCategorySelect}
        currentCountry={currentCountry}
        onCountryChange={setCurrentCountry}
        topHeadlines={topHeadlines}
        onSubscribeClick={handleSubscribeClick}
      />
      
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

          {error && (
            <div className="error-container">
              <p>Error: {error}</p>
            </div>
          )}

          {!loading && !error && Object.keys(newsData).length === 0 && (
            <div className="no-news-container">
              <p>No news available for today. Please check back later.</p>
            </div>
          )}

          {!loading && !error && Object.keys(newsData).length > 0 && (
            <NewsGrid 
              newsData={newsData} 
              selectedCategory={selectedCategory}
              userCountry={currentCountry.name}
            />
          )}
        </>
      )}

      {/* Admin Review Panel - only visible in admin mode on news and opinion pages */}
      {isAdminMode && (currentPage === 'news' || currentPage === 'opinion') && (
        <AdminOpinionReview />
      )}

      {/* Footer - always visible at bottom */}
      <Footer />
    </div>
  );
};

export default App;

