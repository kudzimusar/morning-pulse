import React, { useState, useEffect, useMemo } from 'react';
import { NewsStory } from '../../types';
import ArticleCard from './ArticleCard';
import LoadingSkeleton from './LoadingSkeleton';
import { CountryInfo } from '../services/locationService';
import { getOrderedCategories } from '../services/userPreferences';
import { getCurrentEditor } from '../services/authService';
import { getAuth } from 'firebase/auth';

interface ForYouFeedProps {
  newsData: {
    [category: string]: NewsStory[];
  };
  userCountry?: CountryInfo;
  userId?: string | null;
  isAuthenticated?: boolean;
}

const ForYouFeed: React.FC<ForYouFeedProps> = ({ 
  newsData, 
  userCountry,
  userId = null,
  isAuthenticated = false,
}) => {
  const [loading, setLoading] = useState(true);
  const [personalizedArticles, setPersonalizedArticles] = useState<NewsStory[]>([]);
  const [authState, setAuthState] = useState<{ isAuthenticated: boolean; userId: string | null }>({
    isAuthenticated: false,
    userId: null,
  });

  // Detect auth state globally
  useEffect(() => {
    const checkAuth = () => {
      try {
        // Check Firebase Auth
        const auth = getAuth();
        const currentUser = auth.currentUser;
        
        // Also check editor auth (for staff)
        const editor = getCurrentEditor();
        
        if (currentUser || editor) {
          const uid = currentUser?.uid || editor?.uid || null;
          setAuthState({
            isAuthenticated: true,
            userId: uid,
          });
        } else {
          setAuthState({
            isAuthenticated: false,
            userId: null,
          });
        }
      } catch (e) {
        console.error('Error checking auth state:', e);
        setAuthState({
          isAuthenticated: isAuthenticated || false,
          userId: userId || null,
        });
      }
    };

    checkAuth();
    // Listen for auth state changes
    const auth = getAuth();
    const unsubscribe = auth.onAuthStateChanged(() => {
      checkAuth();
    });

    return () => unsubscribe();
  }, [isAuthenticated, userId]);

  // Get user's preferred categories from localStorage (only for authenticated users)
  const preferredCategories = useMemo(() => {
    // Guest users: Use editorial fallback (trending categories)
    if (!authState.isAuthenticated || !authState.userId) {
      return ['Local (Zim)', 'Business (Zim)', 'World News', 'Sports', 'Tech & AI'];
    }

    // Signed-in users: Use stored preferences
    try {
      const stored = localStorage.getItem('userCategoryPreferences');
      if (stored) {
        const prefs = JSON.parse(stored);
        // Get top 3 preferred categories
        const categories = Object.entries(prefs)
          .sort(([, a]: any, [, b]: any) => b - a)
          .slice(0, 3)
          .map(([category]) => category);
        
        if (categories.length > 0) {
          return categories;
        }
      }
    } catch (e) {
      console.error('Error reading category preferences:', e);
    }
    
    // Fallback to default categories if no preferences found
    return ['Local (Zim)', 'Business (Zim)', 'World News'];
  }, [authState.isAuthenticated, authState.userId]);

  useEffect(() => {
    setLoading(true);
    
    const generateFeed = () => {
      const articles: NewsStory[] = [];
      
      if (authState.isAuthenticated && authState.userId) {
        // SIGNED-IN USER: Personalized feed based on preferences
        // Get articles from preferred categories first
        preferredCategories.forEach(category => {
          const categoryArticles = newsData[category] || [];
          articles.push(...categoryArticles.slice(0, 5)); // Top 5 from each preferred category
        });
        
        // Fill remaining with other categories
        Object.keys(newsData).forEach(category => {
          if (!preferredCategories.includes(category)) {
            const categoryArticles = newsData[category] || [];
            articles.push(...categoryArticles.slice(0, 2)); // 2 from each other category
          }
        });
      } else {
        // GUEST USER: Editorial fallback feed (trending + editor's picks)
        // Show mix of trending categories
        const trendingCategories = ['Local (Zim)', 'Business (Zim)', 'World News', 'Sports', 'Tech & AI'];
        trendingCategories.forEach(category => {
          const categoryArticles = newsData[category] || [];
          articles.push(...categoryArticles.slice(0, 4)); // Top 4 from each trending category
        });
      }
      
      // Sort by timestamp (most recent first)
      const sorted = articles.sort((a, b) => {
        const timeA = a.timestamp || 0;
        const timeB = b.timestamp || 0;
        return timeB - timeA;
      });
      
      setPersonalizedArticles(sorted.slice(0, 20)); // Limit to 20 articles
      setLoading(false);
    };

    if (Object.keys(newsData).length > 0) {
      generateFeed();
    } else {
      setLoading(false);
    }
  }, [newsData, preferredCategories, authState]);

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (personalizedArticles.length === 0 && !loading) {
    return (
      <div className="mobile-content-with-nav" style={{ padding: '32px 16px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '16px', color: 'var(--text-color)' }}>
          {authState.isAuthenticated ? 'Your Personalized Feed' : 'Trending Stories'}
        </h2>
        <p style={{ color: 'var(--light-text)', marginBottom: '24px' }}>
          {authState.isAuthenticated 
            ? "We're building your personalized feed based on your reading preferences."
            : "Discover the stories that matter most."}
        </p>
        {!authState.isAuthenticated && (
          <button
            onClick={() => {
              window.location.hash = 'join';
            }}
            style={{
              padding: '12px 24px',
              background: 'var(--primary-color)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '0.9375rem',
              fontWeight: 600,
              cursor: 'pointer',
              marginTop: '16px',
            }}
          >
            Sign in to personalize your news
          </button>
        )}
        {authState.isAuthenticated && (
          <p style={{ color: 'var(--light-text)', fontSize: '0.875rem' }}>
            Start reading articles to help us understand what you like!
          </p>
        )}
      </div>
    );
  }

  return (
    <main className="premium-news-grid mobile-content-with-nav">
      <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color)' }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-color)' }}>
          {authState.isAuthenticated ? 'For You' : 'Trending'}
        </h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--light-text)', marginTop: '4px' }}>
          {authState.isAuthenticated 
            ? 'Personalized stories based on your interests'
            : 'Top stories from around the world'}
        </p>
        {!authState.isAuthenticated && (
          <button
            onClick={() => {
              window.location.hash = 'join';
            }}
            style={{
              marginTop: '12px',
              padding: '8px 16px',
              background: 'transparent',
              color: 'var(--primary-color)',
              border: '1px solid var(--primary-color)',
              borderRadius: '4px',
              fontSize: '0.8125rem',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Sign in to personalize →
          </button>
        )}
      </div>
      
      <div className="mobile-card-stack mobile-only">
        {personalizedArticles.map((article, index) => (
          <ArticleCard
            key={`foryou-${article.id}-${index}`}
            article={article}
            variant="compact"
            userCountry={userCountry}
          />
        ))}
      </div>
    </main>
  );
};

export default ForYouFeed;
