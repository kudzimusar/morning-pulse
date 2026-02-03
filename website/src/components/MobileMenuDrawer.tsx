import React from 'react';
import { X, Home, Grid3x3, Bookmark, User, FileText, Info, Shield, Mail, Settings } from 'lucide-react';

interface MobileMenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  userRole?: string[] | null;
  currentPage?: string;
  onNavigate?: (hash: string) => void;
}

const MobileMenuDrawer: React.FC<MobileMenuDrawerProps> = ({
  isOpen,
  onClose,
  userRole,
  currentPage,
  onNavigate,
}) => {
  const handleNavClick = (hash: string) => {
    if (onNavigate) {
      onNavigate(hash);
    } else {
      window.location.hash = hash;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    onClose();
  };

  const isEditor = userRole && Array.isArray(userRole) && 
    (userRole.includes('editor') || userRole.includes('admin') || userRole.includes('super_admin'));
  const isWriter = userRole && Array.isArray(userRole) && userRole.includes('writer');
  const isAdvertiser = userRole && Array.isArray(userRole) && userRole.includes('advertiser');

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="mobile-menu-backdrop"
          onClick={onClose}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1998,
            animation: 'fadeIn 0.2s ease',
          }}
        />
      )}

      {/* Drawer */}
      <div
        className={`mobile-menu-drawer ${isOpen ? 'open' : ''}`}
        style={{
          position: 'fixed',
          top: 0,
          right: isOpen ? 0 : '-100%',
          width: '85%',
          maxWidth: '320px',
          height: '100vh',
          background: '#ffffff',
          zIndex: 1999,
          boxShadow: '-2px 0 8px rgba(0, 0, 0, 0.15)',
          transition: 'right 0.3s ease',
          overflowY: 'auto',
          paddingTop: 'env(safe-area-inset-top)',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '16px',
          borderBottom: '1px solid #e0e0e0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#000' }}>
            Menu
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label="Close menu"
          >
            <X size={24} />
          </button>
        </div>

        {/* Navigation Sections */}
        <nav style={{ padding: '8px 0' }}>
          {/* Main Navigation */}
          <div style={{ padding: '8px 0' }}>
            <button
              onClick={() => handleNavClick('#news')}
              className="mobile-menu-item"
              style={{
                width: '100%',
                padding: '16px',
                background: 'none',
                border: 'none',
                textAlign: 'left',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                fontSize: '1rem',
                color: '#1a1a1a',
              }}
            >
              <Home size={20} />
              <span>Home</span>
            </button>

            <button
              onClick={() => handleNavClick('#opinion')}
              className="mobile-menu-item"
              style={{
                width: '100%',
                padding: '16px',
                background: 'none',
                border: 'none',
                textAlign: 'left',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                fontSize: '1rem',
                color: '#1a1a1a',
              }}
            >
              <FileText size={20} />
              <span>Opinion</span>
            </button>

            <button
              onClick={() => handleNavClick('#bookmarks')}
              className="mobile-menu-item"
              style={{
                width: '100%',
                padding: '16px',
                background: 'none',
                border: 'none',
                textAlign: 'left',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                fontSize: '1rem',
                color: '#1a1a1a',
              }}
            >
              <Bookmark size={20} />
              <span>Saved Articles</span>
            </button>
          </div>

          {/* Divider */}
          <div style={{ height: '1px', background: '#e0e0e0', margin: '8px 0' }} />

          {/* Categories Section */}
          <div style={{ padding: '8px 0' }}>
            <div style={{
              padding: '12px 16px',
              fontSize: '0.75rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: '#666666',
            }}>
              Categories
            </div>
            {[
              { label: 'Local News', hash: '#news?category=Local' },
              { label: 'Business', hash: '#news?category=Business' },
              { label: 'Technology', hash: '#news?category=Technology' },
              { label: 'World News', hash: '#news?category=World News' },
              { label: 'Sports', hash: '#news?category=Sports' },
              { label: 'Health', hash: '#news?category=Health' },
              { label: 'Environment', hash: '#news?category=Environment' },
            ].map((category) => (
              <button
                key={category.hash}
                onClick={() => handleNavClick(category.hash)}
                className="mobile-menu-item"
                style={{
                  width: '100%',
                  padding: '12px 16px 12px 48px',
                  background: 'none',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '0.9375rem',
                  color: '#1a1a1a',
                }}
              >
                {category.label}
              </button>
            ))}
          </div>

          {/* Divider */}
          <div style={{ height: '1px', background: '#e0e0e0', margin: '8px 0' }} />

          {/* Role-Based Access */}
          {(isEditor || isWriter || isAdvertiser) && (
            <div style={{ padding: '8px 0' }}>
              <div style={{
                padding: '12px 16px',
                fontSize: '0.75rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: '#666666',
              }}>
                Dashboard
              </div>
              {isEditor && (
                <button
                  onClick={() => handleNavClick('#dashboard')}
                  className="mobile-menu-item"
                  style={{
                    width: '100%',
                    padding: '12px 16px 12px 48px',
                    background: 'none',
                    border: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '0.9375rem',
                    color: '#1a1a1a',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                  }}
                >
                  <User size={18} />
                  <span>Editor Dashboard</span>
                </button>
              )}
              {isWriter && (
                <button
                  onClick={() => handleNavClick('#writer/dashboard')}
                  className="mobile-menu-item"
                  style={{
                    width: '100%',
                    padding: '12px 16px 12px 48px',
                    background: 'none',
                    border: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '0.9375rem',
                    color: '#1a1a1a',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                  }}
                >
                  <FileText size={18} />
                  <span>Writer Dashboard</span>
                </button>
              )}
              {isAdvertiser && (
                <button
                  onClick={() => handleNavClick('#advertiser/dashboard')}
                  className="mobile-menu-item"
                  style={{
                    width: '100%',
                    padding: '12px 16px 12px 48px',
                    background: 'none',
                    border: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '0.9375rem',
                    color: '#1a1a1a',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                  }}
                >
                  <Settings size={18} />
                  <span>Advertiser Dashboard</span>
                </button>
              )}
            </div>
          )}

          {/* Divider */}
          <div style={{ height: '1px', background: '#e0e0e0', margin: '8px 0' }} />

          {/* Legal & Info */}
          <div style={{ padding: '8px 0' }}>
            <div style={{
              padding: '12px 16px',
              fontSize: '0.75rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: '#666666',
            }}>
              Information
            </div>
            <button
              onClick={() => handleNavClick('#about')}
              className="mobile-menu-item"
              style={{
                width: '100%',
                padding: '12px 16px 12px 48px',
                background: 'none',
                border: 'none',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '0.9375rem',
                color: '#1a1a1a',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <Info size={18} />
              <span>About Us</span>
            </button>
            <button
              onClick={() => handleNavClick('#editorial')}
              className="mobile-menu-item"
              style={{
                width: '100%',
                padding: '12px 16px 12px 48px',
                background: 'none',
                border: 'none',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '0.9375rem',
                color: '#1a1a1a',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <Shield size={18} />
              <span>Editorial Standards</span>
            </button>
            <button
              onClick={() => handleNavClick('#privacy')}
              className="mobile-menu-item"
              style={{
                width: '100%',
                padding: '12px 16px 12px 48px',
                background: 'none',
                border: 'none',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '0.9375rem',
                color: '#1a1a1a',
              }}
            >
              Privacy Policy
            </button>
            <button
              onClick={() => handleNavClick('#terms')}
              className="mobile-menu-item"
              style={{
                width: '100%',
                padding: '12px 16px 12px 48px',
                background: 'none',
                border: 'none',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '0.9375rem',
                color: '#1a1a1a',
              }}
            >
              Terms of Service
            </button>
            <button
              onClick={() => handleNavClick('#cookies')}
              className="mobile-menu-item"
              style={{
                width: '100%',
                padding: '12px 16px 12px 48px',
                background: 'none',
                border: 'none',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '0.9375rem',
                color: '#1a1a1a',
              }}
            >
              Cookie Policy
            </button>
            <button
              onClick={() => handleNavClick('#advertise')}
              className="mobile-menu-item"
              style={{
                width: '100%',
                padding: '12px 16px 12px 48px',
                background: 'none',
                border: 'none',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '0.9375rem',
                color: '#1a1a1a',
              }}
            >
              Advertise With Us
            </button>
            <a
              href="mailto:tip@morningpulse.net?subject=Secure%20Tip"
              className="mobile-menu-item"
              style={{
                width: '100%',
                padding: '12px 16px 12px 48px',
                background: 'none',
                border: 'none',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '0.9375rem',
                color: '#1a1a1a',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <Mail size={18} />
              <span>Submit a Tip</span>
            </a>
          </div>
        </nav>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .mobile-menu-item:active {
          background-color: #f3f4f6;
        }
      `}</style>
    </>
  );
};

export default MobileMenuDrawer;
