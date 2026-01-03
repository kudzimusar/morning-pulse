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
        <article
          key={opinion.id}
          className="opinion-card"
          style={{
            borderBottom: '3px solid #000',
            padding: '32px 0',
            marginBottom: '24px'
          }}
        >
          <div className="opinion-card-content">
            {/* Author and Date at top */}
            <div className="opinion-byline" style={{
              marginBottom: '16px',
              fontSize: '0.875rem',
              color: '#4b5563',
              fontFamily: 'Georgia, serif'
            }}>
              <span className="opinion-author" style={{ fontWeight: '600' }}>
                By {opinion.authorName}
                {opinion.authorTitle && `, ${opinion.authorTitle}`}
              </span>
              {opinion.publishedAt && (
                <>
                  <span className="opinion-separator" style={{ margin: '0 8px' }}>•</span>
                  <span className="opinion-time">
                    {new Date(opinion.publishedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </>
              )}
            </div>

            {/* Headline */}
            <h2 className="opinion-headline" style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              lineHeight: '1.2',
              marginBottom: '12px',
              fontFamily: 'Georgia, serif',
              color: '#000'
            }}>
              {opinion.headline}
            </h2>

            {/* Sub-headline */}
            {opinion.subHeadline && (
              <p className="opinion-subheadline" style={{
                fontSize: '1.125rem',
                color: '#4b5563',
                marginBottom: '24px',
                fontFamily: 'Georgia, serif',
                fontStyle: 'italic',
                lineHeight: '1.5'
              }}>
                {opinion.subHeadline}
              </p>
            )}

            {/* Full Essay Body */}
            {opinion.body && (
              <div 
                className="opinion-body"
                style={{
                  fontSize: '1.125rem',
                  lineHeight: '1.8',
                  color: '#1f2937',
                  fontFamily: 'Georgia, serif',
                  whiteSpace: 'pre-wrap',
                  wordWrap: 'break-word',
                  marginTop: '24px'
                }}
                dangerouslySetInnerHTML={{ __html: opinion.body }}
              />
            )}
          </div>
        </article>
      ))}
    </div>
  );
};

export default OpinionFeed;
