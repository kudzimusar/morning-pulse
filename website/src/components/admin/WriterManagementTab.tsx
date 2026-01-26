import React, { useState, useEffect } from 'react';
import { getPendingWriters, getApprovedWriters, approveWriter, rejectWriter, Writer } from '../../services/writerService';
import { requireSuperAdmin } from '../../services/authService';

interface WriterManagementTabProps {
  userRoles: string[] | null;
}

const WriterManagementTab: React.FC<WriterManagementTabProps> = ({ userRoles }) => {
  const [pendingWriters, setPendingWriters] = useState<Writer[]>([]);
  const [approvedWriters, setApprovedWriters] = useState<Writer[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved'>('pending');
  const [rejectReason, setRejectReason] = useState<{ [key: string]: string }>({});
  const [showRejectForm, setShowRejectForm] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    // ✅ FIX: Wait for auth handshake to complete before fetching
    if (!userRoles || userRoles.length === 0) {
      return;
    }
    if (!requireSuperAdmin(userRoles)) {
      return;
    }
    loadWriters();
  }, [userRoles]);

  const loadWriters = async () => {
    try {
      setLoading(true);
      const [pending, approved] = await Promise.all([
        getPendingWriters(),
        getApprovedWriters(),
      ]);
      setPendingWriters(pending);
      setApprovedWriters(approved);
    } catch (error: any) {
      console.error('Error loading writers:', error);
      alert(`Failed to load writers: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (uid: string) => {
    if (!requireSuperAdmin(userRoles)) {
      alert('You do not have permission to approve writers.');
      return;
    }

    if (!confirm('Are you sure you want to approve this writer?')) {
      return;
    }

    try {
      await approveWriter(uid);
      alert('Writer approved successfully!');
      await loadWriters();
    } catch (error: any) {
      alert(`Failed to approve writer: ${error.message}`);
    }
  };

  const handleReject = async (uid: string) => {
    if (!requireSuperAdmin(userRoles)) {
      alert('You do not have permission to reject writers.');
      return;
    }

    const reason = rejectReason[uid]?.trim();
    if (!reason) {
      alert('Please provide a reason for rejection.');
      return;
    }

    if (!confirm('Are you sure you want to reject this writer?')) {
      return;
    }

    try {
      await rejectWriter(uid, reason);
      alert('Writer rejected.');
      setRejectReason({ ...rejectReason, [uid]: '' });
      setShowRejectForm({ ...showRejectForm, [uid]: false });
      await loadWriters();
    } catch (error: any) {
      alert(`Failed to reject writer: ${error.message}`);
    }
  };

  if (!requireSuperAdmin(userRoles)) {
    return (
      <div style={{ padding: '32px', textAlign: 'center' }}>
        <h2>Access Denied</h2>
        <p>You do not have permission to manage writers. Super Admin access required.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ padding: '32px', textAlign: 'center' }}>
        <p>Loading writers...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ margin: '0 0 16px 0', fontSize: '1.5rem' }}>Writer Management</h2>
        
        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #e5e7eb' }}>
          <button
            onClick={() => setActiveTab('pending')}
            style={{
              padding: '12px 24px',
              border: 'none',
              backgroundColor: 'transparent',
              borderBottom: activeTab === 'pending' ? '2px solid #000' : '2px solid transparent',
              cursor: 'pointer',
              fontWeight: activeTab === 'pending' ? '600' : '400',
              color: activeTab === 'pending' ? '#000' : '#6b7280'
            }}
          >
            Pending Approval ({pendingWriters.length})
          </button>
          <button
            onClick={() => setActiveTab('approved')}
            style={{
              padding: '12px 24px',
              border: 'none',
              backgroundColor: 'transparent',
              borderBottom: activeTab === 'approved' ? '2px solid #000' : '2px solid transparent',
              cursor: 'pointer',
              fontWeight: activeTab === 'approved' ? '600' : '400',
              color: activeTab === 'approved' ? '#000' : '#6b7280'
            }}
          >
            Approved Writers ({approvedWriters.length})
          </button>
        </div>
      </div>

      {/* Pending Writers */}
      {activeTab === 'pending' && (
        <div>
          {pendingWriters.length === 0 ? (
            <div style={{
              padding: '48px',
              textAlign: 'center',
              backgroundColor: '#f9fafb',
              borderRadius: '8px',
              border: '1px solid #e5e7eb'
            }}>
              <p style={{ color: '#6b7280', margin: 0 }}>No pending writer applications.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {pendingWriters.map((writer) => (
                <div
                  key={writer.uid}
                  style={{
                    padding: '20px',
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ margin: '0 0 8px 0', fontSize: '1.125rem' }}>{writer.name}</h3>
                      <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '8px' }}>
                        {writer.email}
                      </div>
                      {writer.bio && (
                        <p style={{
                          margin: '8px 0',
                          fontSize: '0.875rem',
                          color: '#374151',
                          lineHeight: '1.6'
                        }}>
                          {writer.bio}
                        </p>
                      )}
                      {writer.expertise && writer.expertise.length > 0 && (
                        <div style={{ marginTop: '8px' }}>
                          <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>Expertise: </span>
                          {writer.expertise.map((exp, idx) => (
                            <span
                              key={idx}
                              style={{
                                display: 'inline-block',
                                padding: '2px 8px',
                                margin: '0 4px 4px 0',
                                backgroundColor: '#f3f4f6',
                                borderRadius: '4px',
                                fontSize: '0.75rem'
                              }}
                            >
                              {exp}
                            </span>
                          ))}
                        </div>
                      )}
                      <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '8px' }}>
                        Applied: {writer.createdAt.toLocaleDateString()}
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginLeft: '16px' }}>
                      <button
                        onClick={() => handleApprove(writer.uid)}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#16a34a',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        Approve
                      </button>
                      
                      {!showRejectForm[writer.uid] ? (
                        <button
                          onClick={() => setShowRejectForm({ ...showRejectForm, [writer.uid]: true })}
                          style={{
                            padding: '8px 16px',
                            backgroundColor: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          Reject
                        </button>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '200px' }}>
                          <textarea
                            value={rejectReason[writer.uid] || ''}
                            onChange={(e) => setRejectReason({ ...rejectReason, [writer.uid]: e.target.value })}
                            placeholder="Reason for rejection..."
                            rows={3}
                            style={{
                              padding: '8px',
                              border: '1px solid #d1d5db',
                              borderRadius: '6px',
                              fontSize: '0.875rem',
                              resize: 'vertical',
                              fontFamily: 'inherit'
                            }}
                          />
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              onClick={() => handleReject(writer.uid)}
                              style={{
                                flex: 1,
                                padding: '6px 12px',
                                backgroundColor: '#ef4444',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '0.75rem'
                              }}
                            >
                              Confirm Reject
                            </button>
                            <button
                              onClick={() => {
                                setShowRejectForm({ ...showRejectForm, [writer.uid]: false });
                                setRejectReason({ ...rejectReason, [writer.uid]: '' });
                              }}
                              style={{
                                flex: 1,
                                padding: '6px 12px',
                                backgroundColor: '#6b7280',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '0.75rem'
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Approved Writers */}
      {activeTab === 'approved' && (
        <div>
          {approvedWriters.length === 0 ? (
            <div style={{
              padding: '48px',
              textAlign: 'center',
              backgroundColor: '#f9fafb',
              borderRadius: '8px',
              border: '1px solid #e5e7eb'
            }}>
              <p style={{ color: '#6b7280', margin: 0 }}>No approved writers yet.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {approvedWriters.map((writer) => (
                <div
                  key={writer.uid}
                  style={{
                    padding: '20px',
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ margin: '0 0 8px 0', fontSize: '1.125rem' }}>{writer.name}</h3>
                      <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '8px' }}>
                        {writer.email}
                      </div>
                      {writer.bio && (
                        <p style={{
                          margin: '8px 0',
                          fontSize: '0.875rem',
                          color: '#374151',
                          lineHeight: '1.6'
                        }}>
                          {writer.bio}
                        </p>
                      )}
                      <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '8px' }}>
                        Approved: {writer.approvedAt?.toLocaleDateString() || 'N/A'}
                      </div>
                    </div>
                    <div>
                      <span
                        style={{
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          backgroundColor: '#d1fae5',
                          color: '#065f46'
                        }}
                      >
                        Approved
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WriterManagementTab;
