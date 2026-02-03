import React from 'react';
import { Search, Menu } from 'lucide-react';

interface MobileHeaderProps {
  onLogoClick?: () => void;
  onSearchClick?: () => void;
  onMenuClick?: () => void;
}

const MobileHeader: React.FC<MobileHeaderProps> = ({
  onLogoClick,
  onSearchClick,
  onMenuClick,
}) => {
  return (
    <header className="mobile-header mobile-only">
      <button
        onClick={onMenuClick}
        className="mobile-header-icon mobile-touch-target"
        aria-label="Menu"
      >
        <Menu size={20} />
      </button>
      
      <button
        onClick={onLogoClick}
        className="mobile-header-logo"
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
        }}
      >
        Morning Pulse
      </button>
      
      <div className="mobile-header-actions">
        {onSearchClick && (
          <button
            onClick={onSearchClick}
            className="mobile-header-icon mobile-touch-target"
            aria-label="Search"
          >
            <Search size={20} />
          </button>
        )}
      </div>
    </header>
  );
};

export default MobileHeader;
