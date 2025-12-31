import React from 'react';
import { NewsStory } from '../../../types';

interface HeroCardProps {
  article: NewsStory;
}

const HeroCard: React.FC<HeroCardProps> = ({ article }) => {
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

  return (
    <article 
      className={`hero-card ${article.url ? 'clickable' : ''}`}
      onClick={handleClick}
    >
      <div 
        className="hero-image"
        style={{ 
          background: getCategoryGradient(article.category)
        }}
      >
        <div className="hero-image-placeholder">
          <span className="category-icon">{getCategoryIcon(article.category)}</span>
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
            <span className="hero-tag">#{article.category.replace(/\s+/g, '')}</span>
            {article.category === 'Local (Zim)' && <span className="hero-tag">#ZimNews</span>}
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
