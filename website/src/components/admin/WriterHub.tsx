/**
 * Writer Hub - Unified Writer Management Center
 * Consolidates all writer-related features in one place:
 * - Writer Applications & Governance (approval, tiers, beats, suspension)
 * - Story Pitches (review, approve, reject)
 * - Payments (statements, approvals)
 */

import React, { useState, useEffect } from 'react';
import { PenLine, Lightbulb, DollarSign } from 'lucide-react';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';
import { getApp } from 'firebase/app';
import WriterManagementTab from './WriterManagementTab';
import PitchReviewTab from './PitchReviewTab';
import WriterPaymentsAdmin from './WriterPaymentsAdmin';

const APP_ID = (window as any).__app_id || 'morning-pulse-app';

type SubTab = 'writers' | 'pitches' | 'payments';

interface QuickStats {
  pendingWriters: number;
  approvedWriters: number;
  pendingPitches: number;
  pendingPayments: number;
}

interface WriterHubProps {
  userRoles: string[] | null;
}

const WriterHub: React.FC<WriterHubProps> = ({ userRoles }) => {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('writers');
  const [stats, setStats] = useState<QuickStats>({
    pendingWriters: 0,
    approvedWriters: 0,
    pendingPitches: 0,
    pendingPayments: 0
  });
  const [loadingStats, setLoadingStats] = useState(true);

  // Load quick stats on mount
  useEffect(() => {
    loadQuickStats();
  }, []);

  const loadQuickStats = async () => {
    try {
      setLoadingStats(true);
      const db = getFirestore(getApp());

      // Get writer counts
      const writersRef = collection(db, 'artifacts', APP_ID, 'public', 'data', 'writers');
      const writersSnapshot = await getDocs(writersRef);
      const writers = writersSnapshot.docs.map(doc => doc.data());
      const pendingWriters = writers.filter(w => w.status === 'pending' || !w.approved).length;
      const approvedWriters = writers.filter(w => w.status === 'approved' || w.approved).length;

      // Get pending pitches
      const pitchesRef = collection(db, 'artifacts', APP_ID, 'public', 'data', 'storyPitches');
      const pendingPitchesQuery = query(pitchesRef, where('status', '==', 'submitted'));
      const pitchesSnapshot = await getDocs(pendingPitchesQuery);
      const pendingPitches = pitchesSnapshot.size;

      // Get pending payments (simplified - count all pending/approved statements)
      let pendingPayments = 0;
      try {
        const paymentsRef = collection(db, 'writerPayments');
        const paymentsSnapshot = await getDocs(paymentsRef);
        for (const writerDoc of paymentsSnapshot.docs) {
          const statementsRef = collection(db, 'writerPayments', writerDoc.id, 'statements');
          const stmtQuery = query(statementsRef, where('status', 'in', ['pending', 'approved']));
          const stmtSnapshot = await getDocs(stmtQuery);
          pendingPayments += stmtSnapshot.size;
        }
      } catch (e) {
        console.log('No payment data yet');
      }

      setStats({
        pendingWriters,
        approvedWriters,
        pendingPitches,
        pendingPayments
      });
    } catch (error) {
      console.error('Error loading writer hub stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const subTabs = [
    { 
      id: 'writers' as SubTab, 
      label: 'Writers', 
      Icon: PenLine, 
      description: 'Applications & Governance',
      badge: stats.pendingWriters > 0 ? stats.pendingWriters : undefined,
      badgeColor: '#dc2626'
    },
    { 
      id: 'pitches' as SubTab, 
      label: 'Story Pitches', 
      Icon: Lightbulb, 
      description: 'Review pitch submissions',
      badge: stats.pendingPitches > 0 ? stats.pendingPitches : undefined,
      badgeColor: '#d97706'
    },
    { 
      id: 'payments' as SubTab, 
      label: 'Payments', 
      Icon: DollarSign, 
      description: 'Contributor compensation',
      badge: stats.pendingPayments > 0 ? stats.pendingPayments : undefined,
      badgeColor: '#059669'
    }
  ];

  return (
    <div style={{ padding: '0' }}>
      {/* Header */}
      <div style={{ 
        marginBottom: '24px',
        padding: '24px',
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <h2 style={{ 
              fontSize: '1.5rem', 
              fontWeight: '700', 
              color: '#1f2937',
              marginBottom: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <PenLine size={24} aria-hidden /> Writer Management
            </h2>
            <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
              Manage writers, review pitches, and handle contributor payments
            </p>
          </div>
          
          {/* Quick stats */}
          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ 
              padding: '12px 16px', 
              backgroundColor: '#f3f4f6', 
              borderRadius: '8px',
              textAlign: 'center',
              minWidth: '80px'
            }}>
              <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1f2937' }}>
                {loadingStats ? '...' : stats.approvedWriters}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Writers</div>
            </div>
            <div style={{ 
              padding: '12px 16px', 
              backgroundColor: stats.pendingWriters > 0 ? '#fef2f2' : '#f3f4f6', 
              borderRadius: '8px',
              textAlign: 'center',
              minWidth: '80px'
            }}>
              <div style={{ 
                fontSize: '1.25rem', 
                fontWeight: '700', 
                color: stats.pendingWriters > 0 ? '#dc2626' : '#1f2937' 
              }}>
                {loadingStats ? '...' : stats.pendingWriters}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Pending</div>
            </div>
            <div style={{ 
              padding: '12px 16px', 
              backgroundColor: stats.pendingPitches > 0 ? '#fffbeb' : '#f3f4f6', 
              borderRadius: '8px',
              textAlign: 'center',
              minWidth: '80px'
            }}>
              <div style={{ 
                fontSize: '1.25rem', 
                fontWeight: '700', 
                color: stats.pendingPitches > 0 ? '#d97706' : '#1f2937' 
              }}>
                {loadingStats ? '...' : stats.pendingPitches}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Pitches</div>
            </div>
          </div>
        </div>

        {/* Sub-tab Navigation */}
        <div style={{ 
          display: 'flex', 
          gap: '8px',
          borderBottom: '1px solid #e5e7eb',
          marginBottom: '-24px',
          marginLeft: '-24px',
          marginRight: '-24px',
          paddingLeft: '24px',
          paddingRight: '24px'
        }}>
          {subTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              style={{
                padding: '12px 20px',
                backgroundColor: 'transparent',
                border: 'none',
                borderBottom: activeSubTab === tab.id ? '2px solid #2563eb' : '2px solid transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: activeSubTab === tab.id ? '#2563eb' : '#6b7280',
                fontWeight: activeSubTab === tab.id ? '600' : '400',
                fontSize: '0.875rem',
                transition: 'all 0.15s ease',
                position: 'relative'
              }}
            >
              <span><tab.Icon size={16} aria-hidden /></span>
              <span>{tab.label}</span>
              {tab.badge && (
                <span style={{
                  backgroundColor: tab.badgeColor,
                  color: 'white',
                  fontSize: '0.7rem',
                  fontWeight: '600',
                  padding: '2px 6px',
                  borderRadius: '10px',
                  minWidth: '18px',
                  textAlign: 'center'
                }}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        minHeight: '400px'
      }}>
        {activeSubTab === 'writers' && (
          <WriterManagementTab userRoles={userRoles} />
        )}

        {activeSubTab === 'pitches' && (
          <PitchReviewTab userRoles={userRoles} />
        )}

        {activeSubTab === 'payments' && (
          <WriterPaymentsAdmin userRoles={userRoles} />
        )}
      </div>
    </div>
  );
};

export default WriterHub;
