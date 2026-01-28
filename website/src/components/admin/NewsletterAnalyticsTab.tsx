/**
 * Newsletter Analytics Tab
 * Displays statistics for sent newsletters
 */

import React, { useState, useEffect } from 'react';
import { getFirestore, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { getApp } from 'firebase/app';

const APP_ID = (window as any).__app_id || 'morning-pulse-app';

interface NewsletterSend {
  id: string;
  subject: string;
  sentAt: Date;
  totalSubscribers: number;
  targetedSubscribers: number;
  successfulSends: number;
  failedSends: number;
  interests?: string[];
}

const NewsletterAnalyticsTab: React.FC = () => {
  const [sends, setSends] = useState<NewsletterSend[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSends();
  }, []);

  const loadSends = async () => {
    try {
      setLoading(true);
      const db = getFirestore(getApp());
      const sendsRef = collection(db, 'artifacts', APP_ID, 'analytics', 'newsletters', 'sends');
      const q = query(sendsRef, orderBy('sentAt', 'desc'), limit(50));
      
      const snapshot = await getDocs(q);
      const sendsList: NewsletterSend[] = [];
      
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        sendsList.push({
          id: docSnap.id,
          subject: data.subject || 'No Subject',
          sentAt: data.sentAt?.toDate?.() || new Date(),
          totalSubscribers: data.totalSubscribers || 0,
          targetedSubscribers: data.targetedSubscribers || 0,
          successfulSends: data.successfulSends || 0,
          failedSends: data.failedSends || 0,
          interests: data.interests,
        });
      });
      
      setSends(sendsList);
    } catch (error) {
      console.error('Error loading newsletter analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '32px', textAlign: 'center' }}>Loading analytics...</div>;
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0 }}>Newsletter Broadcast History</h3>
        <button
          onClick={loadSends}
          style={{
            padding: '8px 16px',
            backgroundColor: '#f3f4f6',
            color: '#374151',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.875rem'
          }}
        >
          🔄 Refresh
        </button>
      </div>

      {sends.length === 0 ? (
        <div style={{
          padding: '48px',
          textAlign: 'center',
          backgroundColor: '#f9fafb',
          borderRadius: '8px',
          border: '1px solid #e5e7eb'
        }}>
          <p style={{ color: '#6b7280' }}>No newsletter send records found.</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: '600' }}>Sent Date</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: '600' }}>Subject</th>
                <th style={{ textAlign: 'center', padding: '12px 16px', fontWeight: '600' }}>Target</th>
                <th style={{ textAlign: 'center', padding: '12px 16px', fontWeight: '600' }}>Success</th>
                <th style={{ textAlign: 'center', padding: '12px 16px', fontWeight: '600' }}>Fail</th>
                <th style={{ textAlign: 'center', padding: '12px 16px', fontWeight: '600' }}>Open Rate</th>
              </tr>
            </thead>
            <tbody>
              {sends.map((send) => {
                const openRate = send.successfulSends > 0 
                  ? ((send.successfulSends / send.targetedSubscribers) * 100).toFixed(1) 
                  : '0.0';
                
                return (
                  <tr key={send.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '12px 16px' }}>
                      {send.sentAt.toLocaleDateString()}
                      <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                        {send.sentAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: '500' }}>{send.subject}</div>
                      {send.interests && send.interests.length > 0 && (
                        <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                          {send.interests.map(i => (
                            <span key={i} style={{ 
                              fontSize: '0.7rem', 
                              backgroundColor: '#e0f2fe', 
                              color: '#0369a1', 
                              padding: '1px 6px', 
                              borderRadius: '10px' 
                            }}>{i}</span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>{send.targetedSubscribers}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'center', color: '#059669' }}>{send.successfulSends}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'center', color: send.failedSends > 0 ? '#dc2626' : '#9ca3af' }}>
                      {send.failedSends}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <div style={{ 
                        fontWeight: '600',
                        color: parseFloat(openRate) > 20 ? '#059669' : '#374151'
                      }}>
                        {openRate}%
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default NewsletterAnalyticsTab;
