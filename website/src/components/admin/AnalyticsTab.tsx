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
            In Pipeline
          </div>
          <div style={{
            fontSize: '32px',
            fontWeight: '700',
            color: '#3b82f6'
          }}>
            {(analytics.totalDrafts || 0) + (analytics.totalPending || 0) + (analytics.totalInReview || 0)}
          </div>
          <div style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>
            {analytics.totalDrafts || 0} drafts • {analytics.totalPending || 0} pending • {analytics.totalInReview || 0} in-review
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
            Scheduled
          </div>
          <div style={{
            fontSize: '32px',
            fontWeight: '700',
            color: '#4338ca'
          }}>
            {analytics.totalScheduled || 0}
          </div>
          <div style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>
            Awaiting auto-publish
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
            Avg Time to Publish
          </div>
          <div style={{
            fontSize: '32px',
            fontWeight: '700',
            color: '#f59e0b'
          }}>
            {analytics.avgTimeToPublish ? `${analytics.avgTimeToPublish}h` : 'N/A'}
          </div>
          <div style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>
            From submission
          </div>
        </div>
      </div>

      {/* Two Column Layout for Analytics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))',
        gap: '24px',
        marginBottom: '32px'
      }}>
        {/* Top Opinions by Views */}
        <div style={{
          border: '1px solid #e5e5e5',
          borderRadius: '8px',
          padding: '24px',
          backgroundColor: '#fff'
        }}>
          <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>
            🏆 Top Performing Opinions
          </h3>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            {!analytics.topOpinions || analytics.topOpinions.length === 0 ? (
              <div style={{ color: '#999', fontSize: '13px', padding: '20px', textAlign: 'center' }}>
                No view data available yet. Views will be tracked when readers open opinions.
              </div>
            ) : (
              analytics.topOpinions.map((op, index) => (
                <div
                  key={op.id}
                  style={{
                    padding: '12px',
                    backgroundColor: index === 0 ? '#f0fdf4' : '#f9fafb',
                    borderRadius: '4px',
                    border: index === 0 ? '1px solid #86efac' : '1px solid #e5e5e5'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '6px'
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '600', fontSize: '14px', marginBottom: '4px' }}>
                        {index + 1}. {op.headline}
                      </div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        By {op.authorName}
                      </div>
                    </div>
                    <div style={{
                      fontSize: '20px',
                      fontWeight: '700',
                      color: index === 0 ? '#10b981' : '#3b82f6'
                    }}>
                      {op.views}
                    </div>
                  </div>
                  {op.slug && (
                    <div style={{
                      fontSize: '10px',
                      color: '#999',
                      fontFamily: 'monospace',
                      marginTop: '4px'
                    }}>
                      /opinion/{op.slug}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Authors */}
        <div style={{
          border: '1px solid #e5e5e5',
          borderRadius: '8px',
          padding: '24px',
          backgroundColor: '#fff'
        }}>
          <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>
            ✍️ Top Contributors
          </h3>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            {!analytics.topAuthors || analytics.topAuthors.length === 0 ? (
              <div style={{ color: '#999', fontSize: '13px', padding: '20px', textAlign: 'center' }}>
                No author data available yet.
              </div>
            ) : (
              analytics.topAuthors.map((author, index) => (
                <div
                  key={author.authorName}
                  style={{
                    padding: '12px',
                    backgroundColor: index === 0 ? '#fef3c7' : '#f9fafb',
                    borderRadius: '4px',
                    border: index === 0 ? '1px solid #fde68a' : '1px solid #e5e5e5'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '14px', marginBottom: '4px' }}>
                        {index + 1}. {author.authorName}
                      </div>
                      <div style={{ fontSize: '11px', color: '#666' }}>
                        {author.publishedCount} article{author.publishedCount !== 1 ? 's' : ''} • 
                        {' '}{author.avgViewsPerArticle} avg views
                      </div>
                    </div>
                    <div style={{
                      fontSize: '18px',
                      fontWeight: '700',
                      color: index === 0 ? '#f59e0b' : '#6b7280'
                    }}>
                      {author.totalViews}
                    </div>
                  </div>
                </div>
              ))
            )}
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
