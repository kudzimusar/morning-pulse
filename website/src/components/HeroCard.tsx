import React from 'react';
import { NewsStory } from '../../../types';
import { CountryInfo } from '../services/locationService';

interface HeroCardProps {
  article: NewsStory;
  userCountry?: CountryInfo;
}

const HeroCard: React.FC<HeroCardProps> = ({ article, userCountry }) => {
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

  // Get image URL - use urlToImage if available, otherwise Unsplash fallback
  const getImageUrl = () => {
    if (article.urlToImage) {
      return article.urlToImage;
    }
    // Unsplash fallback based on category
    const categoryQuery = article.category.toLowerCase().replace(/\s+/g, ',').replace(/\(zim\)/g, 'zimbabwe');
    return `https://source.unsplash.com/featured/?${categoryQuery},news`;
  };

  // Generate tags for glassmorphism overlay
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
      className={`hero-card ${article.url ? 'clickable' : ''}`}
      onClick={handleClick}
    >
      <div 
        className="hero-image"
        style={{ 
          backgroundImage: `url(${getImageUrl()})`,
          background: article.urlToImage 
            ? `url(${article.urlToImage})` 
            : `url(${getImageUrl()}), ${getCategoryGradient(article.category)}`
        }}
      >
        {/* Glassmorphism overlay with tags */}
        <div className="hero-image-overlay glassmorphism">
          <div className="hero-tags-overlay">
            {getTags().map((tag, index) => (
              <span key={index} className="hero-tag-overlay">{tag}</span>
            ))}
          </div>
        </div>
        <div className="hero-overlay">
          <div className="hero-category-badge">{article.category}</div>
        </div>
      </div>
      <div className="hero-content">
        <h2 className="hero-headline">{article.headline}</h2>
        <p className="hero-summary">{article.detail}</p>
        <div className="hero-footer">
          <span className="hero-source">{article.source}</span>
          <div className="hero-tags">
            {getTags().map((tag, index) => (
              <span key={index} className="hero-tag">{tag}</span>
            ))}
          </div>
          {article.url && (
            <span className="hero-link">Read Full Story →</span>
          )}
        </div>
      </div>
    </article>
  );
};

export default HeroCard;
