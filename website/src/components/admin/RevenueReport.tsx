import React, { useState, useEffect } from 'react';
import { getRevenueSummary } from '../../services/billingService';
import { getApprovedAdvertisers, Advertiser } from '../../services/advertiserService';

interface RevenueReportProps {
  userRoles: string[] | null;
}

const RevenueReport: React.FC<RevenueReportProps> = ({ userRoles }) => {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [selectedAdvertiser, setSelectedAdvertiser] = useState<string | null>(null);
  const [advertisers, setAdvertisers] = useState<Advertiser[]>([]);

  useEffect(() => {
    loadData();
  }, [dateRange, selectedAdvertiser]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const advertisersList = await getApprovedAdvertisers();
      setAdvertisers(advertisersList);
      
      const now = new Date();
      let startDate: Date | undefined;
      
      if (dateRange === '7d') {
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (dateRange === '30d') {
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      } else if (dateRange === '90d') {
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      }
      
      const revenueSummary = await getRevenueSummary({
        startDate,
        advertiserId: selectedAdvertiser || undefined,
      });
      
      setSummary(revenueSummary);
    } catch (error: any) {
      console.error('Error loading revenue report:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '32px', textAlign: 'center' }}>Loading revenue report...</div>;
  }

  if (!summary) {
    return <div style={{ padding: '32px', textAlign: 'center' }}>No revenue data available.</div>;
  }

  const collectionRate = summary.totalRevenue > 0 
    ? ((summary.totalRevenue / (summary.totalRevenue + summary.pendingRevenue)) * 100).toFixed(1)
    : '0';

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0 }}>Revenue Report</h3>
        <div style={{ display: 'flex', gap: '12px' }}>
          <select
            value={selectedAdvertiser || ''}
            onChange={(e) => setSelectedAdvertiser(e.target.value || null)}
            style={{
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '0.875rem'
            }}
          >
            <option value="">All Advertisers</option>
            {advertisers.map((adv) => (
              <option key={adv.uid} value={adv.uid}>
                {adv.companyName}
              </option>
            ))}
          </select>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            style={{
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '0.875rem'
            }}
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="all">All time</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '32px'
      }}>
        <div style={{
          padding: '20px',
          backgroundColor: 'white',
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '8px' }}>Total Revenue</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#16a34a' }}>
            ${summary.totalRevenue.toLocaleString()}
          </div>
        </div>
        
        <div style={{
          padding: '20px',
          backgroundColor: 'white',
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '8px' }}>Pending Revenue</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b' }}>
            ${summary.pendingRevenue.toLocaleString()}
          </div>
        </div>
        
        <div style={{
          padding: '20px',
          backgroundColor: 'white',
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '8px' }}>Collection Rate</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
            {collectionRate}%
          </div>
        </div>
        
        <div style={{
          padding: '20px',
          backgroundColor: 'white',
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '8px' }}>Paid Invoices</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
            {summary.paidInvoices}
          </div>
        </div>
        
        <div style={{
          padding: '20px',
          backgroundColor: 'white',
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '8px' }}>Pending Invoices</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b' }}>
            {summary.pendingInvoices}
          </div>
        </div>
        
        <div style={{
          padding: '20px',
          backgroundColor: 'white',
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '8px' }}>Overdue Invoices</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ef4444' }}>
            {summary.overdueInvoices}
          </div>
        </div>
      </div>

      {/* Revenue Breakdown */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        border: '1px solid #e5e7eb',
        padding: '24px'
      }}>
        <h4 style={{ margin: '0 0 16px 0' }}>Revenue Breakdown</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '4px' }}>Total Billed</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
              ${(summary.totalRevenue + summary.pendingRevenue).toLocaleString()}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '4px' }}>Collected</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#16a34a' }}>
              ${summary.totalRevenue.toLocaleString()}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '4px' }}>Outstanding</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f59e0b' }}>
              ${summary.pendingRevenue.toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RevenueReport;
