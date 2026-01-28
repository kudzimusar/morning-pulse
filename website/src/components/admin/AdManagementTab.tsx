import React, { useState, useEffect } from 'react';
import { 
  getPendingAdvertisers, 
  getApprovedAdvertisers, 
  approveAdvertiser, 
  rejectAdvertiser,
  getPendingAds,
  getActiveAds,
  approveAd,
  rejectAd,
  activateAd,
  subscribeToAds,
  Advertiser,
  Ad
} from '../../services/advertiserService';
import { requireSuperAdmin } from '../../services/authService';
import { generateInvoiceForAd } from '../../services/billingService';
import CampaignsTab from './CampaignsTab';
import PlacementsTab from './PlacementsTab';
import AdAnalyticsTab from './AdAnalyticsTab';
import AdBillingTab from './AdBillingTab';

interface AdManagementTabProps {
  userRoles: string[] | null;
}

type MainTab = 'advertisers' | 'creatives' | 'campaigns' | 'placements' | 'analytics' | 'billing';

const AdManagementTab: React.FC<AdManagementTabProps> = ({ userRoles }) => {
  const [pendingAdvertisers, setPendingAdvertisers] = useState<Advertiser[]>([]);
  const [approvedAdvertisers, setApprovedAdvertisers] = useState<Advertiser[]>([]);
  const [pendingAds, setPendingAds] = useState<Ad[]>([]);
  const [activeAds, setActiveAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<MainTab>('advertisers');
  const [advertiserSubTab, setAdvertiserSubTab] = useState<'pending' | 'approved'>('pending');
  const [rejectReason, setRejectReason] = useState<{ [key: string]: string }>({});
  const [showRejectForm, setShowRejectForm] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    if (!requireSuperAdmin(userRoles)) {
      return;
    }
    
    if (activeTab === 'advertisers') {
      loadAdvertisers();
    } else if (activeTab === 'creatives') {
      const unsubscribe = subscribeToAds(
        (ads) => {
          setPendingAds((ads || []).filter(a => a.status === 'pending'));
          setActiveAds((ads || []).filter(a => a.status === 'active' || a.status === 'approved'));
          setLoading(false);
        },
        (err) => {
          // console.error('Error subscribing to ads:', err);
          setLoading(false);
        }
      );
      return () => unsubscribe();
    } else {
      setLoading(false);
    }
  }, [userRoles, activeTab, advertiserSubTab]);

  const loadAdvertisers = async () => {
    try {
      setLoading(true);
      const [pending, approved] = await Promise.all([
        getPendingAdvertisers(),
        getApprovedAdvertisers(),
      ]);
      setPendingAdvertisers(pending || []);
      setApprovedAdvertisers(approved || []);
    } catch (error: any) {
      // console.error('Error loading advertisers:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadData = async () => {
    if (activeTab === 'advertisers') {
      await loadAdvertisers();
    }
  };

  const handleApproveAdvertiser = async (uid: string) => {
    if (!requireSuperAdmin(userRoles)) {
      alert('You do not have permission to approve advertisers.');
      return;
    }

    if (!confirm('Are you sure you want to approve this advertiser?')) {
      return;
    }

    try {
      await approveAdvertiser(uid);
      alert('Advertiser approved successfully!');
      await loadData();
    } catch (error: any) {
      alert(`Failed to approve advertiser: ${error.message}`);
    }
  };

  const handleRejectAdvertiser = async (uid: string) => {
    if (!requireSuperAdmin(userRoles)) {
      alert('You do not have permission to reject advertisers.');
      return;
    }

    const reason = rejectReason[uid]?.trim();
    if (!reason) {
      alert('Please provide a reason for rejection.');
      return;
    }

    if (!confirm('Are you sure you want to reject this advertiser?')) {
      return;
    }

    try {
      await rejectAdvertiser(uid, reason);
      alert('Advertiser rejected.');
      setRejectReason({ ...rejectReason, [uid]: '' });
      setShowRejectForm({ ...showRejectForm, [uid]: false });
      await loadData();
    } catch (error: any) {
      alert(`Failed to reject advertiser: ${error.message}`);
    }
  };

  const handleApproveAd = async (adId: string) => {
    if (!requireSuperAdmin(userRoles)) {
      alert('You do not have permission to approve ads.');
      return;
    }

    if (!confirm('Are you sure you want to approve this ad?')) {
      return;
    }

    try {
      await approveAd(adId);
      
      // Auto-generate invoice if enabled
      const generateInvoice = confirm('Generate invoice for this ad?');
      if (generateInvoice) {
        const amount = parseFloat(prompt('Enter invoice amount (USD):') || '0');
        if (amount > 0) {
          try {
            await generateInvoiceForAd(adId, {
              amount,
              currency: 'USD',
              description: `Advertisement approval - Ad ID: ${adId}`,
            });
            alert('Ad approved and invoice generated successfully!');
          } catch (invoiceError: any) {
            // console.error('Invoice generation failed:', invoiceError);
            alert(`Ad approved, but invoice generation failed: ${invoiceError.message}`);
          }
        } else {
          alert('Ad approved successfully!');
        }
      } else {
        alert('Ad approved successfully!');
      }
      
      await loadData();
    } catch (error: any) {
      alert(`Failed to approve ad: ${error.message}`);
    }
  };

  const handleRejectAd = async (adId: string) => {
    if (!requireSuperAdmin(userRoles)) {
      alert('You do not have permission to reject ads.');
      return;
    }

    if (!confirm('Are you sure you want to reject this ad?')) {
      return;
    }

    try {
      await rejectAd(adId);
      alert('Ad rejected.');
      await loadData();
    } catch (error: any) {
      alert(`Failed to reject ad: ${error.message}`);
    }
  };

  const handleActivateAd = async (adId: string) => {
    if (!requireSuperAdmin(userRoles)) {
      alert('You do not have permission to activate ads.');
      return;
    }

    if (!confirm('Are you sure you want to activate this ad?')) {
      return;
    }

    try {
      await activateAd(adId);
      alert('Ad activated successfully!');
      await loadData();
    } catch (error: any) {
      alert(`Failed to activate ad: ${error.message}`);
    }
  };

  if (!requireSuperAdmin(userRoles)) {
    return (
      <div style={{ padding: '32px', textAlign: 'center' }}>
        <h2>Access Denied</h2>
        <p>You do not have permission to manage ads. Super Admin access required.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ padding: '32px', textAlign: 'center' }}>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ margin: '0 0 16px 0', fontSize: '1.5rem' }}>Ad Operations Console</h2>
        
        {/* Main Tabs */}
        <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid #e5e7eb', marginBottom: '16px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveTab('advertisers')}
            style={{
              padding: '12px 20px',
              border: 'none',
              backgroundColor: 'transparent',
              borderBottom: activeTab === 'advertisers' ? '2px solid #000' : '2px solid transparent',
              cursor: 'pointer',
              fontWeight: activeTab === 'advertisers' ? '600' : '400',
              color: activeTab === 'advertisers' ? '#000' : '#6b7280',
              fontSize: '0.875rem',
              whiteSpace: 'nowrap'
            }}
          >
            Advertisers
          </button>
          <button
            onClick={() => setActiveTab('creatives')}
            style={{
              padding: '12px 20px',
              border: 'none',
              backgroundColor: 'transparent',
              borderBottom: activeTab === 'creatives' ? '2px solid #000' : '2px solid transparent',
              cursor: 'pointer',
              fontWeight: activeTab === 'creatives' ? '600' : '400',
              color: activeTab === 'creatives' ? '#000' : '#6b7280',
              fontSize: '0.875rem',
              whiteSpace: 'nowrap'
            }}
          >
            Creatives ({pendingAds.length} pending, {activeAds.length} active)
          </button>
          <button
            onClick={() => setActiveTab('campaigns')}
            style={{
              padding: '12px 20px',
              border: 'none',
              backgroundColor: 'transparent',
              borderBottom: activeTab === 'campaigns' ? '2px solid #000' : '2px solid transparent',
              cursor: 'pointer',
              fontWeight: activeTab === 'campaigns' ? '600' : '400',
              color: activeTab === 'campaigns' ? '#000' : '#6b7280',
              fontSize: '0.875rem',
              whiteSpace: 'nowrap'
            }}
          >
            Campaigns
          </button>
          <button
            onClick={() => setActiveTab('placements')}
            style={{
              padding: '12px 20px',
              border: 'none',
              backgroundColor: 'transparent',
              borderBottom: activeTab === 'placements' ? '2px solid #000' : '2px solid transparent',
              cursor: 'pointer',
              fontWeight: activeTab === 'placements' ? '600' : '400',
              color: activeTab === 'placements' ? '#000' : '#6b7280',
              fontSize: '0.875rem',
              whiteSpace: 'nowrap'
            }}
          >
            Placements
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            style={{
              padding: '12px 20px',
              border: 'none',
              backgroundColor: 'transparent',
              borderBottom: activeTab === 'analytics' ? '2px solid #000' : '2px solid transparent',
              cursor: 'pointer',
              fontWeight: activeTab === 'analytics' ? '600' : '400',
              color: activeTab === 'analytics' ? '#000' : '#6b7280',
              fontSize: '0.875rem',
              whiteSpace: 'nowrap'
            }}
          >
            Analytics
          </button>
          <button
            onClick={() => setActiveTab('billing')}
            style={{
              padding: '12px 20px',
              border: 'none',
              backgroundColor: 'transparent',
              borderBottom: activeTab === 'billing' ? '2px solid #000' : '2px solid transparent',
              cursor: 'pointer',
              fontWeight: activeTab === 'billing' ? '600' : '400',
              color: activeTab === 'billing' ? '#000' : '#6b7280',
              fontSize: '0.875rem',
              whiteSpace: 'nowrap'
            }}
          >
            Billing
          </button>
        </div>
      </div>

      {/* Advertisers Content */}
      {activeTab === 'advertisers' && (
        <div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
            <button
              onClick={() => setAdvertiserSubTab('pending')}
              style={{
                padding: '6px 12px',
                backgroundColor: advertiserSubTab === 'pending' ? '#f3f4f6' : 'transparent',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: advertiserSubTab === 'pending' ? '600' : '400',
                cursor: 'pointer'
              }}
            >
              Pending Approval ({pendingAdvertisers.length})
            </button>
            <button
              onClick={() => setAdvertiserSubTab('approved')}
              style={{
                padding: '6px 12px',
                backgroundColor: advertiserSubTab === 'approved' ? '#f3f4f6' : 'transparent',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: advertiserSubTab === 'approved' ? '600' : '400',
                cursor: 'pointer'
              }}
            >
              Approved ({approvedAdvertisers.length})
            </button>
          </div>

          {advertiserSubTab === 'pending' && (
            <div>
              {(!pendingAdvertisers || pendingAdvertisers.length === 0) ? (
                <div style={{
                  padding: '48px',
                  textAlign: 'center',
                  backgroundColor: '#f9fafb',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb'
                }}>
                  <p style={{ color: '#6b7280', margin: 0 }}>No pending advertiser registrations.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {pendingAdvertisers.map((advertiser) => (
                    <div
                      key={advertiser.uid}
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
                          <h3 style={{ margin: '0 0 8px 0', fontSize: '1.125rem' }}>{advertiser.companyName}</h3>
                          <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '8px' }}>
                            {advertiser.contactEmail} | {advertiser.contactPhone}
                          </div>
                          {advertiser.website && (
                            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '8px' }}>
                              <a href={advertiser.website} target="_blank" rel="noopener noreferrer" style={{ color: '#000' }}>
                                {advertiser.website}
                              </a>
                            </div>
                          )}
                          <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '8px' }}>
                            Applied: {advertiser.createdAt?.toLocaleDateString()}
                          </div>
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginLeft: '16px' }}>
                          <button
                            onClick={() => handleApproveAdvertiser(advertiser.uid)}
                            style={{
                              padding: '8px 16px',
                              backgroundColor: '#16a34a',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '0.875rem',
                              fontWeight: '500',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            Approve
                          </button>
                          
                          {!showRejectForm[advertiser.uid] ? (
                            <button
                              onClick={() => setShowRejectForm({ ...showRejectForm, [advertiser.uid]: true })}
                              style={{
                                padding: '8px 16px',
                                backgroundColor: '#ef4444',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                                fontWeight: '500',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              Reject
                            </button>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '200px' }}>
                              <textarea
                                value={rejectReason[advertiser.uid] || ''}
                                onChange={(e) => setRejectReason({ ...rejectReason, [advertiser.uid]: e.target.value })}
                                placeholder="Reason for rejection..."
                                rows={3}
                                style={{
                                  padding: '8px',
                                  border: '1px solid #d1d5db',
                                  borderRadius: '6px',
                                  fontSize: '0.875rem',
                                  resize: 'vertical',
                                  fontFamily: 'inherit'
                                }}
                              />
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                  onClick={() => handleRejectAdvertiser(advertiser.uid)}
                                  style={{
                                    flex: 1,
                                    padding: '6px 12px',
                                    backgroundColor: '#ef4444',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '0.75rem'
                                  }}
                                >
                                  Confirm Reject
                                </button>
                                <button
                                  onClick={() => {
                                    setShowRejectForm({ ...showRejectForm, [advertiser.uid]: false });
                                    setRejectReason({ ...rejectReason, [advertiser.uid]: '' });
                                  }}
                                  style={{
                                    flex: 1,
                                    padding: '6px 12px',
                                    backgroundColor: '#6b7280',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '0.75rem'
                                  }}
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {advertiserSubTab === 'approved' && (
            <div>
              {(!approvedAdvertisers || approvedAdvertisers.length === 0) ? (
                <div style={{
                  padding: '48px',
                  textAlign: 'center',
                  backgroundColor: '#f9fafb',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb'
                }}>
                  <p style={{ color: '#6b7280', margin: 0 }}>No approved advertisers yet.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {approvedAdvertisers.map((advertiser) => (
                    <div
                      key={advertiser.uid}
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
                          <h3 style={{ margin: '0 0 8px 0', fontSize: '1.125rem' }}>{advertiser.companyName}</h3>
                          <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '8px' }}>
                            {advertiser.contactEmail} | {advertiser.contactPhone}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '8px' }}>
                            Approved: {advertiser.approvedAt?.toLocaleDateString() || 'N/A'}
                          </div>
                        </div>
                        <div>
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
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Creatives Content */}
      {activeTab === 'creatives' && (
        <div>
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ marginBottom: '16px', fontSize: '1.125rem', fontWeight: '600' }}>Pending Approval ({pendingAds.length})</h3>
            {(!pendingAds || pendingAds.length === 0) ? (
              <p style={{ color: '#6b7280', fontSize: '0.875rem', padding: '16px', backgroundColor: '#f9fafb', borderRadius: '6px' }}>No pending ads.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                {pendingAds.map((ad) => (
                  <div
                    key={ad.id}
                    style={{
                      padding: '16px',
                      backgroundColor: 'white',
                      borderRadius: '6px',
                      border: '1px solid #e5e7eb',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ margin: '0 0 8px 0', fontSize: '1rem' }}>{ad.title}</h4>
                        <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '8px' }}>
                          Placement: <span style={{ color: '#374151', fontWeight: '500' }}>{ad.placement}</span> | Schedule: <span style={{ color: '#374151', fontWeight: '500' }}>{ad.startDate?.toLocaleDateString()} - {ad.endDate?.toLocaleDateString()}</span>
                        </div>
                        {ad.creativeUrl && (
                          <div style={{ marginTop: '12px' }}>
                            <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '4px' }}>Creative Preview:</div>
                            <img 
                              src={ad.creativeUrl} 
                              alt={ad.title}
                              style={{
                                maxWidth: '300px',
                                maxHeight: '150px',
                                objectFit: 'contain',
                                border: '1px solid #e5e7eb',
                                borderRadius: '4px',
                                backgroundColor: '#f9fafb'
                              }}
                            />
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '8px', marginLeft: '16px' }}>
                        <button
                          onClick={() => handleApproveAd(ad.id)}
                          style={{
                            padding: '8px 16px',
                            backgroundColor: '#16a34a',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                            fontWeight: '500'
                          }}
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleRejectAd(ad.id)}
                          style={{
                            padding: '8px 16px',
                            backgroundColor: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                            fontWeight: '500'
                          }}
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h3 style={{ marginBottom: '16px', fontSize: '1.125rem', fontWeight: '600' }}>Active Inventory & Performance ({activeAds.length})</h3>
            {(!activeAds || activeAds.length === 0) ? (
              <p style={{ color: '#6b7280', fontSize: '0.875rem', padding: '16px', backgroundColor: '#f9fafb', borderRadius: '6px' }}>No active ads in inventory.</p>
            ) : (
              <div style={{ 
                backgroundColor: 'white', 
                borderRadius: '8px', 
                border: '1px solid #e5e7eb',
                overflow: 'hidden',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Ad Creative</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Placement</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Views</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Clicks</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>CTR</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Revenue</th>
                      <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeAds.map((ad) => {
                      const ctr = ad.views > 0 ? (ad.clicks / ad.views) * 100 : 0;
                      const revenue = ad.clicks * 0.50; // Mock rate of $0.50 per click
                      return (
                        <tr key={ad.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ fontWeight: '600', fontSize: '0.875rem', color: '#111827' }}>{ad.title}</div>
                            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>ID: {ad.id.substring(0, 8)}</div>
                          </td>
                          <td style={{ padding: '12px 16px', fontSize: '0.875rem', color: '#374151' }}>
                            {ad.placement}
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: '0.875rem', color: '#374151' }}>
                            {ad.views.toLocaleString()}
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: '0.875rem', color: '#374151' }}>
                            {ad.clicks.toLocaleString()}
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: '0.875rem', fontWeight: '600', color: '#f59e0b' }}>
                            {ctr.toFixed(2)}%
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: '0.875rem', fontWeight: '600', color: '#16a34a' }}>
                            ${revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                            {ad.status === 'approved' ? (
                              <button
                                onClick={() => handleActivateAd(ad.id)}
                                style={{
                                  padding: '4px 12px',
                                  backgroundColor: '#000',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '0.75rem',
                                  fontWeight: '600'
                                }}
                              >
                                Activate
                              </button>
                            ) : (
                              <span style={{ 
                                padding: '4px 10px', 
                                backgroundColor: '#d1fae5', 
                                color: '#065f46', 
                                borderRadius: '12px', 
                                fontSize: '0.7rem',
                                fontWeight: '600',
                                textTransform: 'uppercase'
                              }}>
                                {ad.status}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Campaigns Tab */}
      {activeTab === 'campaigns' && (
        <CampaignsTab userRoles={userRoles} />
      )}

      {/* Placements Tab */}
      {activeTab === 'placements' && (
        <PlacementsTab userRoles={userRoles} />
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <AdAnalyticsTab userRoles={userRoles} />
      )}

      {/* Billing Tab */}
      {activeTab === 'billing' && (
        <AdBillingTab userRoles={userRoles} />
      )}
    </div>
  );
};

export default AdManagementTab;
