import React, { useState, useEffect, useMemo } from 'react';
import WeatherBar from './WeatherBar';
import CountrySwitcher from './CountrySwitcher';
import AdSlot from './AdSlot';
import AppearanceMenu from './AppearanceMenu';
import { Type } from 'lucide-react';
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
  activePage?: string;
  onNavSelect?: (page: string) => void;
}

const Header: React.FC<HeaderProps> = ({
  topHeadlines = [],
  onCategorySelect,
  onSubscribeClick,
  currentCountry,
  onCountryChange,
  userRole,
  onDashboardClick,
  activePage, // New prop
  onNavSelect // New prop
}) => {
  const [harareTime, setHarareTime] = useState('');
  const [harareDate, setHarareDate] = useState('');
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isAppearanceMenuOpen, setIsAppearanceMenuOpen] = useState(false);

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
    <header className="newspaper-header" style={{ borderBottom: '1px solid var(--mp-light-gray)' }}>
      {/* 1. TOP UTILITY BAR (Dark, Premium) */}
      <div className="header-top-bar" style={{ backgroundColor: 'var(--mp-ink)', color: 'var(--mp-white)', padding: '10px 0' }}>
        <div className="header-top-content" style={{ maxWidth: 'var(--page-max-width)', margin: '0 auto', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {/* Left side: Live indicator */}
          <div className="live-indicator" style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '11px', letterSpacing: '0.05em' }}>
            <span style={{ height: '8px', width: '8px', backgroundColor: 'var(--mp-brand-red)', borderRadius: '50%', display: 'inline-block' }}></span>
            <span style={{ fontWeight: '700' }}>LIVE GLOBAL</span>
            <span style={{ opacity: 0.7 }}>{harareTime} | {harareDate}</span>
          </div>

          {/* Right side: Country & Weather */}
          <div className="header-actions-right" style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            {/* Country Chooser - Styled */}
            {currentCountry && onCountryChange && (
              <CountrySwitcher
                currentCountry={currentCountry}
                onCountryChange={onCountryChange}
              />
            )}

            {/* Inline Weather */}
            <div style={{ display: 'flex', alignItems: 'center', fontSize: '12px', gap: '8px' }}>
              <span className="font-bold uppercase tracking-widest text-[#9CA3AF]">WEATHER</span>
              <span className="opacity-90"><WeatherBar /></span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. MAIN MASTHEAD (Clean, Serif) */}
      <div className="header-main" style={{ padding: '40px 0 28px', textAlign: 'center', borderBottom: '1px solid var(--mp-light-gray)' }}>
        <div className="header-main-content" style={{ maxWidth: 'var(--page-max-width)', margin: '0 auto', padding: '0 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>

          <h1 className="masthead" onClick={() => handleCategoryClick(null)} style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '3.5rem',
            fontWeight: '900',
            letterSpacing: '-0.04em',
            margin: '0 0 16px',
            cursor: 'pointer',
            color: 'var(--mp-ink)'
          }}>
            Morning Pulse
          </h1>

          {/* NAV TABS (The Premium Touch) */}
          <nav style={{ display: 'flex', gap: '32px', fontSize: '14px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <button
              onClick={() => onNavSelect && onNavSelect('new-home')}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: activePage === 'new-home' ? 'var(--mp-brand-red)' : 'var(--mp-slate)',
                borderBottom: activePage === 'new-home' ? '2px solid var(--mp-brand-red)' : '2px solid transparent',
                paddingBottom: '4px'
              }}>
              Mega Pulse
            </button>
            <button
              onClick={() => onNavSelect && onNavSelect('news')}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: activePage === 'news' ? 'var(--mp-brand-red)' : 'var(--mp-slate)',
                borderBottom: activePage === 'news' ? '2px solid var(--mp-brand-red)' : '2px solid transparent',
                paddingBottom: '4px'
              }}>
              Latest News
            </button>
            <button
              onClick={() => onNavSelect && onNavSelect('foryou')}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: activePage === 'foryou' ? 'var(--mp-brand-red)' : 'var(--mp-slate)',
                borderBottom: activePage === 'foryou' ? '2px solid var(--mp-brand-red)' : '2px solid transparent',
                paddingBottom: '4px'
              }}>
              For You
            </button>
            <button
              onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--mp-slate)', display: 'flex', alignItems: 'center', gap: '4px'
              }}>
              Sections ▼
            </button>
          </nav>

          {/* Category Dropdown (Absolute) */}
          {isCategoryDropdownOpen && (
            <div className="mp-glass" style={{
              position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
              zIndex: 50, padding: '16px', borderRadius: '8px',
              boxShadow: 'var(--shadow-float)', marginTop: '8px',
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', minWidth: '300px'
            }}>
              <button
                onClick={() => handleCategoryClick(null)}
                style={{ textAlign: 'left', padding: '8px', border: 'none', background: 'none', cursor: 'pointer', fontWeight: '600' }}
              >
                All News
              </button>
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => handleCategoryClick(category)}
                  style={{ textAlign: 'left', padding: '8px', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--mp-slate)' }}
                >
                  {category}
                </button>
              ))}
            </div>
          )}

          {/* Action Buttons (Subscribe, etc) - Absolute Right */}
          <div style={{ position: 'absolute', right: '24px', top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: '12px' }}>
            {onSubscribeClick && (
              <button
                onClick={onSubscribeClick}
                style={{
                  backgroundColor: 'var(--mp-brand-red)', color: 'white',
                  border: 'none', padding: '8px 16px', borderRadius: '4px',
                  fontWeight: '700', fontSize: '12px', textTransform: 'uppercase', cursor: 'pointer'
                }}
              >
                Subscribe
              </button>
            )}
            {/* Dashboard button for editors */}
            {userRole && Array.isArray(userRole) && (userRole.includes('editor') || userRole.includes('admin') || userRole.includes('super_admin')) && onDashboardClick && (
              <button onClick={onDashboardClick} style={{ backgroundColor: 'black', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}>
                Dashboard
              </button>
            )}
          </div>

        </div>
      </div>

      {/* 3. TICKER STRIP (Subtle) */}
      {topHeadlines.length > 0 && (
        <div style={{ backgroundColor: 'var(--mp-faint-gray)', borderBottom: '1px solid var(--mp-light-gray)', padding: '12px 0' }}>
          <div className="mega-page-container" style={{ display: 'flex', alignItems: 'center', fontSize: '13px' }}>
            <span style={{ color: 'var(--mp-brand-red)', fontWeight: '800', marginRight: '16px' }}>BREAKING:</span>
            <div style={{ overflow: 'hidden', whiteSpace: 'nowrap', flex: 1 }}>
              {topHeadlines.map((headline, index) => (
                <span key={index} style={{ marginRight: '24px', color: 'var(--mp-ink)' }}>{headline}</span>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
