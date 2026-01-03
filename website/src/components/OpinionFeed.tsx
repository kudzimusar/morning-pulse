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
  const [activeCategory, setActiveCategory] = useState<string>('Latest');

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

  // Helper function to get image URL with fallback
  const getImageUrl = (opinion: Opinion, index: number = 0) => {
    if (opinion.imageUrl) {
      return opinion.imageUrl;
    }
    // Use different Unsplash images based on index for variety
    const unsplashIds = [
      '1504711434812-13ee07f6fa43',
      '1488190211421-dd24b4761e27',
      '1499750310107-5fef28a66643',
      '1507003211169-0a1dd7228f2d'
    ];
    const seed = unsplashIds[index % unsplashIds.length];
    return `https://images.unsplash.com/photo-${seed}?auto=format&fit=crop&q=80&w=1200`;
  };

  // Filter opinions by category
  const categories = ['Latest', 'The Board', 'Guest Essays', 'Letters', 'Culture', 'Video', 'Audio'];
  const filteredOpinions = activeCategory === 'Latest' 
    ? opinions 
    : activeCategory === 'Guest Essays'
    ? opinions.filter(o => o.writerType === 'Guest Essay')
    : opinions.filter(o => o.category === activeCategory);

  // NYT-style layout: Lead essay + secondary grid
  const leadEssay = filteredOpinions[0];
  const secondaryEssays = filteredOpinions.slice(1, 4);
  const remainingEssays = filteredOpinions.slice(4);

  return (
    <div className="opinion-feed" style={{ fontFamily: 'Georgia, serif', backgroundColor: '#fffdfa', minHeight: '100vh' }}>
      {/* Category Navigation Bar - Sticky */}
      <div style={{
        position: 'sticky',
        top: '56px', // Below main header (h-14 = 56px)
        zIndex: 30,
        backgroundColor: '#fff',
        borderBottom: '1px solid #e7e5e4',
        height: '48px' // h-12 = 48px
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 16px',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          overflowX: 'auto'
        }}>
          <div style={{
            display: 'flex',
            gap: '24px',
            whiteSpace: 'nowrap'
          }}>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  fontSize: '11px',
                  fontWeight: '900',
                  textTransform: 'uppercase',
                  letterSpacing: '0.15em',
                  transition: 'color 0.2s',
                  color: activeCategory === cat ? '#991b1b' : '#a8a29e',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0',
                  fontFamily: 'Georgia, serif'
                }}
                onMouseEnter={(e) => {
                  if (activeCategory !== cat) e.currentTarget.style.color = '#000';
                }}
                onMouseLeave={(e) => {
                  if (activeCategory !== cat) e.currentTarget.style.color = '#a8a29e';
                }}
              >
                {cat}
              </button>
            ))}
          </div>
          {onNavigateToSubmit && (
            <div style={{
              display: 'none', // Hidden on mobile, shown on desktop via media query
              alignItems: 'center',
              gap: '16px',
              color: '#a8a29e',
              borderLeft: '1px solid #e7e5e4',
              paddingLeft: '16px',
              marginLeft: '16px'
            }}>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  onNavigateToSubmit();
                }}
                style={{
                  fontSize: '10px',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  letterSpacing: '0.15em',
                  color: '#000',
                  border: '1px solid #000',
                  padding: '4px 12px',
                  background: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontFamily: 'Georgia, serif'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#000';
                  e.currentTarget.style.color = '#fff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#000';
                }}
              >
                Submit
              </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Grid - 12 column layout */}
      <main style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '32px 16px',
        paddingTop: '32px'
      }}>
        {loading ? (
          <div style={{
            height: '384px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontStyle: 'italic',
            color: '#a8a29e',
            fontFamily: 'Georgia, serif'
          }}>
            Loading perspectives...
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: '48px'
          }}>
            {/* Media query for 12-column grid on desktop */}
            <style>{`
              @media (min-width: 1024px) {
                .opinion-main-grid {
                  grid-template-columns: repeat(12, 1fr) !important;
                }
                .opinion-main-content {
                  grid-column: span 8 !important;
                }
                .opinion-sidebar {
                  grid-column: span 4 !important;
                  border-left: 1px solid #e7e5e4 !important;
                  padding-left: 40px !important;
                  border-top: none !important;
                  padding-top: 0 !important;
                }
              }
            `}</style>
            <div className="opinion-main-grid" style={{
              display: 'grid',
              gridTemplateColumns: '1fr',
              gap: '48px'
            }}>
              {/* LEFT COLUMN: PRIMARY CONTENT (8 cols on desktop) */}
              <div className="opinion-main-content" style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '48px'
              }}>
              {/* Hero Lead Story */}
              {leadEssay && (
                <article
                  key={leadEssay.id}
                  style={{
                    cursor: onOpinionClick ? 'pointer' : 'default'
                  }}
                  onClick={() => onOpinionClick?.(leadEssay)}
                  onMouseEnter={(e) => {
                    if (onOpinionClick) {
                      e.currentTarget.style.opacity = '0.95';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '1';
                  }}
                >
                  {/* Hero Image */}
                  <div style={{
                    position: 'relative',
                    aspectRatio: '16/9',
                    marginBottom: '32px',
                    overflow: 'hidden',
                    backgroundColor: '#f5f5f4',
                    borderRadius: '2px'
                  }}>
                    <img
                      src={getImageUrl(leadEssay, 0)}
                      alt={leadEssay.headline}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transition: 'transform 1s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    />
                    <div style={{
                      position: 'absolute',
                      top: '16px',
                      left: '16px',
                      backgroundColor: '#991b1b',
                      color: '#fff',
                      fontSize: '9px',
                      fontWeight: '900',
                      textTransform: 'uppercase',
                      letterSpacing: '0.15em',
                      padding: '4px 8px'
                    }}>
                      Featured Essay
                    </div>
                  </div>

                  {/* Hero Content */}
                  <div style={{
                    maxWidth: '720px'
                  }}>
                    {/* Headline - Large for Hero */}
                    <h2 style={{
                      fontSize: 'clamp(2.25rem, 6vw, 3.75rem)',
                      fontWeight: '900',
                      lineHeight: '0.95',
                      marginBottom: '24px',
                      fontFamily: 'Georgia, serif',
                      color: '#000',
                      letterSpacing: '-0.02em',
                      transition: 'color 0.2s'
                    }}>
                      {leadEssay.headline}
                    </h2>

                    {/* Sub-headline */}
                    {leadEssay.subHeadline && (
                      <p style={{
                        fontSize: 'clamp(1.125rem, 2vw, 1.25rem)',
                        color: '#78716c',
                        marginBottom: '24px',
                        fontFamily: 'Georgia, serif',
                        fontStyle: 'italic',
                        lineHeight: '1.6',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {leadEssay.subHeadline || "Exploring the deep intersections of technology, sovereignty, and the human spirit in a rapidly changing digital landscape."}
                      </p>
                    )}

                    {/* Byline */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      marginBottom: '32px'
                    }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: '#e7e5e4',
                        color: '#78716c',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        fontFamily: 'Georgia, serif',
                        textTransform: 'uppercase'
                      }}>
                        {getAuthorInitial(leadEssay.authorName)}
                      </div>
                      <div style={{
                        fontSize: '11px',
                        fontWeight: '900',
                        textTransform: 'uppercase',
                        letterSpacing: '0.15em',
                        color: '#000',
                        fontFamily: 'Georgia, serif'
                      }}>
                        By {leadEssay.authorName}
                      </div>
                    </div>
                  </div>
                </article>
              )}

              {/* Secondary Grid - 2 columns (responsive) */}
              {secondaryEssays.length > 0 && (
                <div style={{
                  borderTop: '1px solid #e7e5e4',
                  paddingTop: '48px'
                }}>
                  {/* Media query for 2 columns on larger screens */}
                  <style>{`
                    @media (min-width: 768px) {
                      .opinion-secondary-grid {
                        grid-template-columns: repeat(2, 1fr) !important;
                      }
                    }
                  `}</style>
                  <div className="opinion-secondary-grid" style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr',
                    gap: '48px'
                  }}>
                  {secondaryEssays.map((opinion, idx) => (
                    <article
                      key={opinion.id}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '20px',
                        cursor: onOpinionClick ? 'pointer' : 'default'
                      }}
                      className="group"
                      onClick={() => onOpinionClick?.(opinion)}
                      onMouseEnter={(e) => {
                        if (onOpinionClick) {
                          e.currentTarget.style.opacity = '0.95';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.opacity = '1';
                      }}
                    >
                      {/* Image */}
                      <div style={{
                        aspectRatio: '16/9',
                        backgroundColor: '#f5f5f4',
                        overflow: 'hidden',
                        borderRadius: '2px'
                      }}>
                        <img
                          src={getImageUrl(opinion, idx + 1)}
                          alt={opinion.headline}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            transition: 'transform 0.7s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.05)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                          }}
                        />
                      </div>

                      {/* Content */}
                      <div>
                        <h3 style={{
                          fontSize: 'clamp(1.5rem, 3vw, 1.875rem)',
                          fontWeight: '900',
                          lineHeight: '1.3',
                          marginBottom: '12px',
                          fontFamily: 'Georgia, serif',
                          color: '#000',
                          transition: 'color 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.color = '#57534e'}
                        onMouseLeave={(e) => e.currentTarget.style.color = '#000'}
                        >
                          {opinion.headline}
                        </h3>
                        <div style={{
                          fontSize: '10px',
                          fontWeight: 'bold',
                          textTransform: 'uppercase',
                          letterSpacing: '0.15em',
                          color: '#a8a29e',
                          fontFamily: 'Georgia, serif'
                        }}>
                          By {opinion.authorName}
                        </div>
                      </div>
                    </article>
                  ))}
                  </div>
              )}

              {/* Remaining Essays */}
              {remainingEssays.map((opinion) => (
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

              {/* RIGHT COLUMN: SIDEBAR (4 cols on desktop) */}
              <aside className="opinion-sidebar" style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '48px',
                borderTop: '1px solid #e7e5e4',
                paddingTop: '48px',
                marginTop: '0'
              }}>
                {/* The Editorial Board */}
                <section>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '32px'
                  }}>
                    <div style={{
                      width: '24px',
                      height: '24px',
                      backgroundColor: '#000',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      🎤
                    </div>
                    <h3 style={{
                      fontSize: '11px',
                      fontWeight: '900',
                      textTransform: 'uppercase',
                      letterSpacing: '0.2em',
                      fontFamily: 'Georgia, serif',
                      borderBottom: '1px solid #000',
                      flexGrow: 1,
                      paddingBottom: '4px',
                      color: '#000'
                    }}>
                      The Board
                    </h3>
                  </div>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '32px'
                  }}>
                    {["The Path to Digital Sovereignty", "Why Local Journalism Matters"].map((title, i) => (
                      <div 
                        key={i}
                        style={{
                          cursor: 'pointer',
                          borderBottom: '1px solid #f5f5f4',
                          paddingBottom: '24px'
                        }}
                      >
                        <h4 style={{
                          fontWeight: 'bold',
                          fontSize: '1.25rem',
                          lineHeight: '1.3',
                          marginBottom: '8px',
                          fontFamily: 'Georgia, serif',
                          color: '#000',
                          transition: 'text-decoration 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                        onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                        >
                          {title}
                        </h4>
                        <p style={{
                          fontSize: '10px',
                          color: '#a8a29e',
                          textTransform: 'uppercase',
                          letterSpacing: '0.1em',
                          fontWeight: '900',
                          fontFamily: 'Georgia, serif'
                        }}>
                          Editorial Board • 4 MIN READ
                        </p>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Submission Box - Multimedia Section */}
                {onNavigateToSubmit && (
                  <div 
                    style={{
                      backgroundColor: '#000',
                      color: '#fff',
                      padding: '40px',
                      textAlign: 'center',
                      borderRadius: '2px',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s'
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigateToSubmit();
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1c1917'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#000'}
                  >
                    <div style={{
                      fontSize: '32px',
                      marginBottom: '24px',
                      color: '#78716c'
                    }}>
                      ✎
                    </div>
                    <h4 style={{
                      fontWeight: '900',
                      fontSize: '1.5rem',
                      textTransform: 'uppercase',
                      letterSpacing: '-0.02em',
                      fontFamily: 'Georgia, serif',
                      marginBottom: '16px',
                      color: '#fff'
                    }}>
                      Submit Your Perspective
                    </h4>
                    <p style={{
                      color: '#a8a29e',
                      fontSize: '12px',
                      marginBottom: '32px',
                      lineHeight: '1.6',
                      fontFamily: 'Georgia, serif'
                    }}>
                      Join the Morning Pulse community. We publish deep-dives that challenge the digital status quo.
                    </p>
                    <button
                      style={{
                        width: '100%',
                        backgroundColor: '#fff',
                        color: '#000',
                        padding: '16px',
                        fontWeight: 'bold',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        fontSize: '10px',
                        border: 'none',
                        cursor: 'pointer',
                        fontFamily: 'Georgia, serif'
                      }}
                    >
                      Write for us
                    </button>
                  </div>
                )}
              </aside>
            </div>
          </div>
    </div>
  );
};

export default OpinionFeed;
