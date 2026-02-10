import React, { useState, useEffect } from 'react';
import MetricCard from './widgets/MetricCard';
import './AdminDashboard.css';

const SystemTab: React.FC = () => {
    const [logs, setLogs] = useState<any[]>([]);

    useEffect(() => {
        setLogs([
            { id: 1, type: 'info', message: 'Database backup completed successfully', time: '10 min ago' },
            { id: 2, type: 'warning', message: 'High API latency detected in Region: US-East', time: '2 hrs ago' },
            { id: 3, type: 'success', message: 'SSL certificate renewed for morningpulse.com', time: 'Yesterday' },
            { id: 4, type: 'info', message: 'System maintenance scheduled for 2:00 AM UTC', time: '2 days ago' },
        ]);
    }, []);

    return (
        <div className="fade-in">
            <header style={{ marginBottom: '24px' }}>
                <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700' }}>System Health & Infrastructure</h2>
                <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: '14px' }}>
                    Monitor platform stability, API performance, and infrastructure events.
                </p>
            </header>

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
                    title="API Latency"
                    value="125ms"
                    change={12}
                    trend="down"
                    icon="📡"
                    color="#3b82f6"
                    description="Global average response"
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

            <div style={{ padding: '20px', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '12px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ fontSize: '24px' }}>⚡</div>
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#1e40af' }}>Infrastructure Pulse: Low Latency Mode</div>
                    <div style={{ fontSize: '12px', color: '#3b82f6' }}>All systems are nominal. Global CDN propagation at 100%.</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div className="status-badge active" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fff' }}></span>
                        Live
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
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#f0fdf4', borderRadius: '8px' }}>
                            <span style={{ fontWeight: '500' }}>Firestore Multi-Region DB</span>
                            <span className="status-badge active">Operational</span>
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
                    <div style={{ padding: '16px 24px', borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Critical System Events</h3>
                    </div>
                    <div style={{ padding: '0 24px' }}>
                        {logs.map((log) => (
                            <div key={log.id} style={{ padding: '16px 0', borderBottom: '1px solid #f3f4f6', display: 'flex', gap: '12px' }}>
                                <div style={{
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: '50%',
                                    marginTop: '6px',
                                    backgroundColor: log.type === 'error' ? '#ef4444' : log.type === 'warning' ? '#f59e0b' : '#3b82f6'
                                }}></div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '14px', fontWeight: '500', color: '#111827' }}>{log.message}</div>
                                    <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>{log.time}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SystemTab;
