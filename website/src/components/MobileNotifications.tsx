import React, { useState, useEffect } from 'react';
import { X, Bell } from 'lucide-react';

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
}

const MobileNotifications: React.FC<MobileNotificationsProps> = ({
  isOpen,
  onClose,
  notificationCount = 0,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    // TODO: Fetch real notifications from backend
    // For now, use mock data
    const mockNotifications: Notification[] = [
      {
        id: '1',
        title: 'Breaking News',
        message: 'New developments in the latest story',
        timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
        read: false,
        type: 'breaking',
        link: '#news',
      },
      {
        id: '2',
        title: 'Your Opinion Published',
        message: 'Your opinion piece has been published and is now live.',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
        read: false,
        type: 'personal',
        link: '#opinion',
      },
    ];
    setNotifications(mockNotifications);
  }, []);

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
          background: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1998,
          animation: 'fadeIn 0.2s ease',
        }}
      />

      {/* Notifications Panel */}
      <div
        className="mobile-notifications-panel"
        style={{
          position: 'fixed',
          top: 0,
          right: isOpen ? 0 : '-100%',
          width: '85%',
          maxWidth: '360px',
          height: '100vh',
          background: '#ffffff',
          zIndex: 1999,
          boxShadow: '-2px 0 8px rgba(0, 0, 0, 0.15)',
          transition: 'right 0.3s ease',
          overflowY: 'auto',
          paddingTop: 'env(safe-area-inset-top)',
          display: 'flex',
          flexDirection: 'column',
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
            <Bell size={24} color="var(--primary-color)" />
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#000' }}>
              Notifications
            </h2>
            {notificationCount > 0 && (
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
            <X size={24} />
          </button>
        </div>

        {/* Notifications List */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {notifications.length === 0 ? (
            <div style={{
              padding: '48px 24px',
              textAlign: 'center',
              color: 'var(--light-text)',
            }}>
              <Bell size={48} color="#e0e0e0" style={{ marginBottom: '16px', opacity: 0.5 }} />
              <div style={{ fontSize: '1rem', marginBottom: '8px', fontWeight: 500 }}>
                No notifications
              </div>
              <div style={{ fontSize: '0.875rem' }}>
                You're all caught up!
              </div>
            </div>
          ) : (
            <div style={{ padding: '8px 0' }}>
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
                    background: notification.read ? '#ffffff' : '#f9fafb',
                    border: 'none',
                    borderBottom: '1px solid #e0e0e0',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f3f4f6';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = notification.read ? '#ffffff' : '#f9fafb';
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: '12px',
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        color: 'var(--text-color)',
                        marginBottom: '4px',
                      }}>
                        {notification.title}
                      </div>
                      <div style={{
                        fontSize: '0.8125rem',
                        color: 'var(--light-text)',
                        lineHeight: 1.5,
                      }}>
                        {notification.message}
                      </div>
                    </div>
                    {!notification.read && (
                      <div style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: 'var(--primary-color)',
                        flexShrink: 0,
                        marginTop: '4px',
                      }} />
                    )}
                  </div>
                  <div style={{
                    fontSize: '0.75rem',
                    color: 'var(--lighter-text)',
                    marginTop: '4px',
                  }}>
                    {formatTimestamp(notification.timestamp)}
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
