// TrendingSidebar.tsx
// Sidebar showing trending/popular articles - DESKTOP ONLY

import React, { useState, useEffect } from 'react';
import { TrendingUp, Clock } from 'lucide-react';
import { trackArticleClick, getTopArticles, getPopularCategories } from '../../services/analyticsService';
import { NewsStory } from '../../../types';

interface TrendingArticle {
  id: string;
  title: string;
  headline?: string;
  url?: string;
  category: string;
  views?: number;
  trendingScore?: number;
  imageUrl?: string;
  timestamp?: number;
}

interface TrendingSidebarProps {
  articles: NewsStory[];
  maxItems?: number;
  onArticleClick?: (articleId: string) => void;
}

export const TrendingSidebar: React.FC<TrendingSidebarProps> = ({
  articles,
  maxItems = 10,
  onArticleClick,
}) => {
  const [trendingArticles, setTrendingArticles] = useState<TrendingArticle[]>([]);
  const [timeRange, setTimeRange] = useState<'hour' | 'day' | 'week'>('day');

  useEffect(() => {
    // Calculate trending scores from analytics
    const topArticles = getTopArticles(50);
    const topArticleIds = new Set(topArticles.map(a => a.articleId));
    
    // Map articles with trending scores
    const articlesWithScores: TrendingArticle[] = articles
      .map(article => {
        const topArticle = topArticles.find(ta => ta.articleId === article.id);
        const clicks = topArticle?.clicks || 0;
        
        // Calculate trending score
        // Factors: clicks (weighted), recency, category popularity
        const recencyBoost = article.timestamp 
          ? Math.max(0, 1 - (Date.now() - article.timestamp) / (7 * 24 * 60 * 60 * 1000)) // Decay over 7 days
          : 0.5;
        
        const trendingScore = (clicks * 1.5) + (recencyBoost * 10);
        
        return {
          id: article.id,
          title: article.headline,
          headline: article.headline,
          url: article.url,
          category: article.category,
          views: clicks,
          trendingScore,
          imageUrl: article.urlToImage,
          timestamp: article.timestamp,
        };
      })
      .filter(article => article.trendingScore > 0 || topArticleIds.has(article.id))
      .sort((a, b) => (b.trendingScore || 0) - (a.trendingScore || 0))
      .slice(0, maxItems);
    
    setTrendingArticles(articlesWithScores);
  }, [articles, maxItems, timeRange]);

  const handleArticleClick = (article: TrendingArticle) => {
    // Track click
    trackArticleClick({
      articleId: article.id,
      articleTitle: article.title || article.headline || '',
      category: article.category,
      position: 0, // Position in trending sidebar
      source: 'trending',
    });

    if (onArticleClick) {
      onArticleClick(article.id);
    }

    // Navigate to article
    if (article.url) {
      if (article.url.startsWith('#')) {
        window.location.hash = article.url.substring(1);
      } else if (article.url.startsWith('http')) {
        window.open(article.url, '_blank', 'noopener,noreferrer');
      } else {
        window.location.href = article.url;
      }
    }
  };

  const getTimeAgo = (timestamp?: number): string => {
    if (!timestamp) return '';
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <aside
      className="trending-sidebar"
      className="trending-sidebar-desktop"
      style={{
        background: 'white',
        borderRadius: '16px',
        padding: '1.5rem',
        boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
        position: 'sticky',
        top: '1rem',
        maxHeight: 'calc(100vh - 2rem)',
        overflowY: 'auto',
      }}
    >
      <div style={{ marginBottom: '1.5rem' }}>
        <h3
          style={{
            margin: '0 0 1rem 0',
            fontSize: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontWeight: 700,
          }}
        >
          <TrendingUp size={20} color="var(--primary-color)" />
          Trending Now
        </h3>
        
        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            background: '#f0f0f0',
            padding: '0.25rem',
            borderRadius: '12px',
          }}
        >
          <button
            onClick={() => setTimeRange('hour')}
            style={{
              flex: 1,
              padding: '0.5rem',
              background: timeRange === 'hour' ? 'white' : 'none',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: timeRange === 'hour' ? 600 : 500,
              color: timeRange === 'hour' ? 'var(--primary-color)' : '#666',
              transition: 'all 0.2s',
              boxShadow: timeRange === 'hour' ? '0 2px 4px rgba(0, 0, 0, 0.1)' : 'none',
            }}
          >
            1H
          </button>
          <button
            onClick={() => setTimeRange('day')}
            style={{
              flex: 1,
              padding: '0.5rem',
              background: timeRange === 'day' ? 'white' : 'none',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: timeRange === 'day' ? 600 : 500,
              color: timeRange === 'day' ? 'var(--primary-color)' : '#666',
              transition: 'all 0.2s',
              boxShadow: timeRange === 'day' ? '0 2px 4px rgba(0, 0, 0, 0.1)' : 'none',
            }}
          >
            24H
          </button>
          <button
            onClick={() => setTimeRange('week')}
            style={{
              flex: 1,
              padding: '0.5rem',
              background: timeRange === 'week' ? 'white' : 'none',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: timeRange === 'week' ? 600 : 500,
              color: timeRange === 'week' ? 'var(--primary-color)' : '#666',
              transition: 'all 0.2s',
              boxShadow: timeRange === 'week' ? '0 2px 4px rgba(0, 0, 0, 0.1)' : 'none',
            }}
          >
            7D
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {trendingArticles.length === 0 ? (
          <div
            style={{
              padding: '2rem',
              textAlign: 'center',
              color: '#666',
              fontSize: '0.9rem',
            }}
          >
            No trending articles yet. Check back soon!
          </div>
        ) : (
          trendingArticles.map((article, index) => (
            <TrendingItem
              key={article.id}
              article={article}
              rank={index + 1}
              onClick={() => handleArticleClick(article)}
              getTimeAgo={getTimeAgo}
            />
          ))
        )}
      </div>

      <style>{`
        .trending-sidebar-desktop {
          display: block;
        }
        
        @media (max-width: 1023px) {
          .trending-sidebar-desktop {
            display: none !important;
          }
        }
        
        .trending-sidebar-desktop::-webkit-scrollbar {
          width: 6px;
        }
        
        .trending-sidebar-desktop::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        
        .trending-sidebar-desktop::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 10px;
        }
        
        .trending-sidebar-desktop::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
      `}</style>
    </aside>
  );
};

// Individual Trending Item Component
interface TrendingItemProps {
  article: TrendingArticle;
  rank: number;
  onClick: () => void;
  getTimeAgo: (timestamp?: number) => string;
}

const TrendingItem: React.FC<TrendingItemProps> = ({ article, rank, onClick, getTimeAgo }) => {
  const getRankColor = (rank: number): string => {
    if (rank === 1) return '#FFD700'; // Gold
    if (rank === 2) return '#C0C0C0'; // Silver
    if (rank === 3) return '#CD7F32'; // Bronze
    return 'var(--primary-color)';
  };

  const formatViews = (views?: number): string => {
    if (!views) return '';
    if (views < 1000) return `${views}`;
    if (views < 1000000) return `${(views / 1000).toFixed(1)}K`;
    return `${(views / 1000000).toFixed(1)}M`;
  };

  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.75rem',
        background: '#f8f9fa',
        borderRadius: '12px',
        cursor: 'pointer',
        transition: 'all 0.2s',
        position: 'relative',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = '#e9ecef';
        e.currentTarget.style.transform = 'translateX(4px)';
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = '#f8f9fa';
        e.currentTarget.style.transform = 'translateX(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          color: 'white',
          fontSize: '0.9rem',
          flexShrink: 0,
          background: getRankColor(rank),
        }}
      >
        {rank}
      </div>

      {article.imageUrl && (
        <div
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '8px',
            overflow: 'hidden',
            flexShrink: 0,
          }}
        >
          <img
            src={article.imageUrl}
            alt={article.title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        </div>
      )}

      <div style={{ flex: 1, minWidth: 0 }}>
        <h4
          style={{
            margin: '0 0 0.5rem 0',
            fontSize: '0.9rem',
            lineHeight: 1.4,
            color: '#333',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            fontWeight: 600,
          }}
        >
          {article.title || article.headline}
        </h4>
        
        <div
          style={{
            display: 'flex',
            gap: '0.75rem',
            alignItems: 'center',
            fontSize: '0.75rem',
          }}
        >
          <span
            style={{
              color: 'var(--primary-color)',
              fontWeight: 600,
              textTransform: 'uppercase',
            }}
          >
            {article.category}
          </span>
          {article.timestamp && (
            <span
              style={{
                color: '#666',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <Clock size={12} />
              {getTimeAgo(article.timestamp)}
            </span>
          )}
          {article.views && (
            <span style={{ color: '#666' }}>
              👁️ {formatViews(article.views)}
            </span>
          )}
        </div>
      </div>

      <div style={{ fontSize: '1.2rem', flexShrink: 0 }}>
        <span>↗️</span>
      </div>
    </div>
  );
};

export default TrendingSidebar;
