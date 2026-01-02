import React, { useEffect, useState } from 'react';
import { Opinion } from '../../../types';
import { 
  subscribeToPendingOpinions, 
  approveOpinion, 
  rejectOpinion,
  getCurrentAuthUser,
  ensureAuthenticated
} from '../services/opinionsService';

const AdminOpinionReview: React.FC = () => {
  const [pendingOpinions, setPendingOpinions] = useState<Opinion[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      // Opinion will be removed from pending list automatically via subscription
    } catch (error: any) {
      console.error('Error approving opinion:', error);
      alert(`Failed to approve opinion: ${error.message}`);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (opinionId: string) => {
    setProcessingId(opinionId);
    try {
      await rejectOpinion(opinionId, 'admin');
      // Opinion will be removed from pending list automatically via subscription
    } catch (error: any) {
      console.error('Error rejecting opinion:', error);
      alert(`Failed to reject opinion: ${error.message}`);
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
    <div className="admin-opinion-review">
      <div className="admin-opinion-review-header">
        <h2>Review Opinions ({pendingOpinions.length})</h2>
      </div>
      <div className="admin-opinion-review-list">
        {pendingOpinions.map((opinion) => {
          const isExpanded = expandedId === opinion.id;
          const isProcessing = processingId === opinion.id;
          
          return (
            <div key={opinion.id} className="admin-opinion-review-item">
              <div className="admin-opinion-review-preview">
                <div className="admin-opinion-review-meta">
                  <span className="admin-opinion-review-author">
                    {opinion.authorName}
                  </span>
                  {opinion.authorTitle && (
                    <>
                      <span className="admin-opinion-review-title">•</span>
                      <span className="admin-opinion-review-title">
                        {opinion.authorTitle}
                      </span>
                    </>
                  )}
                  <span className="admin-opinion-review-date">•</span>
                  <span className="admin-opinion-review-date">
                    {opinion.submittedAt?.toLocaleDateString() || 'Recently'}
                  </span>
                </div>
                <h3 className="admin-opinion-review-headline">
                  {opinion.headline}
                </h3>
                <p className="admin-opinion-review-subheadline">
                  {opinion.subHeadline}
                </p>
                
                {isExpanded && (
                  <div className="admin-opinion-review-body">
                    <p className="admin-opinion-review-body-label">Full Essay:</p>
                    <div 
                      className="admin-opinion-review-body-text"
                      dangerouslySetInnerHTML={{ __html: opinion.body }}
                    />
                  </div>
                )}
              </div>
              
              <div className="admin-opinion-review-actions">
                <button
                  className="admin-opinion-review-expand"
                  onClick={() => toggleExpand(opinion.id)}
                  disabled={isProcessing}
                >
                  {isExpanded ? '▼ Collapse' : '▶ Expand'}
                </button>
                <button
                  className="admin-opinion-review-approve"
                  onClick={() => handleApprove(opinion.id)}
                  disabled={isProcessing}
                >
                  ✓ Approve
                </button>
                <button
                  className="admin-opinion-review-reject"
                  onClick={() => handleReject(opinion.id)}
                  disabled={isProcessing}
                >
                  ✗ Reject
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminOpinionReview;
