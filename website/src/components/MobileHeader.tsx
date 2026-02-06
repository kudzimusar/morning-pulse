import React, { useState } from 'react';
import { Menu, Bell, Search, LogIn, User } from 'lucide-react';

interface MobileHeaderProps {
  onLogoClick?: () => void;
  onMenuClick?: () => void;
  onSearchClick?: () => void;
  onNotificationsClick?: () => void;
  onSignInClick?: () => void;
  onTabChange?: (tab: 'latest' | 'foryou' | 'askai') => void;
  onTickerClick?: (headline: string) => void;
  onSubscribeClick?: () => void;
  activeTab?: 'latest' | 'foryou' | 'askai';
  userRole?: string[] | null;
  isAuthenticated?: boolean;
  notificationCount?: number;
  topHeadlines?: string[];
}

const MobileHeader: React.FC<MobileHeaderProps> = ({
  onLogoClick,
  onMenuClick,
  onSearchClick,
  onNotificationsClick,
  onSignInClick,
  onTabChange,
  onTickerClick,
  onSubscribeClick,
  activeTab = 'latest',
  userRole,
  isAuthenticated = false,
  notificationCount = 0,
  topHeadlines = [],
}) => {
  const handleTabClick = (tab: 'latest' | 'foryou' | 'askai') => {
    if (onTabChange) {
      onTabChange(tab);
    } else {
      // Fallback navigation
      if (tab === 'latest') {
        window.location.hash = 'news';
      } else if (tab === 'foryou') {
        window.location.hash = 'foryou';
      } else if (tab === 'askai') {
        window.location.hash = 'askai';
      }
    }
  };

  return (
    <header className="mobile-header mobile-only">
      {/* Row 1: Top Bar (Dark Blue #000033) */}
      <div className="mobile-header-top-bar">
        <div className="mobile-header-top-left">
          <button
            onClick={onMenuClick}
            className="mobile-header-icon mobile-touch-target"
            aria-label="Menu"
          >
            <Menu size={22} />
          </button>
          <button
            onClick={onNotificationsClick}
            className="mobile-header-icon mobile-touch-target mobile-notifications-btn"
            aria-label="Notifications"
          >
            <Bell size={22} />
            {notificationCount > 0 && (
              <span className="mobile-notification-badge">{notificationCount}</span>
            )}
          </button>
        </div>
        
        <button
          onClick={onLogoClick}
          className="mobile-header-logo"
        >
          Morning Pulse
        </button>
        
        <div className="mobile-header-top-right">
          {onSearchClick && (
            <button
              onClick={onSearchClick}
              className="mobile-header-icon mobile-touch-target"
              aria-label="Search"
            >
              <Search size={22} />
            </button>
          )}
          {isAuthenticated ? (
            <button
              onClick={onSignInClick}
              className="mobile-header-icon mobile-touch-target"
              aria-label="Profile"
            >
              <User size={22} />
            </button>
          ) : (
            <button
              onClick={onSignInClick}
              className="mobile-sign-in-btn"
              aria-label="Sign In"
            >
              Sign In
            </button>
          )}
        </div>
      </div>

      {/* Row 2: Navigation Tabs (White Background) */}
      <div className="mobile-header-nav-tabs">
        <button
          onClick={() => handleTabClick('latest')}
          className={`mobile-header-nav-tab ${activeTab === 'latest' ? 'active' : ''}`}
        >
          Latest
        </button>
        <button
          onClick={() => handleTabClick('foryou')}
          className={`mobile-header-nav-tab ${activeTab === 'foryou' ? 'active' : ''}`}
        >
          For You
        </button>
        <button
          onClick={() => handleTabClick('askai')}
          className={`mobile-header-nav-tab ${activeTab === 'askai' ? 'active' : ''}`}
        >
          Ask The Pulse AI
        </button>
        {/* Subscribe Button - Only for guests, far right */}
        {!isAuthenticated && onSubscribeClick && (
          <button
            onClick={onSubscribeClick}
            className="mobile-header-subscribe-btn"
            style={{
              marginLeft: 'auto',
              padding: '0 12px',
              fontSize: '0.8125rem',
              fontWeight: 600,
              color: 'var(--primary-color)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            Subscribe
          </button>
        )}
      </div>

      {/* Breaking News Ticker (Red #dc2626) - Row 3, Lightweight */}
      {topHeadlines.length > 0 && (
        <div className="mobile-header-ticker">
          <div className="mobile-ticker-content">
            <span className="mobile-ticker-label">BREAKING:</span>
            <div 
              className="mobile-ticker-wrapper"
              onMouseEnter={(e) => {
                const scroll = e.currentTarget.querySelector('.mobile-ticker-scroll') as HTMLElement;
                if (scroll) scroll.style.animationPlayState = 'paused';
              }}
              onMouseLeave={(e) => {
                const scroll = e.currentTarget.querySelector('.mobile-ticker-scroll') as HTMLElement;
                if (scroll) scroll.style.animationPlayState = 'running';
              }}
              onTouchStart={(e) => {
                const scroll = e.currentTarget.querySelector('.mobile-ticker-scroll') as HTMLElement;
                if (scroll) scroll.style.animationPlayState = 'paused';
              }}
              onTouchEnd={(e) => {
                const scroll = e.currentTarget.querySelector('.mobile-ticker-scroll') as HTMLElement;
                if (scroll) scroll.style.animationPlayState = 'running';
              }}
            >
              <div className="mobile-ticker-scroll">
                {topHeadlines.map((headline, index) => (
                  <span 
                    key={index} 
                    className="mobile-ticker-item"
                    onClick={() => {
                      if (onTickerClick) {
                        onTickerClick(headline);
                      } else if (onTabChange) {
                        onTabChange('latest');
                        window.location.hash = 'news';
                      }
                    }}
                  >
                    {headline}
                    {index < topHeadlines.length - 1 && <span className="mobile-ticker-separator"> • </span>}
                  </span>
                ))}
                {/* Duplicate for seamless loop */}
                {topHeadlines.map((headline, index) => (
                  <span 
                    key={`dup-${index}`} 
                    className="mobile-ticker-item"
                    onClick={() => {
                      if (onTickerClick) {
                        onTickerClick(headline);
                      } else if (onTabChange) {
                        onTabChange('latest');
                        window.location.hash = 'news';
                      }
                    }}
                  >
                    {headline}
                    {index < topHeadlines.length - 1 && <span className="mobile-ticker-separator"> • </span>}
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

export default MobileHeader;
