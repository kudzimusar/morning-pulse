import React, { useState, useEffect } from 'react';
import { Firestore } from 'firebase/firestore';
import MetricCard from './widgets/MetricCard';
import {
  startHealthPolling,
  stopHealthPolling,
  subscribeToHealth,
  getRecentEvents,
  type HealthState,
  type SystemEvent,
} from '../../services/systemHealthService';
import './AdminDashboard.css';

const STATIC_EVENTS: SystemEvent[] = [
  { id: 'static-1', type: 'info', message: 'Database backup completed successfully', time: '10 min ago', timestamp: Date.now() - 10 * 60 * 1000 },
  { id: 'static-2', type: 'success', message: 'SSL certificate renewed for morningpulse.com', time: 'Yesterday', timestamp: Date.now() - 86400000 },
  { id: 'static-3', type: 'info', message: 'System maintenance scheduled for 2:00 AM UTC', time: '2 days ago', timestamp: Date.now() - 2 * 86400000 },
];

interface SystemTabProps {
  firebaseInstances?: { auth: any; db: Firestore } | null;
  onNavigateToTab?: (tab: string) => void;
}

const CONFIG_ROWS: { label: string; tabId: string }[] = [
  { label: 'Security settings', tabId: 'settings' },
  { label: 'Email templates', tabId: 'settings' },
  { label: 'Site appearance', tabId: 'settings' },
  { label: 'Integrations', tabId: 'integrations' },
  { label: 'Analytics tracking', tabId: 'analytics' },
  { label: 'Advanced settings', tabId: 'settings' },
];

const SystemTab: React.FC<SystemTabProps> = ({ firebaseInstances, onNavigateToTab }) => {
  const [health, setHealth] = useState<HealthState>({ latencyMs: null, status: 'unknown', lastChecked: null, error: null });
  const [events, setEvents] = useState<SystemEvent[]>([]);

  useEffect(() => {
    if (firebaseInstances?.db) {
      startHealthPolling(firebaseInstances.db, 45000);
      const unsub = subscribeToHealth(setHealth);
      return () => {
        unsub();
        stopHealthPolling();
      };
    }
  }, [firebaseInstances?.db]);

  useEffect(() => {
    const live = getRecentEvents();
    setEvents(live.length > 0 ? live : STATIC_EVENTS);
    const id = setInterval(() => setEvents(getRecentEvents().length > 0 ? getRecentEvents() : STATIC_EVENTS), 5000);
    return () => clearInterval(id);
  }, [health.lastChecked]);

  const latencyValue = health.latencyMs != null ? `${health.latencyMs}ms` : '—';
  const latencyTrend = health.status === 'healthy' ? 'down' : health.status === 'critical' ? 'up' : 'neutral';
  const firestoreStatus = health.status === 'critical' ? 'Degraded' : health.status === 'warning' ? 'High latency' : 'Operational';
  const firestoreBadge = health.status === 'critical' ? 'inactive' : health.status === 'warning' ? 'pending' : 'active';
  const showLatencyAlert = health.status === 'warning' || health.status === 'critical';

  return (
    <div className="fade-in">
      <header style={{ marginBottom: '24px' }}>
        <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700' }}>System Health & Infrastructure</h2>
        <p style={{ margin: '4px 0 0 0', color: 'var(--admin-text-muted)', fontSize: '14px' }}>
          Monitor platform stability, API performance, and infrastructure events.
        </p>
      </header>

      {showLatencyAlert && (
        <div
          className="admin-card"
          style={{
            padding: '16px 20px',
            marginBottom: '24px',
            borderLeft: `4px solid ${health.status === 'critical' ? 'var(--admin-error)' : 'var(--admin-warning)'}`,
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <span style={{ fontSize: '24px' }}>⚠️</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--admin-text-main)' }}>
              {health.status === 'critical' ? 'High Firestore latency' : 'Elevated Firestore latency'}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>
              {health.latencyMs != null && `${health.latencyMs}ms`} — Check network or Firebase status.
            </div>
          </div>
          <span className={`status-badge ${health.status === 'critical' ? 'inactive' : 'pending'}`}>{firestoreStatus}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        <MetricCard
          title="Uptime"
          value="99.99%"
          trend="neutral"
          icon="⚡"
          color="#10b981"
          description="Last 30 days performance"
        />
        <MetricCard
          title="Firestore latency"
          value={latencyValue}
          trend={latencyTrend}
          icon="📡"
          color={health.status === 'critical' ? '#ef4444' : health.status === 'warning' ? '#f59e0b' : '#3b82f6'}
          description={health.lastChecked ? 'Live ping' : 'Enable Firebase for live data'}
        />
        <MetricCard
          title="Error Rate"
          value="0.04%"
          change={5}
          trend="down"
          icon="⚠️"
          color="#ef4444"
          description="Request failure frequency"
        />
        <MetricCard
          title="DB Storage"
          value="2.3 GB"
          icon="💾"
          color="#8b5cf6"
          description="23% of allocated quota"
        />
      </div>

      <div
        style={{
          padding: '20px',
          backgroundColor: health.status === 'healthy' ? '#eff6ff' : health.status === 'critical' ? '#fef2f2' : '#fffbeb',
          border: `1px solid ${health.status === 'healthy' ? '#bfdbfe' : health.status === 'critical' ? '#fecaca' : '#fde68a'}`,
          borderRadius: '12px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
        }}
      >
        <div style={{ fontSize: '24px' }}>⚡</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '14px', fontWeight: '600', color: health.status === 'healthy' ? '#1e40af' : health.status === 'critical' ? '#991b1b' : '#92400e' }}>
            Infrastructure Pulse: {health.status === 'healthy' ? 'Low Latency Mode' : health.status === 'critical' ? 'High Latency' : 'Elevated Latency'}
          </div>
          <div style={{ fontSize: '12px', color: health.status === 'healthy' ? '#3b82f6' : health.status === 'critical' ? '#dc2626' : '#d97706' }}>
            {health.status === 'healthy'
              ? 'All systems nominal. Global CDN propagation at 100%.'
              : health.error || 'Firestore latency above threshold.'}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className={`status-badge ${health.status === 'critical' ? 'inactive' : health.status === 'warning' ? 'pending' : 'active'}`} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: health.status === 'healthy' ? '#fff' : 'currentColor' }}></span>
            {health.status === 'unknown' && !firebaseInstances?.db ? 'No data' : health.status === 'healthy' ? 'Live' : 'Alert'}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div className="admin-card" style={{ padding: '24px' }}>
          <h3 style={{ marginTop: 0, fontSize: '16px', fontWeight: '600', marginBottom: '20px' }}>System Infrastructure Status</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#f0fdf4', borderRadius: '8px' }}>
              <span style={{ fontWeight: '500' }}>Cloud Functions</span>
              <span className="status-badge active">Operational</span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px',
                background: firestoreBadge === 'active' ? '#f0fdf4' : firestoreBadge === 'pending' ? '#fff7ed' : '#fef2f2',
                borderRadius: '8px',
              }}
            >
              <span style={{ fontWeight: '500' }}>Firestore Multi-Region DB</span>
              <span className={`status-badge ${firestoreBadge}`}>{firestoreStatus}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#fff7ed', borderRadius: '8px' }}>
              <span style={{ fontWeight: '500' }}>CDN / Edge Caching</span>
              <span className="status-badge pending">Warning</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#f0fdf4', borderRadius: '8px' }}>
              <span style={{ fontWeight: '500' }}>Search Index Service</span>
              <span className="status-badge active">Operational</span>
            </div>
          </div>
        </div>

        <div className="admin-card">
          <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--admin-border)', background: 'var(--admin-bg)' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Critical System Events</h3>
          </div>
          <div style={{ padding: '0 24px', maxHeight: '320px', overflowY: 'auto' }}>
            {events.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--admin-text-muted)', fontSize: '14px' }}>No recent events</div>
            ) : (
              events.map((log) => (
                <div key={log.id} style={{ padding: '16px 0', borderBottom: '1px solid #f3f4f6', display: 'flex', gap: '12px' }}>
                  <div
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      marginTop: '6px',
                      flexShrink: 0,
                      backgroundColor: log.type === 'error' ? 'var(--admin-error)' : log.type === 'warning' ? 'var(--admin-warning)' : log.type === 'success' ? 'var(--admin-success)' : '#3b82f6',
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--admin-text-main)' }}>{log.message}</div>
                    <div style={{ fontSize: '12px', color: 'var(--admin-text-muted)', marginTop: '4px' }}>{log.time}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Configuration & Settings block */}
      <div className="admin-card" style={{ padding: '24px', marginTop: '24px' }}>
        <h3 style={{ marginTop: 0, fontSize: '16px', fontWeight: '600', marginBottom: '20px' }}>Configuration & Settings</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {CONFIG_ROWS.map((row) => (
            <div
              key={row.tabId + row.label}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px',
                background: '#f9fafb',
                borderRadius: '8px',
              }}
            >
              <span style={{ fontWeight: '500' }}>{row.label}</span>
              {onNavigateToTab ? (
                <button
                  type="button"
                  className="admin-button admin-button-secondary"
                  style={{ padding: '6px 12px', fontSize: '13px' }}
                  onClick={() => onNavigateToTab(row.tabId)}
                >
                  Configure
                </button>
              ) : (
                <span style={{ fontSize: '13px', color: 'var(--admin-text-muted)' }}>—</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SystemTab;
