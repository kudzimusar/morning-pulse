import React, { useState, useEffect } from 'react';

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
}

const Header: React.FC<HeaderProps> = ({ topHeadlines = [], onCategorySelect }) => {
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

  // Create ticker text from headlines
  const tickerText = topHeadlines.length > 0 
    ? topHeadlines.join(' • ')
    : 'Loading latest headlines...';

  return (
    <header className="premium-header">
      {/* Top Bar with Live indicator and time */}
      <div className="header-top-bar">
        <div className="header-top-content">
          <div className="live-indicator">
            <span className="live-dot"></span>
            <span>LIVE</span>
            <span className="time-indicator">{harareTime}</span>
          </div>
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

      {/* Main Header with Logo */}
      <div className="header-main">
        <div className="header-main-content">
          <h1 className="premium-logo" onClick={() => handleCategoryClick(null)}>
            Morning Pulse
          </h1>
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
      <div className="header-ticker">
        <div className="ticker-content">
          <span className="ticker-label">BREAKING:</span>
          <div className="ticker-scroll">
            <span className="ticker-text">{tickerText}</span>
            <span className="ticker-text">{tickerText}</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
