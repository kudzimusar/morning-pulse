/**
 * Newsletter Hub - Unified Newsletter Management Center
 * Consolidates all newsletter-related features in one place:
 * - Compose & Send newsletters
 * - Manage subscribers
 * - View send history & analytics
 * - Configure settings
 */

import React, { useState, useEffect } from 'react';
import { FileEdit, Users, BarChart3, Settings, Mail, Lightbulb, Clock } from 'lucide-react';
import { getFirestore, collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { getApp } from 'firebase/app';
import NewsletterTab from './NewsletterTab';
import SubscriberTab from './SubscriberTab';
import NewsletterAnalyticsTab from './NewsletterAnalyticsTab';

const APP_ID = (window as any).__app_id || 'morning-pulse-app';

type SubTab = 'compose' | 'subscribers' | 'history' | 'settings';

interface QuickStats {
  totalSubscribers: number;
  activeSubscribers: number;
  totalSends: number;
  lastSendDate: Date | null;
  avgDeliveryRate: number;
}

const NewsletterHub: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('compose');
  const [stats, setStats] = useState<QuickStats>({
    totalSubscribers: 0,
    activeSubscribers: 0,
    totalSends: 0,
    lastSendDate: null,
    avgDeliveryRate: 0
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

      // Get subscriber count
      const subscribersRef = collection(db, 'artifacts', APP_ID, 'public', 'data', 'subscribers');
      const subscribersSnapshot = await getDocs(subscribersRef);
      const subscribers = subscribersSnapshot.docs.map(doc => doc.data());
      const activeCount = subscribers.filter(s => s.status === 'active').length;

      // Get send history
      const sendsRef = collection(db, 'artifacts', APP_ID, 'analytics', 'newsletters', 'sends');
      const sendsQuery = query(sendsRef, orderBy('sentAt', 'desc'), limit(10));
      const sendsSnapshot = await getDocs(sendsQuery);
      
      let lastSendDate: Date | null = null;
      let totalSuccessful = 0;
      let totalTargeted = 0;

      sendsSnapshot.docs.forEach((doc, index) => {
        const data = doc.data();
        if (index === 0 && data.sentAt) {
          lastSendDate = data.sentAt.toDate?.() || new Date(data.sentAt);
        }
        totalSuccessful += data.successfulSends || 0;
        totalTargeted += data.targetedSubscribers || 0;
      });

      const avgDeliveryRate = totalTargeted > 0 
        ? Math.round((totalSuccessful / totalTargeted) * 100) 
        : 0;

      setStats({
        totalSubscribers: subscribers.length,
        activeSubscribers: activeCount,
        totalSends: sendsSnapshot.size,
        lastSendDate,
        avgDeliveryRate
      });
    } catch (error) {
      console.error('Error loading newsletter stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const subTabs = [
    { id: 'compose' as SubTab, label: 'Compose & Send', Icon: FileEdit, description: 'Create and send newsletters' },
    { id: 'subscribers' as SubTab, label: 'Subscribers', Icon: Users, description: 'Manage your audience' },
    { id: 'history' as SubTab, label: 'Send History', Icon: BarChart3, description: 'Track past newsletters' },
    { id: 'settings' as SubTab, label: 'Settings', Icon: Settings, description: 'Configure preferences' }
  ];

  const formatDate = (date: Date | null) => {
    if (!date) return 'Never';
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ 
          margin: 0, 
          fontSize: '28px', 
          fontWeight: '700',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <Mail size={24} aria-hidden /> Newsletter Hub
        </h2>
        <p style={{ 
          margin: '8px 0 0 0', 
          color: '#6b7280', 
          fontSize: '14px' 
        }}>
          Create, send, and manage your newsletters all in one place
        </p>
      </div>

      {/* Quick Stats Bar */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div style={{
          padding: '16px 20px',
          backgroundColor: '#f0fdf4',
          borderRadius: '12px',
          border: '1px solid #bbf7d0'
        }}>
          <div style={{ fontSize: '12px', color: '#166534', fontWeight: '600', marginBottom: '4px' }}>
            Active Subscribers
          </div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#15803d' }}>
            {loadingStats ? '...' : stats.activeSubscribers}
          </div>
          <div style={{ fontSize: '11px', color: '#16a34a' }}>
            of {stats.totalSubscribers} total
          </div>
        </div>

        <div style={{
          padding: '16px 20px',
          backgroundColor: '#eff6ff',
          borderRadius: '12px',
          border: '1px solid #bfdbfe'
        }}>
          <div style={{ fontSize: '12px', color: '#1e40af', fontWeight: '600', marginBottom: '4px' }}>
            Newsletters Sent
          </div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#1d4ed8' }}>
            {loadingStats ? '...' : stats.totalSends}
          </div>
          <div style={{ fontSize: '11px', color: '#2563eb' }}>
            all time
          </div>
        </div>

        <div style={{
          padding: '16px 20px',
          backgroundColor: '#fef3c7',
          borderRadius: '12px',
          border: '1px solid #fcd34d'
        }}>
          <div style={{ fontSize: '12px', color: '#92400e', fontWeight: '600', marginBottom: '4px' }}>
            Last Sent
          </div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#b45309' }}>
            {loadingStats ? '...' : formatDate(stats.lastSendDate)}
          </div>
          <div style={{ fontSize: '11px', color: '#d97706' }}>
            most recent
          </div>
        </div>

        <div style={{
          padding: '16px 20px',
          backgroundColor: '#f3e8ff',
          borderRadius: '12px',
          border: '1px solid #d8b4fe'
        }}>
          <div style={{ fontSize: '12px', color: '#6b21a8', fontWeight: '600', marginBottom: '4px' }}>
            Delivery Rate
          </div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#7c3aed' }}>
            {loadingStats ? '...' : `${stats.avgDeliveryRate}%`}
          </div>
          <div style={{ fontSize: '11px', color: '#8b5cf6' }}>
            average
          </div>
        </div>
      </div>

      {/* Sub-tab Navigation */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '24px',
        borderBottom: '2px solid #e5e7eb',
        paddingBottom: '0'
      }}>
        {subTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            style={{
              padding: '12px 20px',
              border: 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: activeSubTab === tab.id ? '600' : '500',
              color: activeSubTab === tab.id ? '#000' : '#6b7280',
              borderBottom: activeSubTab === tab.id ? '2px solid #000' : '2px solid transparent',
              marginBottom: '-2px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              if (activeSubTab !== tab.id) {
                e.currentTarget.style.color = '#374151';
              }
            }}
            onMouseOut={(e) => {
              if (activeSubTab !== tab.id) {
                e.currentTarget.style.color = '#6b7280';
              }
            }}
          >
            <span><tab.Icon size={16} aria-hidden /></span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Sub-tab Content */}
      <div style={{
        backgroundColor: '#fff',
        borderRadius: '12px',
        border: '1px solid #e5e7eb',
        padding: '24px',
        minHeight: '500px'
      }}>
        {activeSubTab === 'compose' && (
          <NewsletterTab />
        )}

        {activeSubTab === 'subscribers' && (
          <SubscriberTab />
        )}

        {activeSubTab === 'history' && (
          <NewsletterAnalyticsTab />
        )}

        {activeSubTab === 'settings' && (
          <NewsletterSettings />
        )}
      </div>
    </div>
  );
};

/**
 * Newsletter Settings Sub-component
 */
const NewsletterSettings: React.FC = () => {
  const [settings, setSettings] = useState({
    defaultTitle: 'Weekly Opinion Digest',
    senderName: 'Morning Pulse',
    senderEmail: 'newsletter@morningpulse.com',
    replyToEmail: '',
    footerText: 'You received this email because you subscribed to Morning Pulse newsletter.',
    autoDaily: false,
    autoWeekly: false,
    dailyTime: '06:00',
    weeklyDay: 'monday',
    weeklyTime: '08:00'
  });

  return (
    <div style={{ maxWidth: '600px' }}>
      <h3 style={{ marginTop: 0, marginBottom: '24px', fontSize: '20px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Settings size={20} aria-hidden /> Newsletter Settings
      </h3>

      {/* Email Settings */}
      <div style={{
        marginBottom: '32px',
        padding: '20px',
        backgroundColor: '#f9fafb',
        borderRadius: '8px',
        border: '1px solid #e5e7eb'
      }}>
        <h4 style={{ marginTop: 0, marginBottom: '16px', fontSize: '16px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Mail size={16} aria-hidden /> Email Configuration
        </h4>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>
            Default Newsletter Title
          </label>
          <input
            type="text"
            value={settings.defaultTitle}
            onChange={(e) => setSettings({ ...settings, defaultTitle: e.target.value })}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '14px'
            }}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>
            Sender Name
          </label>
          <input
            type="text"
            value={settings.senderName}
            onChange={(e) => setSettings({ ...settings, senderName: e.target.value })}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '14px'
            }}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>
            Footer Text
          </label>
          <textarea
            value={settings.footerText}
            onChange={(e) => setSettings({ ...settings, footerText: e.target.value })}
            rows={3}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '14px',
              resize: 'vertical'
            }}
          />
        </div>
      </div>

      {/* Automation Settings */}
      <div style={{
        marginBottom: '32px',
        padding: '20px',
        backgroundColor: '#f0f9ff',
        borderRadius: '8px',
        border: '1px solid #bae6fd'
      }}>
        <h4 style={{ marginTop: 0, marginBottom: '16px', fontSize: '16px', fontWeight: '600', color: '#0c4a6e' }}>
          <Clock size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} aria-hidden /> Automation (Coming Soon)
        </h4>

        <div style={{ 
          fontSize: '13px', 
          color: '#0369a1', 
          lineHeight: '1.6',
          marginBottom: '16px'
        }}>
          Automated newsletter scheduling will be available soon. You'll be able to:
        </div>

        <ul style={{ 
          margin: 0, 
          paddingLeft: '20px', 
          fontSize: '13px', 
          color: '#0369a1',
          lineHeight: '1.8'
        }}>
          <li>Enable automatic daily digests</li>
          <li>Schedule weekly roundups</li>
          <li>Set preferred send times</li>
          <li>Configure content filters</li>
        </ul>

        <div style={{
          marginTop: '16px',
          padding: '12px',
          backgroundColor: '#e0f2fe',
          borderRadius: '6px',
          fontSize: '12px',
          color: '#0c4a6e'
        }}>
          <Lightbulb size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} aria-hidden /><strong>Tip:</strong> For now, use Google Cloud Scheduler to call the newsletter endpoints at your preferred times.
        </div>
      </div>

      {/* Save Button */}
      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          style={{
            padding: '12px 24px',
            backgroundColor: '#000',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600'
          }}
        >
          Save Settings
        </button>
        <button
          style={{
            padding: '12px 24px',
            backgroundColor: 'transparent',
            color: '#6b7280',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          Reset to Defaults
        </button>
      </div>
    </div>
  );
};

export default NewsletterHub;
