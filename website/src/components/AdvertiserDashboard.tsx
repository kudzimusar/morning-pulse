import React, { useState, useEffect } from 'react';
import { getAuth, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { 
  getCurrentAdvertiser, 
  getAdsByAdvertiser,
  getAdvertiserInvoices,
  Advertiser,
  Ad,
  Invoice
} from '../services/advertiserService';

const AdvertiserDashboard: React.FC = () => {
  const [advertiser, setAdvertiser] = useState<Advertiser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [ads, setAds] = useState<Ad[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'ads' | 'profile' | 'billing'>('overview');

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        try {
          const advertiserData = await getCurrentAdvertiser();
          if (advertiserData && advertiserData.status === 'approved') {
            setAdvertiser(advertiserData);
            await loadAds(currentUser.uid);
            await loadInvoices(currentUser.uid);
          } else {
            window.location.hash = 'advertiser/login';
          }
        } catch (error) {
          console.error('Error loading advertiser data:', error);
        }
      } else {
        window.location.hash = 'advertiser/login';
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loadAds = async (advertiserId: string) => {
    try {
      const adsList = await getAdsByAdvertiser(advertiserId);
      setAds(adsList);
    } catch (error) {
      console.error('Error loading ads:', error);
    }
  };

  const loadInvoices = async (advertiserId: string) => {
    try {
      const invoicesList = await getAdvertiserInvoices(advertiserId);
      setInvoices(invoicesList);
    } catch (error) {
      console.error('Error loading invoices:', error);
    }
  };

  const handleLogout = async () => {
    try {
      const auth = getAuth();
      await signOut(auth);
      window.location.hash = 'advertiser/login';
    } catch (error) {
      console.error('Logout error:', error);
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

  if (!advertiser || advertiser.status !== 'approved') {
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
          <p>Your advertiser account is not yet approved.</p>
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

  const activeAds = ads.filter(a => a.status === 'active').length;
  const pendingAds = ads.filter(a => a.status === 'pending').length;
  const totalViews = ads.reduce((sum, ad) => sum + ad.views, 0);
  const totalClicks = ads.reduce((sum, ad) => sum + ad.clicks, 0);

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
          <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Advertiser Dashboard</h1>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <span style={{ fontSize: '0.875rem' }}>{advertiser.companyName}</span>
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
            onClick={() => setActiveTab('ads')}
            style={{
              padding: '12px 24px',
              border: 'none',
              backgroundColor: 'transparent',
              borderBottom: activeTab === 'ads' ? '2px solid #000' : '2px solid transparent',
              cursor: 'pointer',
              fontWeight: activeTab === 'ads' ? '600' : '400',
              color: activeTab === 'ads' ? '#000' : '#6b7280'
            }}
          >
            My Ads ({ads.length})
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
            Billing ({invoices.filter(inv => inv.status !== 'paid').length})
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
            <h2 style={{ marginTop: 0, marginBottom: '24px' }}>Overview</h2>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
              marginBottom: '32px'
            }}>
              <div style={{
                padding: '20px',
                backgroundColor: '#f9fafb',
                borderRadius: '6px',
                border: '1px solid #e5e7eb'
              }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '8px' }}>
                  {ads.length}
                </div>
                <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>Total Ads</div>
              </div>
              
              <div style={{
                padding: '20px',
                backgroundColor: '#f0fdf4',
                borderRadius: '6px',
                border: '1px solid #bbf7d0'
              }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '8px', color: '#16a34a' }}>
                  {activeAds}
                </div>
                <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>Active</div>
              </div>
              
              <div style={{
                padding: '20px',
                backgroundColor: '#fef3c7',
                borderRadius: '6px',
                border: '1px solid #fde68a'
              }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '8px', color: '#d97706' }}>
                  {pendingAds}
                </div>
                <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>Pending</div>
              </div>

              <div style={{
                padding: '20px',
                backgroundColor: '#f9fafb',
                borderRadius: '6px',
                border: '1px solid #e5e7eb'
              }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '8px' }}>
                  {totalViews}
                </div>
                <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>Total Views</div>
              </div>

              <div style={{
                padding: '20px',
                backgroundColor: '#f9fafb',
                borderRadius: '6px',
                border: '1px solid #e5e7eb'
              }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '8px' }}>
                  {totalClicks}
                </div>
                <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>Total Clicks</div>
              </div>
            </div>

            <div>
              <h3 style={{ marginBottom: '16px' }}>Quick Actions</h3>
              <a
                href="#advertiser/submit-ad"
                style={{
                  display: 'inline-block',
                  padding: '12px 24px',
                  backgroundColor: '#000',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '6px',
                  fontWeight: '500'
                }}
              >
                Submit New Ad
              </a>
            </div>
          </div>
        )}

        {activeTab === 'ads' && (
          <div style={{
            backgroundColor: 'white',
            padding: '32px',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            <h2 style={{ marginTop: 0, marginBottom: '24px' }}>My Ads</h2>
            
            {ads.length === 0 ? (
              <p style={{ color: '#6b7280' }}>You haven't submitted any ads yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {ads.map((ad) => (
                  <div
                    key={ad.id}
                    style={{
                      padding: '16px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <h3 style={{ margin: '0 0 8px 0', fontSize: '1rem' }}>{ad.title}</h3>
                      <div style={{ display: 'flex', gap: '16px', fontSize: '0.875rem', color: '#6b7280' }}>
                        <span>Placement: {ad.placement}</span>
                        <span>Views: {ad.views}</span>
                        <span>Clicks: {ad.clicks}</span>
                        <span>Start: {ad.startDate.toLocaleDateString()}</span>
                        <span>End: {ad.endDate.toLocaleDateString()}</span>
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
                            ad.status === 'active'
                              ? '#d1fae5'
                              : ad.status === 'pending'
                              ? '#fef3c7'
                              : ad.status === 'approved'
                              ? '#dbeafe'
                              : '#fee2e2',
                          color:
                            ad.status === 'active'
                              ? '#065f46'
                              : ad.status === 'pending'
                              ? '#92400e'
                              : ad.status === 'approved'
                              ? '#1e40af'
                              : '#991b1b'
                        }}
                      >
                        {ad.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'profile' && (
          <div style={{
            backgroundColor: 'white',
            padding: '32px',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            <h2 style={{ marginTop: 0, marginBottom: '24px' }}>Company Profile</h2>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '4px' }}>Company Name</div>
              <div style={{ fontSize: '1rem' }}>{advertiser.companyName}</div>
            </div>
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '4px' }}>Email</div>
              <div style={{ fontSize: '1rem' }}>{advertiser.contactEmail}</div>
            </div>
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '4px' }}>Phone</div>
              <div style={{ fontSize: '1rem' }}>{advertiser.contactPhone}</div>
            </div>
            {advertiser.website && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '4px' }}>Website</div>
                <div style={{ fontSize: '1rem' }}>
                  <a href={advertiser.website} target="_blank" rel="noopener noreferrer" style={{ color: '#000' }}>
                    {advertiser.website}
                  </a>
                </div>
              </div>
            )}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '4px' }}>Status</div>
              <div style={{ fontSize: '1rem' }}>
                <span
                  style={{
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    backgroundColor: '#d1fae5',
                    color: '#065f46'
                  }}
                >
                  Approved
                </span>
              </div>
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
            <h2 style={{ marginTop: 0, marginBottom: '24px' }}>Invoices & Billing</h2>
            
            {invoices.length === 0 ? (
              <p style={{ color: '#6b7280' }}>No invoices found.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {invoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    style={{
                      padding: '16px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <h3 style={{ margin: '0 0 8px 0', fontSize: '1rem' }}>
                        Invoice {invoice.invoiceNumber || invoice.id.substring(0, 8)}
                      </h3>
                      <div style={{ display: 'flex', gap: '16px', fontSize: '0.875rem', color: '#6b7280' }}>
                        <span>Amount: ${invoice.amount.toLocaleString()} {invoice.currency}</span>
                        <span>Due: {invoice.dueDate.toLocaleDateString()}</span>
                        <span>Created: {invoice.createdAt.toLocaleDateString()}</span>
                      </div>
                      {invoice.lineItems && invoice.lineItems.length > 0 && (
                        <div style={{ marginTop: '8px', fontSize: '0.875rem', color: '#6b7280' }}>
                          {invoice.lineItems.map((item, idx) => (
                            <div key={idx}>{item.description}</div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <span
                        style={{
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          backgroundColor:
                            invoice.status === 'paid'
                              ? '#d1fae5'
                              : invoice.status === 'overdue'
                              ? '#fee2e2'
                              : invoice.status === 'sent'
                              ? '#dbeafe'
                              : '#f3f4f6',
                          color:
                            invoice.status === 'paid'
                              ? '#065f46'
                              : invoice.status === 'overdue'
                              ? '#991b1b'
                              : invoice.status === 'sent'
                              ? '#1e40af'
                              : '#374151'
                        }}
                      >
                        {invoice.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdvertiserDashboard;
