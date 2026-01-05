import React, { useEffect, useState } from 'react';
import { Opinion } from '../../../types';
import { 
  subscribeToPendingOpinions, 
  approveOpinion, 
  rejectOpinion,
  getCurrentAuthUser,
  ensureAuthenticated,
  uploadOpinionImage
} from '../services/opinionsService';
import { getImageByTopic } from '../utils/imageGenerator';

interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error';
}

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB

const AdminOpinionReview: React.FC = () => {
  const [pendingOpinions, setPendingOpinions] = useState<Opinion[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isVisible, setIsVisible] = useState(true);
  const [replacementUrls, setReplacementUrls] = useState<Record<string, string>>({});

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

  const handleReplaceImage = async (opinion: Opinion, file: File) => {
    if (file.size > MAX_IMAGE_BYTES) {
      showToast('Image too large (max 5MB).', 'error');
      return;
    }

    setUploadingId(opinion.id);
    try {
      const url = await uploadOpinionImage(file, 'published_images', opinion.id);
      setReplacementUrls(prev => ({ ...prev, [opinion.id]: url }));
      showToast('Replacement image uploaded.', 'success');
    } catch (err: any) {
      console.error('Replace image error:', err);
      showToast(`Upload failed: ${err.message || 'Unknown error'}`, 'error');
    } finally {
      setUploadingId(null);
    }
  };

  const handleApprove = async (opinionId: string) => {
    setProcessingId(opinionId);
    
    // IMMEDIATE UI UPDATE: Remove from local state to show progress instantly
    setPendingOpinions(prev => prev.filter(op => op.id !== opinionId));
    
    try {
      await approveOpinion(opinionId, 'admin', replacementUrls[opinionId]);
      showToast('Essay Published!', 'success');
      // Opinion will be removed from pending list automatically via subscription
    } catch (error: any) {
      console.error('Error approving opinion:', error);
      showToast(`Failed to approve: ${error.message}`, 'error');
      // Re-add to list if approval failed (subscription will sync eventually)
      // Note: The subscription will re-sync the correct state
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (opinionId: string) => {
    setProcessingId(opinionId);
    
    // IMMEDIATE UI UPDATE: Remove from local state to show progress instantly
    setPendingOpinions(prev => prev.filter(op => op.id !== opinionId));
    
    try {
      await rejectOpinion(opinionId, 'admin');
      showToast('Essay Rejected', 'success');
      // Opinion will be removed from pending list automatically via subscription
    } catch (error: any) {
      console.error('Error rejecting opinion:', error);
      showToast(`Failed to reject: ${error.message}`, 'error');
      // Re-add to list if rejection failed (subscription will sync eventually)
      // Note: The subscription will re-sync the correct state
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

  if (!isVisible) {
    return (
      <div style={{
        position: 'fixed',
        bottom: '0',
        left: '0',
        zIndex: 1000
      }}>
        <button
          onClick={() => setIsVisible(true)}
          style={{
            padding: '8px 12px',
            backgroundColor: '#000',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.75rem',
            fontWeight: 'bold',
            textTransform: 'uppercase'
          }}
        >
          Show Review Panel
        </button>
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

      {/* Review Panel - Bottom Right with High Contrast */}
      <div style={{
        position: 'fixed',
        bottom: '0',
        right: '0',
        width: '400px',
        maxHeight: '70vh',
        backgroundColor: '#000',
        borderTop: '4px solid #fff',
        borderLeft: '4px solid #fff',
        boxShadow: '0 -4px 12px rgba(0, 0, 0, 0.3)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header with Close button - High Contrast */}
        <div style={{
          backgroundColor: '#fff',
          color: '#000',
          padding: '12px 16px',
          fontSize: '0.75rem',
          fontWeight: '900',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '2px solid #000'
        }}>
          <span style={{ fontFamily: 'monospace' }}>REVIEW ({pendingOpinions.length})</span>
          <button
            onClick={() => setIsVisible(false)}
            style={{
              background: 'transparent',
              border: '2px solid #000',
              color: '#000',
              cursor: 'pointer',
              fontSize: '1rem',
              padding: '2px 8px',
              lineHeight: '1',
              fontWeight: 'bold'
            }}
            title="Close panel"
          >
            ×
          </button>
        </div>

        {/* List */}
        <div style={{
          overflowY: 'auto',
          flex: 1
        }}>
          {pendingOpinions.map((opinion) => {
            const isExpanded = expandedId === opinion.id;
            const isProcessing = processingId === opinion.id;
            const isUploading = uploadingId === opinion.id;
            const suggestedSrc =
              opinion.suggestedImageUrl ||
              opinion.imageUrl ||
              getImageByTopic(opinion.headline || '', opinion.id);
            const replacementSrc = replacementUrls[opinion.id];
            
            return (
              <div
                key={opinion.id}
                style={{
                  borderBottom: '2px solid #fff',
                  padding: '16px',
                  backgroundColor: '#000',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1a1a1a'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#000'}
              >
                {/* Meta Info - High Contrast */}
                <div style={{
                  fontSize: '0.75rem',
                  color: '#fff',
                  marginBottom: '8px',
                  display: 'flex',
                  gap: '8px',
                  alignItems: 'center'
                }}>
                  <span style={{ fontWeight: '600' }}>{opinion.authorName}</span>
                  {opinion.writerType && (
                    <>
                      <span style={{ color: '#999' }}>•</span>
                      <span style={{ color: '#999' }}>{opinion.writerType}</span>
                    </>
                  )}
                  <span style={{ color: '#999' }}>•</span>
                  <span style={{ color: '#999' }}>{opinion.submittedAt?.toLocaleDateString() || 'Recently'}</span>
                </div>

                {/* Headline - High Contrast */}
                <h3 style={{
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  color: '#fff',
                  marginBottom: '8px',
                  lineHeight: '1.4'
                }}>
                  {opinion.headline}
                </h3>

                {/* Sub-headline - High Contrast */}
                {opinion.subHeadline && (
                  <p style={{
                    fontSize: '0.875rem',
                    color: '#ccc',
                    marginBottom: '12px',
                    lineHeight: '1.5'
                  }}>
                    {opinion.subHeadline}
                  </p>
                )}

                {/* Suggested / Replacement Image (Editorial Gate) */}
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#999', marginBottom: '6px' }}>
                    Recommended: 2000×1125 (16:9). Max: 5MB.
                  </div>

                  <div style={{ aspectRatio: '16/9', overflow: 'hidden', background: '#111', border: '1px solid #333' }}>
                    <img
                      src={replacementSrc || suggestedSrc}
                      alt="Suggested"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      loading="lazy"
                    />
                  </div>

                  {replacementSrc && (
                    <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '6px' }}>
                      Replacement uploaded (will publish as final).
                    </div>
                  )}

                  <label style={{ display: 'inline-block', marginTop: '10px', cursor: isProcessing ? 'not-allowed' : 'pointer' }}>
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      disabled={isUploading || isProcessing}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleReplaceImage(opinion, f);
                        e.currentTarget.value = '';
                      }}
                    />
                    <span style={{
                      padding: '6px 12px',
                      border: '2px solid #fff',
                      color: '#fff',
                      fontSize: '0.75rem',
                      fontWeight: '900',
                      opacity: (isUploading || isProcessing) ? 0.6 : 1
                    }}>
                      {isUploading ? 'UPLOADING...' : 'REPLACE IMAGE'}
                    </span>
                  </label>
                </div>

                {/* Expanded Body - High Contrast */}
                {isExpanded && (
                  <div style={{
                    marginTop: '12px',
                    paddingTop: '12px',
                    borderTop: '2px solid #fff'
                  }}>
                    <p style={{
                      fontSize: '0.75rem',
                      fontWeight: '900',
                      textTransform: 'uppercase',
                      color: '#fff',
                      marginBottom: '12px',
                      letterSpacing: '0.1em'
                    }}>
                      FULL ESSAY:
                    </p>
                    <div
                      style={{
                        fontSize: '0.875rem',
                        lineHeight: '1.8',
                        color: '#fff',
                        fontFamily: 'Georgia, serif',
                        whiteSpace: 'pre-wrap',
                        wordWrap: 'break-word',
                        backgroundColor: '#1a1a1a',
                        padding: '16px',
                        borderRadius: '4px'
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
                    disabled={isProcessing || isUploading}
                    style={{
                      padding: '6px 12px',
                      fontSize: '0.75rem',
                      border: '2px solid #fff',
                      backgroundColor: 'transparent',
                      color: '#fff',
                      cursor: (isProcessing || isUploading) ? 'not-allowed' : 'pointer',
                      borderRadius: '0',
                      fontWeight: 'bold',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => !(isProcessing || isUploading) && (e.currentTarget.style.backgroundColor = '#fff') && (e.currentTarget.style.color = '#000')}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#fff'; }}
                  >
                    {isExpanded ? '▼ COLLAPSE' : '▶ EXPAND'}
                  </button>
                  <button
                    onClick={() => handleApprove(opinion.id)}
                    disabled={isProcessing || isUploading}
                    style={{
                      padding: '6px 12px',
                      fontSize: '0.75rem',
                      border: '2px solid #fff',
                      backgroundColor: (isProcessing || isUploading) ? '#333' : '#fff',
                      color: (isProcessing || isUploading) ? '#999' : '#000',
                      cursor: (isProcessing || isUploading) ? 'not-allowed' : 'pointer',
                      borderRadius: '0',
                      fontWeight: '900',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => !(isProcessing || isUploading) && (e.currentTarget.style.backgroundColor = '#10b981') && (e.currentTarget.style.color = '#fff')}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = (isProcessing || isUploading) ? '#333' : '#fff'; e.currentTarget.style.color = (isProcessing || isUploading) ? '#999' : '#000'; }}
                  >
                    ✓ APPROVE
                  </button>
                  <button
                    onClick={() => handleReject(opinion.id)}
                    disabled={isProcessing || isUploading}
                    style={{
                      padding: '6px 12px',
                      fontSize: '0.75rem',
                      border: '2px solid #fff',
                      backgroundColor: (isProcessing || isUploading) ? '#333' : '#000',
                      color: '#fff',
                      cursor: (isProcessing || isUploading) ? 'not-allowed' : 'pointer',
                      borderRadius: '0',
                      fontWeight: '900',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => !(isProcessing || isUploading) && (e.currentTarget.style.backgroundColor = '#ef4444') && (e.currentTarget.style.color = '#fff')}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = (isProcessing || isUploading) ? '#333' : '#000'; e.currentTarget.style.color = '#fff'; }}
                  >
                    ✗ REJECT
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
