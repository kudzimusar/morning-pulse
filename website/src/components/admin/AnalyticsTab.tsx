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
import { getAnalyticsSummary } from '../../services/analyticsService';
import MetricCard from './widgets/MetricCard';
import './AdminDashboard.css';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

interface AnalyticsTabProps {
  firebaseInstances?: any;
  isAuthorized?: boolean;
  userRoles?: string[];
}

const formatTime = (seconds: number) => {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
};

const AnalyticsTab: React.FC<AnalyticsTabProps> = ({
  firebaseInstances,
  isAuthorized,
  userRoles
}) => {
  const [loading, setLoading] = useState(true);
  const [trafficData, setTrafficData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [topArticles, setTopArticles] = useState<any[]>([]);
  const [kpis, setKpis] = useState<{ avgSession: string; bounceRate: number; pagesPerSession: number; totalShares: number }>({ avgSession: '—', bounceRate: 0, pagesPerSession: 0, totalShares: 0 });
  const [writerData, setWriterData] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const db = firebaseInstances?.db;
        const summary = db ? await getAnalyticsSummary(db) : null;

        if (summary) {
          setTrafficData((summary.dailyTraffic || []).map((d) => ({
            date: new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' }),
            views: d.views || 0,
            users: Math.round((d.views || 0) * 0.4),
          })));
          const catEntries = summary.categoryDistribution ? Object.entries(summary.categoryDistribution).map(([name, value]) => ({ name, value })) : [];
          setCategoryData(catEntries.length > 0 ? catEntries : [{ name: 'No data', value: 1 }]);
          const articles = (summary.topArticles || summary.topOpinions || []).slice(0, 5).map((a: any) => ({
            id: a.id,
            title: a.title || a.headline || 'Untitled',
            views: a.views || 0,
            ctr: a.engagement ? `${((a.engagement / (a.views || 1)) * 100).toFixed(1)}%` : '—',
          }));
          setTopArticles(articles);
          setKpis({
            avgSession: formatTime(summary.avgTimeOnPage || 0),
            bounceRate: summary.bounceRate ?? 0,
            pagesPerSession: summary.uniqueVisitors > 0 ? Number(((summary.totalViews || 0) / summary.uniqueVisitors).toFixed(1)) : 0,
            totalShares: summary.totalViews || 0,
          });
          const authors = (summary.topAuthors || []).slice(0, 5).map((a: any, i: number) => ({
            name: a.authorName,
            avg: a.avgViewsPerArticle || 0,
            rank: i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}th`,
          }));
          setWriterData(authors);
        } else {
          setTrafficData([]);
          setCategoryData([{ name: 'No data', value: 1 }]);
          setTopArticles([]);
          setWriterData([]);
        }
      } catch (e) {
        console.error('Analytics load error:', e);
        setTrafficData([]);
        setCategoryData([{ name: 'No data', value: 1 }]);
        setTopArticles([]);
        setWriterData([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [firebaseInstances?.db]);

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
        <MetricCard title="Avg Session" value={kpis.avgSession} trend="neutral" icon="⏱️" color="#3b82f6" />
        <MetricCard title="Bounce Rate" value={`${kpis.bounceRate.toFixed(1)}%`} trend="neutral" icon="🚪" color="#ef4444" />
        <MetricCard title="Pages/Session" value={kpis.pagesPerSession} trend="neutral" icon="📖" color="#10b981" />
        <MetricCard title="Total Views" value={kpis.totalShares.toLocaleString()} trend="neutral" icon="🔗" color="#8b5cf6" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '24px' }}>
        {/* Main Traffic Chart */}
        <div className="admin-card" style={{ padding: '24px' }}>
          <h3 style={{ marginTop: 0, marginBottom: '20px', fontSize: '16px' }}>Traffic Volume (Weekly)</h3>
          <div style={{ height: 300, minHeight: 300, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={280}>
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
          <div style={{ height: 300, minHeight: 300, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={280}>
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
              {writerData.length > 0 ? writerData.map((writer, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: '500', fontSize: '13px' }}>{writer.name}</td>
                  <td style={{ fontSize: '13px' }}>{writer.avg.toLocaleString()}</td>
                  <td style={{ fontSize: '13px' }}>{writer.rank}</td>
                </tr>
              )) : (
                <tr><td colSpan={3} style={{ color: '#6b7280', fontSize: '13px' }}>No writer data yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsTab;
