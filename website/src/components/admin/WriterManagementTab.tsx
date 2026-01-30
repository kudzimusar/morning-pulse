import React, { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import { 
  getPendingWriters, 
  getApprovedWriters, 
  approveWriter, 
  rejectWriter, 
  Writer,
  setWriterTier,
  setWriterBeats,
  suspendWriter,
  unsuspendWriter,
  assignEditorToWriter,
  removeEditorFromWriter
} from '../../services/writerService';
import { requireSuperAdmin } from '../../services/authService';

// Common beats/topics for writers
const AVAILABLE_BEATS = [
  'Politics',
  'Business',
  'Technology',
  'Culture',
  'Sports',
  'Health',
  'Environment',
  'Education',
  'Entertainment',
  'International',
  'Investigation',
  'Opinion',
  'Feature',
  'Breaking News'
];

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
  
  // Governance controls state
  const [expandedWriter, setExpandedWriter] = useState<string | null>(null);
  const [suspendReason, setSuspendReason] = useState<{ [key: string]: string }>({});
  const [showSuspendForm, setShowSuspendForm] = useState<{ [key: string]: boolean }>({});
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

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

  // ============================================
  // GOVERNANCE HANDLERS (Sprint 1)
  // ============================================

  const handleSetTier = async (uid: string, tier: 'staff' | 'freelance' | 'contributor' | 'guest') => {
    setActionInProgress(uid);
    try {
      await setWriterTier(uid, tier);
      await loadWriters();
    } catch (error: any) {
      alert(`Failed to set tier: ${error.message}`);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleSetBeats = async (uid: string, beats: string[]) => {
    setActionInProgress(uid);
    try {
      await setWriterBeats(uid, beats);
      await loadWriters();
    } catch (error: any) {
      alert(`Failed to update beats: ${error.message}`);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleSuspend = async (uid: string) => {
    const reason = suspendReason[uid]?.trim();
    if (!reason) {
      alert('Please provide a reason for suspension.');
      return;
    }

    if (!confirm('Are you sure you want to suspend this writer?')) {
      return;
    }

    const auth = getAuth();
    const currentUser = auth.currentUser;

    setActionInProgress(uid);
    try {
      await suspendWriter(
        uid, 
        reason, 
        currentUser?.uid || 'unknown',
        currentUser?.displayName || currentUser?.email || 'Admin'
      );
      alert('Writer suspended.');
      setSuspendReason({ ...suspendReason, [uid]: '' });
      setShowSuspendForm({ ...showSuspendForm, [uid]: false });
      await loadWriters();
    } catch (error: any) {
      alert(`Failed to suspend writer: ${error.message}`);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleUnsuspend = async (uid: string) => {
    if (!confirm('Are you sure you want to unsuspend this writer?')) {
      return;
    }

    setActionInProgress(uid);
    try {
      await unsuspendWriter(uid);
      alert('Writer unsuspended.');
      await loadWriters();
    } catch (error: any) {
      alert(`Failed to unsuspend writer: ${error.message}`);
    } finally {
      setActionInProgress(null);
    }
  };

  // Helper to get tier badge color
  const getTierBadgeStyle = (tier?: string) => {
    switch (tier) {
      case 'staff': return { bg: '#dbeafe', color: '#1e40af' };
      case 'freelance': return { bg: '#fef3c7', color: '#92400e' };
      case 'contributor': return { bg: '#d1fae5', color: '#065f46' };
      case 'guest': return { bg: '#f3f4f6', color: '#6b7280' };
      default: return { bg: '#f3f4f6', color: '#6b7280' };
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
              {approvedWriters.map((writer) => {
                const isExpanded = expandedWriter === writer.uid;
                const isSuspended = writer.suspension?.isSuspended;
                const tierStyle = getTierBadgeStyle(writer.tier);
                
                return (
                  <div
                    key={writer.uid}
                    style={{
                      backgroundColor: isSuspended ? '#fef2f2' : 'white',
                      borderRadius: '8px',
                      border: isSuspended ? '1px solid #fca5a5' : '1px solid #e5e7eb',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                      overflow: 'hidden'
                    }}
                  >
                    {/* Header Row - Clickable */}
                    <div
                      onClick={() => setExpandedWriter(isExpanded ? null : writer.uid)}
                      style={{
                        padding: '20px',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start'
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                          <h3 style={{ margin: 0, fontSize: '1.125rem' }}>{writer.name}</h3>
                          {/* Tier Badge */}
                          {writer.tier && (
                            <span style={{
                              padding: '2px 8px',
                              borderRadius: '10px',
                              fontSize: '0.7rem',
                              fontWeight: '500',
                              backgroundColor: tierStyle.bg,
                              color: tierStyle.color,
                              textTransform: 'capitalize'
                            }}>
                              {writer.tier}
                            </span>
                          )}
                          {/* Suspended Badge */}
                          {isSuspended && (
                            <span style={{
                              padding: '2px 8px',
                              borderRadius: '10px',
                              fontSize: '0.7rem',
                              fontWeight: '500',
                              backgroundColor: '#fee2e2',
                              color: '#991b1b'
                            }}>
                              SUSPENDED
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                          {writer.email}
                        </div>
                        {/* Beats Display */}
                        {writer.beats && writer.beats.length > 0 && (
                          <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {writer.beats.map((beat, idx) => (
                              <span
                                key={idx}
                                style={{
                                  padding: '2px 6px',
                                  backgroundColor: '#f3f4f6',
                                  borderRadius: '4px',
                                  fontSize: '0.7rem',
                                  color: '#4b5563'
                                }}
                              >
                                {beat}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          backgroundColor: isSuspended ? '#fee2e2' : '#d1fae5',
                          color: isSuspended ? '#991b1b' : '#065f46'
                        }}>
                          {isSuspended ? 'Suspended' : 'Active'}
                        </span>
                        <span style={{
                          fontSize: '1.25rem',
                          color: '#9ca3af',
                          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)',
                          transition: 'transform 0.2s'
                        }}>
                          ▼
                        </span>
                      </div>
                    </div>

                    {/* Expanded Governance Controls */}
                    {isExpanded && (
                      <div style={{
                        padding: '20px',
                        borderTop: '1px solid #e5e7eb',
                        backgroundColor: '#f9fafb'
                      }}>
                        {/* Writer Info */}
                        <div style={{ marginBottom: '20px' }}>
                          {writer.bio && (
                            <p style={{
                              margin: '0 0 12px 0',
                              fontSize: '0.875rem',
                              color: '#374151',
                              lineHeight: '1.6'
                            }}>
                              {writer.bio}
                            </p>
                          )}
                          <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                            Approved: {writer.approvedAt?.toLocaleDateString() || 'N/A'}
                            {writer.editorName && ` • Assigned Editor: ${writer.editorName}`}
                          </div>
                        </div>

                        {/* Suspension Info */}
                        {isSuspended && writer.suspension && (
                          <div style={{
                            padding: '12px',
                            backgroundColor: '#fee2e2',
                            borderRadius: '6px',
                            marginBottom: '20px'
                          }}>
                            <div style={{ fontWeight: '600', color: '#991b1b', marginBottom: '4px', fontSize: '0.875rem' }}>
                              Suspension Details
                            </div>
                            <p style={{ margin: '0 0 4px 0', color: '#991b1b', fontSize: '0.875rem' }}>
                              Reason: {writer.suspension.reason}
                            </p>
                            {writer.suspension.suspendedByName && (
                              <p style={{ margin: 0, color: '#b91c1c', fontSize: '0.75rem' }}>
                                By: {writer.suspension.suspendedByName} on {writer.suspension.suspendedAt?.toLocaleDateString() || 'N/A'}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Governance Controls Grid */}
                        <div style={{ 
                          display: 'grid', 
                          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                          gap: '16px' 
                        }}>
                          {/* Tier Control */}
                          <div>
                            <label style={{ 
                              display: 'block', 
                              marginBottom: '6px', 
                              fontSize: '0.75rem', 
                              fontWeight: '600',
                              color: '#374151'
                            }}>
                              Writer Tier
                            </label>
                            <select
                              value={writer.tier || ''}
                              onChange={(e) => handleSetTier(writer.uid, e.target.value as any)}
                              disabled={actionInProgress === writer.uid}
                              style={{
                                width: '100%',
                                padding: '8px 12px',
                                border: '1px solid #d1d5db',
                                borderRadius: '6px',
                                fontSize: '0.875rem',
                                backgroundColor: 'white'
                              }}
                            >
                              <option value="">Select tier...</option>
                              <option value="staff">Staff</option>
                              <option value="freelance">Freelance</option>
                              <option value="contributor">Contributor</option>
                              <option value="guest">Guest</option>
                            </select>
                          </div>

                          {/* Beats Control */}
                          <div>
                            <label style={{ 
                              display: 'block', 
                              marginBottom: '6px', 
                              fontSize: '0.75rem', 
                              fontWeight: '600',
                              color: '#374151'
                            }}>
                              Beats / Topics
                            </label>
                            <select
                              multiple
                              value={writer.beats || []}
                              onChange={(e) => {
                                const selected = Array.from(e.target.selectedOptions, option => option.value);
                                handleSetBeats(writer.uid, selected);
                              }}
                              disabled={actionInProgress === writer.uid}
                              style={{
                                width: '100%',
                                padding: '8px',
                                border: '1px solid #d1d5db',
                                borderRadius: '6px',
                                fontSize: '0.75rem',
                                backgroundColor: 'white',
                                minHeight: '80px'
                              }}
                            >
                              {AVAILABLE_BEATS.map(beat => (
                                <option key={beat} value={beat}>{beat}</option>
                              ))}
                            </select>
                            <p style={{ margin: '4px 0 0', fontSize: '0.7rem', color: '#6b7280' }}>
                              Hold Ctrl/Cmd to select multiple
                            </p>
                          </div>
                        </div>

                        {/* Suspension Controls */}
                        <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
                          {isSuspended ? (
                            <button
                              onClick={() => handleUnsuspend(writer.uid)}
                              disabled={actionInProgress === writer.uid}
                              style={{
                                padding: '10px 20px',
                                backgroundColor: '#16a34a',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: actionInProgress === writer.uid ? 'not-allowed' : 'pointer',
                                fontSize: '0.875rem',
                                fontWeight: '500',
                                opacity: actionInProgress === writer.uid ? 0.6 : 1
                              }}
                            >
                              {actionInProgress === writer.uid ? 'Processing...' : '✓ Unsuspend Writer'}
                            </button>
                          ) : showSuspendForm[writer.uid] ? (
                            <div>
                              <label style={{ 
                                display: 'block', 
                                marginBottom: '6px', 
                                fontSize: '0.75rem', 
                                fontWeight: '600',
                                color: '#991b1b'
                              }}>
                                Suspension Reason
                              </label>
                              <textarea
                                value={suspendReason[writer.uid] || ''}
                                onChange={(e) => setSuspendReason({ ...suspendReason, [writer.uid]: e.target.value })}
                                placeholder="Explain the reason for suspension..."
                                rows={2}
                                style={{
                                  width: '100%',
                                  padding: '8px 12px',
                                  border: '1px solid #fca5a5',
                                  borderRadius: '6px',
                                  fontSize: '0.875rem',
                                  marginBottom: '12px',
                                  boxSizing: 'border-box',
                                  fontFamily: 'inherit'
                                }}
                              />
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                  onClick={() => handleSuspend(writer.uid)}
                                  disabled={actionInProgress === writer.uid}
                                  style={{
                                    padding: '8px 16px',
                                    backgroundColor: '#dc2626',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: actionInProgress === writer.uid ? 'not-allowed' : 'pointer',
                                    fontSize: '0.875rem',
                                    fontWeight: '500',
                                    opacity: actionInProgress === writer.uid ? 0.6 : 1
                                  }}
                                >
                                  {actionInProgress === writer.uid ? 'Suspending...' : 'Confirm Suspension'}
                                </button>
                                <button
                                  onClick={() => {
                                    setShowSuspendForm({ ...showSuspendForm, [writer.uid]: false });
                                    setSuspendReason({ ...suspendReason, [writer.uid]: '' });
                                  }}
                                  style={{
                                    padding: '8px 16px',
                                    backgroundColor: '#6b7280',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '0.875rem'
                                  }}
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => setShowSuspendForm({ ...showSuspendForm, [writer.uid]: true })}
                              style={{
                                padding: '10px 20px',
                                backgroundColor: '#ef4444',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                                fontWeight: '500'
                              }}
                            >
                              ⚠️ Suspend Writer
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WriterManagementTab;
