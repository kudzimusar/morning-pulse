import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import MetricCard from './widgets/MetricCard';
import ActivityFeed from './widgets/ActivityFeed';
import StaffOnlineList from './widgets/StaffOnlineList';
import PerformanceChart from './widgets/PerformanceChart';
import PrioritySummary from './PrioritySummary';
import { fetchDashboardStats, fetchTrendData, fetchContentPipelineCounts, fetchPriorityCounts, DashboardStats, ContentPipelineCount } from '../../services/dashboardService';

interface DashboardOverviewTabProps {
    onNavigate: (tab: string) => void;
    pendingCount: number;
    publishedCount: number;
}

const DashboardOverviewTab: React.FC<DashboardOverviewTabProps> = ({
    onNavigate,
    pendingCount: initialPending,
    publishedCount: initialPublished
}) => {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [revenueData, setRevenueData] = useState<any[]>([]);
    const [userData, setUserData] = useState<any[]>([]);
    const [contentPipelineData, setContentPipelineData] = useState<ContentPipelineCount[]>([]);
    const [subscriberData, setSubscriberData] = useState<any[]>([]);
    const [priorityCounts, setPriorityCounts] = useState<{ scheduledCount: number; imageIssuesCount: number }>({ scheduledCount: 0, imageIssuesCount: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                const [dashboardStats, revenueStats, userStats, pipelineCounts, subscriberTrend, counts] = await Promise.all([
                    fetchDashboardStats(),
                    fetchTrendData('revenue'),
                    fetchTrendData('users'),
                    fetchContentPipelineCounts(),
                    fetchTrendData('subscribers'),
                    fetchPriorityCounts()
                ]);

                setStats(dashboardStats);
                setRevenueData(revenueStats);
                setUserData(userStats);
                setContentPipelineData(pipelineCounts);
                setSubscriberData(subscriberTrend);
                setPriorityCounts(counts);
            } catch (error) {
                console.error("Error loading dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    if (loading && !stats) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
                <div style={{
                    width: '40px',
                    height: '40px',
                    border: '3px solid #f3f4f6',
                    borderTopColor: '#4f46e5',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <div className="admin-dashboard-overview" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#111827' }}>
                        Morning Pulse Command Center
                    </h2>
                    <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: '14px' }}>
                        Real-time overview of your enterprise newsroom operations.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        onClick={() => onNavigate('editorial-queue')}
                        className="admin-button admin-button-primary"
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px' }}
                    >
                        <span>📝</span> Create Article
                    </button>
                    <button
                        onClick={() => onNavigate('staff-management')}
                        className="admin-button admin-button-secondary"
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px' }}
                    >
                        <span>👥</span> Invite Staff
                    </button>
                </div>
            </header>

            {/* Quick Stats Bar */}
            <div className="admin-card" style={{ marginBottom: 0, padding: '12px 20px' }}>
                <span style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Quick Actions:</span>
                <div style={{ display: 'flex', gap: '16px' }}>
                    <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('ad-management'); }} style={{ fontSize: '14px', color: '#3b82f6', textDecoration: 'none', fontWeight: '500' }}>📢 Manage Ads</a>
                    <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('newsletter-hub'); }} style={{ fontSize: '14px', color: '#3b82f6', textDecoration: 'none', fontWeight: '500' }}>📧 Send Newsletter</a>
                    <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('analytics'); }} style={{ fontSize: '14px', color: '#3b82f6', textDecoration: 'none', fontWeight: '500' }}>📈 View Report</a>
                </div>
            </div>

            {/* KPI Section */}
            <div className="kpi-grid">
                <MetricCard
                    title="Total Readers"
                    value={stats?.totalUsers || 0}
                    trend="neutral"
                    icon="👥"
                    color="#3b82f6"
                    description="Global audience reach"
                />
                <MetricCard
                    title="Active Staff"
                    value={stats?.activeStaff || 0}
                    trend="neutral"
                    icon="🛡️"
                    color="#8b5cf6"
                    description="Editorial team strength"
                />
                <MetricCard
                    title="Revenue MTD"
                    value={`$${(stats?.revenueMTD || 0).toLocaleString()}`}
                    trend="neutral"
                    icon="💰"
                    color="#10b981"
                    description="Subscription & Ad income"
                />
                <MetricCard
                    title="Published"
                    value={stats?.publishedContent || 0}
                    trend="neutral"
                    icon="📰"
                    color="#f59e0b"
                    description="Articles live"
                />
            </div>

            <div className="admin-dashboard-grid-2-1">
                {/* Left Column: Charts & Priority */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', minWidth: 0, overflow: 'hidden' }}>
                    <PerformanceChart
                        title="Revenue Performance (6 Months)"
                        data={revenueData}
                        xKey="name"
                        yKey="value"
                        color="#10b981"
                        height={240}
                    />

                    {/* Content Status (This Week) / Pipeline */}
                    <div className="admin-card" style={{ marginBottom: 0, flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', fontWeight: '600', color: '#111827' }}>
                            Content Status (This Week)
                        </h3>
                        <div style={{ flex: 1, minHeight: 260, width: '100%' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={contentPipelineData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                                    <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <PrioritySummary
                        pendingCount={initialPending}
                        imageIssuesCount={priorityCounts.imageIssuesCount}
                        scheduledCount={priorityCounts.scheduledCount}
                        recentlyPublishedCount={initialPublished}
                        onNavigate={onNavigate}
                    />
                </div>

                {/* Right Column: Activity & Presence */}
                <div className="admin-command-center-right">
                    <ActivityFeed />
                    <StaffOnlineList />
                </div>
            </div>

            {/* Engagement Section */}
            <div className="admin-dashboard-grid-1-1">
                <PerformanceChart
                    title="User Growth"
                    data={userData}
                    xKey="name"
                    yKey="value"
                    color="#3b82f6"
                    height={200}
                />
                <PerformanceChart
                    title="Subscriber Growth (6 Months)"
                    data={subscriberData}
                    xKey="name"
                    yKey="value"
                    color="#10b981"
                    height={200}
                />
                <div className="admin-card" style={{ marginBottom: 0, justifyContent: 'center' }}>
                    <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>System Health</h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                        <div style={{ flex: 1, minWidth: '120px', padding: '12px', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                            <div style={{ color: '#16a34a', fontSize: '12px', fontWeight: '600' }}>API</div>
                            <div style={{ fontSize: '18px', fontWeight: '700', color: '#166534' }}>99.9%</div>
                        </div>
                        <div style={{ flex: 1, minWidth: '120px', padding: '12px', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                            <div style={{ color: '#16a34a', fontSize: '12px', fontWeight: '600' }}>DB</div>
                            <div style={{ fontSize: '18px', fontWeight: '700', color: '#166534' }}>Online</div>
                        </div>
                        <div style={{ flex: 1, minWidth: '120px', padding: '12px', backgroundColor: '#fff7ed', borderRadius: '8px', border: '1px solid #ffedd5' }}>
                            <div style={{ color: '#c2410c', fontSize: '12px', fontWeight: '600' }}>Cache</div>
                            <div style={{ fontSize: '18px', fontWeight: '700', color: '#9a3412' }}>Rebuilding</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardOverviewTab;
