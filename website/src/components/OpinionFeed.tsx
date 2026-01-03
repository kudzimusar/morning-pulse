import React, { useEffect, useState } from 'react';
import { Opinion } from '../../../types';
import { 
  subscribeToPublishedOpinions
} from '../services/opinionsService';

interface OpinionFeedProps {
  onOpinionClick?: (opinion: Opinion) => void;
  onNavigateToSubmit?: () => void;
}

const OpinionFeed: React.FC<OpinionFeedProps> = ({ onOpinionClick, onNavigateToSubmit }) => {
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

  // Helper function to get author initial
  const getAuthorInitial = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  // Helper function to extract first letter from HTML body
  const getFirstLetter = (html: string) => {
    if (!html) return '';
    // Remove HTML tags and get first character
    const text = html.replace(/<[^>]*>/g, '').trim();
    const firstChar = text.charAt(0);
    // Return uppercase if it's a letter, otherwise return as-is
    return firstChar.match(/[a-zA-Z]/) ? firstChar.toUpperCase() : firstChar;
  };

  // Helper function to remove first letter from HTML body for drop cap effect
  const getBodyWithoutFirstLetter = (html: string) => {
    if (!html) return '';
    // Find the first text character (not in a tag)
    const match = html.match(/^([^<]*<[^>]*>)*([a-zA-Z])/);
    if (match) {
      const index = match[0].length - 1;
      return html.substring(0, index) + html.substring(index + 1);
    }
    // Fallback: just remove first character
    return html.substring(1);
  };

  return (
    <div className="opinion-feed" style={{ fontFamily: 'Georgia, serif' }}>
      {/* NYT Masthead - Centered, Authoritative */}
      <div style={{
        borderTop: '4px solid #000',
        borderBottom: '2px solid #000',
        padding: '32px 16px',
        marginBottom: '48px',
        textAlign: 'center'
      }}>
        <h1 style={{
          fontSize: 'clamp(2.5rem, 8vw, 7rem)',
          fontWeight: '900',
          letterSpacing: '0.02em',
          textTransform: 'uppercase',
          fontFamily: '"Times New Roman", serif',
          margin: 0,
          color: '#000',
          lineHeight: '1',
          fontStyle: 'italic'
        }}>
          OPINION
        </h1>
        {onNavigateToSubmit && (
          <div style={{ marginTop: '16px' }}>
            <a 
              href="#opinion/submit" 
              onClick={(e) => {
                e.preventDefault();
                onNavigateToSubmit();
              }}
              style={{
                fontSize: '0.875rem',
                color: '#000',
                textDecoration: 'underline',
                fontFamily: 'Georgia, serif',
                fontWeight: '500'
              }}
            >
              Submit a Guest Essay
            </a>
          </div>
        )}
      </div>

      {/* Grid Layout: Main Content + Sidebar (responsive) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: '48px',
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 16px'
      }}>
        {/* Main Content Column - Centered reading column */}
        <div style={{ 
          gridColumn: '1 / -1',
          maxWidth: '680px',
          margin: '0 auto',
          width: '100%'
        }}>
          {leadEssay && (
            <article
              key={leadEssay.id}
              style={{
                borderBottom: '3px solid #000',
                padding: '48px 0',
                marginBottom: '64px'
              }}
            >
              {/* Credit Card Style Byline */}
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                marginBottom: '32px',
                paddingBottom: '20px',
                borderBottom: '2px solid #000'
              }}>
                {/* Small Avatar - 10x10 equivalent (40px) */}
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: '#000',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  fontFamily: 'Georgia, serif',
                  flexShrink: 0
                }}>
                  {getAuthorInitial(leadEssay.authorName)}
                </div>
                
                {/* Multi-line Meta Data */}
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: '0.875rem',
                    fontWeight: '900',
                    textTransform: 'uppercase',
                    color: '#000',
                    fontFamily: 'Georgia, serif',
                    letterSpacing: '0.05em',
                    marginBottom: '6px',
                    lineHeight: '1.2'
                  }}>
                    {leadEssay.authorName}
                  </div>
                  {leadEssay.authorTitle && (
                    <div style={{
                      fontSize: '0.75rem',
                      color: '#4b5563',
                      fontFamily: 'Georgia, serif',
                      marginBottom: '6px',
                      lineHeight: '1.4'
                    }}>
                      {leadEssay.authorTitle}
                    </div>
                  )}
                  {leadEssay.publishedAt && (
                    <div style={{
                      fontSize: '0.75rem',
                      color: '#6b7280',
                      fontFamily: 'Georgia, serif',
                      lineHeight: '1.4'
                    }}>
                      {new Date(leadEssay.publishedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                  )}
                </div>

                {/* Share and Bookmark Icons */}
                <div style={{
                  display: 'flex',
                  gap: '8px',
                  alignItems: 'flex-start',
                  paddingTop: '4px'
                }}>
                  <button
                    style={{
                      background: 'none',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      padding: '6px 10px',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      color: '#4b5563',
                      fontFamily: 'Georgia, serif'
                    }}
                    title="Share"
                  >
                    Share
                  </button>
                  <button
                    style={{
                      background: 'none',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      padding: '6px 10px',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      color: '#4b5563',
                      fontFamily: 'Georgia, serif'
                    }}
                    title="Bookmark"
                  >
                    Bookmark
                  </button>
                </div>
              </div>

              {/* Headline - Responsive */}
              <h2 style={{
                fontSize: 'clamp(1.875rem, 5vw, 3rem)',
                fontWeight: '900',
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

              {/* Full Essay Body with Enhanced Drop Cap */}
              {leadEssay.body && (
                <div style={{
                  fontSize: 'clamp(1rem, 2vw, 1.1rem)',
                  lineHeight: '1.65',
                  color: '#1f2937',
                  fontFamily: 'Georgia, serif',
                  whiteSpace: 'pre-wrap',
                  wordWrap: 'break-word',
                  marginTop: '32px',
                  position: 'relative'
                }}>
                  {/* Enhanced Drop Cap - Tighter, Smaller */}
                  <span
                    style={{
                      float: 'left',
                      fontSize: 'clamp(4rem, 8vw, 7rem)',
                      lineHeight: '0.75',
                      fontWeight: 'bold',
                      marginRight: '10px',
                      marginTop: '8px',
                      color: '#000',
                      fontFamily: 'Georgia, serif',
                      display: 'block',
                      height: '5rem',
                      paddingRight: '4px'
                    }}
                  >
                    {getFirstLetter(leadEssay.body)}
                  </span>
                  <div
                    style={{
                      display: 'inline',
                      textIndent: '0'
                    }}
                    dangerouslySetInnerHTML={{ 
                      __html: getBodyWithoutFirstLetter(leadEssay.body)
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

              {/* Headline - Responsive */}
              <h3 style={{
                fontSize: 'clamp(1.5rem, 4vw, 1.875rem)',
                fontWeight: '900',
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

              {/* Essay Body - Responsive */}
              {opinion.body && (
                <div
                  style={{
                    fontSize: 'clamp(1rem, 2vw, 1.1rem)',
                    lineHeight: '1.65',
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

        {/* Sidebar - Stacks on mobile, fixed width on desktop */}
        <aside style={{
          gridColumn: '1 / -1',
          marginTop: '32px',
          maxWidth: '680px',
          margin: '32px auto 0',
          width: '100%'
        }}>
          {/* The Editorial Board */}
          <div style={{
            border: '2px solid #000',
            padding: '24px',
            marginBottom: '32px',
            backgroundColor: '#fafafa'
          }}>
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: '900',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              fontFamily: 'Georgia, serif',
              marginBottom: '16px',
              color: '#000',
              borderBottom: '2px solid #000',
              paddingBottom: '12px'
            }}>
              The Editorial Board
            </h3>
            <p style={{
              fontSize: '0.875rem',
              lineHeight: '1.6',
              color: '#4b5563',
              fontFamily: 'Georgia, serif',
              marginBottom: '16px'
            }}>
              The Editorial Board represents the opinions of the Morning Pulse editorial staff. Our board members are independent voices committed to providing thoughtful analysis and commentary on the issues that matter most.
            </p>
            <p style={{
              fontSize: '0.875rem',
              lineHeight: '1.6',
              color: '#4b5563',
              fontFamily: 'Georgia, serif'
            }}>
              To submit an opinion piece for consideration, please use the submission form below.
            </p>
          </div>

          {/* Submission Box */}
          {onNavigateToSubmit && (
            <div style={{
              border: '2px solid #000',
              padding: '32px',
              backgroundColor: '#fff',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '16px'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: '#000',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.25rem',
                  fontWeight: 'bold',
                  fontFamily: 'Georgia, serif',
                  flexShrink: 0
                }}>
                  ✎
                </div>
                <h3 style={{
                  fontSize: '1.125rem',
                  fontWeight: '900',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  fontFamily: 'Georgia, serif',
                  margin: 0,
                  color: '#000'
                }}>
                  Submit a Guest Essay
                </h3>
              </div>
              <p style={{
                fontSize: '0.875rem',
                lineHeight: '1.6',
                color: '#4b5563',
                fontFamily: 'Georgia, serif',
                marginBottom: '20px'
              }}>
                Share your perspective with Morning Pulse readers. All submissions are reviewed by our editorial team before publication.
              </p>
              <a 
                href="#opinion/submit" 
                onClick={(e) => {
                  e.preventDefault();
                  onNavigateToSubmit();
                }}
                style={{
                  display: 'inline-block',
                  backgroundColor: '#000',
                  color: '#fff',
                  padding: '12px 24px',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  fontFamily: 'Georgia, serif',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1f2937'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#000'}
              >
                Submit Your Essay →
              </a>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};

export default OpinionFeed;
