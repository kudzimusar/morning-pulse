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
import OpinionPage from './components/OpinionPage';
import OpinionSubmissionForm from './components/OpinionSubmissionForm';
import AdminOpinionReview from './components/AdminOpinionReview';
import DatePicker from './components/DatePicker';
import { NewsStory } from '../../types';
import { 
  detectUserLocation, 
  getUserCountry, 
  saveUserCountry,
  CountryInfo,
  SUPPORTED_COUNTRIES 
} from './services/locationService';

type Page = 'news' | 'advertise' | 'subscribe' | 'about' | 'editorial' | 'privacy' | 'opinion' | 'opinion-submit';

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
  const [globalNewsData, setGlobalNewsData] = useState<any>(null); // Store entire Firestore document
  const [copyToast, setCopyToast] = useState(false); // Toast notification for copy action

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
      else if (hash === 'opinion') setCurrentPage('opinion');
      else if (hash === 'opinion/submit' || hash === 'opinion-submit') setCurrentPage('opinion-submit');
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

  // Store global news data from Firestore
  const handleGlobalDataUpdate = useCallback((data: any) => {
    setGlobalNewsData(data);
  }, []);

  /**
   * Country flag emoji mapping
   */
  const getCountryFlag = (countryCode: string, countryName: string): string => {
    const flagMap: { [key: string]: string } = {
      'ZW': '🇿🇼', 'Zimbabwe': '🇿🇼',
      'ZA': '🇿🇦', 'South Africa': '🇿🇦',
      'GB': '🇬🇧', 'United Kingdom': '🇬🇧', 'UK': '🇬🇧',
      'US': '🇺🇸', 'United States': '🇺🇸', 'USA': '🇺🇸',
      'KE': '🇰🇪', 'Kenya': '🇰🇪',
      'NG': '🇳🇬', 'Nigeria': '🇳🇬',
      'GH': '🇬🇭', 'Ghana': '🇬🇭',
      'EG': '🇪🇬', 'Egypt': '🇪🇬',
      'AU': '🇦🇺', 'Australia': '🇦🇺',
      'CA': '🇨🇦', 'Canada': '🇨🇦',
      'IN': '🇮🇳', 'India': '🇮🇳',
      'CN': '🇨🇳', 'China': '🇨🇳',
      'JP': '🇯🇵', 'Japan': '🇯🇵',
      'FR': '🇫🇷', 'France': '🇫🇷',
      'DE': '🇩🇪', 'Germany': '🇩🇪',
    };
    return flagMap[countryCode] || flagMap[countryName] || '🌍';
  };

  /**
   * Generate WhatsApp summary from global news data
   * Formats news from all countries into the Global Edition template
   */
  const generateWhatsAppSummary = useCallback((newsData: any, currentCountry?: CountryInfo): string => {
    if (!newsData || typeof newsData !== 'object') {
      return 'No news data available.';
    }

    const now = new Date();
    const dateStr = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

    let summary = `🗞️ *MORNING PULSE | GLOBAL EDITION* 🗞️\n`;
    summary += `🗓️ ${dateStr} | ${timeStr}\n\n`;

    // TOP GLOBAL PULSE - Get Global category headlines from all countries
    summary += `🌍 *TOP GLOBAL PULSE*\n`;
    const globalHeadlines: string[] = [];
    
    // Iterate through all countries in the document
    Object.keys(newsData).forEach((countryKey) => {
      // Skip metadata fields
      if (countryKey === 'categories' || countryKey === 'timestamp' || countryKey === 'date') {
        return;
      }
      
      const countryData = newsData[countryKey];
      if (countryData && typeof countryData === 'object') {
        // Try different variations of Global category name
        const globalCategory = countryData['Global'] || countryData['global'] || countryData['Global News'];
        if (globalCategory && Array.isArray(globalCategory) && globalCategory.length > 0) {
          const headline = globalCategory[0]?.headline;
          if (headline && headline.trim()) {
            globalHeadlines.push(`• ${headline}`);
          }
        }
      }
    });

    if (globalHeadlines.length > 0) {
      summary += globalHeadlines.slice(0, 5).join('\n') + '\n\n';
    } else {
      summary += `• Global news updates coming soon...\n\n`;
    }

    // REGIONAL ROUNDUP - Iterate through all countries, get Local or Business headlines
    summary += `📍 *REGIONAL ROUNDUP*\n`;
    const countryKeys = Object.keys(newsData).filter(key => 
      key !== 'categories' && key !== 'timestamp' && key !== 'date' && 
      typeof newsData[key] === 'object'
    );

    const regionalEntries: string[] = [];
    
    countryKeys.forEach((countryKey) => {
      const countryData = newsData[countryKey];
      if (countryData && typeof countryData === 'object') {
        // Try to get country info from SUPPORTED_COUNTRIES
        const countryInfo = SUPPORTED_COUNTRIES.find(c => 
          c.code === countryKey || c.name === countryKey || 
          c.code.toLowerCase() === countryKey.toLowerCase() ||
          c.name.toLowerCase() === countryKey.toLowerCase()
        );
        
        const countryName = countryInfo?.name || countryKey;
        const countryCode = countryInfo?.code || countryKey;
        const flag = getCountryFlag(countryCode, countryName);

        // Try to get Local or Business headline (priority: Local first, then Business)
        let headline: string | null = null;
        
        // Try Local category variations
        const localCategory = countryData['Local'] || countryData['local'] || 
                             countryData['Local (Zim)'] || countryData[`Local (${countryName})`] ||
                             countryData['Local News'];
        
        if (localCategory && Array.isArray(localCategory) && localCategory.length > 0) {
          headline = localCategory[0]?.headline;
        }
        
        // If no Local, try Business
        if (!headline || !headline.trim()) {
          const businessCategory = countryData['Business'] || countryData['business'] ||
                                   countryData['Business (Zim)'] || countryData[`Business (${countryName})`] ||
                                   countryData['Business News'];
          
          if (businessCategory && Array.isArray(businessCategory) && businessCategory.length > 0) {
            headline = businessCategory[0]?.headline;
          }
        }

        // Only add if we have a valid headline
        if (headline && headline.trim()) {
          regionalEntries.push(`${flag} ${countryName}: ${headline}`);
        }
      }
    });

    if (regionalEntries.length > 0) {
      summary += regionalEntries.join('\n') + '\n\n';
    } else {
      summary += `Regional updates coming soon...\n\n`;
    }

    // BUSINESS & TECH - Get from current selected country
    summary += `💼 *BUSINESS & TECH*\n`;
    if (currentCountry) {
      const currentCountryKey = currentCountry.code || currentCountry.name;
      const currentCountryData = newsData[currentCountryKey] || newsData[currentCountry.name];
      
      if (currentCountryData && typeof currentCountryData === 'object') {
        // Try Business category
        const businessCategory = currentCountryData['Business'] || currentCountryData['business'] ||
                               currentCountryData['Business (Zim)'] || currentCountryData[`Business (${currentCountry.name})`] ||
                               currentCountryData['Business News'];
        
        // Try Tech category
        const techCategory = currentCountryData['Tech'] || currentCountryData['tech'] ||
                            currentCountryData['Technology'] || currentCountryData['Technology News'];
        
        const businessHeadline = businessCategory && Array.isArray(businessCategory) && businessCategory.length > 0
          ? businessCategory[0]?.headline : null;
        
        const techHeadline = techCategory && Array.isArray(techCategory) && techCategory.length > 0
          ? techCategory[0]?.headline : null;

        if (businessHeadline && businessHeadline.trim()) {
          summary += `• ${businessHeadline}\n`;
        }
        if (techHeadline && techHeadline.trim()) {
          summary += `• ${techHeadline}\n`;
        }
        
        if (!businessHeadline && !techHeadline) {
          summary += `• Business and tech updates coming soon...\n`;
        }
      } else {
        summary += `• Business and tech updates coming soon...\n`;
      }
    } else {
      summary += `• Business and tech updates coming soon...\n`;
    }

    summary += `\n🌐 *LIVE DASHBOARD*\n`;
    summary += `https://kudzimusar.github.io/morning-pulse/\n`;
    summary += `\n_Reliable. Glocal. Instant._`;

    return summary;
  }, []);

  // Handle copy summary to clipboard
  const handleCopySummary = useCallback(async () => {
    if (!globalNewsData) {
      alert('No news data available. Please wait for news to load.');
      return;
    }

    try {
      const summary = generateWhatsAppSummary(globalNewsData, userCountry);
      await navigator.clipboard.writeText(summary);
      setCopyToast(true);
      setTimeout(() => setCopyToast(false), 3000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      alert('Failed to copy summary. Please try again.');
    }
  }, [globalNewsData, generateWhatsAppSummary, userCountry]);

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
      case 'opinion':
        return (
          <OpinionPage 
            onBack={() => { setCurrentPage('news'); window.location.hash = ''; setSelectedCategory(null); }}
            onNavigateToSubmit={() => { setCurrentPage('opinion-submit'); window.location.hash = 'opinion/submit'; }}
          />
        );
      case 'opinion-submit':
        return (
          <OpinionSubmissionForm 
            onBack={() => { setCurrentPage('opinion'); window.location.hash = 'opinion'; }}
            onSuccess={() => { setCurrentPage('opinion'); window.location.hash = 'opinion'; }}
          />
        );
      case 'news':
      default:
        // If Opinion category is selected, show OpinionPage instead of NewsGrid
        if (selectedCategory === 'Opinion') {
          return (
            <OpinionPage 
              onBack={() => { setSelectedCategory(null); }}
              onNavigateToSubmit={() => { setCurrentPage('opinion-submit'); window.location.hash = 'opinion/submit'; }}
            />
          );
        }
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
                userCountry={userCountry}
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
          onGlobalDataUpdate={handleGlobalDataUpdate}
        />
      )}
      
      {renderPage()}
      
      {/* Admin Opinion Review - Only visible when VITE_ENABLE_ADMIN=true */}
      {(currentPage === 'news' || currentPage === 'opinion') && (import.meta.env.VITE_ENABLE_ADMIN === 'true') && (
        <AdminOpinionReview />
      )}
      
      {/* Admin Copy Summary Button - Only visible when VITE_ENABLE_ADMIN=true */}
      {currentPage === 'news' && (import.meta.env.VITE_ENABLE_ADMIN === 'true') && (
        <div style={{
          position: 'fixed',
          bottom: '80px',
          right: '20px',
          zIndex: 1000
        }}>
          <button
            onClick={handleCopySummary}
            disabled={!globalNewsData}
            style={{
              padding: '12px 20px',
              backgroundColor: globalNewsData ? '#25D366' : '#cccccc',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: globalNewsData ? 'pointer' : 'not-allowed',
              fontSize: '14px',
              fontWeight: '600',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.2s',
              opacity: globalNewsData ? 1 : 0.6,
            }}
            onMouseOver={(e) => {
              if (globalNewsData) {
                e.currentTarget.style.backgroundColor = '#20BA5A';
                e.currentTarget.style.transform = 'scale(1.05)';
              }
            }}
            onMouseOut={(e) => {
              if (globalNewsData) {
                e.currentTarget.style.backgroundColor = '#25D366';
                e.currentTarget.style.transform = 'scale(1)';
              }
            }}
            title={globalNewsData ? 'Copy daily summary to clipboard' : 'Loading news data...'}
          >
            {globalNewsData ? '📋 Copy Daily Summary for WhatsApp' : '⏳ Loading news...'}
          </button>
          {copyToast && (
            <div style={{
              position: 'absolute',
              bottom: '60px',
              right: '0',
              backgroundColor: '#4CAF50',
              color: 'white',
              padding: '10px 16px',
              borderRadius: '6px',
              fontSize: '13px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
              animation: 'fadeIn 0.3s ease-in',
            }}>
              ✅ Copied to clipboard!
            </div>
          )}
        </div>
      )}
      
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
