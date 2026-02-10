import React, { useEffect, useState } from 'react';
import MetricCard from './widgets/MetricCard';
import ActivityFeed from './widgets/ActivityFeed';
import StaffOnlineList from './widgets/StaffOnlineList';
import PerformanceChart from './widgets/PerformanceChart';
import PrioritySummary from './PrioritySummary';
import { fetchDashboardStats, fetchTrendData, DashboardStats } from '../../services/dashboardService';

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
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                const [dashboardStats, revenueStats, userStats] = await Promise.all([
                    fetchDashboardStats(),
                    fetchTrendData('revenue'),
                    fetchTrendData('users')
                ]);

                setStats(dashboardStats);
                setRevenueData(revenueStats);
                setUserData(userStats);
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <header>
                <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#111827' }}>
                    Morning Pulse Command Center
                </h2>
                <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: '14px' }}>
                    Real-time overview of your enterprise newsroom operations.
                </p>
            </header>

            {/* KPI Section */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '20px'
            }}>
                <MetricCard
                    title="Total Readers"
                    value={stats?.totalUsers || 0}
                    change={12}
                    trend="up"
                    icon="👥"
                    color="#3b82f6"
                    description="Global audience reach"
                />
                <MetricCard
                    title="Active Staff"
                    value={stats?.activeStaff || 0}
                    change={2}
                    trend="neutral"
                    icon="🛡️"
                    color="#8b5cf6"
                    description="Editorial team strength"
                />
                <MetricCard
                    title="Revenue MTD"
                    value={`$${(stats?.revenueMTD || 0).toLocaleString()}`}
                    change={15}
                    trend="up"
                    icon="💰"
                    color="#10b981"
                    description="Subscription & Ad income"
                />
                <MetricCard
                    title="Published"
                    value={stats?.publishedContent || 0}
                    change={8}
                    trend="up"
                    icon="📰"
                    color="#f59e0b"
                    description="Articles live this month"
                />
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr',
                gap: '24px'
            }}>
                {/* Left Column: Charts & Priority */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <PerformanceChart
                        title="Revenue Performance (6 Months)"
                        data={revenueData}
                        xKey="name"
                        yKey="value"
                        color="#10b981"
                    />

                    <PrioritySummary
                        pendingCount={initialPending}
                        imageIssuesCount={0}
                        scheduledCount={0}
                        recentlyPublishedCount={initialPublished}
                        onNavigate={onNavigate}
                    />
                </div>

                {/* Right Column: Activity & Presence */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <ActivityFeed />
                    <StaffOnlineList />
                </div>
            </div>

            {/* Engagement Section */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '24px'
            }}>
                <PerformanceChart
                    title="User Growth"
                    data={userData}
                    xKey="name"
                    yKey="value"
                    color="#3b82f6"
                    height={200}
                />
                <div style={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center'
                }}>
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
