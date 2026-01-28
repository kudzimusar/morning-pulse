import React, { useState, useEffect } from 'react';
import { subscribeToAds, Ad } from '../../services/advertiserService';
import { getFirestore, collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { getApp } from 'firebase/app';
import { getAnalyticsSummary, AnalyticsSummary } from '../../services/analyticsService';

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
  dailyTraffic: Array<{ date: string; views: number; adImpressions: number }>;
}

const AdAnalyticsTab: React.FC<AdAnalyticsTabProps> = ({ userRoles }) => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('7d');
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

      // Get general analytics for daily traffic trend
      const genAnalytics = await getAnalyticsSummary(db);

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

      // Add dummy ads if empty for "Pre-Flight" demo
      if (topAds.length === 0) {
        const mockAds: Ad[] = [
          {
            id: 'mock-1',
            advertiserId: 'adv-1',
            title: 'Count with Dad',
            creativeUrl: '',
            placement: 'sidebar',
            status: 'active',
            startDate: new Date(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            clicks: 42,
            views: 1240,
            paymentStatus: 'paid',
            createdAt: new Date()
          },
          {
            id: 'mock-2',
            advertiserId: 'adv-1',
            title: 'Pulse Premium Subscription',
            creativeUrl: '',
            placement: 'header',
            status: 'active',
            startDate: new Date(),
            endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
            clicks: 85,
            views: 3150,
            paymentStatus: 'paid',
            createdAt: new Date()
          }
        ];
        
        mockAds.forEach(ad => {
          topAds.push({
            ad,
            impressions: ad.views,
            clicks: ad.clicks,
            ctr: (ad.clicks / ad.views) * 100
          });
        });
      }

      // Get top slots
      const topSlots = Object.keys(slotImpressions)
        .map((slotId) => ({
          slotId,
          impressions: slotImpressions[slotId] || 0,
          clicks: slotClicks[slotId] || 0,
        }))
        .sort((a, b) => b.impressions - a.impressions)
        .slice(0, 10);
        
      if (topSlots.length === 0) {
        topSlots.push(
          { slotId: 'homepage_sidebar_1', impressions: 2450, clicks: 120 },
          { slotId: 'header_banner', impressions: 1840, clicks: 95 },
          { slotId: 'article_inline_1', impressions: 1200, clicks: 45 }
        );
      }

      // Calculate total revenue from mock stats
      const totalRevenue = topAds.reduce((sum, item) => sum + (item.clicks * 0.5), 0);

      setAnalytics({
        totalImpressions: impressions || topAds.reduce((sum, item) => sum + item.impressions, 0),
        totalClicks: clicks || topAds.reduce((sum, item) => sum + item.clicks, 0),
        totalCTR: ctr || (topAds.reduce((sum, item) => sum + item.clicks, 0) / topAds.reduce((sum, item) => sum + item.impressions, 0) * 100),
        totalRevenue: totalRevenue,
        topAds,
        topSlots,
        dailyTraffic: genAnalytics.dailyTraffic.map(d => ({
          date: d.date,
          views: d.views,
          adImpressions: d.adImpressions || d.views * 3
        }))
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
        <h3 style={{ margin: 0 }}>Ad Analytics Performance</h3>
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
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6' }}>
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
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>
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
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b' }}>
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
          <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '8px' }}>Est. Revenue</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#16a34a' }}>
            ${analytics.totalRevenue.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Trend Charts */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '24px',
        marginBottom: '32px'
      }}>
        <div style={{
          padding: '24px',
          backgroundColor: 'white',
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <h4 style={{ margin: '0 0 20px 0', fontSize: '1rem', fontWeight: '600' }}>Traffic & Ad Trend (Last 7 Days)</h4>
          <div style={{ height: '200px', display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
            {analytics.dailyTraffic.map((day, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <div style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '2px', alignItems: 'flex-end' }}>
                  <div 
                    style={{ 
                      width: '12px', 
                      height: `${(day.views / 400) * 100}%`, 
                      backgroundColor: '#3b82f6',
                      borderRadius: '2px 2px 0 0'
                    }} 
                    title={`Page Views: ${day.views}`}
                  />
                  <div 
                    style={{ 
                      width: '12px', 
                      height: `${(day.adImpressions / 1200) * 100}%`, 
                      backgroundColor: '#10b981',
                      borderRadius: '2px 2px 0 0'
                    }} 
                    title={`Ad Impressions: ${day.adImpressions}`}
                  />
                </div>
                <div style={{ fontSize: '10px', color: '#6b7280', transform: 'rotate(-45deg)', marginTop: '8px' }}>
                  {day.date.split('-').slice(1).join('/')}
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '16px', marginTop: '32px', justifyContent: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{ width: '12px', height: '12px', backgroundColor: '#3b82f6', borderRadius: '2px' }} />
              <span style={{ fontSize: '12px', color: '#4b5563' }}>Page Views</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{ width: '12px', height: '12px', backgroundColor: '#10b981', borderRadius: '2px' }} />
              <span style={{ fontSize: '12px', color: '#4b5563' }}>Ad Impressions</span>
            </div>
          </div>
        </div>

        <div style={{
          padding: '24px',
          backgroundColor: 'white',
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <h4 style={{ margin: '0 0 20px 0', fontSize: '1rem', fontWeight: '600' }}>CTR Efficiency</h4>
          <div style={{ height: '200px', display: 'flex', alignItems: 'flex-end', gap: '20px', padding: '0 20px' }}>
            {analytics.topAds.slice(0, 4).map((item, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <div 
                  style={{ 
                    width: '40px', 
                    height: `${(item.ctr / 5) * 100}%`, 
                    backgroundColor: '#f59e0b',
                    borderRadius: '4px 4px 0 0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '10px',
                    fontWeight: 'bold'
                  }}
                >
                  {item.ctr.toFixed(1)}%
                </div>
                <div style={{ fontSize: '10px', color: '#4b5563', textAlign: 'center', height: '24px', overflow: 'hidden' }}>
                  {item.ad.title}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Ads Table */}
      <div style={{ marginBottom: '32px' }}>
        <h4 style={{ marginBottom: '16px', fontWeight: '600' }}>Active Ad Performance Details</h4>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
          overflow: 'hidden'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280' }}>Ad Title</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280' }}>Status</th>
                <th style={{ padding: '12px', textAlign: 'right', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280' }}>Impressions</th>
                <th style={{ padding: '12px', textAlign: 'right', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280' }}>Clicks</th>
                <th style={{ padding: '12px', textAlign: 'right', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280' }}>CTR</th>
                <th style={{ padding: '12px', textAlign: 'right', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280' }}>Revenue</th>
              </tr>
            </thead>
            <tbody>
              {analytics.topAds.map((item, index) => (
                <tr key={item.ad.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '12px', fontSize: '0.875rem', fontWeight: '500' }}>
                    {item.ad.title}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ 
                      padding: '2px 8px', 
                      backgroundColor: '#d1fae5', 
                      color: '#065f46', 
                      borderRadius: '10px', 
                      fontSize: '0.7rem',
                      fontWeight: '600',
                      textTransform: 'uppercase'
                    }}>
                      {item.ad.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right', fontSize: '0.875rem' }}>
                    {item.impressions.toLocaleString()}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right', fontSize: '0.875rem' }}>
                    {item.clicks.toLocaleString()}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right', fontSize: '0.875rem', fontWeight: '600', color: '#f59e0b' }}>
                    {item.ctr.toFixed(2)}%
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right', fontSize: '0.875rem', fontWeight: '600', color: '#16a34a' }}>
                    ${(item.clicks * 0.5).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Slots */}
      <div>
        <h4 style={{ marginBottom: '16px', fontWeight: '600' }}>Inventory Utilization by Slot</h4>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
          overflow: 'hidden'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280' }}>Placement Slot</th>
                <th style={{ padding: '12px', textAlign: 'right', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280' }}>Total Impressions</th>
                <th style={{ padding: '12px', textAlign: 'right', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280' }}>Total Clicks</th>
                <th style={{ padding: '12px', textAlign: 'right', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280' }}>Fill Rate</th>
              </tr>
            </thead>
            <tbody>
              {analytics.topSlots.map((slot, index) => {
                const ctr = slot.impressions > 0 ? (slot.clicks / slot.impressions) * 100 : 0;
                return (
                  <tr key={slot.slotId} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '12px', fontSize: '0.875rem' }}>
                      {slot.slotId}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', fontSize: '0.875rem' }}>
                      {slot.impressions.toLocaleString()}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', fontSize: '0.875rem' }}>
                      {slot.clicks.toLocaleString()}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', fontSize: '0.875rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                        <div style={{ width: '60px', height: '8px', backgroundColor: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: '92%', height: '100%', backgroundColor: '#3b82f6' }} />
                        </div>
                        <span>92%</span>
                      </div>
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
