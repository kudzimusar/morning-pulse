import React from 'react';
import { Home, Grid3x3, Bookmark, User } from 'lucide-react';

interface BottomNavProps {
  currentPage?: string;
  onNavigate?: (page: string) => void;
  userRole?: string[] | null;
}

const BottomNav: React.FC<BottomNavProps> = ({
  currentPage = 'home',
  onNavigate,
  userRole,
}) => {
  const handleNavClick = (page: string, hash: string) => {
    if (onNavigate) {
      onNavigate(page);
    } else {
      // Remove leading # if present
      const cleanHash = hash.startsWith('#') ? hash.substring(1) : hash;
      window.location.hash = cleanHash;
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const isActive = (page: string) => {
    if (page === 'home') {
      return currentPage === 'news' || currentPage === '' || !currentPage;
    }
    return currentPage === page;
  };

  // Determine if user should see profile or dashboard
  const profilePage = userRole && Array.isArray(userRole) && 
    (userRole.includes('editor') || userRole.includes('admin') || userRole.includes('super_admin'))
    ? 'dashboard'
    : userRole && Array.isArray(userRole) && userRole.includes('writer')
    ? 'writer-dashboard'
    : userRole && Array.isArray(userRole) && userRole.includes('advertiser')
    ? 'advertiser-dashboard'
    : 'profile';

  const profileHash = profilePage === 'dashboard' 
    ? '#dashboard'
    : profilePage === 'writer-dashboard'
    ? '#writer/dashboard'
    : profilePage === 'advertiser-dashboard'
    ? '#advertiser/dashboard'
    : '#profile';

  return (
    <nav className="mobile-bottom-nav mobile-only">
      <button
        onClick={() => handleNavClick('home', '#news')}
        className={`mobile-bottom-nav-item ${isActive('home') ? 'active' : ''}`}
        aria-label="Home"
      >
        <Home className="mobile-bottom-nav-icon" />
        <span>Home</span>
      </button>
      
      <button
        onClick={() => handleNavClick('categories', '#news')}
        className={`mobile-bottom-nav-item ${isActive('categories') ? 'active' : ''}`}
        aria-label="Categories"
      >
        <Grid3x3 className="mobile-bottom-nav-icon" />
        <span>Categories</span>
      </button>
      
      <button
        onClick={() => handleNavClick('bookmarks', '#bookmarks')}
        className={`mobile-bottom-nav-item ${isActive('bookmarks') ? 'active' : ''}`}
        aria-label="Bookmarks"
      >
        <Bookmark className="mobile-bottom-nav-icon" />
        <span>Saved</span>
      </button>
      
      <button
        onClick={() => handleNavClick(profilePage, profileHash)}
        className={`mobile-bottom-nav-item ${isActive(profilePage) ? 'active' : ''}`}
        aria-label="Profile"
      >
        <User className="mobile-bottom-nav-icon" />
        <span>Profile</span>
      </button>
    </nav>
  );
};

export default BottomNav;
