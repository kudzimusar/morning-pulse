import React, { useState, useEffect } from 'react';
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

  // Try to load static data first (Mode B), fallback to Firestore (Mode A)
  useEffect(() => {
    const loadStaticData = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const response = await fetch(`/morning-pulse/data/news-${today}.json`);
        if (response.ok) {
          const data = await response.json();
          setNewsData(data.categories || {});
          setLoading(false);
          setUseFirestore(false);
          return;
        }
      } catch (err) {
        console.log('Static data not available, using Firestore mode');
      }
      // If static data fails, use Firestore
      setUseFirestore(true);
      setLoading(false);
    };

    loadStaticData();
  }, []);

  const handleNewsUpdate = (data: NewsData) => {
    setNewsData(data);
    setLoading(false);
    setError(null);
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    setLoading(false);
  };

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
        <NewsGrid newsData={newsData} />
      )}
    </div>
  );
};

export default App;

