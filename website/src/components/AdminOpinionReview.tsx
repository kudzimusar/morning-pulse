import React, { useEffect, useState } from 'react';
import { Opinion } from '../../../types';
import { subscribeToPendingOpinions, approveOpinion, rejectOpinion } from '../services/opinionsService';

const AdminOpinionReview: React.FC = () => {
  const [pendingOpinions, setPendingOpinions] = useState<Opinion[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToPendingOpinions((opinions) => {
      setPendingOpinions(opinions);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleApprove = async (opinionId: string) => {
    if (processingId) return; // Prevent double-clicks
    
    setProcessingId(opinionId);
    try {
      await approveOpinion(opinionId, 'admin');
      // Opinion will be removed from pending list via real-time listener
    } catch (error: any) {
      console.error('Error approving opinion:', error);
      alert(`Failed to approve opinion: ${error.message}`);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (opinionId: string) => {
    if (processingId) return; // Prevent double-clicks
    
    if (!confirm('Are you sure you want to reject this opinion? This action cannot be undone.')) {
      return;
    }

    setProcessingId(opinionId);
    try {
      await rejectOpinion(opinionId, 'admin');
      // Opinion will be removed from pending list via real-time listener
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
          <p>Loading pending opinions...</p>
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
          <p>No pending opinions to review.</p>
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
                  <span className="admin-opinion-review-author">{opinion.authorName}</span>
                  {opinion.authorTitle && (
                    <span className="admin-opinion-review-title">{opinion.authorTitle}</span>
                  )}
                  <span className="admin-opinion-review-date">
                    Submitted: {opinion.submittedAt.toLocaleDateString()}
                  </span>
                </div>
                <h3 className="admin-opinion-review-headline">{opinion.headline}</h3>
                <p className="admin-opinion-review-subheadline">{opinion.subHeadline}</p>
                
                {isExpanded && (
                  <div className="admin-opinion-review-body">
                    <p className="admin-opinion-review-body-label">Full Essay:</p>
                    <div 
                      className="admin-opinion-review-body-text"
                      dangerouslySetInnerHTML={{ __html: opinion.body }}
                    />
                  </div>
                )}

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
                    {isProcessing ? 'Processing...' : '✓ Approve'}
                  </button>
                  <button
                    className="admin-opinion-review-reject"
                    onClick={() => handleReject(opinion.id)}
                    disabled={isProcessing}
                  >
                    {isProcessing ? 'Processing...' : '✗ Reject'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminOpinionReview;
