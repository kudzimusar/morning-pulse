import React, { useEffect, useState } from 'react';
import { StaffMember } from '../../../types';
import type { StaffRole } from '../../../types';
import { getStaffMetrics, StaffMetrics } from '../../../services/staffMetricsService';
import { getStaffAuditLogs } from '../../../services/auditService';
import { PERMISSION_KEYS, PERMISSION_LABELS, roleHasPermission } from '../../../constants/permissionMatrix';
import type { PermissionKey } from '../../../constants/permissionMatrix';
import MetricCard from './MetricCard';
import PerformanceChart from './PerformanceChart';
import '../AdminDashboard.css';

interface StaffProfileModalProps {
    member: StaffMember;
    onClose: () => void;
}

const StaffProfileModal: React.FC<StaffProfileModalProps> = ({ member, onClose }) => {
    const [metrics, setMetrics] = useState<StaffMetrics | null>(null);
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadContent = async () => {
            setLoading(true);
            try {
                const [m, l] = await Promise.all([
                    getStaffMetrics(member.uid),
                    getStaffAuditLogs(member.uid)
                ]);
                setMetrics(m);
                setLogs(l);
            } catch (error) {
                console.error("Error loading staff profile data:", error);
            } finally {
                setLoading(false);
            }
        };
        loadContent();
    }, [member.uid]);

    const stats = [
        { title: 'Articles', value: metrics?.articlesPublished || 0, icon: '📰', color: '#3b82f6' },
        { title: 'Total Views', value: (metrics?.totalViews || 0).toLocaleString(), icon: '👁️', color: '#10b981' },
        { title: 'Avg Views', value: metrics?.avgViewsPerArticle || 0, icon: '📈', color: '#f59e0b' },
        { title: 'Engagement', value: `${metrics?.totalEngagement || 0}%`, icon: '🔥', color: '#8b5cf6' },
    ];

    const roles = member.roles?.length ? member.roles : [member.role].filter(Boolean);
    const hasPermission = (perm: PermissionKey) => roles.some((r: string) => roleHasPermission(r as StaffRole, perm));

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content staff-profile-modal" onClick={e => e.stopPropagation()}>
                <header className="modal-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div className="profile-avatar large">
                            {(member.name || '?').charAt(0)}
                        </div>
                        <div>
                            <h2 style={{ margin: 0 }}>{member.name || 'Unknown Staff'}</h2>
                            <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>{member.email || 'No email provided'} • {member.role || 'No role'}</p>
                        </div>
                    </div>
                    <button className="close-button" onClick={onClose}>&times;</button>
                </header>

                <div className="modal-body">
                    {loading ? (
                        <div style={{ padding: '40px', textAlign: 'center' }}>Compiling dossier...</div>
                    ) : (
                        <>
                            {/* KPIs */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
                                {stats.map(stat => (
                                    <div key={stat.title} className="mini-metric-card">
                                        <span style={{ fontSize: '20px' }}>{stat.icon}</span>
                                        <div>
                                            <div style={{ fontSize: '12px', color: '#6b7280' }}>{stat.title}</div>
                                            <div style={{ fontSize: '18px', fontWeight: '700' }}>{stat.value}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px' }}>
                                {/* Performance Chart Placeholder */}
                                <div className="admin-card" style={{ padding: '20px' }}>
                                    <h3 style={{ marginTop: 0, fontSize: '16px', marginBottom: '16px' }}>Performance Trend (90 Days)</h3>
                                    <div style={{ height: '200px', backgroundColor: '#f9fafb', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <PerformanceChart
                                            title=""
                                            height={180}
                                            data={[
                                                { name: 'W1', value: 12 },
                                                { name: 'W2', value: 18 },
                                                { name: 'W3', value: 15 },
                                                { name: 'W4', value: 22 },
                                                { name: 'W5', value: 30 },
                                            ]}
                                            xKey="name"
                                            yKey="value"
                                            color={stats[0].color}
                                        />
                                    </div>
                                </div>

                                {/* Recent Activity */}
                                <div className="admin-card" style={{ display: 'flex', flexDirection: 'column' }}>
                                    <div style={{ padding: '16px', borderBottom: '1px solid #e5e7eb' }}>
                                        <h3 style={{ margin: 0, fontSize: '16px' }}>Recent Footprint</h3>
                                    </div>
                                    <div style={{ flex: 1, overflowY: 'auto', maxHeight: '300px', padding: '0 16px' }}>
                                        {logs.length > 0 ? logs.map((log, i) => (
                                            <div key={i} style={{ padding: '12px 0', borderBottom: '1px solid #f3f4f6' }}>
                                                <div style={{ fontSize: '13px', fontWeight: '500' }}>{log.action}</div>
                                                <div style={{ fontSize: '11px', color: '#9ca3af' }}>{log.timestamp instanceof Date ? log.timestamp.toLocaleString() : (log.timestamp?.seconds ? new Date(log.timestamp.seconds * 1000).toLocaleString() : '—')}</div>
                                            </div>
                                        )) : (
                                            <div style={{ padding: '20px', textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>No recent activity recorded.</div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* A3: Permissions & Access */}
                            <div className="admin-card" style={{ padding: '20px', marginTop: '24px' }}>
                                <h3 style={{ margin: '0 0 12px 0', fontSize: '16px' }}>Permissions & Access</h3>
                                <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: 'var(--admin-text-muted)' }}>Effective permissions from role(s).</p>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px 24px' }}>
                                    {PERMISSION_KEYS.map(perm => (
                                        <div key={perm} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                                            <span style={{ color: hasPermission(perm as PermissionKey) ? 'var(--admin-success)' : 'var(--admin-border)', fontWeight: 'bold' }}>{hasPermission(perm as PermissionKey) ? '✓' : '—'}</span>
                                            <span>{PERMISSION_LABELS[perm as PermissionKey]}</span>
                                        </div>
                                    ))}
                                </div>
                                <button type="button" className="admin-button admin-button-secondary" style={{ marginTop: '16px', padding: '6px 12px', fontSize: '13px' }} onClick={() => alert('Customize permissions: coming soon. Change role above to update access.')}>Customize permissions</button>
                            </div>
                        </>
                    )}
                </div>

                <footer className="modal-footer" style={{ justifyContent: 'flex-end', gap: '12px' }}>
                    <button className="admin-button admin-button-secondary" onClick={onClose}>Close Profile</button>
                    <button className="admin-button admin-button-primary" onClick={() => alert('Customize permissions: coming soon. Change role in Staff Management to update access.')}>Edit Permissions</button>
                </footer>
            </div>

            <style>{`
        .mini-metric-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: #f9fafb;
          border-radius: 10px;
          border: 1px solid #e5e7eb;
        }
        .profile-avatar.large {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: #4f46e5;
          color: white;
          font-size: 24px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .staff-profile-modal {
          max-width: 800px;
          width: 90%;
        }
      `}</style>
        </div>
    );
};

export default StaffProfileModal;
