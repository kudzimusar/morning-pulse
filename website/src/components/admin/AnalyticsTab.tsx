/**
 * Analytics Tab
 * View statistics and metrics
 */

import React, { useEffect, useState } from 'react';
import { Firestore } from 'firebase/firestore';
import { getAnalyticsSummary, AnalyticsSummary } from '../../services/analyticsService';

interface AnalyticsTabProps {
  firebaseInstances: { auth: any; db: Firestore } | null;
}

const AnalyticsTab: React.FC<AnalyticsTabProps> = ({ firebaseInstances }) => {
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
    const interval = setInterval(loadAnalytics, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const data = await getAnalyticsSummary();
      setAnalytics(data);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !analytics) {
    return <div>Loading analytics...</div>;
  }

  return (
    <div>
      <h2 style={{ marginTop: 0, marginBottom: '24px', fontSize: '24px', fontWeight: '600' }}>
        Analytics Dashboard
      </h2>

      {/* Key Metrics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '32px'
      }}>
        <div style={{
          border: '1px solid #e5e5e5',
          borderRadius: '8px',
          padding: '20px',
          backgroundColor: '#fff'
        }}>
          <div style={{
            fontSize: '14px',
            color: '#666',
            marginBottom: '8px'
          }}>
            Total Published
          </div>
          <div style={{
            fontSize: '32px',
            fontWeight: '700',
            color: '#10b981'
          }}>
            {analytics.totalPublished}
          </div>
        </div>

        <div style={{
          border: '1px solid #e5e5e5',
          borderRadius: '8px',
          padding: '20px',
          backgroundColor: '#fff'
        }}>
          <div style={{
            fontSize: '14px',
            color: '#666',
            marginBottom: '8px'
          }}>
            Total Submissions
          </div>
          <div style={{
            fontSize: '32px',
            fontWeight: '700',
            color: '#3b82f6'
          }}>
            {analytics.totalSubmissions}
          </div>
        </div>

        <div style={{
          border: '1px solid #e5e5e5',
          borderRadius: '8px',
          padding: '20px',
          backgroundColor: '#fff'
        }}>
          <div style={{
            fontSize: '14px',
            color: '#666',
            marginBottom: '8px'
          }}>
            Rejected
          </div>
          <div style={{
            fontSize: '32px',
            fontWeight: '700',
            color: '#ef4444'
          }}>
            {analytics.totalRejected}
          </div>
        </div>

        <div style={{
          border: '1px solid #e5e5e5',
          borderRadius: '8px',
          padding: '20px',
          backgroundColor: '#fff'
        }}>
          <div style={{
            fontSize: '14px',
            color: '#666',
            marginBottom: '8px'
          }}>
            Views Today
          </div>
          <div style={{
            fontSize: '32px',
            fontWeight: '700',
            color: '#f59e0b'
          }}>
            {analytics.viewsToday}
          </div>
        </div>
      </div>

      {/* Top Categories */}
      <div style={{
        border: '1px solid #e5e5e5',
        borderRadius: '8px',
        padding: '24px',
        backgroundColor: '#fff',
        marginBottom: '32px'
      }}>
        <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>
          Top Categories
        </h3>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          {analytics.topCategories.length === 0 ? (
            <div style={{ color: '#999' }}>No category data available</div>
          ) : (
            analytics.topCategories.map((cat, index) => (
              <div
                key={cat.category}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '4px'
                }}
              >
                <span style={{ fontWeight: '500' }}>
                  {index + 1}. {cat.category}
                </span>
                <span style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#3b82f6'
                }}>
                  {cat.count}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div style={{
        border: '1px solid #e5e5e5',
        borderRadius: '8px',
        padding: '24px',
        backgroundColor: '#fff'
      }}>
        <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>
          Recent Activity
        </h3>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          {analytics.recentActivity.length === 0 ? (
            <div style={{ color: '#999' }}>No recent activity</div>
          ) : (
            analytics.recentActivity.map((activity, index) => (
              <div
                key={index}
                style={{
                  padding: '12px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              >
                <span style={{ fontWeight: '500' }}>{activity.action}</span>
                {' '}
                <span style={{ color: '#666' }}>
                  {activity.timestamp.toLocaleString()}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsTab;
