import React, { useEffect, useState } from 'react';
import { DollarSign, Users, Megaphone, TrendingDown } from 'lucide-react';
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
import { exportToCSV } from '../../services/csvExportService';
import { fetchRevenueMetrics } from '../../services/dashboardService';
import MetricCard from './widgets/MetricCard';
import './AdminDashboard.css';

const RevenueTab: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [revenueTrend, setRevenueTrend] = useState<any[]>([]);
    const [subscriptionMix, setSubscriptionMix] = useState<any[]>([]);
    const [metrics, setMetrics] = useState<{ mtdRevenue: number; activeSubs: number; adImpressions: number; adClicks: number; adRevenue: number } | null>(null);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const m = await fetchRevenueMetrics();
                setMetrics(m);
                setRevenueTrend(m.revenueTrend.length > 0 ? m.revenueTrend : [{ month: '—', revenue: 0 }]);
                setSubscriptionMix(m.subscriptionMix);
            } catch (e) {
                console.error('Revenue load error:', e);
                setRevenueTrend([{ month: '—', revenue: 0 }]);
                setSubscriptionMix([{ name: 'No data', count: 1, color: '#9ca3af' }]);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading financial oversight engine...</div>;

    return (
        <div className="fade-in">
            <header style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700' }}>Revenue Control</h2>
                    <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: '14px' }}>
                        Monetization performance, subscription health, and fiscal projections.
                    </p>
                </div>
                <button
                    className="admin-button admin-button-secondary"
                    onClick={() => exportToCSV(revenueTrend, 'Revenue_Report')}
                >
                    Export Report
                </button>
            </header>

            {/* KPI Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '24px' }}>
                <MetricCard title="MTD Revenue" value={`$${(metrics?.mtdRevenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`} trend="neutral" icon={<DollarSign size={18} />} color="#10b981" />
                <MetricCard title="Active Subs" value={(metrics?.activeSubs || 0).toLocaleString()} trend="neutral" icon={<Users size={18} />} color="#f59e0b" />
                <MetricCard title="Ad Impressions" value={(metrics?.adImpressions || 0).toLocaleString()} trend="neutral" icon={<Megaphone size={18} />} color="#3b82f6" />
                <MetricCard title="Ad Revenue" value={`$${(metrics?.adRevenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`} trend="neutral" icon={<TrendingDown size={18} />} color="#8b5cf6" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '24px' }}>
                {/* Revenue Growth Chart */}
                <div className="admin-card" style={{ padding: '24px' }}>
                    <h3 style={{ marginTop: 0, marginBottom: '20px', fontSize: '16px' }}>Monthly Revenue Growth (MRR)</h3>
                    <div style={{ height: 300, minHeight: 300, width: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={280}>
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
                    <div style={{ height: 300, minHeight: 300, width: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={280}>
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

            {/* Ad Inventory Performance */}
            <div className="admin-card" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ margin: 0, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}><Megaphone size={18} aria-hidden /> Advertising Hub Performance</h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
                    <div style={{ padding: '16px', backgroundColor: '#f9fafb', borderRadius: '12px' }}>
                        <p style={{ margin: 0, color: '#6b7280', fontSize: '12px' }}>Total Impressions</p>
                        <p style={{ margin: '4px 0 0 0', fontSize: '20px', fontWeight: '700' }}>{(metrics?.adImpressions || 0).toLocaleString()}</p>
                    </div>
                    <div style={{ padding: '16px', backgroundColor: '#f9fafb', borderRadius: '12px' }}>
                        <p style={{ margin: 0, color: '#6b7280', fontSize: '12px' }}>Total Clicks</p>
                        <p style={{ margin: '4px 0 0 0', fontSize: '20px', fontWeight: '700' }}>{(metrics?.adClicks || 0).toLocaleString()}</p>
                    </div>
                    <div style={{ padding: '16px', backgroundColor: '#f9fafb', borderRadius: '12px' }}>
                        <p style={{ margin: 0, color: '#6b7280', fontSize: '12px' }}>CTR</p>
                        <p style={{ margin: '4px 0 0 0', fontSize: '20px', fontWeight: '700' }}>
                            {metrics?.adImpressions ? `${((metrics.adClicks / metrics.adImpressions) * 100).toFixed(2)}%` : '0%'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RevenueTab;
