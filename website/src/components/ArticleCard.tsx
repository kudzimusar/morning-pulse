import React, { useState, useEffect } from 'react';
import { NewsStory } from '../../../types';
import { CountryInfo } from '../services/locationService';
import { getCachedUnsplashImageUrl } from '../services/imageService';

interface ArticleCardProps {
  article: NewsStory;
  variant?: 'grid' | 'compact';
  userCountry?: CountryInfo;
}

const ArticleCard: React.FC<ArticleCardProps> = ({ article, variant = 'grid', userCountry }) => {
  const [imageUrl, setImageUrl] = useState<string>('');

  // Fetch image URL on mount
  useEffect(() => {
    let isMounted = true;

    const loadImageUrl = async () => {
      if (article.urlToImage) {
        if (isMounted) {
          setImageUrl(article.urlToImage);
        }
        return;
      }

      // Use Unsplash proxy with fallback
      try {
        const url = await getCachedUnsplashImageUrl(
          article.id,
          article.category,
          article.headline,
          800,
          600
        );
        if (isMounted) {
          setImageUrl(url);
        }
      } catch (error) {
        // Silently fail - will use gradient placeholder
        if (isMounted) {
          setImageUrl('');
        }
      }
    };

    loadImageUrl();

    return () => {
      isMounted = false;
    };
  }, [article.id, article.urlToImage, article.category, article.headline]);

  const handleClick = () => {
    if (article.url) {
      window.open(article.url, '_blank', 'noopener,noreferrer');
    }
  };

  // Generate gradient based on category
  const getCategoryGradient = (category: string) => {
    const gradients: { [key: string]: string } = {
      'Local (Zim)': 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
      'Business (Zim)': 'linear-gradient(135deg, #065f46 0%, #10b981 100%)',
      'African Focus': 'linear-gradient(135deg, #b45309 0%, #f59e0b 100%)',
      'Global': 'linear-gradient(135deg, #991b1b 0%, #ef4444 100%)',
      'Sports': 'linear-gradient(135deg, #1e40af 0%, #60a5fa 100%)',
      'Tech': 'linear-gradient(135deg, #6b21a8 0%, #a78bfa 100%)',
      'General News': 'linear-gradient(135deg, #0c4a6e 0%, #06b6d4 100%)',
    };
    return gradients[category] || gradients['General News'];
  };

  // Get category icon
  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: string } = {
      'Local (Zim)': '📍',
      'Business (Zim)': '💼',
      'African Focus': '🌍',
      'Global': '🌎',
      'Sports': '⚽',
      'Tech': '💻',
      'General News': '📰',
    };
    return icons[category] || icons['General News'];
  };

  // Generate tags
  const getTags = () => {
    const tags = [`#${article.category.replace(/\s+/g, '')}`];
    
    // Dynamically add country tag based on userCountry prop
    if (article.category.includes('Local')) {
      if (userCountry?.code) {
        tags.push(`#${userCountry.code}News`);
      } else if (userCountry?.name) {
        tags.push(`#${userCountry.name.replace(/\s+/g, '')}News`);
      } else {
        tags.push('#ZimNews'); // Fallback
      }
    }
    
    if (article.category.includes('Business')) tags.push('#Business');
    if (article.category.includes('African')) tags.push('#Africa');
    
    return tags;
  };

  return (
    <article 
      className={`premium-article-card ${variant} ${article.url ? 'clickable' : ''}`}
      onClick={handleClick}
    >
      <div 
        className="article-image"
        style={{ 
          backgroundImage: imageUrl 
            ? `url(${imageUrl})` 
            : getCategoryGradient(article.category),
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Glassmorphism overlay with tags */}
        <div className="article-image-overlay glassmorphism">
          <div className="article-tags-overlay">
            {getTags().map((tag, index) => (
              <span key={index} className="article-tag-overlay">{tag}</span>
            ))}
          </div>
        </div>
      </div>
      <div className="article-content">
        <h3 className="article-headline">{article.headline}</h3>
        <p className="article-detail">{article.detail}</p>
        <div className="article-footer">
          <div className="article-meta">
            <span className="article-source">{article.source}</span>
            {article.url && (
              <span className="article-link">Read more →</span>
            )}
          </div>
          <div className="article-tags">
            {getTags().map((tag, index) => (
              <span key={index} className="article-tag">{tag}</span>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
};

export default ArticleCard;
