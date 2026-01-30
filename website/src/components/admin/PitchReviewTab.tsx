/**
 * PitchReviewTab Component
 * Admin/Editor interface for reviewing and managing story pitches
 */

import React, { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import { 
  getSubmittedPitches, 
  getApprovedPitches, 
  getPitchesByStatus,
  approvePitch, 
  rejectPitch,
  assignEditorToPitch,
  setPitchPriority
} from '../../services/pitchService';
import { StoryPitch, PitchStatus } from '../../../types';

interface PitchReviewTabProps {
  userRoles: string[] | null;
}

const PitchReviewTab: React.FC<PitchReviewTabProps> = ({ userRoles }) => {
  const [activeTab, setActiveTab] = useState<'submitted' | 'approved' | 'rejected' | 'converted'>('submitted');
  const [pitches, setPitches] = useState<StoryPitch[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedPitch, setExpandedPitch] = useState<string | null>(null);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  
  // Rejection form state
  const [rejectingPitchId, setRejectingPitchId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  
  // Approval feedback
  const [approvingPitchId, setApprovingPitchId] = useState<string | null>(null);
  const [approvalFeedback, setApprovalFeedback] = useState('');
  const [approvalPriority, setApprovalPriority] = useState<'low' | 'normal' | 'high' | 'urgent'>('normal');

  useEffect(() => {
    loadPitches();
  }, [activeTab]);

  const loadPitches = async () => {
    setLoading(true);
    try {
      let result: StoryPitch[];
      switch (activeTab) {
        case 'submitted':
          result = await getSubmittedPitches();
          break;
        case 'approved':
          result = await getApprovedPitches();
          break;
        case 'rejected':
          result = await getPitchesByStatus('rejected');
          break;
        case 'converted':
          result = await getPitchesByStatus('converted');
          break;
        default:
          result = [];
      }
      setPitches(result);
    } catch (error: any) {
      console.error('Error loading pitches:', error);
      alert(`Failed to load pitches: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (pitchId: string) => {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      alert('You must be logged in to approve pitches');
      return;
    }

    setActionInProgress(pitchId);
    try {
      await approvePitch(
        pitchId,
        user.uid,
        user.displayName || user.email || 'Editor',
        approvalFeedback || undefined,
        approvalPriority
      );
      alert('Pitch approved! The writer has been notified.');
      setApprovingPitchId(null);
      setApprovalFeedback('');
      setApprovalPriority('normal');
      loadPitches();
    } catch (error: any) {
      alert(`Failed to approve pitch: ${error.message}`);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleReject = async (pitchId: string) => {
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      alert('You must be logged in to reject pitches');
      return;
    }

    setActionInProgress(pitchId);
    try {
      await rejectPitch(
        pitchId,
        user.uid,
        user.displayName || user.email || 'Editor',
        rejectionReason
      );
      alert('Pitch rejected. The writer has been notified.');
      setRejectingPitchId(null);
      setRejectionReason('');
      loadPitches();
    } catch (error: any) {
      alert(`Failed to reject pitch: ${error.message}`);
    } finally {
      setActionInProgress(null);
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'urgent': return { bg: '#fee2e2', color: '#991b1b' };
      case 'high': return { bg: '#fef3c7', color: '#92400e' };
      case 'normal': return { bg: '#dbeafe', color: '#1e40af' };
      case 'low': return { bg: '#f3f4f6', color: '#6b7280' };
      default: return { bg: '#f3f4f6', color: '#6b7280' };
    }
  };

  const getStatusColor = (status: PitchStatus) => {
    switch (status) {
      case 'submitted': return { bg: '#fef3c7', color: '#92400e' };
      case 'approved': return { bg: '#d1fae5', color: '#065f46' };
      case 'rejected': return { bg: '#fee2e2', color: '#991b1b' };
      case 'converted': return { bg: '#dbeafe', color: '#1e40af' };
      default: return { bg: '#f3f4f6', color: '#6b7280' };
    }
  };

  const isEditor = userRoles?.some(r => 
    ['editor', 'admin', 'super_admin'].includes(r)
  );

  if (!isEditor) {
    return (
      <div style={{ padding: '32px', textAlign: 'center' }}>
        <h2>Access Denied</h2>
        <p>You need editor privileges to review pitches.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ margin: '0 0 8px 0', fontSize: '1.5rem' }}>Pitch Review</h2>
        <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>
          Review and manage story pitches from writers
        </p>
      </div>

      {/* Tabs */}
      <div style={{ 
        display: 'flex', 
        gap: '8px', 
        borderBottom: '1px solid #e5e7eb',
        marginBottom: '24px'
      }}>
        {(['submitted', 'approved', 'rejected', 'converted'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '12px 24px',
              border: 'none',
              backgroundColor: 'transparent',
              borderBottom: activeTab === tab ? '2px solid #000' : '2px solid transparent',
              cursor: 'pointer',
              fontWeight: activeTab === tab ? '600' : '400',
              color: activeTab === tab ? '#000' : '#6b7280',
              textTransform: 'capitalize'
            }}
          >
            {tab} ({activeTab === tab ? pitches.length : '...'})
          </button>
        ))}
      </div>

      {/* Pitch List */}
      {loading ? (
        <div style={{ padding: '48px', textAlign: 'center' }}>
          <p style={{ color: '#6b7280' }}>Loading pitches...</p>
        </div>
      ) : pitches.length === 0 ? (
        <div style={{
          padding: '48px',
          textAlign: 'center',
          backgroundColor: '#f9fafb',
          borderRadius: '8px',
          border: '1px solid #e5e7eb'
        }}>
          <p style={{ color: '#6b7280', margin: 0 }}>
            No {activeTab} pitches found.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {pitches.map(pitch => (
            <div
              key={pitch.id}
              style={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                overflow: 'hidden',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
              }}
            >
              {/* Header */}
              <div 
                onClick={() => setExpandedPitch(expandedPitch === pitch.id ? null : pitch.id)}
                style={{
                  padding: '16px 20px',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  backgroundColor: expandedPitch === pitch.id ? '#f9fafb' : 'white'
                }}
              >
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '1.125rem' }}>
                    {pitch.title}
                  </h3>
                  <div style={{ 
                    display: 'flex', 
                    gap: '12px', 
                    alignItems: 'center',
                    fontSize: '0.875rem',
                    color: '#6b7280'
                  }}>
                    <span>By {pitch.writerName}</span>
                    {pitch.proposedCategory && (
                      <>
                        <span>•</span>
                        <span>{pitch.proposedCategory}</span>
                      </>
                    )}
                    {pitch.submittedAt && (
                      <>
                        <span>•</span>
                        <span>Submitted {new Date(pitch.submittedAt).toLocaleDateString()}</span>
                      </>
                    )}
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {pitch.priority && (
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      backgroundColor: getPriorityColor(pitch.priority).bg,
                      color: getPriorityColor(pitch.priority).color,
                      textTransform: 'uppercase'
                    }}>
                      {pitch.priority}
                    </span>
                  )}
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    backgroundColor: getStatusColor(pitch.status).bg,
                    color: getStatusColor(pitch.status).color,
                    textTransform: 'capitalize'
                  }}>
                    {pitch.status}
                  </span>
                  <span style={{ 
                    fontSize: '1.25rem', 
                    color: '#9ca3af',
                    transform: expandedPitch === pitch.id ? 'rotate(180deg)' : 'rotate(0)',
                    transition: 'transform 0.2s'
                  }}>
                    ▼
                  </span>
                </div>
              </div>

              {/* Expanded Content */}
              {expandedPitch === pitch.id && (
                <div style={{ 
                  padding: '20px',
                  borderTop: '1px solid #e5e7eb',
                  backgroundColor: '#fafafa'
                }}>
                  {/* Summary */}
                  <div style={{ marginBottom: '16px' }}>
                    <h4 style={{ 
                      margin: '0 0 8px 0', 
                      fontSize: '0.875rem', 
                      fontWeight: '600',
                      color: '#374151'
                    }}>
                      Summary
                    </h4>
                    <p style={{ 
                      margin: 0, 
                      color: '#4b5563',
                      lineHeight: '1.6'
                    }}>
                      {pitch.summary}
                    </p>
                  </div>

                  {/* Angle */}
                  <div style={{ marginBottom: '16px' }}>
                    <h4 style={{ 
                      margin: '0 0 8px 0', 
                      fontSize: '0.875rem', 
                      fontWeight: '600',
                      color: '#374151'
                    }}>
                      Unique Angle
                    </h4>
                    <p style={{ 
                      margin: 0, 
                      color: '#4b5563',
                      lineHeight: '1.6'
                    }}>
                      {pitch.angle}
                    </p>
                  </div>

                  {/* Meta info */}
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                    gap: '16px',
                    marginBottom: '16px'
                  }}>
                    {pitch.estimatedWordCount && (
                      <div>
                        <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>Word Count</span>
                        <p style={{ margin: '4px 0 0', fontWeight: '500' }}>
                          ~{pitch.estimatedWordCount} words
                        </p>
                      </div>
                    )}
                    {pitch.proposedDeadline && (
                      <div>
                        <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>Can Deliver By</span>
                        <p style={{ margin: '4px 0 0', fontWeight: '500' }}>
                          {new Date(pitch.proposedDeadline).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                    <div>
                      <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>Writer Email</span>
                      <p style={{ margin: '4px 0 0', fontWeight: '500' }}>
                        {pitch.writerEmail}
                      </p>
                    </div>
                  </div>

                  {/* Sources */}
                  {pitch.sources && (
                    <div style={{ marginBottom: '16px' }}>
                      <h4 style={{ 
                        margin: '0 0 8px 0', 
                        fontSize: '0.875rem', 
                        fontWeight: '600',
                        color: '#374151'
                      }}>
                        Proposed Sources
                      </h4>
                      <p style={{ 
                        margin: 0, 
                        color: '#4b5563',
                        lineHeight: '1.6'
                      }}>
                        {pitch.sources}
                      </p>
                    </div>
                  )}

                  {/* Relevance */}
                  {pitch.relevance && (
                    <div style={{ marginBottom: '16px' }}>
                      <h4 style={{ 
                        margin: '0 0 8px 0', 
                        fontSize: '0.875rem', 
                        fontWeight: '600',
                        color: '#374151'
                      }}>
                        Why Now?
                      </h4>
                      <p style={{ 
                        margin: 0, 
                        color: '#4b5563',
                        lineHeight: '1.6'
                      }}>
                        {pitch.relevance}
                      </p>
                    </div>
                  )}

                  {/* Rejection reason (if rejected) */}
                  {pitch.status === 'rejected' && pitch.rejectionReason && (
                    <div style={{ 
                      marginBottom: '16px',
                      padding: '12px',
                      backgroundColor: '#fee2e2',
                      borderRadius: '6px'
                    }}>
                      <h4 style={{ 
                        margin: '0 0 8px 0', 
                        fontSize: '0.875rem', 
                        fontWeight: '600',
                        color: '#991b1b'
                      }}>
                        Rejection Reason
                      </h4>
                      <p style={{ margin: 0, color: '#991b1b' }}>
                        {pitch.rejectionReason}
                      </p>
                      {pitch.reviewedByName && (
                        <p style={{ 
                          margin: '8px 0 0', 
                          fontSize: '0.75rem', 
                          color: '#b91c1c' 
                        }}>
                          — {pitch.reviewedByName}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Editor feedback (if approved) */}
                  {pitch.status === 'approved' && pitch.editorFeedback && (
                    <div style={{ 
                      marginBottom: '16px',
                      padding: '12px',
                      backgroundColor: '#d1fae5',
                      borderRadius: '6px'
                    }}>
                      <h4 style={{ 
                        margin: '0 0 8px 0', 
                        fontSize: '0.875rem', 
                        fontWeight: '600',
                        color: '#065f46'
                      }}>
                        Editor Notes
                      </h4>
                      <p style={{ margin: 0, color: '#065f46' }}>
                        {pitch.editorFeedback}
                      </p>
                    </div>
                  )}

                  {/* Action Buttons (for submitted pitches) */}
                  {pitch.status === 'submitted' && (
                    <div style={{ 
                      marginTop: '20px',
                      paddingTop: '16px',
                      borderTop: '1px solid #e5e7eb'
                    }}>
                      {/* Approval Form */}
                      {approvingPitchId === pitch.id ? (
                        <div style={{ marginBottom: '16px' }}>
                          <h4 style={{ margin: '0 0 12px 0', fontSize: '0.875rem' }}>
                            Approve Pitch
                          </h4>
                          <div style={{ marginBottom: '12px' }}>
                            <label style={{ 
                              display: 'block', 
                              marginBottom: '6px',
                              fontSize: '0.875rem',
                              color: '#374151'
                            }}>
                              Priority Level
                            </label>
                            <select
                              value={approvalPriority}
                              onChange={(e) => setApprovalPriority(e.target.value as any)}
                              style={{
                                padding: '8px 12px',
                                border: '1px solid #d1d5db',
                                borderRadius: '6px',
                                fontSize: '0.875rem'
                              }}
                            >
                              <option value="low">Low</option>
                              <option value="normal">Normal</option>
                              <option value="high">High</option>
                              <option value="urgent">Urgent</option>
                            </select>
                          </div>
                          <div style={{ marginBottom: '12px' }}>
                            <label style={{ 
                              display: 'block', 
                              marginBottom: '6px',
                              fontSize: '0.875rem',
                              color: '#374151'
                            }}>
                              Feedback for Writer (optional)
                            </label>
                            <textarea
                              value={approvalFeedback}
                              onChange={(e) => setApprovalFeedback(e.target.value)}
                              placeholder="Any notes or guidance for the writer..."
                              rows={2}
                              style={{
                                width: '100%',
                                padding: '8px 12px',
                                border: '1px solid #d1d5db',
                                borderRadius: '6px',
                                fontSize: '0.875rem',
                                boxSizing: 'border-box',
                                fontFamily: 'inherit'
                              }}
                            />
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              onClick={() => handleApprove(pitch.id)}
                              disabled={actionInProgress === pitch.id}
                              style={{
                                padding: '8px 16px',
                                backgroundColor: '#16a34a',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: actionInProgress === pitch.id ? 'not-allowed' : 'pointer',
                                fontSize: '0.875rem',
                                fontWeight: '500',
                                opacity: actionInProgress === pitch.id ? 0.6 : 1
                              }}
                            >
                              {actionInProgress === pitch.id ? 'Approving...' : 'Confirm Approval'}
                            </button>
                            <button
                              onClick={() => {
                                setApprovingPitchId(null);
                                setApprovalFeedback('');
                                setApprovalPriority('normal');
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
                      ) : rejectingPitchId === pitch.id ? (
                        /* Rejection Form */
                        <div style={{ marginBottom: '16px' }}>
                          <h4 style={{ margin: '0 0 12px 0', fontSize: '0.875rem' }}>
                            Reject Pitch
                          </h4>
                          <textarea
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder="Explain why this pitch is being rejected..."
                            rows={3}
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              border: '1px solid #d1d5db',
                              borderRadius: '6px',
                              fontSize: '0.875rem',
                              marginBottom: '12px',
                              boxSizing: 'border-box',
                              fontFamily: 'inherit'
                            }}
                          />
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              onClick={() => handleReject(pitch.id)}
                              disabled={actionInProgress === pitch.id}
                              style={{
                                padding: '8px 16px',
                                backgroundColor: '#dc2626',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: actionInProgress === pitch.id ? 'not-allowed' : 'pointer',
                                fontSize: '0.875rem',
                                fontWeight: '500',
                                opacity: actionInProgress === pitch.id ? 0.6 : 1
                              }}
                            >
                              {actionInProgress === pitch.id ? 'Rejecting...' : 'Confirm Rejection'}
                            </button>
                            <button
                              onClick={() => {
                                setRejectingPitchId(null);
                                setRejectionReason('');
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
                        /* Action Buttons */
                        <div style={{ display: 'flex', gap: '12px' }}>
                          <button
                            onClick={() => setApprovingPitchId(pitch.id)}
                            style={{
                              padding: '10px 20px',
                              backgroundColor: '#16a34a',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '0.875rem',
                              fontWeight: '500'
                            }}
                          >
                            ✓ Approve Pitch
                          </button>
                          <button
                            onClick={() => setRejectingPitchId(pitch.id)}
                            style={{
                              padding: '10px 20px',
                              backgroundColor: '#dc2626',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '0.875rem',
                              fontWeight: '500'
                            }}
                          >
                            ✗ Reject
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PitchReviewTab;
