import React, { useState, useEffect } from 'react';
import { 
  getCampaignsByAdvertiser,
  getCampaignAnalytics,
  updateCampaign,
  Campaign,
  getApprovedAdvertisers,
  Advertiser
} from '../../services/advertiserService';
import { subscribeToAds, Ad } from '../../services/advertiserService';

interface CampaignsTabProps {
  userRoles: string[] | null;
}

const CampaignsTab: React.FC<CampaignsTabProps> = ({ userRoles }) => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [advertisers, setAdvertisers] = useState<Advertiser[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAdvertiser, setSelectedAdvertiser] = useState<string | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [analytics, setAnalytics] = useState<{ [key: string]: any }>({});

  useEffect(() => {
    loadData();
  }, [selectedAdvertiser]);

  const loadData = async () => {
    try {
      setLoading(true);
      const advertisersList = await getApprovedAdvertisers();
      
      // Subscribe to ads separately
      let adsList: Ad[] = [];
      const unsubscribe = subscribeToAds(
        (ads) => {
          adsList = ads;
        },
        () => {
          adsList = [];
        }
      );
      
      // Wait a bit for initial data
      await new Promise(resolve => setTimeout(resolve, 1000));
      unsubscribe();
      setAdvertisers(advertisersList);
      setAds(adsList);

      if (selectedAdvertiser) {
        const campaignsList = await getCampaignsByAdvertiser(selectedAdvertiser);
        setCampaigns(campaignsList);

        // Load analytics for each campaign
        const analyticsData: { [key: string]: any } = {};
        for (const campaign of campaignsList) {
          try {
            const campaignAnalytics = await getCampaignAnalytics(campaign.id);
            analyticsData[campaign.id] = campaignAnalytics;
          } catch (err) {
            console.error('Error loading campaign analytics:', err);
          }
        }
        setAnalytics(analyticsData);
      } else {
        setCampaigns([]);
      }
    } catch (error: any) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (campaignId: string, newStatus: Campaign['status']) => {
    if (!confirm(`Are you sure you want to ${newStatus} this campaign?`)) {
      return;
    }

    try {
      await updateCampaign(campaignId, { status: newStatus });
      await loadData();
      alert('Campaign status updated successfully!');
    } catch (error: any) {
      alert(`Failed to update campaign: ${error.message}`);
    }
  };

  if (loading) {
    return <div style={{ padding: '32px', textAlign: 'center' }}>Loading campaigns...</div>;
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ marginBottom: '16px' }}>Campaign Management</h3>
        
        {/* Advertiser Filter */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
            Filter by Advertiser:
          </label>
          <select
            value={selectedAdvertiser || ''}
            onChange={(e) => setSelectedAdvertiser(e.target.value || null)}
            style={{
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '0.875rem',
              minWidth: '300px'
            }}
          >
            <option value="">All Advertisers</option>
            {advertisers.map((adv) => (
              <option key={adv.uid} value={adv.uid}>
                {adv.companyName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Campaigns List */}
      {campaigns.length === 0 ? (
        <div style={{
          padding: '48px',
          textAlign: 'center',
          backgroundColor: '#f9fafb',
          borderRadius: '8px',
          border: '1px solid #e5e7eb'
        }}>
          <p style={{ color: '#6b7280', margin: 0 }}>
            {selectedAdvertiser ? 'No campaigns found for this advertiser.' : 'Select an advertiser to view campaigns.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {campaigns.map((campaign) => {
            const campaignAnalytics = analytics[campaign.id] || { impressions: 0, clicks: 0, ctr: 0, spend: 0 };
            const campaignAds = ads.filter(ad => campaign.adIds.includes(ad.id));

            return (
              <div
                key={campaign.id}
                style={{
                  padding: '20px',
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '1.125rem' }}>{campaign.name}</h4>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '8px' }}>
                      Advertiser: {advertisers.find(a => a.uid === campaign.advertiserId)?.companyName || 'Unknown'}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '8px' }}>
                      {campaign.startDate.toLocaleDateString()} - {campaign.endDate.toLocaleDateString()}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '8px' }}>
                      Budget: ${campaign.totalBudget.toLocaleString()} | 
                      {campaign.dailyCap && ` Daily Cap: $${campaign.dailyCap.toLocaleString()}`}
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                      <span
                        style={{
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          backgroundColor:
                            campaign.status === 'active'
                              ? '#d1fae5'
                              : campaign.status === 'paused'
                              ? '#fef3c7'
                              : campaign.status === 'completed'
                              ? '#e0e7ff'
                              : '#f3f4f6',
                          color:
                            campaign.status === 'active'
                              ? '#065f46'
                              : campaign.status === 'paused'
                              ? '#92400e'
                              : campaign.status === 'completed'
                              ? '#3730a3'
                              : '#374151'
                        }}
                      >
                        {campaign.status}
                      </span>
                      <span
                        style={{
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          backgroundColor:
                            campaign.priorityTier === 'premium'
                              ? '#fef3c7'
                              : campaign.priorityTier === 'house'
                              ? '#fee2e2'
                              : '#e0e7ff',
                          color:
                            campaign.priorityTier === 'premium'
                              ? '#92400e'
                              : campaign.priorityTier === 'house'
                              ? '#991b1b'
                              : '#3730a3'
                        }}
                      >
                        {campaign.priorityTier}
                      </span>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginLeft: '16px' }}>
                    {campaign.status === 'draft' && (
                      <button
                        onClick={() => handleStatusChange(campaign.id, 'active')}
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
                        Activate
                      </button>
                    )}
                    {campaign.status === 'active' && (
                      <button
                        onClick={() => handleStatusChange(campaign.id, 'paused')}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#f59e0b',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '0.875rem',
                          fontWeight: '500'
                        }}
                      >
                        Pause
                      </button>
                    )}
                    {campaign.status === 'paused' && (
                      <button
                        onClick={() => handleStatusChange(campaign.id, 'active')}
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
                        Resume
                      </button>
                    )}
                  </div>
                </div>

                {/* Analytics */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                  gap: '12px',
                  marginTop: '16px',
                  padding: '16px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '6px'
                }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '4px' }}>Impressions</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                      {campaignAnalytics.impressions.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '4px' }}>Clicks</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                      {campaignAnalytics.clicks.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '4px' }}>CTR</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                      {campaignAnalytics.ctr.toFixed(2)}%
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '4px' }}>Spend</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                      ${campaignAnalytics.spend.toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Campaign Ads */}
                {campaignAds.length > 0 && (
                  <div style={{ marginTop: '16px' }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: '500', marginBottom: '8px' }}>
                      Ads in Campaign ({campaignAds.length}):
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {campaignAds.map((ad) => (
                        <div
                          key={ad.id}
                          style={{
                            padding: '8px 12px',
                            backgroundColor: '#f3f4f6',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            color: '#374151'
                          }}
                        >
                          {ad.title}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CampaignsTab;
