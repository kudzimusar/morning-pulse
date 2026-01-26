import React, { useState, useEffect } from 'react';
import { subscribeToSubscribers, Subscriber } from '../../services/subscriptionService';
import { requireSuperAdmin } from '../../services/authService';

interface SubscriberManagementTabProps {
  userRoles: string[] | null;
}

const SubscriberManagementTab: React.FC<SubscriberManagementTabProps> = ({ userRoles }) => {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'cancelled' | 'expired' | 'pending'>('all');

  useEffect(() => {
    // ✅ FIX: Wait for auth handshake to complete before fetching
    if (!userRoles || userRoles.length === 0) {
      return;
    }
    if (!requireSuperAdmin(userRoles)) {
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToSubscribers(
      (data) => {
        setSubscribers(data || []);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error loading subscribers:', err);
        setError(err.message || 'Failed to load subscribers');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userRoles]);

  const filteredSubscribers = subscribers.filter(sub => {
    if (filter === 'all') return true;
    return sub.status === filter;
  });

  if (!requireSuperAdmin(userRoles)) {
    return (
      <div style={{ padding: '32px', textAlign: 'center' }}>
        <h2>Access Denied</h2>
        <p>You do not have permission to manage subscribers. Super Admin access required.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ padding: '32px', textAlign: 'center' }}>
        <p>Loading subscribers...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', color: '#ef4444' }}>
        <h2>Error</h2>
        <p>{error}</p>
        <p style={{ fontSize: '12px', color: '#666' }}>
          Check Firestore permissions for path: artifacts/morning-pulse-app/public/data/subscribers
        </p>
      </div>
    );
  }

  const stats = {
    total: subscribers.length,
    active: subscribers.filter(s => s.status === 'active').length,
    cancelled: subscribers.filter(s => s.status === 'cancelled').length,
    expired: subscribers.filter(s => s.status === 'expired').length,
    pending: subscribers.filter(s => s.status === 'pending_payment').length,
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ margin: '0 0 16px 0', fontSize: '1.5rem' }}>Subscriber Management</h2>
        
        {/* Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}>
          <div style={{
            padding: '16px',
            backgroundColor: '#f9fafb',
            borderRadius: '6px',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '4px' }}>Total</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.total}</div>
          </div>
          <div style={{
            padding: '16px',
            backgroundColor: '#f0fdf4',
            borderRadius: '6px',
            border: '1px solid #bbf7d0'
          }}>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '4px' }}>Active</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#16a34a' }}>{stats.active}</div>
          </div>
          <div style={{
            padding: '16px',
            backgroundColor: '#fee2e2',
            borderRadius: '6px',
            border: '1px solid #fecaca'
          }}>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '4px' }}>Cancelled</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#dc2626' }}>{stats.cancelled}</div>
          </div>
          <div style={{
            padding: '16px',
            backgroundColor: '#fef3c7',
            borderRadius: '6px',
            border: '1px solid #fde68a'
          }}>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '4px' }}>Expired</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#d97706' }}>{stats.expired}</div>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #e5e7eb' }}>
          {(['all', 'active', 'cancelled', 'expired', 'pending'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '12px 24px',
                border: 'none',
                backgroundColor: 'transparent',
                borderBottom: filter === f ? '2px solid #000' : '2px solid transparent',
                cursor: 'pointer',
                fontWeight: filter === f ? '600' : '400',
                color: filter === f ? '#000' : '#6b7280',
                textTransform: 'capitalize'
              }}
            >
              {f.replace('_', ' ')} ({f === 'all' ? stats.total : stats[f]})
            </button>
          ))}
        </div>
      </div>

      {/* Subscribers List */}
      {filteredSubscribers.length === 0 ? (
        <div style={{
          padding: '48px',
          textAlign: 'center',
          backgroundColor: '#f9fafb',
          borderRadius: '8px',
          border: '1px solid #e5e7eb'
        }}>
          <p style={{ color: '#6b7280', margin: 0 }}>No subscribers found.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredSubscribers.map((subscriber) => (
            <div
              key={subscriber.uid}
              style={{
                padding: '20px',
                backgroundColor: 'white',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '1.125rem' }}>{subscriber.email}</h3>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '8px' }}>
                    {subscriber.whatsapp && `WhatsApp: ${subscriber.whatsapp}`}
                  </div>
                  <div style={{ display: 'flex', gap: '16px', fontSize: '0.875rem', color: '#6b7280' }}>
                    <span>Plan: <strong style={{ textTransform: 'capitalize' }}>{subscriber.subscriptionTier?.replace('-', ' ')}</strong></span>
                    <span>Payment: <strong>{subscriber.paymentStatus}</strong></span>
                    <span>Start: {subscriber.startDate?.toLocaleDateString()}</span>
                    <span>End: {subscriber.endDate?.toLocaleDateString()}</span>
                  </div>
                </div>
                <div>
                  <span
                    style={{
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      backgroundColor:
                        subscriber.status === 'active'
                          ? '#d1fae5'
                          : subscriber.status === 'cancelled'
                          ? '#fee2e2'
                          : subscriber.status === 'expired'
                          ? '#fef3c7'
                          : '#f3f4f6',
                      color:
                        subscriber.status === 'active'
                          ? '#065f46'
                          : subscriber.status === 'cancelled'
                          ? '#991b1b'
                          : subscriber.status === 'expired'
                          ? '#92400e'
                          : '#374151',
                      textTransform: 'capitalize'
                    }}
                  >
                    {subscriber.status?.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SubscriberManagementTab;
