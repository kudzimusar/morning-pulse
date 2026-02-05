import React, { useState, useEffect, useMemo } from 'react';
import { NewsStory } from '../../types';
import ArticleCard from './ArticleCard';
import LoadingSkeleton from './LoadingSkeleton';
import { CountryInfo } from '../services/locationService';
import { getOrderedCategories } from '../services/userPreferences';

interface ForYouFeedProps {
  newsData: {
    [category: string]: NewsStory[];
  };
  userCountry?: CountryInfo;
}

const ForYouFeed: React.FC<ForYouFeedProps> = ({ newsData, userCountry }) => {
  const [loading, setLoading] = useState(true);
  const [personalizedArticles, setPersonalizedArticles] = useState<NewsStory[]>([]);

  // Get user's preferred categories from localStorage
  const preferredCategories = useMemo(() => {
    try {
      const stored = localStorage.getItem('userCategoryPreferences');
      if (stored) {
        const prefs = JSON.parse(stored);
        // Get top 3 preferred categories
        return Object.entries(prefs)
          .sort(([, a]: any, [, b]: any) => b - a)
          .slice(0, 3)
          .map(([category]) => category);
      }
    } catch (e) {
      console.error('Error reading category preferences:', e);
    }
    // Default to most common categories
    return ['Local (Zim)', 'Business (Zim)', 'World News'];
  }, []);

  useEffect(() => {
    setLoading(true);
    
    // Simulate personalized feed generation
    const generatePersonalizedFeed = () => {
      const articles: NewsStory[] = [];
      
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
      generatePersonalizedFeed();
    } else {
      setLoading(false);
    }
  }, [newsData, preferredCategories]);

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (personalizedArticles.length === 0) {
    return (
      <div className="mobile-content-with-nav" style={{ padding: '32px 16px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '16px', color: 'var(--text-color)' }}>
          Your Personalized Feed
        </h2>
        <p style={{ color: 'var(--light-text)', marginBottom: '24px' }}>
          We're building your personalized feed based on your reading preferences.
        </p>
        <p style={{ color: 'var(--light-text)', fontSize: '0.875rem' }}>
          Start reading articles to help us understand what you like!
        </p>
      </div>
    );
  }

  return (
    <main className="premium-news-grid mobile-content-with-nav">
      <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color)' }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-color)' }}>
          For You
        </h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--light-text)', marginTop: '4px' }}>
          Personalized stories based on your interests
        </p>
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
