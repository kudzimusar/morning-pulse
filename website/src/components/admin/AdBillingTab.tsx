import React, { useState, useEffect } from 'react';
import { getAdvertiserInvoices, Invoice, getApprovedAdvertisers, Advertiser } from '../../services/advertiserService';

interface AdBillingTabProps {
  userRoles: string[] | null;
}

const AdBillingTab: React.FC<AdBillingTabProps> = ({ userRoles }) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [advertisers, setAdvertisers] = useState<Advertiser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAdvertiser, setSelectedAdvertiser] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<Invoice['status'] | 'all'>('all');

  useEffect(() => {
    loadData();
  }, [selectedAdvertiser]);

  const loadData = async () => {
    try {
      setLoading(true);
      const advertisersList = await getApprovedAdvertisers();
      setAdvertisers(advertisersList);

      if (selectedAdvertiser) {
        const invoicesList = await getAdvertiserInvoices(selectedAdvertiser);
        setInvoices(invoicesList);
      } else {
        // Load all invoices (would need admin method)
        setInvoices([]);
      }
    } catch (error: any) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredInvoices = invoices.filter(inv => 
    filterStatus === 'all' || inv.status === filterStatus
  );

  const totalRevenue = filteredInvoices
    .filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + inv.amount, 0);

  const pendingAmount = filteredInvoices
    .filter(inv => inv.status === 'sent' || inv.status === 'overdue')
    .reduce((sum, inv) => sum + inv.amount, 0);

  if (loading) {
    return <div style={{ padding: '32px', textAlign: 'center' }}>Loading billing data...</div>;
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ marginBottom: '16px' }}>Billing & Invoices</h3>
        
        {/* Summary Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}>
          <div style={{
            padding: '20px',
            backgroundColor: 'white',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '8px' }}>Total Revenue</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#16a34a' }}>
              ${totalRevenue.toLocaleString()}
            </div>
          </div>
          
          <div style={{
            padding: '20px',
            backgroundColor: 'white',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '8px' }}>Pending</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f59e0b' }}>
              ${pendingAmount.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: '500' }}>
              Filter by Advertiser:
            </label>
            <select
              value={selectedAdvertiser || ''}
              onChange={(e) => setSelectedAdvertiser(e.target.value || null)}
              style={{
                width: '100%',
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
          </div>
          
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: '500' }}>
              Filter by Status:
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '0.875rem'
              }}
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Invoices List */}
      {filteredInvoices.length === 0 ? (
        <div style={{
          padding: '48px',
          textAlign: 'center',
          backgroundColor: '#f9fafb',
          borderRadius: '8px',
          border: '1px solid #e5e7eb'
        }}>
          <p style={{ color: '#6b7280', margin: 0 }}>
            {selectedAdvertiser ? 'No invoices found for this advertiser.' : 'Select an advertiser to view invoices.'}
          </p>
        </div>
      ) : (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
          overflow: 'hidden'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280' }}>Invoice #</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280' }}>Advertiser</th>
                <th style={{ padding: '12px', textAlign: 'right', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280' }}>Amount</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280' }}>Status</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280' }}>Due Date</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280' }}>Created</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((invoice) => {
                const advertiser = advertisers.find(a => a.uid === invoice.advertiserId);
                return (
                  <tr key={invoice.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '12px', fontSize: '0.875rem', fontFamily: 'monospace' }}>
                      {invoice.invoiceNumber || invoice.id.substring(0, 8)}
                    </td>
                    <td style={{ padding: '12px', fontSize: '0.875rem' }}>
                      {advertiser?.companyName || 'Unknown'}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', fontSize: '0.875rem', fontWeight: '500' }}>
                      ${invoice.amount.toLocaleString()} {invoice.currency}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span
                        style={{
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          backgroundColor:
                            invoice.status === 'paid'
                              ? '#d1fae5'
                              : invoice.status === 'overdue'
                              ? '#fee2e2'
                              : invoice.status === 'sent'
                              ? '#dbeafe'
                              : '#f3f4f6',
                          color:
                            invoice.status === 'paid'
                              ? '#065f46'
                              : invoice.status === 'overdue'
                              ? '#991b1b'
                              : invoice.status === 'sent'
                              ? '#1e40af'
                              : '#374151'
                        }}
                      >
                        {invoice.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px', fontSize: '0.875rem' }}>
                      {invoice.dueDate.toLocaleDateString()}
                    </td>
                    <td style={{ padding: '12px', fontSize: '0.875rem' }}>
                      {invoice.createdAt.toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdBillingTab;
