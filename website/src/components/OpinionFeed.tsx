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

  // NYT-style layout: Lead essay + sidebar
  const leadEssay = opinions[0];
  const otherEssays = opinions.slice(1);

  return (
    <div className="opinion-feed" style={{ fontFamily: 'Georgia, serif' }}>
      {/* NYT Masthead */}
      <div style={{
        borderTop: '4px solid #000',
        borderBottom: '1px solid #000',
        padding: '16px 0',
        marginBottom: '32px'
      }}>
        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: '900',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          fontFamily: '"Times New Roman", serif',
          margin: 0,
          color: '#000'
        }}>
          OPINION
        </h1>
      </div>

      {/* Grid Layout: Main Content (8 cols) + Sidebar (4 cols) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: '32px',
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 24px'
      }}>
        {/* Main Content Column */}
        <div style={{ gridColumn: '1 / -1' }}>
          {leadEssay && (
            <article
              key={leadEssay.id}
              style={{
                borderBottom: '3px solid #000',
                padding: '32px 0',
                marginBottom: '48px'
              }}
            >
              {/* Author and Date at top */}
              <div style={{
                marginBottom: '16px',
                fontSize: '0.875rem',
                color: '#4b5563',
                fontFamily: 'Georgia, serif'
              }}>
                <span style={{ fontWeight: '600' }}>
                  By {leadEssay.authorName}
                  {leadEssay.authorTitle && `, ${leadEssay.authorTitle}`}
                </span>
                {leadEssay.publishedAt && (
                  <>
                    <span style={{ margin: '0 8px' }}>•</span>
                    <span>
                      {new Date(leadEssay.publishedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </>
                )}
              </div>

              {/* Headline */}
              <h2 style={{
                fontSize: '2.5rem',
                fontWeight: 'bold',
                lineHeight: '1.2',
                marginBottom: '16px',
                fontFamily: 'Georgia, serif',
                color: '#000'
              }}>
                {leadEssay.headline}
              </h2>

              {/* Sub-headline */}
              {leadEssay.subHeadline && (
                <p style={{
                  fontSize: '1.25rem',
                  color: '#4b5563',
                  marginBottom: '24px',
                  fontFamily: 'Georgia, serif',
                  fontStyle: 'italic',
                  lineHeight: '1.5'
                }}>
                  {leadEssay.subHeadline}
                </p>
              )}

              {/* Full Essay Body with Drop Cap */}
              {leadEssay.body && (
                <div style={{
                  fontSize: '1.125rem',
                  lineHeight: '1.8',
                  color: '#1f2937',
                  fontFamily: 'Georgia, serif',
                  whiteSpace: 'pre-wrap',
                  wordWrap: 'break-word',
                  marginTop: '24px'
                }}>
                  {/* Drop Cap for first paragraph */}
                  <div
                    style={{
                      display: 'inline-block',
                      float: 'left',
                      fontSize: '5rem',
                      lineHeight: '0.8',
                      fontWeight: 'bold',
                      marginRight: '8px',
                      marginTop: '4px',
                      color: '#000',
                      fontFamily: 'Georgia, serif'
                    }}
                    dangerouslySetInnerHTML={{ 
                      __html: leadEssay.body.substring(0, 1) 
                    }}
                  />
                  <div
                    dangerouslySetInnerHTML={{ 
                      __html: leadEssay.body.substring(1) 
                    }}
                  />
                </div>
              )}
            </article>
          )}

          {/* Other Essays */}
          {otherEssays.map((opinion) => (
            <article
              key={opinion.id}
              style={{
                borderBottom: '2px solid #000',
                padding: '24px 0',
                marginBottom: '24px'
              }}
            >
              {/* Author and Date */}
              <div style={{
                marginBottom: '12px',
                fontSize: '0.875rem',
                color: '#4b5563',
                fontFamily: 'Georgia, serif'
              }}>
                <span style={{ fontWeight: '600' }}>
                  By {opinion.authorName}
                  {opinion.authorTitle && `, ${opinion.authorTitle}`}
                </span>
                {opinion.publishedAt && (
                  <>
                    <span style={{ margin: '0 8px' }}>•</span>
                    <span>
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
              <h3 style={{
                fontSize: '1.75rem',
                fontWeight: 'bold',
                lineHeight: '1.3',
                marginBottom: '12px',
                fontFamily: 'Georgia, serif',
                color: '#000'
              }}>
                {opinion.headline}
              </h3>

              {/* Sub-headline */}
              {opinion.subHeadline && (
                <p style={{
                  fontSize: '1rem',
                  color: '#4b5563',
                  marginBottom: '16px',
                  fontFamily: 'Georgia, serif',
                  fontStyle: 'italic',
                  lineHeight: '1.5'
                }}>
                  {opinion.subHeadline}
                </p>
              )}

              {/* Essay Body */}
              {opinion.body && (
                <div
                  style={{
                    fontSize: '1rem',
                    lineHeight: '1.8',
                    color: '#1f2937',
                    fontFamily: 'Georgia, serif',
                    whiteSpace: 'pre-wrap',
                    wordWrap: 'break-word'
                  }}
                  dangerouslySetInnerHTML={{ __html: opinion.body }}
                />
              )}
            </article>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OpinionFeed;
