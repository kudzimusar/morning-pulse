import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Header from './components/Header';
import NewsGrid from './components/NewsGrid';
import Footer from './components/Footer';
import FirebaseConnector from './components/FirebaseConnector';
import AdvertisePage from './components/AdvertisePage';
import SubscriptionPage from './components/SubscriptionPage';
import AboutPage from './components/AboutPage';
import EditorialPage from './components/EditorialPage';
import PrivacyPage from './components/PrivacyPage';
import DatePicker from './components/DatePicker';
import { NewsStory } from '../../types';
import { 
  detectUserLocation, 
  getUserCountry, 
  saveUserCountry,
  CountryInfo,
  SUPPORTED_COUNTRIES 
} from './services/locationService';

type Page = 'news' | 'advertise' | 'subscribe' | 'about' | 'editorial' | 'privacy';

interface NewsData {
  [category: string]: NewsStory[];
}

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('news');
  const [newsData, setNewsData] = useState<NewsData>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useFirestore, setUseFirestore] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isSubscribed, setIsSubscribed] = useState(false); // TODO: Get from user session/auth
  const [userCountry, setUserCountry] = useState<CountryInfo>(SUPPORTED_COUNTRIES[0]); // Default to Zimbabwe
  const [locationDetecting, setLocationDetecting] = useState(true);

  // Detect user location on mount
  useEffect(() => {
    const initializeLocation = async () => {
      setLocationDetecting(true);
      
      // First, check if user has a saved preference
      const savedCountry = getUserCountry();
      if (savedCountry) {
        console.log('✅ Using saved country preference:', savedCountry.name);
        setUserCountry(savedCountry);
        setLocationDetecting(false);
        return;
      }
      
      // Otherwise, detect location
      try {
        const detectedCountry = await detectUserLocation();
        setUserCountry(detectedCountry);
        saveUserCountry(detectedCountry);
        console.log('✅ Location detected:', detectedCountry.name);
      } catch (error) {
        console.error('❌ Location detection failed:', error);
        // Keep default (Zimbabwe)
      } finally {
        setLocationDetecting(false);
      }
    };

    initializeLocation();
  }, []);

  // Handle country change
  const handleCountryChange = useCallback((country: CountryInfo) => {
    setUserCountry(country);
    saveUserCountry(country);
    console.log('✅ Country changed to:', country.name);
  }, []);

  // Handle page navigation from hash changes (for footer links)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      if (hash === 'advertise') setCurrentPage('advertise');
      else if (hash === 'subscription' || hash === 'subscribe') setCurrentPage('subscribe');
      else if (hash === 'about') setCurrentPage('about');
      else if (hash === 'editorial') setCurrentPage('editorial');
      else if (hash === 'privacy') setCurrentPage('privacy');
      else setCurrentPage('news');
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Get top headlines for ticker
  const topHeadlines = useMemo(() => {
    const articles: NewsStory[] = [];
    Object.values(newsData).forEach(categoryArticles => {
      articles.push(...categoryArticles);
    });
    return articles
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
      .slice(0, 5)
      .map(article => article.headline);
  }, [newsData]);

  // Load news data for selected date
  useEffect(() => {
    if (currentPage !== 'news') return;

    const loadNewsForDate = async () => {
      setLoading(true);
      try {
        // Try static file first
        const url = `/morning-pulse/data/news-${selectedDate}.json`;
        console.log('🔍 Attempting to load news from:', url);
        const response = await fetch(url);
        
        if (response.ok) {
          const data = await response.json();
          setNewsData(data.categories || {});
          setLoading(false);
          setUseFirestore(false);
          setError(null);
          return;
        }
        
        // If static file not found, check Firebase config
        const windowConfig = typeof window !== 'undefined' ? (window as any).__firebase_config : null;
        const envConfig = import.meta.env.VITE_FIREBASE_CONFIG;
        const hasConfig = windowConfig && typeof windowConfig === 'object' && windowConfig.apiKey
          || (envConfig && typeof envConfig === 'string' && envConfig.trim() !== '');
        
        if (hasConfig) {
          setUseFirestore(true);
          setLoading(false);
        } else {
          setLoading(false);
          setError('News not available for this date.');
        }
      } catch (err) {
        console.error('Error loading news:', err);
        setError('Failed to load news.');
        setLoading(false);
      }
    };

    loadNewsForDate();
  }, [selectedDate, currentPage]);

  const handleNewsUpdate = useCallback((data: NewsData) => {
    setNewsData(data);
    setLoading(false);
    setError(null);
  }, []);

  const handleError = useCallback((errorMessage: string) => {
    console.error('⚠️ Error loading news:', errorMessage);
    setError(errorMessage);
    setLoading(false);
  }, []);

  const handleDateChange = useCallback((date: string) => {
    setSelectedDate(date);
  }, []);

  const renderPage = () => {
    switch (currentPage) {
      case 'advertise':
        return <AdvertisePage onBack={() => { setCurrentPage('news'); window.location.hash = ''; }} />;
      case 'subscribe':
        return <SubscriptionPage onBack={() => { setCurrentPage('news'); window.location.hash = ''; }} />;
      case 'about':
        return <AboutPage onBack={() => { setCurrentPage('news'); window.location.hash = ''; }} />;
      case 'editorial':
        return <EditorialPage onBack={() => { setCurrentPage('news'); window.location.hash = ''; }} />;
      case 'privacy':
        return <PrivacyPage onBack={() => { setCurrentPage('news'); window.location.hash = ''; }} />;
      case 'news':
      default:
        return (
          <>
            <div className="news-controls">
              <DatePicker 
                currentDate={selectedDate}
                onDateSelect={handleDateChange}
                maxDaysBack={isSubscribed ? 365 : 2}
              />
            </div>
            {loading && (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading news for {selectedDate}...</p>
              </div>
            )}
            {error && (
              <div className="error-container">
                <p>{error}</p>
              </div>
            )}
            {!loading && !error && Object.keys(newsData).length === 0 && (
              <div className="no-news-container">
                <p>Morning Pulse is currently gathering news for this date. Please check back later.</p>
              </div>
            )}
            {!loading && !error && Object.keys(newsData).length > 0 && (
              <NewsGrid 
                newsData={newsData} 
                selectedCategory={selectedCategory}
              />
            )}
          </>
        );
    }
  };

  return (
    <div className="app">
      <Header 
        topHeadlines={topHeadlines}
        onCategorySelect={setSelectedCategory}
        onSubscribeClick={() => { setCurrentPage('subscribe'); window.location.hash = 'subscription'; }}
        currentCountry={userCountry}
        onCountryChange={handleCountryChange}
      />
      {useFirestore && currentPage === 'news' && (
        <FirebaseConnector
          onNewsUpdate={handleNewsUpdate}
          onError={handleError}
          userCountry={userCountry}
          selectedDate={selectedDate}
        />
      )}
      
      {renderPage()}
      
      <Footer onNavigate={(page) => {
        if (page === 'news') setCurrentPage('news');
        else if (page === 'subscribe') setCurrentPage('subscribe');
        else if (page === 'advertise') setCurrentPage('advertise');
        else if (page === 'about') setCurrentPage('about');
        else if (page === 'editorial') setCurrentPage('editorial');
        else if (page === 'privacy') setCurrentPage('privacy');
        window.location.hash = page;
      }} />
    </div>
  );
};

export default App;
