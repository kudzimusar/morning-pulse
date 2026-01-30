import React, { useState, useEffect, useMemo } from 'react';
import WeatherBar from './WeatherBar';
import CountrySwitcher from './CountrySwitcher';
import AdSlot from './AdSlot';
import { CountryInfo, getCountryTimezone } from '../services/locationService';
import { getOrderedCategories, trackCategoryInteraction } from '../services/userPreferences';

const DEFAULT_CATEGORIES = [
  'Local (Zim)',
  'Business (Zim)',
  'African Focus',
  'World News',
  'Sports',
  'Tech & AI',
  'Environment',
  'Health',
  'General News',
  'In-Depth Analysis',
  'Opinion'
];

interface HeaderProps {
  topHeadlines?: string[];
  onCategorySelect?: (category: string | null) => void;
  onSubscribeClick?: () => void;
  currentCountry?: CountryInfo;
  onCountryChange?: (country: CountryInfo) => void;
  userRole?: string[] | null;
  onDashboardClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
  topHeadlines = [], 
  onCategorySelect, 
  onSubscribeClick, 
  currentCountry, 
  onCountryChange,
  userRole,
  onDashboardClick
}) => {
  const [harareTime, setHarareTime] = useState('');
  const [harareDate, setHarareDate] = useState('');
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Get ordered categories based on user preferences
  const categories = useMemo(() => {
    // Dynamically adjust "Local" category name based on current country
    const adjustedCategories = DEFAULT_CATEGORIES.map(cat => 
      cat === 'Local (Zim)' && currentCountry?.code !== 'ZW' 
        ? `Local (${currentCountry?.name || 'Zimbabwe'})`
        : cat
    );
    return getOrderedCategories(adjustedCategories);
  }, [currentCountry]);

  // Update time and date every second using selected country's timezone
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timezone = currentCountry?.timezone || getCountryTimezone(currentCountry?.code || 'ZW') || 'UTC';
      
      // Use selected country's timezone
      setHarareTime(now.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit',
        hour12: true,
        timeZone: timezone
      }));
      setHarareDate(now.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric',
        timeZone: timezone
      }));
    };
    
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [currentCountry]);

  const handleCategoryClick = (category: string | null) => {
    setSelectedCategory(category);
    setIsCategoryDropdownOpen(false);
    
    // Track category interaction for personalization
    if (category) {
      trackCategoryInteraction(category);
    }
    
    if (onCategorySelect) {
      onCategorySelect(category);
    }
    // If Opinion is selected, navigate to opinion page
    if (category === 'Opinion') {
      window.location.hash = 'opinion';
    }
  };

  return (
    <header className="premium-header">
      {/* Top Bar with Live indicator, time, date, and dropdowns */}
      <div className="header-top-bar">
        <div className="header-top-content">
          {/* Left side: Live indicator */}
          <div className="live-indicator">
            <span className="live-dot"></span>
            <span>LIVE GLOBAL</span>
            <span className="time-indicator">{harareTime} | {harareDate}</span>
          </div>
          
          {/* Center: Weather */}
          <WeatherBar />
          
          {/* Right side: Dropdowns */}
          <div className="header-actions-right">
            {/* Country Chooser - Top Dropdown */}
            {currentCountry && onCountryChange && (
              <CountrySwitcher 
                currentCountry={currentCountry}
                onCountryChange={onCountryChange}
              />
            )}
            
            {/* Category Chooser - Bottom Dropdown */}
            <div className="category-dropdown-container">
              <button 
                className="category-dropdown-btn"
                onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                aria-expanded={isCategoryDropdownOpen}
              >
                <span className="category-dropdown-text">Categories</span>
                <span className={`dropdown-arrow ${isCategoryDropdownOpen ? 'open' : ''}`}>▼</span>
              </button>
              
              {isCategoryDropdownOpen && (
                <div className="category-dropdown-menu">
                  <button 
                    className="category-dropdown-option"
                    onClick={() => handleCategoryClick(null)}
                  >
                    All News
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category}
                      className="category-dropdown-option"
                      onClick={() => handleCategoryClick(category)}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Header with Logo and Subscribe */}
      <div className="header-main">
        <div className="header-main-content">
          <h1 className="premium-logo" onClick={() => handleCategoryClick(null)}>
            Morning Pulse
          </h1>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {/* Dashboard button for editors */}
            {userRole && Array.isArray(userRole) && (userRole.includes('editor') || userRole.includes('admin') || userRole.includes('super_admin')) && onDashboardClick && (
              <button 
                onClick={onDashboardClick}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#000',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  whiteSpace: 'nowrap'
                }}
              >
                Go to Dashboard
              </button>
            )}
            {onSubscribeClick && (
              <button 
                className="subscribe-button"
                onClick={onSubscribeClick}
              >
                Subscribe
              </button>
            )}
          </div>
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

      {/* ✅ FIX: Header Banner Ad Slot - Responsive with constrained height */}
      <div style={{
        width: '100%',
        maxWidth: '100%',
        marginTop: '8px',
        padding: '0 16px',
        boxSizing: 'border-box',
        maxHeight: '120px', // ✅ FIX: Constrain header ad height
        overflow: 'hidden'
      }}>
        <AdSlot 
          slotId="header_banner" 
          userCountry={currentCountry}
          style={{
            width: '100%',
            maxWidth: '100%',
            margin: '0 auto',
            maxHeight: '120px', // ✅ FIX: Constrain ad image height
            objectFit: 'contain' // ✅ FIX: Maintain aspect ratio
          }}
        />
      </div>
    </header>
  );
};

export default Header;
