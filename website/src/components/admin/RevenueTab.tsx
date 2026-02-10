import React, { useEffect, useState } from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    Cell
} from 'recharts';
import MetricCard from './widgets/MetricCard';
import './AdminDashboard.css';

const RevenueTab: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [revenueTrend, setRevenueTrend] = useState<any[]>([]);
    const [subscriptionMix, setSubscriptionMix] = useState<any[]>([]);

    useEffect(() => {
        // Simulating monetization data fetch
        setTimeout(() => {
            setRevenueTrend([
                { month: 'Jan', revenue: 32000, churn: 120 },
                { month: 'Feb', revenue: 35000, churn: 140 },
                { month: 'Mar', revenue: 38000, churn: 130 },
                { month: 'Apr', revenue: 42000, churn: 110 },
                { month: 'May', revenue: 45000, churn: 95 },
                { month: 'Jun', revenue: 52000, churn: 80 },
            ]);

            setSubscriptionMix([
                { name: 'Free', count: 12500, color: '#9ca3af' },
                { name: 'Pro', count: 4800, color: '#3b82f6' },
                { name: 'Premium', count: 1200, color: '#f59e0b' },
                { name: 'Corporate', count: 150, color: '#8b5cf6' },
            ]);

            setLoading(false);
        }, 1200);
    }, []);

    if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading financial oversight engine...</div>;

    return (
        <div className="fade-in">
            <header style={{ marginBottom: '24px' }}>
                <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700' }}>Revenue Control</h2>
                <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: '14px' }}>
                    Monetization performance, subscription health, and fiscal projections.
                </p>
            </header>

            {/* KPI Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '24px' }}>
                <MetricCard title="MTD Revenue" value="$52,430" trend="up" change={15} icon="💰" color="#10b981" />
                <MetricCard title="Avg MRR" value="$45,200" trend="up" change={12} icon="🔄" color="#3b82f6" />
                <MetricCard title="Active Subs" value="6,150" trend="up" change={5} icon="👥" color="#f59e0b" />
                <MetricCard title="Churn Rate" value="1.8%" trend="down" change={0.5} icon="📉" color="#ef4444" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '24px' }}>
                {/* Revenue Growth Chart */}
                <div className="admin-card" style={{ padding: '24px' }}>
                    <h3 style={{ marginTop: 0, marginBottom: '20px', fontSize: '16px' }}>Monthly Revenue Growth (MRR)</h3>
                    <div style={{ height: '300px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={revenueTrend}>
                                <defs>
                                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                                <Tooltip />
                                <Area type="monotone" dataKey="revenue" stroke="#10b981" fillOpacity={1} fill="url(#colorRev)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Subscription Mix */}
                <div className="admin-card" style={{ padding: '24px' }}>
                    <h3 style={{ marginTop: 0, marginBottom: '20px', fontSize: '16px' }}>Subscription Tier Mix</h3>
                    <div style={{ height: '300px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={subscriptionMix} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#4b5563' }} />
                                <Tooltip />
                                <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={30}>
                                    {subscriptionMix.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Ad Inventory Performance placeholder */}
            <div className="admin-card" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ margin: 0, fontSize: '16px' }}>📢 Advertising Hub Performance</h3>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <span style={{ fontSize: '12px', padding: '4px 8px', backgroundColor: '#ecfdf5', color: '#047857', borderRadius: '12px', fontWeight: '500' }}>Inventory: 94% full</span>
                    </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
                    <div style={{ padding: '16px', backgroundColor: '#f9fafb', borderRadius: '12px' }}>
                        <p style={{ margin: 0, color: '#6b7280', fontSize: '12px' }}>Total Impressions</p>
                        <p style={{ margin: '4px 0 0 0', fontSize: '20px', fontWeight: '700' }}>1.2M</p>
                    </div>
                    <div style={{ padding: '16px', backgroundColor: '#f9fafb', borderRadius: '12px' }}>
                        <p style={{ margin: 0, color: '#6b7280', fontSize: '12px' }}>Avg eCPM</p>
                        <p style={{ margin: '4px 0 0 0', fontSize: '20px', fontWeight: '700' }}>$12.40</p>
                    </div>
                    <div style={{ padding: '16px', backgroundColor: '#f9fafb', borderRadius: '12px' }}>
                        <p style={{ margin: 0, color: '#6b7280', fontSize: '12px' }}>Ad Fill Rate</p>
                        <p style={{ margin: '4px 0 0 0', fontSize: '20px', fontWeight: '700' }}>98.2%</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RevenueTab;
