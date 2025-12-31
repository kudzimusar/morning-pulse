import React, { useState, useEffect } from 'react';
import WeatherBar from './WeatherBar';

const CATEGORIES = [
  'Local (Zim)',
  'Business (Zim)',
  'African Focus',
  'Global',
  'Sports',
  'Tech',
  'General News'
];

interface HeaderProps {
  topHeadlines?: string[];
  onCategorySelect?: (category: string | null) => void;
  onSubscribeClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ topHeadlines = [], onCategorySelect, onSubscribeClick }) => {
  const [harareTime, setHarareTime] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Update Harare time every second
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const harareTime = new Date(now.toLocaleString('en-US', { timeZone: 'Africa/Harare' }));
      setHarareTime(harareTime.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit',
        hour12: true 
      }) + ' CAT');
    };
    
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleCategoryClick = (category: string | null) => {
    setSelectedCategory(category);
    setIsDropdownOpen(false);
    if (onCategorySelect) {
      onCategorySelect(category);
    }
  };

  return (
    <header className="premium-header">
      {/* Top Bar with Live indicator, time, and weather */}
      <div className="header-top-bar">
        <div className="header-top-content">
          <div className="live-indicator">
            <span className="live-dot"></span>
            <span>LIVE</span>
            <span className="time-indicator">{harareTime}</span>
          </div>
          <WeatherBar />
          <div className="header-actions">
            <button 
              className="categories-btn"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              aria-expanded={isDropdownOpen}
            >
              Categories
              <span className={`dropdown-arrow ${isDropdownOpen ? 'open' : ''}`}>▼</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Header with Logo and Subscribe */}
      <div className="header-main">
        <div className="header-main-content">
          <h1 className="premium-logo" onClick={() => handleCategoryClick(null)}>
            Morning Pulse
          </h1>
          {onSubscribeClick && (
            <button 
              className="subscribe-button"
              onClick={onSubscribeClick}
            >
              Subscribe
            </button>
          )}
          {selectedCategory && (
            <div className="selected-category-badge">
              {selectedCategory}
              <button 
                className="clear-filter"
                onClick={() => handleCategoryClick(null)}
                aria-label="Clear filter"
              >
                ×
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Categories Dropdown */}
      {isDropdownOpen && (
        <div className="categories-dropdown">
          <div className="categories-dropdown-content">
            <button 
              className="category-option"
              onClick={() => handleCategoryClick(null)}
            >
              All News
            </button>
            {CATEGORIES.map((category) => (
              <button
                key={category}
                className="category-option"
                onClick={() => handleCategoryClick(category)}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Scrolling Ticker */}
      {topHeadlines.length > 0 && (
        <div className="header-ticker">
          <div className="ticker-content">
            <span className="ticker-label">BREAKING:</span>
            <div className="ticker-wrapper">
              <div className="ticker-scroll">
                {topHeadlines.map((headline, index) => (
                  <span key={index} className="ticker-item">
                    {headline}
                    {index < topHeadlines.length - 1 && <span className="ticker-separator"> • </span>}
                  </span>
                ))}
                {/* Duplicate for seamless loop */}
                {topHeadlines.map((headline, index) => (
                  <span key={`dup-${index}`} className="ticker-item">
                    {headline}
                    {index < topHeadlines.length - 1 && <span className="ticker-separator"> • </span>}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
