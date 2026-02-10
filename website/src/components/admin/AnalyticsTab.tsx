import React, { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { exportToCSV } from '../../services/csvExportService';
import './AdminDashboard.css';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

interface AnalyticsTabProps {
  firebaseInstances?: any;
  isAuthorized?: boolean;
  userRoles?: string[];
}

const AnalyticsTab: React.FC<AnalyticsTabProps> = ({
  firebaseInstances,
  isAuthorized,
  userRoles
}) => {
  const [loading, setLoading] = useState(true);
  const [trafficData, setTrafficData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [topArticles, setTopArticles] = useState<any[]>([]);

  useEffect(() => {
    // Simulating data load from analyticsService
    setTimeout(() => {
      setTrafficData([
        { date: 'Mon', views: 4200, users: 1200 },
        { date: 'Tue', views: 3800, users: 1100 },
        { date: 'Wed', views: 5100, users: 1500 },
        { date: 'Thu', views: 4800, users: 1400 },
        { date: 'Fri', views: 6200, users: 1900 },
        { date: 'Sat', views: 7500, users: 2400 },
        { date: 'Sun', views: 8900, users: 2800 },
      ]);

      setCategoryData([
        { name: 'Politics', value: 35 },
        { name: 'Business', value: 25 },
        { name: 'Tech', value: 20 },
        { name: 'Lifestyle', value: 15 },
        { name: 'Other', value: 5 },
      ]);

      setTopArticles([
        { id: '1', title: 'The Future of AI in Journalism', views: 12450, ctr: '4.2%' },
        { id: '2', title: 'Global Economy Trends 2026', views: 9800, ctr: '3.8%' },
        { id: '3', title: 'Climate Change: Local Impact', views: 8200, ctr: '5.1%' },
        { id: '4', title: 'Morning Pulse Exceeds Growth Target', views: 7600, ctr: '4.5%' },
        { id: '5', title: 'New Tech Hub in Nairobi', views: 6400, ctr: '2.9%' },
      ]);

      setLoading(false);
    }, 1000);
  }, []);

  const handleExport = () => {
    exportToCSV(topArticles, 'Top_Articles');
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Synchronizing analytics engine...</div>;

  return (
    <div className="fade-in">
      <header style={{ marginBottom: '24px' }}>
        <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700' }}>Analytics Hub</h2>
        <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: '14px' }}>
          Real-time metrics on reader engagement, content performance, and traffic sources.
        </p>
      </header>

      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '24px' }}>
        <MetricCard title="Avg Session" value="4m 32s" trend="up" change={5} icon="⏱️" color="#3b82f6" />
        <MetricCard title="Bounce Rate" value="32.5%" trend="down" change={2} icon="🚪" color="#ef4444" />
        <MetricCard title="Pages/Session" value="3.8" trend="up" change={12} icon="📖" color="#10b981" />
        <MetricCard title="Total Shares" value="12,845" trend="up" change={8} icon="🔗" color="#8b5cf6" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '24px' }}>
        {/* Main Traffic Chart */}
        <div className="admin-card" style={{ padding: '24px' }}>
          <h3 style={{ marginTop: 0, marginBottom: '20px', fontSize: '16px' }}>Traffic Volume (Weekly)</h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trafficData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                <Tooltip
                  cursor={{ fill: '#f9fafb' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                />
                <Bar dataKey="views" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Content Breakdown */}
        <div className="admin-card" style={{ padding: '24px' }}>
          <h3 style={{ marginTop: 0, marginBottom: '20px', fontSize: '16px' }}>Categorical Distribution</h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend layout="vertical" align="right" verticalAlign="middle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Tables Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div className="admin-card">
          <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '16px' }}>🏆 Top Articles</h3>
            <button className="admin-button admin-button-secondary" style={{ fontSize: '12px' }} onClick={handleExport}>Export</button>
          </div>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Headline</th>
                <th>Views</th>
                <th>CTR</th>
              </tr>
            </thead>
            <tbody>
              {topArticles.map(article => (
                <tr key={article.id}>
                  <td style={{ fontWeight: '500', fontSize: '13px' }}>{article.title}</td>
                  <td style={{ fontSize: '13px' }}>{article.views.toLocaleString()}</td>
                  <td style={{ fontSize: '13px' }}>{article.ctr}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="admin-card">
          <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '16px' }}>✍️ Writer Efficiency (ROI)</h3>
            <button className="admin-button admin-button-secondary" style={{ fontSize: '12px' }}>Details</button>
          </div>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Writer</th>
                <th>Avg Views/Art</th>
                <th>Rank</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: 'John Doe', avg: 12450, rank: '🥇' },
                { name: 'Sarah Chen', avg: 9800, rank: '🥈' },
                { name: 'Mike Brown', avg: 8200, rank: '🥉' },
                { name: 'Emily White', avg: 7600, rank: '4th' },
                { name: 'David Black', avg: 6400, rank: '5th' },
              ].map((writer, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: '500', fontSize: '13px' }}>{writer.name}</td>
                  <td style={{ fontSize: '13px' }}>{writer.avg.toLocaleString()}</td>
                  <td style={{ fontSize: '13px' }}>{writer.rank}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsTab;
