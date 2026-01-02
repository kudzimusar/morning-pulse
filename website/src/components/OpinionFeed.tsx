import React, { useEffect, useState } from 'react';
import { Opinion } from '../../../types';
import { subscribeToPublishedOpinions } from '../services/opinionsService';

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

    // Subscribe to published opinions with real-time updates
    const unsubscribe = subscribeToPublishedOpinions((fetchedOpinions) => {
      setOpinions(fetchedOpinions);
      setLoading(false);
      setError(null);
    });

    // Cleanup subscription on unmount
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  if (loading) {
    return (
      <div className="opinion-feed-loading">
        <p>Loading opinions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="opinion-feed-error">
        <p>Error loading opinions: {error}</p>
      </div>
    );
  }

  if (opinions.length === 0) {
    return (
      <div className="opinion-feed-empty">
        <p>No published opinions yet. Check back soon!</p>
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
