import React, { useState, useEffect } from 'react';
import { subscribeToAds, Ad, getApprovedAdvertisers, Advertiser } from '../../services/advertiserService';
import { getFirestore, collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { getApp } from 'firebase/app';

const APP_ID = (window as any).__app_id || 'morning-pulse-app';

interface AdAnalyticsTabProps {
  userRoles: string[] | null;
}

interface AnalyticsData {
  totalImpressions: number;
  totalClicks: number;
  totalCTR: number;
  totalRevenue: number;
  topAds: Array<{ ad: Ad; impressions: number; clicks: number; ctr: number }>;
  topSlots: Array<{ slotId: string; impressions: number; clicks: number }>;
}

const AdAnalyticsTab: React.FC<AdAnalyticsTabProps> = ({ userRoles }) => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [ads, setAds] = useState<Ad[]>([]);

  useEffect(() => {
    loadAnalytics();
  }, [dateRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const db = getFirestore(getApp());
      
      // Get date filter
      const now = new Date();
      let startTimestamp: Timestamp | null = null;
      if (dateRange === '7d') {
        startTimestamp = Timestamp.fromDate(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000));
      } else if (dateRange === '30d') {
        startTimestamp = Timestamp.fromDate(new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000));
      } else if (dateRange === '90d') {
        startTimestamp = Timestamp.fromDate(new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000));
      }

      // Get impressions
      const impressionsRef = collection(db, 'artifacts', APP_ID, 'public', 'data', 'adImpressions');
      const impressionsQuery = startTimestamp
        ? query(impressionsRef, where('timestamp', '>=', startTimestamp))
        : impressionsRef;
      const impressionsSnap = await getDocs(impressionsQuery);

      // Get clicks
      const clicksRef = collection(db, 'artifacts', APP_ID, 'public', 'data', 'adClicks');
      const clicksQuery = startTimestamp
        ? query(clicksRef, where('timestamp', '>=', startTimestamp))
        : clicksRef;
      const clicksSnap = await getDocs(clicksQuery);

      // Subscribe to ads for ad details
      const unsubscribe = subscribeToAds((adsList) => {
        setAds(adsList);
      });

      // Calculate metrics
      const impressions = impressionsSnap.size;
      const clicks = clicksSnap.size;
      const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;

      // Group by ad
      const adImpressions: { [key: string]: number } = {};
      const adClicks: { [key: string]: number } = {};
      
      impressionsSnap.forEach((doc) => {
        const adId = doc.data().adId;
        adImpressions[adId] = (adImpressions[adId] || 0) + 1;
      });
      
      clicksSnap.forEach((doc) => {
        const adId = doc.data().adId;
        adClicks[adId] = (adClicks[adId] || 0) + 1;
      });

      // Group by slot
      const slotImpressions: { [key: string]: number } = {};
      const slotClicks: { [key: string]: number } = {};
      
      impressionsSnap.forEach((doc) => {
        const slotId = doc.data().slotId;
        slotImpressions[slotId] = (slotImpressions[slotId] || 0) + 1;
      });
      
      clicksSnap.forEach((doc) => {
        const slotId = doc.data().slotId;
        slotClicks[slotId] = (slotClicks[slotId] || 0) + 1;
      });

      // Get top ads
      const topAds = Object.keys(adImpressions)
        .map((adId) => {
          const ad = ads.find(a => a.id === adId);
          if (!ad) return null;
          const adImps = adImpressions[adId] || 0;
          const adClicksCount = adClicks[adId] || 0;
          return {
            ad,
            impressions: adImps,
            clicks: adClicksCount,
            ctr: adImps > 0 ? (adClicksCount / adImps) * 100 : 0,
          };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null)
        .sort((a, b) => b.impressions - a.impressions)
        .slice(0, 10);

      // Get top slots
      const topSlots = Object.keys(slotImpressions)
        .map((slotId) => ({
          slotId,
          impressions: slotImpressions[slotId] || 0,
          clicks: slotClicks[slotId] || 0,
        }))
        .sort((a, b) => b.impressions - a.impressions)
        .slice(0, 10);

      setAnalytics({
        totalImpressions: impressions,
        totalClicks: clicks,
        totalCTR: ctr,
        totalRevenue: 0, // TODO: Calculate from invoices
        topAds,
        topSlots,
      });

      setTimeout(() => unsubscribe(), 1000);
    } catch (error: any) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '32px', textAlign: 'center' }}>Loading analytics...</div>;
  }

  if (!analytics) {
    return <div style={{ padding: '32px', textAlign: 'center' }}>No analytics data available.</div>;
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0 }}>Ad Analytics</h3>
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value as any)}
          style={{
            padding: '8px 12px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '0.875rem'
          }}
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="all">All time</option>
        </select>
      </div>

      {/* Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '32px'
      }}>
        <div style={{
          padding: '20px',
          backgroundColor: 'white',
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '8px' }}>Total Impressions</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
            {analytics.totalImpressions.toLocaleString()}
          </div>
        </div>
        
        <div style={{
          padding: '20px',
          backgroundColor: 'white',
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '8px' }}>Total Clicks</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
            {analytics.totalClicks.toLocaleString()}
          </div>
        </div>
        
        <div style={{
          padding: '20px',
          backgroundColor: 'white',
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '8px' }}>Overall CTR</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
            {analytics.totalCTR.toFixed(2)}%
          </div>
        </div>
        
        <div style={{
          padding: '20px',
          backgroundColor: 'white',
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '8px' }}>Revenue</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
            ${analytics.totalRevenue.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Top Ads */}
      <div style={{ marginBottom: '32px' }}>
        <h4 style={{ marginBottom: '16px' }}>Top Performing Ads</h4>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
          overflow: 'hidden'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280' }}>Ad</th>
                <th style={{ padding: '12px', textAlign: 'right', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280' }}>Impressions</th>
                <th style={{ padding: '12px', textAlign: 'right', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280' }}>Clicks</th>
                <th style={{ padding: '12px', textAlign: 'right', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280' }}>CTR</th>
              </tr>
            </thead>
            <tbody>
              {analytics.topAds.map((item, index) => (
                <tr key={item.ad.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '12px', fontSize: '0.875rem' }}>
                    {index + 1}. {item.ad.title}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right', fontSize: '0.875rem' }}>
                    {item.impressions.toLocaleString()}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right', fontSize: '0.875rem' }}>
                    {item.clicks.toLocaleString()}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right', fontSize: '0.875rem' }}>
                    {item.ctr.toFixed(2)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Slots */}
      <div>
        <h4 style={{ marginBottom: '16px' }}>Top Performing Slots</h4>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
          overflow: 'hidden'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280' }}>Slot</th>
                <th style={{ padding: '12px', textAlign: 'right', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280' }}>Impressions</th>
                <th style={{ padding: '12px', textAlign: 'right', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280' }}>Clicks</th>
                <th style={{ padding: '12px', textAlign: 'right', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280' }}>CTR</th>
              </tr>
            </thead>
            <tbody>
              {analytics.topSlots.map((slot, index) => {
                const ctr = slot.impressions > 0 ? (slot.clicks / slot.impressions) * 100 : 0;
                return (
                  <tr key={slot.slotId} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '12px', fontSize: '0.875rem' }}>
                      {index + 1}. {slot.slotId}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', fontSize: '0.875rem' }}>
                      {slot.impressions.toLocaleString()}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', fontSize: '0.875rem' }}>
                      {slot.clicks.toLocaleString()}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', fontSize: '0.875rem' }}>
                      {ctr.toFixed(2)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdAnalyticsTab;
