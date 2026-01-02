import React, { useEffect, useState } from 'react';
import { Opinion } from '../../../types';
import { 
  subscribeToPendingOpinions, 
  approveOpinion, 
  rejectOpinion,
  getCurrentAuthUser,
  ensureAuthenticated
} from '../services/opinionsService';

interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error';
}

const AdminOpinionReview: React.FC = () => {
  const [pendingOpinions, setPendingOpinions] = useState<Opinion[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  useEffect(() => {
    setLoading(true);
    setError(null);
    
    let unsubscribe: (() => void) | null = null;
    
    const startSubscription = () => {
      console.log('🔐 Auth ready, starting pending opinions subscription...');
      
      // Subscribe to pending opinions with real-time updates
      unsubscribe = subscribeToPendingOpinions(
        (opinions) => {
          setPendingOpinions(opinions);
          setLoading(false);
          setError(null);
        },
        (errorMessage) => {
          console.error('❌ Subscription error:', errorMessage);
          setError(errorMessage);
          setLoading(false);
        }
      );
    };
    
    // Ensure authentication inside useEffect
    ensureAuthenticated()
      .then(() => {
        const user = getCurrentAuthUser();
        if (!user) {
          console.log('👤 Waiting for Anonymous Auth...');
          // Retry after a short delay
          setTimeout(() => {
            const retryUser = getCurrentAuthUser();
            if (retryUser) {
              startSubscription();
            } else {
              console.error('❌ Auth still not ready after retry');
              setError('Authentication failed. Please refresh the page.');
              setLoading(false);
            }
          }, 500);
          return;
        }
        
        startSubscription();
      })
      .catch((err) => {
        console.error('❌ Authentication error:', err);
        setError(`Authentication failed: ${err.message}`);
        setLoading(false);
      });

    // Cleanup function
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const handleApprove = async (opinionId: string) => {
    setProcessingId(opinionId);
    try {
      await approveOpinion(opinionId, 'admin');
      showToast('Essay Published!', 'success');
      // Opinion will be removed from pending list automatically via subscription
    } catch (error: any) {
      console.error('Error approving opinion:', error);
      showToast(`Failed to approve: ${error.message}`, 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (opinionId: string) => {
    setProcessingId(opinionId);
    try {
      await rejectOpinion(opinionId, 'admin');
      showToast('Essay Rejected', 'success');
      // Opinion will be removed from pending list automatically via subscription
    } catch (error: any) {
      console.error('Error rejecting opinion:', error);
      showToast(`Failed to reject: ${error.message}`, 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const toggleExpand = (opinionId: string) => {
    setExpandedId(expandedId === opinionId ? null : opinionId);
  };

  if (loading) {
    return (
      <div className="admin-opinion-review">
        <div className="admin-opinion-review-header">
          <h2>Review Opinions</h2>
        </div>
        <div className="admin-opinion-review-loading">
          Reviewing Submissions...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-opinion-review">
        <div className="admin-opinion-review-header">
          <h2>Review Opinions</h2>
        </div>
        <div className="admin-opinion-review-error" style={{ color: '#dc2626', padding: '20px' }}>
          {error}
        </div>
      </div>
    );
  }

  if (pendingOpinions.length === 0) {
    return (
      <div className="admin-opinion-review">
        <div className="admin-opinion-review-header">
          <h2>Review Opinions</h2>
        </div>
        <div className="admin-opinion-review-empty">
          No pending submissions
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Toast Notifications */}
      <div style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 10000,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}>
        {toasts.map(toast => (
          <div
            key={toast.id}
            style={{
              padding: '12px 20px',
              backgroundColor: toast.type === 'success' ? '#10b981' : '#ef4444',
              color: 'white',
              borderRadius: '4px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              fontSize: '0.875rem',
              fontWeight: '500',
              minWidth: '200px',
              animation: 'slideIn 0.3s ease-out'
            }}
          >
            {toast.message}
          </div>
        ))}
      </div>

      {/* Review Panel */}
      <div style={{
        position: 'fixed',
        bottom: '0',
        left: '0',
        width: '400px',
        maxHeight: '70vh',
        backgroundColor: 'white',
        borderTop: '2px solid #000',
        borderRight: '2px solid #000',
        boxShadow: '0 -4px 12px rgba(0, 0, 0, 0.15)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          backgroundColor: '#000',
          color: 'white',
          padding: '8px 12px',
          fontSize: '0.75rem',
          fontWeight: 'bold',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          Review Opinions ({pendingOpinions.length})
        </div>

        {/* List */}
        <div style={{
          overflowY: 'auto',
          flex: 1
        }}>
          {pendingOpinions.map((opinion) => {
            const isExpanded = expandedId === opinion.id;
            const isProcessing = processingId === opinion.id;
            
            return (
              <div
                key={opinion.id}
                style={{
                  borderBottom: '1px solid #e5e7eb',
                  padding: '16px',
                  backgroundColor: 'white',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
              >
                {/* Meta Info */}
                <div style={{
                  fontSize: '0.75rem',
                  color: '#6b7280',
                  marginBottom: '8px',
                  display: 'flex',
                  gap: '8px',
                  alignItems: 'center'
                }}>
                  <span style={{ fontWeight: '600' }}>{opinion.authorName}</span>
                  {opinion.writerType && (
                    <>
                      <span>•</span>
                      <span>{opinion.writerType}</span>
                    </>
                  )}
                  <span>•</span>
                  <span>{opinion.submittedAt?.toLocaleDateString() || 'Recently'}</span>
                </div>

                {/* Headline */}
                <h3 style={{
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  color: '#000',
                  marginBottom: '8px',
                  lineHeight: '1.4'
                }}>
                  {opinion.headline}
                </h3>

                {/* Sub-headline */}
                {opinion.subHeadline && (
                  <p style={{
                    fontSize: '0.875rem',
                    color: '#4b5563',
                    marginBottom: '12px',
                    lineHeight: '1.5'
                  }}>
                    {opinion.subHeadline}
                  </p>
                )}

                {/* Expanded Body */}
                {isExpanded && (
                  <div style={{
                    marginTop: '12px',
                    paddingTop: '12px',
                    borderTop: '1px solid #e5e7eb'
                  }}>
                    <p style={{
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      color: '#6b7280',
                      marginBottom: '8px'
                    }}>
                      Full Essay:
                    </p>
                    <div
                      style={{
                        fontSize: '0.875rem',
                        lineHeight: '1.6',
                        color: '#1f2937',
                        fontFamily: 'Georgia, serif'
                      }}
                      dangerouslySetInnerHTML={{ __html: opinion.body }}
                    />
                  </div>
                )}

                {/* Actions */}
                <div style={{
                  display: 'flex',
                  gap: '8px',
                  marginTop: '12px'
                }}>
                  <button
                    onClick={() => toggleExpand(opinion.id)}
                    disabled={isProcessing}
                    style={{
                      padding: '6px 12px',
                      fontSize: '0.75rem',
                      border: '1px solid #d1d5db',
                      backgroundColor: 'white',
                      cursor: isProcessing ? 'not-allowed' : 'pointer',
                      borderRadius: '4px',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => !isProcessing && (e.currentTarget.style.backgroundColor = '#f3f4f6')}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                  >
                    {isExpanded ? '▼ Collapse' : '▶ Expand'}
                  </button>
                  <button
                    onClick={() => handleApprove(opinion.id)}
                    disabled={isProcessing}
                    style={{
                      padding: '6px 12px',
                      fontSize: '0.75rem',
                      border: '1px solid #10b981',
                      backgroundColor: isProcessing ? '#d1d5db' : '#10b981',
                      color: 'white',
                      cursor: isProcessing ? 'not-allowed' : 'pointer',
                      borderRadius: '4px',
                      fontWeight: '600',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => !isProcessing && (e.currentTarget.style.backgroundColor = '#059669')}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isProcessing ? '#d1d5db' : '#10b981'}
                  >
                    ✓ Approve
                  </button>
                  <button
                    onClick={() => handleReject(opinion.id)}
                    disabled={isProcessing}
                    style={{
                      padding: '6px 12px',
                      fontSize: '0.75rem',
                      border: '1px solid #ef4444',
                      backgroundColor: isProcessing ? '#d1d5db' : '#ef4444',
                      color: 'white',
                      cursor: isProcessing ? 'not-allowed' : 'pointer',
                      borderRadius: '4px',
                      fontWeight: '600',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => !isProcessing && (e.currentTarget.style.backgroundColor = '#dc2626')}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isProcessing ? '#d1d5db' : '#ef4444'}
                  >
                    ✗ Reject
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CSS Animation for Toast */}
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
};

export default AdminOpinionReview;
