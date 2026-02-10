import React, { useState, useEffect } from 'react';
import MetricCard from './widgets/MetricCard';
import PerformanceChart from './widgets/PerformanceChart';
import './AdminDashboard.css';

const RevenueTab: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [revenueData, setRevenueData] = useState<any[]>([]);

    useEffect(() => {
        // Mock data simulation
        setTimeout(() => {
            setRevenueData([
                { name: 'Jan', revenue: 12000, subs: 8000, ads: 4000 },
                { name: 'Feb', revenue: 15400, subs: 10000, ads: 5400 },
                { name: 'Mar', revenue: 18900, subs: 12500, ads: 6400 },
                { name: 'Apr', revenue: 22100, subs: 15000, ads: 7100 },
                { name: 'May', revenue: 28400, subs: 19000, ads: 9400 },
                { name: 'Jun', revenue: 35200, subs: 24000, ads: 11200 },
                { name: 'Jul', revenue: 45230, subs: 30000, ads: 15230 },
            ]);
            setLoading(false);
        }, 800);
    }, []);

    if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Analyzing financial records...</div>;

    return (
        <div className="fade-in">
            <header style={{ marginBottom: '24px' }}>
                <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700' }}>Revenue & Monetization</h2>
                <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: '14px' }}>
                    Track subscription growth, ad performance, and overall platform ROI.
                </p>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                <MetricCard
                    title="Total Revenue"
                    value="$45,230.50"
                    change={18}
                    trend="up"
                    icon="💰"
                    color="#10b981"
                    description="Gross income this month"
                />
                <MetricCard
                    title="Subscriptions"
                    value="$30,000.00"
                    change={22}
                    trend="up"
                    icon="💎"
                    color="#3b82f6"
                    description="MRR from active plans"
                />
                <MetricCard
                    title="Ad Revenue"
                    value="$15,230.50"
                    change={9}
                    trend="up"
                    icon="📢"
                    color="#f59e0b"
                    description="Programmatic & Direct ads"
                />
                <MetricCard
                    title="Churn Rate"
                    value="2.3%"
                    change={0.5}
                    trend="down"
                    icon="📉"
                    color="#ef4444"
                    description="Subscriber retention"
                />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
                <div className="admin-card" style={{ padding: '24px' }}>
                    <PerformanceChart
                        title="Revenue Trend (Subscriptions vs Ads)"
                        data={revenueData}
                        xKey="name"
                        yKey="revenue"
                        color="#4f46e5"
                    />
                </div>

                <div className="admin-card" style={{ padding: '24px' }}>
                    <h3 style={{ marginTop: 0, fontSize: '16px', fontWeight: '600' }}>Subscription Tiers</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '20px' }}>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '4px' }}>
                                <span>Free Tier</span>
                                <span style={{ fontWeight: '600' }}>12,847 users</span>
                            </div>
                            <div style={{ height: '8px', backgroundColor: '#f3f4f6', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{ width: '100%', height: '100%', backgroundColor: '#9ca3af' }}></div>
                            </div>
                        </div>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '4px' }}>
                                <span>Monthly Pro</span>
                                <span style={{ fontWeight: '600' }}>1,234 subs</span>
                            </div>
                            <div style={{ height: '8px', backgroundColor: '#f3f4f6', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{ width: '65%', height: '100%', backgroundColor: '#3b82f6' }}></div>
                            </div>
                        </div>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '4px' }}>
                                <span>Annual Premium</span>
                                <span style={{ fontWeight: '600' }}>845 subs</span>
                            </div>
                            <div style={{ height: '8px', backgroundColor: '#f3f4f6', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{ width: '45%', height: '100%', backgroundColor: '#10b981' }}></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RevenueTab;
