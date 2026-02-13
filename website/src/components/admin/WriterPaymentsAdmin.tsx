import React, { useState, useEffect, useCallback } from 'react';
import { DollarSign } from 'lucide-react';
import { 
  getAllPaymentStatements, 
  updatePaymentStatementStatus,
  triggerStatementGeneration,
  WriterPaymentStatement 
} from '../../services/writerPaymentService';
import { getApprovedWriters, Writer } from '../../services/writerService';
import { requireSuperAdmin } from '../../services/authService';

interface WriterPaymentsAdminProps {
  userRoles: string[] | null;
}

const WriterPaymentsAdmin: React.FC<WriterPaymentsAdminProps> = ({ userRoles }) => {
  const [statements, setStatements] = useState<WriterPaymentStatement[]>([]);
  const [writers, setWriters] = useState<Writer[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved' | 'paid'>('pending');
  const [selectedWriter, setSelectedWriter] = useState<string>('all');
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  
  // Period selection for generation
  const [periodStart, setPeriodStart] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  });
  const [periodEnd, setPeriodEnd] = useState<string>(() => {
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return lastDay.toISOString().split('T')[0];
  });

  const loadData = useCallback(async () => {
    if (!userRoles || userRoles.length === 0) return;
    if (!requireSuperAdmin(userRoles)) return;
    
    try {
      setLoading(true);
      const [statementsData, writersData] = await Promise.all([
        getAllPaymentStatements(),
        getApprovedWriters()
      ]);
      setStatements(statementsData);
      setWriters(writersData);
    } catch (error: any) {
      console.error('Error loading payment data:', error);
      alert(`Failed to load payment data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [userRoles]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleGenerateStatements = async () => {
    if (!requireSuperAdmin(userRoles)) {
      alert('You do not have permission to generate statements.');
      return;
    }

    if (!confirm(`Generate payment statements for period ${periodStart} to ${periodEnd}?`)) {
      return;
    }

    try {
      setGenerating(true);
      const result = await triggerStatementGeneration(
        periodStart, 
        periodEnd, 
        selectedWriter !== 'all' ? selectedWriter : undefined
      );
      alert(`Successfully generated ${result.statementsGenerated} payment statements.`);
      await loadData();
    } catch (error: any) {
      alert(`Failed to generate statements: ${error.message}`);
    } finally {
      setGenerating(false);
    }
  };

  const handleStatusChange = async (
    writerId: string, 
    statementId: string, 
    newStatus: 'pending' | 'approved' | 'paid' | 'failed'
  ) => {
    if (!requireSuperAdmin(userRoles)) {
      alert('You do not have permission to update statement status.');
      return;
    }

    const statusLabel = newStatus === 'paid' ? 'paid' : newStatus === 'approved' ? 'approved' : newStatus;
    if (!confirm(`Mark this statement as ${statusLabel}?`)) {
      return;
    }

    try {
      setActionInProgress(statementId);
      const additionalData: { paidAt?: Date; transactionId?: string } = {};
      
      if (newStatus === 'paid') {
        additionalData.paidAt = new Date();
        // In a real implementation, you might prompt for transaction ID
        additionalData.transactionId = `TXN-${Date.now()}`;
      }
      
      await updatePaymentStatementStatus(writerId, statementId, newStatus, additionalData);
      await loadData();
    } catch (error: any) {
      alert(`Failed to update status: ${error.message}`);
    } finally {
      setActionInProgress(null);
    }
  };

  const filteredStatements = statements.filter(statement => {
    // Filter by tab/status
    if (activeTab !== 'all' && statement.status !== activeTab) {
      return false;
    }
    // Filter by selected writer
    if (selectedWriter !== 'all' && statement.writerId !== selectedWriter) {
      return false;
    }
    return true;
  });

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string }> = {
      pending: { bg: '#FEF3C7', text: '#D97706' },
      approved: { bg: '#DBEAFE', text: '#2563EB' },
      paid: { bg: '#D1FAE5', text: '#059669' },
      failed: { bg: '#FEE2E2', text: '#DC2626' }
    };
    const style = badges[status] || badges.pending;
    return (
      <span style={{
        padding: '2px 8px',
        borderRadius: '12px',
        fontSize: '0.75rem',
        fontWeight: '600',
        backgroundColor: style.bg,
        color: style.text,
        textTransform: 'capitalize'
      }}>
        {status}
      </span>
    );
  };

  // Calculate summary stats
  const summaryStats = {
    totalPending: statements.filter(s => s.status === 'pending').reduce((sum, s) => sum + s.totalAmountDue, 0),
    totalApproved: statements.filter(s => s.status === 'approved').reduce((sum, s) => sum + s.totalAmountDue, 0),
    totalPaid: statements.filter(s => s.status === 'paid').reduce((sum, s) => sum + s.totalAmountDue, 0),
    pendingCount: statements.filter(s => s.status === 'pending').length,
    approvedCount: statements.filter(s => s.status === 'approved').length,
    paidCount: statements.filter(s => s.status === 'paid').length,
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p style={{ color: '#6B7280' }}>Loading payment data...</p>
      </div>
    );
  }

  if (!requireSuperAdmin(userRoles)) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p style={{ color: '#DC2626' }}>You do not have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '1.5rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1F2937', marginBottom: '0.5rem' }}>
          Writer Payments
        </h2>
        <p style={{ color: '#6B7280', fontSize: '0.875rem' }}>
          Generate and manage payment statements for contributors
        </p>
      </div>

      {/* Summary Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '1rem', 
        marginBottom: '1.5rem' 
      }}>
        <div style={{ 
          padding: '1rem', 
          backgroundColor: '#FEF3C7', 
          borderRadius: '8px',
          border: '1px solid #FCD34D'
        }}>
          <p style={{ fontSize: '0.75rem', color: '#92400E', fontWeight: '600', marginBottom: '0.25rem' }}>
            PENDING
          </p>
          <p style={{ fontSize: '1.5rem', fontWeight: '700', color: '#D97706' }}>
            {formatCurrency(summaryStats.totalPending)}
          </p>
          <p style={{ fontSize: '0.75rem', color: '#B45309' }}>
            {summaryStats.pendingCount} statement{summaryStats.pendingCount !== 1 ? 's' : ''}
          </p>
        </div>
        
        <div style={{ 
          padding: '1rem', 
          backgroundColor: '#DBEAFE', 
          borderRadius: '8px',
          border: '1px solid #93C5FD'
        }}>
          <p style={{ fontSize: '0.75rem', color: '#1E40AF', fontWeight: '600', marginBottom: '0.25rem' }}>
            APPROVED
          </p>
          <p style={{ fontSize: '1.5rem', fontWeight: '700', color: '#2563EB' }}>
            {formatCurrency(summaryStats.totalApproved)}
          </p>
          <p style={{ fontSize: '0.75rem', color: '#1D4ED8' }}>
            {summaryStats.approvedCount} statement{summaryStats.approvedCount !== 1 ? 's' : ''}
          </p>
        </div>
        
        <div style={{ 
          padding: '1rem', 
          backgroundColor: '#D1FAE5', 
          borderRadius: '8px',
          border: '1px solid #6EE7B7'
        }}>
          <p style={{ fontSize: '0.75rem', color: '#065F46', fontWeight: '600', marginBottom: '0.25rem' }}>
            PAID (ALL TIME)
          </p>
          <p style={{ fontSize: '1.5rem', fontWeight: '700', color: '#059669' }}>
            {formatCurrency(summaryStats.totalPaid)}
          </p>
          <p style={{ fontSize: '0.75rem', color: '#047857' }}>
            {summaryStats.paidCount} statement{summaryStats.paidCount !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Generate Statements Section */}
      <div style={{ 
        padding: '1rem', 
        backgroundColor: '#F9FAFB', 
        borderRadius: '8px', 
        border: '1px solid #E5E7EB',
        marginBottom: '1.5rem'
      }}>
        <h3 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '1rem' }}>
          Generate Payment Statements
        </h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-end' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: '#6B7280', marginBottom: '0.25rem' }}>
              Period Start
            </label>
            <input
              type="date"
              value={periodStart}
              onChange={(e) => setPeriodStart(e.target.value)}
              style={{
                padding: '0.5rem',
                borderRadius: '6px',
                border: '1px solid #D1D5DB',
                fontSize: '0.875rem'
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: '#6B7280', marginBottom: '0.25rem' }}>
              Period End
            </label>
            <input
              type="date"
              value={periodEnd}
              onChange={(e) => setPeriodEnd(e.target.value)}
              style={{
                padding: '0.5rem',
                borderRadius: '6px',
                border: '1px solid #D1D5DB',
                fontSize: '0.875rem'
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: '#6B7280', marginBottom: '0.25rem' }}>
              Writer (optional)
            </label>
            <select
              value={selectedWriter}
              onChange={(e) => setSelectedWriter(e.target.value)}
              style={{
                padding: '0.5rem',
                borderRadius: '6px',
                border: '1px solid #D1D5DB',
                fontSize: '0.875rem',
                minWidth: '200px'
              }}
            >
              <option value="all">All Writers</option>
              {writers.map(writer => (
                <option key={writer.uid} value={writer.uid}>
                  {writer.displayName || writer.name || writer.email}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleGenerateStatements}
            disabled={generating}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: generating ? '#9CA3AF' : '#2563EB',
              color: 'white',
              borderRadius: '6px',
              border: 'none',
              fontWeight: '600',
              fontSize: '0.875rem',
              cursor: generating ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            {generating ? (
              <>
                <span style={{ 
                  width: '1rem', 
                  height: '1rem', 
                  border: '2px solid white', 
                  borderTopColor: 'transparent', 
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                Generating...
              </>
            ) : (
              '📄 Generate Statements'
            )}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ 
        display: 'flex', 
        gap: '0.5rem', 
        marginBottom: '1rem',
        borderBottom: '1px solid #E5E7EB',
        paddingBottom: '0.5rem'
      }}>
        {(['all', 'pending', 'approved', 'paid'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: activeTab === tab ? '#2563EB' : 'transparent',
              color: activeTab === tab ? 'white' : '#6B7280',
              borderRadius: '6px',
              border: 'none',
              fontWeight: '500',
              fontSize: '0.875rem',
              cursor: 'pointer',
              textTransform: 'capitalize'
            }}
          >
            {tab} {tab !== 'all' && `(${statements.filter(s => s.status === tab).length})`}
          </button>
        ))}
      </div>

      {/* Statements Table */}
      {filteredStatements.length === 0 ? (
        <div style={{ 
          padding: '3rem', 
          textAlign: 'center', 
          backgroundColor: '#F9FAFB', 
          borderRadius: '8px',
          border: '1px dashed #D1D5DB'
        }}>
          <p style={{ color: '#6B7280', fontSize: '0.875rem' }}>
            No payment statements found for the selected filters.
          </p>
          <p style={{ color: '#9CA3AF', fontSize: '0.75rem', marginTop: '0.5rem' }}>
            Generate statements using the form above.
          </p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#F9FAFB' }}>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#374151', borderBottom: '1px solid #E5E7EB' }}>
                  Writer
                </th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#374151', borderBottom: '1px solid #E5E7EB' }}>
                  Period
                </th>
                <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: '600', color: '#374151', borderBottom: '1px solid #E5E7EB' }}>
                  Articles
                </th>
                <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: '600', color: '#374151', borderBottom: '1px solid #E5E7EB' }}>
                  Words
                </th>
                <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600', color: '#374151', borderBottom: '1px solid #E5E7EB' }}>
                  Amount
                </th>
                <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: '600', color: '#374151', borderBottom: '1px solid #E5E7EB' }}>
                  Status
                </th>
                <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: '600', color: '#374151', borderBottom: '1px solid #E5E7EB' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredStatements.map((statement) => (
                <tr 
                  key={statement.id}
                  style={{ 
                    borderBottom: '1px solid #E5E7EB',
                    backgroundColor: actionInProgress === statement.id ? '#F3F4F6' : 'white'
                  }}
                >
                  <td style={{ padding: '0.75rem' }}>
                    <div style={{ fontWeight: '500', color: '#1F2937' }}>
                      {statement.writerName}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                      {statement.paymentModel} @ {formatCurrency(statement.rate, statement.currency)}/{statement.paymentModel === 'per-word' ? 'word' : statement.paymentModel === 'per-article' ? 'article' : 'month'}
                    </div>
                  </td>
                  <td style={{ padding: '0.75rem', color: '#4B5563' }}>
                    {formatDate(statement.periodStart)} - {formatDate(statement.periodEnd)}
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'center', color: '#4B5563' }}>
                    {statement.articlesCount}
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'center', color: '#4B5563' }}>
                    {statement.wordsCount?.toLocaleString() || '-'}
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600', color: '#1F2937' }}>
                    {formatCurrency(statement.totalAmountDue, statement.currency)}
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                    {getStatusBadge(statement.status)}
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                      {statement.status === 'pending' && (
                        <button
                          onClick={() => handleStatusChange(statement.writerId, statement.id, 'approved')}
                          disabled={actionInProgress === statement.id}
                          style={{
                            padding: '0.25rem 0.5rem',
                            backgroundColor: '#DBEAFE',
                            color: '#2563EB',
                            borderRadius: '4px',
                            border: 'none',
                            fontSize: '0.75rem',
                            fontWeight: '500',
                            cursor: 'pointer'
                          }}
                          title="Approve statement"
                        >
                          ✓ Approve
                        </button>
                      )}
                      {statement.status === 'approved' && (
                        <button
                          onClick={() => handleStatusChange(statement.writerId, statement.id, 'paid')}
                          disabled={actionInProgress === statement.id}
                          style={{
                            padding: '0.25rem 0.5rem',
                            backgroundColor: '#D1FAE5',
                            color: '#059669',
                            borderRadius: '4px',
                            border: 'none',
                            fontSize: '0.75rem',
                            fontWeight: '500',
                            cursor: 'pointer'
                          }}
                          title="Mark as paid"
                        >
                          <DollarSign size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} aria-hidden /> Mark Paid
                        </button>
                      )}
                      {statement.status === 'paid' && statement.paidAt && (
                        <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                          Paid {formatDate(statement.paidAt)}
                        </span>
                      )}
                      {(statement.status === 'pending' || statement.status === 'approved') && (
                        <button
                          onClick={() => handleStatusChange(statement.writerId, statement.id, 'failed')}
                          disabled={actionInProgress === statement.id}
                          style={{
                            padding: '0.25rem 0.5rem',
                            backgroundColor: '#FEE2E2',
                            color: '#DC2626',
                            borderRadius: '4px',
                            border: 'none',
                            fontSize: '0.75rem',
                            fontWeight: '500',
                            cursor: 'pointer'
                          }}
                          title="Mark as failed"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Export Button */}
      {filteredStatements.length > 0 && (
        <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={() => {
              // Generate CSV export
              const headers = ['Writer', 'Period Start', 'Period End', 'Articles', 'Words', 'Amount', 'Currency', 'Status'];
              const rows = filteredStatements.map(s => [
                s.writerName,
                formatDate(s.periodStart),
                formatDate(s.periodEnd),
                s.articlesCount,
                s.wordsCount || 0,
                s.totalAmountDue.toFixed(2),
                s.currency,
                s.status
              ]);
              const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
              const blob = new Blob([csv], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `payment-statements-${new Date().toISOString().split('T')[0]}.csv`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: 'white',
              color: '#374151',
              borderRadius: '6px',
              border: '1px solid #D1D5DB',
              fontWeight: '500',
              fontSize: '0.875rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            📥 Export CSV
          </button>
        </div>
      )}

      {/* Inline CSS for spinner animation */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default WriterPaymentsAdmin;
