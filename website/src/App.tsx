import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import NewsGrid from './components/NewsGrid';
import FirebaseConnector from './components/FirebaseConnector';
import { NewsStory } from '../../types';

interface NewsData {
  [category: string]: NewsStory[];
}

const App: React.FC = () => {
  const [newsData, setNewsData] = useState<NewsData>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useFirestore, setUseFirestore] = useState(true);

  // Try to load static data first (Mode B), fallback to Firestore (Mode A), then mock data
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
          console.log('ℹ️ Static news file not found (404)');
        }
      } catch (err) {
        console.log('❌ Static data fetch error:', err);
      }
      
      // Check if Firebase config is available
      // Check window first (from firebase-config.js)
      const windowConfig = typeof window !== 'undefined' ? (window as any).__firebase_config : null;
      // Check env var (from build-time)
      const envConfig = import.meta.env.VITE_FIREBASE_CONFIG;
      
      // Determine if we have a valid config
      const hasConfig = windowConfig && typeof windowConfig === 'object' && windowConfig.apiKey
        || (envConfig && typeof envConfig === 'string' && envConfig.trim() !== '');
      
      if (hasConfig) {
        // Try Firestore
        console.log('🔄 Trying Firestore mode');
        setUseFirestore(true);
        setLoading(false);
      } else {
        // No Firebase config, show message
        console.log('ℹ️ No Firebase config available');
        console.log('   Window config:', windowConfig ? 'exists' : 'missing');
        console.log('   Env config:', envConfig ? 'exists' : 'missing');
        setLoading(false);
        setUseFirestore(false);
        setError('Firebase configuration not available. Please configure Firebase to view news.');
      }
    };

    loadStaticData();
  }, []);

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

  return (
    <div className="app">
      <Header />
      {useFirestore && (
        <FirebaseConnector
          onNewsUpdate={handleNewsUpdate}
          onError={handleError}
        />
      )}
      
      {loading && (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading today's news...</p>
        </div>
      )}

      {error && (
        <div className="error-container">
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && Object.keys(newsData).length === 0 && (
        <div className="no-news-container">
          <p>Morning Pulse is currently gathering today's news. Please check back shortly.</p>
        </div>
      )}

      {!loading && !error && Object.keys(newsData).length > 0 && (
        <NewsGrid newsData={newsData} />
      )}
    </div>
  );
};

export default App;

