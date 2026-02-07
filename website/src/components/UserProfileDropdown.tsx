/**
 * User Profile Dropdown Component
 * Displays user profile information and actions when authenticated
 */

import React, { useState, useRef, useEffect } from 'react';
import { User, LogOut, Settings, ChevronDown } from 'lucide-react';

interface UserProfileDropdownProps {
  userName: string;
  userEmail: string;
  userRole?: string[];
  onSignOut: () => void;
  onProfileClick?: () => void;
  onPreferencesClick?: () => void;
}

const UserProfileDropdown: React.FC<UserProfileDropdownProps> = ({
  userName,
  userEmail,
  userRole = [],
  onSignOut,
  onProfileClick,
  onPreferencesClick
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get user initial (first letter of name)
  const userInitial = userName ? userName.charAt(0).toUpperCase() : 'U';

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Check if user is staff
  const isStaff = userRole && userRole.length > 0 && 
    (userRole.includes('editor') || userRole.includes('admin') || 
     userRole.includes('super_admin') || userRole.includes('writer'));

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      {/* Profile Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="mobile-header-icon mobile-touch-target"
        aria-label="User Profile"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '0 8px'
        }}
      >
        {/* Avatar */}
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          backgroundColor: '#000033',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '14px',
          fontWeight: 600,
          flexShrink: 0
        }}>
          {userInitial}
        </div>
        {/* User Name (hidden on very small screens) */}
        <span style={{
          fontSize: '14px',
          fontWeight: 500,
          color: 'white',
          display: 'none' // Hide on mobile, can show on larger screens
        }}>
          {userName.split(' ')[0]}
        </span>
        <ChevronDown 
          size={16} 
          color="white" 
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s'
          }}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          marginTop: '8px',
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          minWidth: '240px',
          zIndex: 1000,
          overflow: 'hidden',
          animation: 'slideDown 0.2s ease-out'
        }}>
          {/* User Info Section */}
          <div style={{
            padding: '16px',
            borderBottom: '1px solid #e0e0e0',
            backgroundColor: '#f9fafb'
          }}>
            <div style={{
              fontSize: '15px',
              fontWeight: 600,
              color: '#1a1a1a',
              marginBottom: '4px'
            }}>
              {userName}
            </div>
            <div style={{
              fontSize: '13px',
              color: '#666666',
              marginBottom: '8px'
            }}>
              {userEmail}
            </div>
            {isStaff && (
              <div style={{
                display: 'inline-block',
                padding: '2px 8px',
                borderRadius: '4px',
                backgroundColor: '#000033',
                color: 'white',
                fontSize: '11px',
                fontWeight: 600,
                textTransform: 'uppercase'
              }}>
                {userRole[0]}
              </div>
            )}
          </div>

          {/* Menu Items */}
          <div style={{ padding: '8px 0' }}>
            {onProfileClick && (
              <button
                onClick={() => {
                  setIsOpen(false);
                  onProfileClick();
                }}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: '#1a1a1a',
                  textAlign: 'left',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <User size={18} color="#666666" />
                <span>My Profile</span>
              </button>
            )}

            {onPreferencesClick && (
              <button
                onClick={() => {
                  setIsOpen(false);
                  onPreferencesClick();
                }}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: '#1a1a1a',
                  textAlign: 'left',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <Settings size={18} color="#666666" />
                <span>Preferences</span>
              </button>
            )}

            {/* Divider */}
            <div style={{
              height: '1px',
              backgroundColor: '#e0e0e0',
              margin: '8px 0'
            }} />

            {/* Sign Out Button */}
            <button
              onClick={() => {
                setIsOpen(false);
                onSignOut();
              }}
              style={{
                width: '100%',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                color: '#dc2626',
                textAlign: 'left',
                transition: 'background-color 0.2s',
                fontWeight: 500
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fee'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <LogOut size={18} color="#dc2626" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}

      {/* CSS Animation */}
      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default UserProfileDropdown;
