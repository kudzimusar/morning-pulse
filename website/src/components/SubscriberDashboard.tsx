import React, { useState, useEffect } from 'react';
import { getAuth, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { 
  getCurrentSubscriber, 
  updateSubscriberProfile, 
  cancelSubscription,
  renewSubscription,
  processPayment,
  Subscriber 
} from '../services/subscriptionService';

const SubscriberDashboard: React.FC = () => {
  const [subscriber, setSubscriber] = useState<Subscriber | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'profile' | 'billing'>('overview');
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    whatsapp: '',
  });
  const [cancelling, setCancelling] = useState(false);
  const [renewing, setRenewing] = useState(false);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        try {
          const subscriberData = await getCurrentSubscriber();
          if (subscriberData && subscriberData.status === 'active') {
            setSubscriber(subscriberData);
            setProfileData({
              whatsapp: subscriberData.whatsapp || '',
            });
          } else {
            window.location.hash = 'subscriber/login';
          }
        } catch (error) {
          console.error('Error loading subscriber data:', error);
        }
      } else {
        window.location.hash = 'subscriber/login';
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      const auth = getAuth();
      await signOut(auth);
      window.location.hash = 'subscriber/login';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleSaveProfile = async () => {
    if (!subscriber) return;
    
    try {
      await updateSubscriberProfile(subscriber.uid, {
        whatsapp: profileData.whatsapp,
      });
      
      const updatedSubscriber = await getCurrentSubscriber();
      if (updatedSubscriber) {
        setSubscriber(updatedSubscriber);
      }
      
      setEditingProfile(false);
      alert('Profile updated successfully!');
    } catch (error: any) {
      alert(`Failed to update profile: ${error.message}`);
    }
  };

  const handleCancelSubscription = async () => {
    if (!subscriber) return;
    
    if (!confirm('Are you sure you want to cancel your subscription? You will lose access to premium features.')) {
      return;
    }

    setCancelling(true);
    try {
      await cancelSubscription(subscriber.uid);
      alert('Subscription cancelled. You can renew anytime.');
      const updatedSubscriber = await getCurrentSubscriber();
      if (updatedSubscriber) {
        setSubscriber(updatedSubscriber);
      }
    } catch (error: any) {
      alert(`Failed to cancel subscription: ${error.message}`);
    } finally {
      setCancelling(false);
    }
  };

  const handleRenewSubscription = async () => {
    if (!subscriber) return;
    
    setRenewing(true);
    try {
      const tierPrices: { [key: string]: number } = {
        'micro-pulse': 0.50,
        'premium': 5.00,
        'enterprise': 15.00,
      };
      const amount = tierPrices[subscriber.subscriptionTier] || 0.50;

      const paymentResult = await processPayment(amount, 'USD', 'mock_payment_method');
      
      if (!paymentResult.success || !paymentResult.paymentId) {
        throw new Error(paymentResult.error || 'Payment processing failed');
      }

      await renewSubscription(subscriber.uid, paymentResult.paymentId);
      alert('Subscription renewed successfully!');
      
      const updatedSubscriber = await getCurrentSubscriber();
      if (updatedSubscriber) {
        setSubscriber(updatedSubscriber);
      }
    } catch (error: any) {
      alert(`Failed to renew subscription: ${error.message}`);
    } finally {
      setRenewing(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fafafa'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '16px' }}>⏳</div>
          <p>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!subscriber || subscriber.status !== 'active') {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fafafa'
      }}>
        <div style={{
          maxWidth: '500px',
          backgroundColor: 'white',
          padding: '48px',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          textAlign: 'center'
        }}>
          <h2>Access Denied</h2>
          <p>Your subscription is not active.</p>
          <button onClick={handleLogout} style={{
            marginTop: '16px',
            padding: '10px 20px',
            backgroundColor: '#000',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}>
            Logout
          </button>
        </div>
      </div>
    );
  }

  const isExpiringSoon = subscriber.endDate.getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000; // 7 days
  const isExpired = subscriber.endDate < new Date();

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#fafafa'
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: '#000',
        color: 'white',
        padding: '20px 0',
        marginBottom: '24px'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Subscriber Dashboard</h1>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <span style={{ fontSize: '0.875rem' }}>{subscriber.email}</span>
            <button
              onClick={handleLogout}
              style={{
                padding: '8px 16px',
                backgroundColor: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.875rem'
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 24px'
      }}>
        {/* Subscription Status Alert */}
        {(isExpiringSoon || isExpired) && (
          <div style={{
            backgroundColor: isExpired ? '#fee2e2' : '#fef3c7',
            border: `1px solid ${isExpired ? '#fecaca' : '#fde68a'}`,
            padding: '16px',
            borderRadius: '6px',
            marginBottom: '24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <strong style={{ color: isExpired ? '#991b1b' : '#92400e' }}>
                {isExpired ? 'Subscription Expired' : 'Subscription Expiring Soon'}
              </strong>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.875rem', color: '#6b7280' }}>
                {isExpired 
                  ? 'Your subscription expired on ' + subscriber.endDate.toLocaleDateString()
                  : 'Your subscription expires on ' + subscriber.endDate.toLocaleDateString()
                }
              </p>
            </div>
            <button
              onClick={handleRenewSubscription}
              disabled={renewing}
              style={{
                padding: '8px 16px',
                backgroundColor: '#000',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: renewing ? 'not-allowed' : 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}
            >
              {renewing ? 'Renewing...' : 'Renew Now'}
            </button>
          </div>
        )}

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '24px',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <button
            onClick={() => setActiveTab('overview')}
            style={{
              padding: '12px 24px',
              border: 'none',
              backgroundColor: 'transparent',
              borderBottom: activeTab === 'overview' ? '2px solid #000' : '2px solid transparent',
              cursor: 'pointer',
              fontWeight: activeTab === 'overview' ? '600' : '400',
              color: activeTab === 'overview' ? '#000' : '#6b7280'
            }}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('billing')}
            style={{
              padding: '12px 24px',
              border: 'none',
              backgroundColor: 'transparent',
              borderBottom: activeTab === 'billing' ? '2px solid #000' : '2px solid transparent',
              cursor: 'pointer',
              fontWeight: activeTab === 'billing' ? '600' : '400',
              color: activeTab === 'billing' ? '#000' : '#6b7280'
            }}
          >
            Billing
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            style={{
              padding: '12px 24px',
              border: 'none',
              backgroundColor: 'transparent',
              borderBottom: activeTab === 'profile' ? '2px solid #000' : '2px solid transparent',
              cursor: 'pointer',
              fontWeight: activeTab === 'profile' ? '600' : '400',
              color: activeTab === 'profile' ? '#000' : '#6b7280'
            }}
          >
            Profile
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div style={{
            backgroundColor: 'white',
            padding: '32px',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            <h2 style={{ marginTop: 0, marginBottom: '24px' }}>Subscription Overview</h2>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '16px',
              marginBottom: '32px'
            }}>
              <div style={{
                padding: '20px',
                backgroundColor: '#f9fafb',
                borderRadius: '6px',
                border: '1px solid #e5e7eb'
              }}>
                <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '4px' }}>Plan</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', textTransform: 'capitalize' }}>
                  {subscriber.subscriptionTier.replace('-', ' ')}
                </div>
              </div>
              
              <div style={{
                padding: '20px',
                backgroundColor: '#f0fdf4',
                borderRadius: '6px',
                border: '1px solid #bbf7d0'
              }}>
                <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '4px' }}>Status</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#16a34a' }}>
                  Active
                </div>
              </div>
              
              <div style={{
                padding: '20px',
                backgroundColor: '#f9fafb',
                borderRadius: '6px',
                border: '1px solid #e5e7eb'
              }}>
                <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '4px' }}>Renews On</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                  {subscriber.endDate.toLocaleDateString()}
                </div>
              </div>
            </div>

            <div style={{
              backgroundColor: '#f9fafb',
              padding: '20px',
              borderRadius: '6px',
              border: '1px solid #e5e7eb'
            }}>
              <h3 style={{ marginTop: 0, marginBottom: '12px' }}>Premium Benefits</h3>
              <ul style={{ margin: 0, paddingLeft: '20px', lineHeight: '1.8' }}>
                <li>✓ Ad-free browsing experience</li>
                <li>✓ Access to full News Archive</li>
                <li>✓ Daily WhatsApp Morning Digest</li>
                <li>✓ Priority support</li>
                <li>✓ Early access to new features</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'billing' && (
          <div style={{
            backgroundColor: 'white',
            padding: '32px',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            <h2 style={{ marginTop: 0, marginBottom: '24px' }}>Billing Information</h2>
            
            <div style={{
              padding: '20px',
              backgroundColor: '#f9fafb',
              borderRadius: '6px',
              border: '1px solid #e5e7eb',
              marginBottom: '24px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ color: '#6b7280' }}>Current Plan:</span>
                <strong style={{ textTransform: 'capitalize' }}>
                  {subscriber.subscriptionTier.replace('-', ' ')}
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ color: '#6b7280' }}>Payment Status:</span>
                <strong style={{ color: subscriber.paymentStatus === 'paid' ? '#16a34a' : '#d97706' }}>
                  {subscriber.paymentStatus.charAt(0).toUpperCase() + subscriber.paymentStatus.slice(1)}
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ color: '#6b7280' }}>Start Date:</span>
                <strong>{subscriber.startDate.toLocaleDateString()}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#6b7280' }}>End Date:</span>
                <strong>{subscriber.endDate.toLocaleDateString()}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={handleRenewSubscription}
                disabled={renewing}
                style={{
                  padding: '12px 24px',
                  backgroundColor: renewing ? '#9ca3af' : '#000',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: renewing ? 'not-allowed' : 'pointer',
                  fontWeight: '500'
                }}
              >
                {renewing ? 'Renewing...' : 'Renew Subscription'}
              </button>
              <button
                onClick={handleCancelSubscription}
                disabled={cancelling}
                style={{
                  padding: '12px 24px',
                  backgroundColor: 'transparent',
                  color: '#ef4444',
                  border: '1px solid #ef4444',
                  borderRadius: '6px',
                  cursor: cancelling ? 'not-allowed' : 'pointer',
                  fontWeight: '500'
                }}
              >
                {cancelling ? 'Cancelling...' : 'Cancel Subscription'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div style={{
            backgroundColor: 'white',
            padding: '32px',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ margin: 0 }}>Profile</h2>
              {!editingProfile && (
                <button
                  onClick={() => setEditingProfile(true)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#000',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.875rem'
                  }}
                >
                  Edit Profile
                </button>
              )}
            </div>

            {editingProfile ? (
              <div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={subscriber.email}
                    disabled
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '1rem',
                      boxSizing: 'border-box',
                      backgroundColor: '#f3f4f6',
                      color: '#6b7280'
                    }}
                  />
                  <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '4px' }}>
                    Email cannot be changed
                  </p>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                    WhatsApp Number
                  </label>
                  <input
                    type="tel"
                    value={profileData.whatsapp}
                    onChange={(e) => setProfileData({ ...profileData, whatsapp: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '1rem',
                      boxSizing: 'border-box'
                    }}
                    placeholder="+263 XXX XXX XXX"
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={handleSaveProfile}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#000',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: '500'
                    }}
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={() => {
                      setEditingProfile(false);
                      setProfileData({
                        whatsapp: subscriber.whatsapp || '',
                      });
                    }}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: 'transparent',
                      color: '#6b7280',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '4px' }}>Email</div>
                  <div style={{ fontSize: '1rem' }}>{subscriber.email}</div>
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '4px' }}>WhatsApp Number</div>
                  <div style={{ fontSize: '1rem' }}>{subscriber.whatsapp || 'Not provided'}</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriberDashboard;
