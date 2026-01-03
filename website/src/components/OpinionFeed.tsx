import React, { useEffect, useState } from 'react';
import { Opinion } from '../../../types';
import { 
  subscribeToPublishedOpinions
} from '../services/opinionsService';

interface OpinionFeedProps {
  onOpinionClick?: (opinion: Opinion) => void;
}

const OpinionFeed: React.FC<OpinionFeedProps> = ({ onOpinionClick }) => {
  const [opinions, setOpinions] = useState<Opinion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    console.log('📰 Starting published opinions subscription...');

    // Subscribe to published opinions with real-time updates
    const unsubscribe = subscribeToPublishedOpinions(
      (fetchedOpinions) => {
        console.log(`📝 Received ${fetchedOpinions.length} published opinions`);
        setOpinions(fetchedOpinions);
        setLoading(false);
        setError(null);
      },
      (errorMessage) => {
        console.error('❌ Subscription error:', errorMessage);
        setError(errorMessage);
        setLoading(false);
      }
    );

    // Cleanup subscription on unmount
    return () => {
      console.log('🔌 Unsubscribing from published opinions');
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  // Public page: Don't block with loading state
  if (loading && opinions.length === 0) {
    return (
      <div className="opinion-feed-loading" style={{ padding: '40px', textAlign: 'center' }}>
        <p>Loading guest essays...</p>
      </div>
    );
  }

  if (error && opinions.length === 0) {
    return (
      <div className="opinion-feed-error" style={{ padding: '40px', textAlign: 'center', color: '#dc2626' }}>
        <p>Error loading opinions: {error}</p>
      </div>
    );
  }

  if (!loading && opinions.length === 0) {
    return (
      <div className="opinion-feed-empty" style={{ padding: '40px', textAlign: 'center' }}>
        <p>No guest essays published yet.</p>
      </div>
    );
  }

  return (
    <div className="opinion-feed">
      {opinions.map((opinion) => (
        <div
          key={opinion.id}
          className="opinion-card"
          onClick={() => onOpinionClick?.(opinion)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onOpinionClick?.(opinion);
            }
          }}
        >
          <div className="opinion-card-content">
            <p className="opinion-tag">{opinion.writerType || 'Guest Essay'}</p>
            <h2 className="opinion-headline">{opinion.headline}</h2>
            <p className="opinion-subheadline">{opinion.subHeadline}</p>
            <div className="opinion-byline">
              <span className="opinion-author">
                By {opinion.authorName}
                {opinion.authorTitle && `, ${opinion.authorTitle}`}
              </span>
              {opinion.publishedAt && (
                <>
                  <span className="opinion-separator">•</span>
                  <span className="opinion-time">
                    {opinion.publishedAt.toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default OpinionFeed;
