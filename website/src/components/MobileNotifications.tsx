import React, { useState, useEffect } from 'react';
import { X, Bell } from 'lucide-react';
import { getAuth } from 'firebase/auth';
import { getCurrentEditor } from '../services/authService';

interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  type: 'breaking' | 'update' | 'personal';
  link?: string;
}

interface MobileNotificationsProps {
  isOpen: boolean;
  onClose: () => void;
  notificationCount?: number;
  isAuthenticated?: boolean;
  userRole?: string[] | null;
}

const MobileNotifications: React.FC<MobileNotificationsProps> = ({
  isOpen,
  onClose,
  notificationCount = 0,
  isAuthenticated = false,
  userRole = null,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [authState, setAuthState] = useState<boolean>(false);

  // Detect auth state
  useEffect(() => {
    const checkAuth = () => {
      try {
        const auth = getAuth();
        const currentUser = auth.currentUser;
        const editor = getCurrentEditor();
        setAuthState(!!(currentUser || editor || isAuthenticated));
      } catch (e) {
        setAuthState(isAuthenticated || false);
      }
    };
    checkAuth();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!authState) {
      setNotifications([]);
      return;
    }

    // TODO: Fetch real notifications from backend
    // For now, use mock data for logged-in users
    const mockNotifications: Notification[] = [
      {
        id: '1',
        title: 'Supreme Court clears way for California voting map that bolsters Democrats',
        message: 'Breaking News',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // Yesterday
        read: false,
        type: 'breaking',
        link: '#news',
      },
      {
        id: '2',
        title: 'Border czar Tom Homan says 700 ICE and CBP officers are leaving Minneapolis',
        message: 'Breaking News',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // Yesterday
        read: false,
        type: 'breaking',
        link: '#news',
      },
    ];
    setNotifications(mockNotifications);
  }, [authState]);

  const handleNotificationClick = (notification: Notification) => {
    if (notification.link) {
      window.location.hash = notification.link;
      onClose();
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="mobile-notifications-backdrop"
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.3)',
          zIndex: 1998,
          animation: 'fadeIn 0.2s ease',
        }}
      />

      {/* Notifications Panel - Slide Down */}
      <div
        className="mobile-notifications-panel"
        style={{
          position: 'fixed',
          top: isOpen ? '0' : '-100%',
          left: 0,
          right: 0,
          width: '100%',
          maxHeight: '70vh',
          background: '#ffffff',
          zIndex: 1999,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          transition: 'top 0.3s ease',
          overflowY: 'auto',
          paddingTop: 'env(safe-area-inset-top)',
          display: 'flex',
          flexDirection: 'column',
          borderBottomLeftRadius: '12px',
          borderBottomRightRadius: '12px',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '16px',
          borderBottom: '1px solid #e0e0e0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          background: '#ffffff',
          zIndex: 1,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#000', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              News Alerts
            </h2>
            {authState && notificationCount > 0 && (
              <span style={{
                background: 'var(--breaking-news)',
                color: 'white',
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '12px',
                minWidth: '20px',
                textAlign: 'center',
              }}>
                {notificationCount}
              </span>
            )}
          </div>
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
            aria-label="Close notifications"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content - Different for logged-in vs guest */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {!authState ? (
            // Guest User - Subscribe CTA
            <div style={{
              padding: '32px 24px',
              textAlign: 'center',
            }}>
              <p style={{
                fontSize: '1rem',
                color: 'var(--text-color)',
                marginBottom: '20px',
                lineHeight: 1.5
              }}>
                Get breaking news alerts and newsletters.
              </p>
              <button
                onClick={() => {
                  window.location.hash = 'join';
                  onClose();
                }}
                style={{
                  padding: '12px 24px',
                  background: 'var(--primary-color)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.9375rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'opacity 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '0.9';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '1';
                }}
              >
                Subscribe
              </button>
            </div>
          ) : notifications.length === 0 ? (
            // Logged-in but no notifications
            <div style={{
              padding: '48px 24px',
              textAlign: 'center',
              color: 'var(--light-text)',
            }}>
              <Bell size={48} color="#e0e0e0" style={{ marginBottom: '16px', opacity: 0.5 }} />
              <div style={{ fontSize: '1rem', marginBottom: '8px', fontWeight: 500 }}>
                No alerts
              </div>
              <div style={{ fontSize: '0.875rem' }}>
                You're all caught up!
              </div>
            </div>
          ) : (
            // Logged-in with notifications - Clean list layout
            <div style={{ padding: '0' }}>
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => {
                    handleNotificationClick(notification);
                    markAsRead(notification.id);
                  }}
                  style={{
                    width: '100%',
                    padding: '16px',
                    background: '#ffffff',
                    border: 'none',
                    borderBottom: '1px solid #e0e0e0',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f9fafb';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#ffffff';
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                  }}>
                    {notification.type === 'breaking' && (
                      <div style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: 'var(--breaking-news)',
                        flexShrink: 0,
                        marginTop: '6px',
                      }} />
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        color: 'var(--text-color)',
                        lineHeight: 1.4,
                        marginBottom: '4px',
                      }}>
                        {notification.title}
                      </div>
                      <div style={{
                        fontSize: '0.75rem',
                        color: 'var(--light-text)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}>
                        <span>{formatTimestamp(notification.timestamp)}</span>
                        {notification.type === 'breaking' && (
                          <>
                            <span>•</span>
                            <span style={{ color: 'var(--breaking-news)', fontWeight: 600 }}>
                              Breaking News
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </>
  );
};

const formatTimestamp = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export default MobileNotifications;
