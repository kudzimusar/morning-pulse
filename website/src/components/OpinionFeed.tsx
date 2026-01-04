import React, { useEffect, useState } from 'react';
import { Opinion } from '../../../types';
import { subscribeToPublishedOpinions } from '../services/opinionsService';
import { X, Mic2, Clock, Share2, Camera } from 'lucide-react';

const UNSPLASH_ACCESS_KEY = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;

const OpinionFeed: React.FC = () => {
  const [opinions, setOpinions] = useState<Opinion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOpinion, setSelectedOpinion] = useState<Opinion | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToPublishedOpinions(
      (fetched) => {
        setOpinions(fetched);
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setLoading(false);
      }
    );
    return () => { if (unsubscribe) unsubscribe(); };
  }, []);

  const getDynamicImage = (opinion: Opinion, width: number = 1200) => {
    if (opinion.imageUrl && opinion.imageUrl.startsWith('http')) return opinion.imageUrl;
    const keywords = `${opinion.category || 'news'} ${opinion.headline.split(' ').slice(0, 2).join(' ')}`;
    const encodedQuery = encodeURIComponent(keywords);
    return `https://source.unsplash.com/featured/${width}x${Math.round(width*0.6)}/?${encodedQuery}&sig=${opinion.id}`;
  };

  if (loading && opinions.length === 0) {
    return (
      <div style={{ 
        padding: '100px 20px', 
        textAlign: 'center', 
        fontFamily: 'Georgia, serif', 
        fontStyle: 'italic', 
        color: '#78716c' 
      }}>
        Curating today's perspectives...
      </div>
    );
  }

  if (!loading && opinions.length === 0) {
    return (
      <div style={{ 
        padding: '100px 20px', 
        textAlign: 'center', 
        fontFamily: 'Georgia, serif',
        color: '#78716c' 
      }}>
        <p style={{ fontStyle: 'italic', fontSize: '1.2rem' }}>No guest essays published yet.</p>
        <p style={{ marginTop: '16px', fontSize: '0.9rem' }}>Check back soon for compelling perspectives.</p>
      </div>
    );
  }

  return (
    <div style={{ 
      fontFamily: 'Georgia, serif', 
      backgroundColor: '#fffdfa', 
      minHeight: '100vh', 
      color: '#1a1a1a' 
    }}>
      <style>{`
        .mag-container { 
          max-width: 1280px; 
          margin: 0 auto; 
          padding: 20px; 
        }
        .mag-grid { 
          display: grid; 
          grid-template-columns: 1fr; 
          gap: 40px; 
        }
        @media (min-width: 1024px) {
          .mag-grid { 
            grid-template-columns: repeat(12, 1fr); 
          }
          .mag-main { 
            grid-column: span 8; 
          }
          .mag-sidebar { 
            grid-column: span 4; 
            border-left: 1px solid #e7e5e4; 
            padding-left: 40px; 
          }
        }
        .headline-xl { 
          font-size: clamp(2.2rem, 7vw, 4rem); 
          line-height: 0.95; 
          font-weight: 900; 
          letter-spacing: -0.04em; 
          margin: 0;
          font-family: Georgia, serif;
        }
        .drop-cap::first-letter {
          float: left; 
          font-size: 5rem; 
          line-height: 0.8; 
          padding-top: 4px; 
          padding-right: 12px; 
          font-weight: 900;
          font-family: Georgia, serif;
        }
        .essay-body p { 
          margin-bottom: 1.8rem; 
          font-size: 1.25rem; 
          line-height: 1.7; 
        }
        .opinion-card-hover:hover {
          transform: translateY(-2px);
          transition: transform 0.2s ease;
        }
        .opinion-card-hover img:hover {
          opacity: 0.95;
        }
        .close-btn:hover {
          background: #333 !important;
        }
        .sidebar-item:hover {
          background: #fafaf9;
        }
      `}</style>

      <main className="mag-container">
        <div className="mag-grid">
          {/* Main Content Area */}
          <div className="mag-main">
            {/* Hero Article */}
            {opinions[0] && (
              <article 
                onClick={() => setSelectedOpinion(opinions[0])} 
                className="opinion-card-hover"
                style={{ 
                  cursor: 'pointer', 
                  marginBottom: '60px' 
                }}
              >
                <div style={{ 
                  aspectRatio: '16/9', 
                  marginBottom: '24px', 
                  overflow: 'hidden', 
                  backgroundColor: '#f5f5f4',
                  borderRadius: '4px'
                }}>
                  <img 
                    src={getDynamicImage(opinions[0], 1200)} 
                    alt={opinions[0].headline}
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'cover',
                      transition: 'opacity 0.2s ease'
                    }} 
                  />
                </div>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  marginBottom: '12px' 
                }}>
                  <span style={{ 
                    fontSize: '11px', 
                    fontWeight: '700', 
                    textTransform: 'uppercase', 
                    color: '#dc2626',
                    letterSpacing: '0.05em'
                  }}>
                    {opinions[0].writerType || 'Guest Essay'}
                  </span>
                  {opinions[0].category && (
                    <>
                      <span style={{ color: '#d4d4d4' }}>•</span>
                      <span style={{ 
                        fontSize: '11px', 
                        fontWeight: '600', 
                        textTransform: 'uppercase', 
                        color: '#78716c' 
                      }}>
                        {opinions[0].category}
                      </span>
                    </>
                  )}
                </div>
                <h1 className="headline-xl">{opinions[0].headline}</h1>
                <p style={{ 
                  fontSize: 'clamp(1.1rem, 3vw, 1.3rem)', 
                  color: '#57534e', 
                  fontStyle: 'italic', 
                  marginTop: '16px',
                  lineHeight: '1.4'
                }}>
                  {opinions[0].subHeadline}
                </p>
                <div style={{ 
                  marginTop: '20px', 
                  fontSize: '11px', 
                  fontWeight: '900', 
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: '#44403c'
                }}>
                  By {opinions[0].authorName}
                  {opinions[0].authorTitle && (
                    <span style={{ fontWeight: '400', fontStyle: 'italic', marginLeft: '4px' }}>
                      , {opinions[0].authorTitle}
                    </span>
                  )}
                </div>
              </article>
            )}

            {/* Secondary Articles Grid */}
            {opinions.length > 1 && (
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
                gap: '32px', 
                borderTop: '4px solid #000', 
                paddingTop: '32px' 
              }}>
                {opinions.slice(1, 4).map((op) => (
                  <article 
                    key={op.id} 
                    onClick={() => setSelectedOpinion(op)} 
                    className="opinion-card-hover"
                    style={{ cursor: 'pointer' }}
                  >
                    <div style={{ 
                      aspectRatio: '3/2', 
                      marginBottom: '12px', 
                      overflow: 'hidden', 
                      backgroundColor: '#f5f5f4',
                      borderRadius: '4px'
                    }}>
                      <img 
                        src={getDynamicImage(op, 600)} 
                        alt={op.headline}
                        style={{ 
                          width: '100%', 
                          height: '100%', 
                          objectFit: 'cover',
                          transition: 'opacity 0.2s ease'
                        }} 
                      />
                    </div>
                    <div style={{ 
                      fontSize: '10px', 
                      fontWeight: '700', 
                      textTransform: 'uppercase', 
                      color: '#dc2626',
                      marginBottom: '8px',
                      letterSpacing: '0.05em'
                    }}>
                      {op.writerType || 'Guest Essay'}
                    </div>
                    <h3 style={{ 
                      fontSize: 'clamp(1.2rem, 4vw, 1.4rem)', 
                      fontWeight: '900', 
                      lineHeight: '1.2',
                      margin: '0 0 8px 0',
                      fontFamily: 'Georgia, serif'
                    }}>
                      {op.headline}
                    </h3>
                    <p style={{ 
                      fontSize: '0.95rem', 
                      color: '#57534e', 
                      fontStyle: 'italic',
                      lineHeight: '1.4',
                      margin: '0 0 12px 0'
                    }}>
                      {op.subHeadline}
                    </p>
                    <div style={{ 
                      fontSize: '10px', 
                      color: '#a8a29e', 
                      textTransform: 'uppercase', 
                      fontWeight: 'bold',
                      letterSpacing: '0.05em'
                    }}>
                      By {op.authorName}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar - The Board */}
          <aside className="mag-sidebar">
            <div style={{ 
              borderBottom: '2px solid #000', 
              paddingBottom: '8px', 
              marginBottom: '24px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px' 
            }}>
              <Mic2 size={16} />
              <h2 style={{ 
                fontSize: '12px', 
                fontWeight: '900', 
                textTransform: 'uppercase',
                margin: 0,
                letterSpacing: '0.1em'
              }}>
                The Board
              </h2>
            </div>
            {opinions.length <= 4 && (
              <p style={{ 
                fontSize: '0.9rem', 
                color: '#a8a29e', 
                fontStyle: 'italic' 
              }}>
                More perspectives coming soon...
              </p>
            )}
            {opinions.slice(4).map(op => (
              <div 
                key={op.id} 
                onClick={() => setSelectedOpinion(op)} 
                className="sidebar-item"
                style={{ 
                  cursor: 'pointer', 
                  borderBottom: '1px solid #e7e5e4', 
                  paddingBottom: '16px', 
                  marginBottom: '16px',
                  padding: '12px',
                  marginLeft: '-12px',
                  marginRight: '-12px',
                  borderRadius: '4px',
                  transition: 'background 0.15s ease'
                }}
              >
                <div style={{ 
                  fontSize: '10px', 
                  fontWeight: '700', 
                  textTransform: 'uppercase', 
                  color: '#dc2626',
                  marginBottom: '6px',
                  letterSpacing: '0.05em'
                }}>
                  {op.writerType || 'Guest Essay'}
                </div>
                <h4 style={{ 
                  fontSize: '1.1rem', 
                  fontWeight: 'bold',
                  margin: '0 0 6px 0',
                  lineHeight: '1.3',
                  fontFamily: 'Georgia, serif'
                }}>
                  {op.headline}
                </h4>
                <div style={{ 
                  fontSize: '10px', 
                  color: '#a8a29e', 
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  {op.authorName}
                </div>
              </div>
            ))}
          </aside>
        </div>
      </main>

      {/* Full Essay Modal */}
      {selectedOpinion && (
        <div style={{ 
          position: 'fixed', 
          inset: 0, 
          zIndex: 1000, 
          backgroundColor: '#fffdfa', 
          overflowY: 'auto', 
          padding: '20px' 
        }}>
          <div style={{ 
            maxWidth: '800px', 
            margin: '40px auto',
            paddingBottom: '80px'
          }}>
            <button 
              onClick={() => setSelectedOpinion(null)} 
              className="close-btn"
              style={{ 
                position: 'fixed', 
                top: '20px', 
                right: '20px', 
                background: '#000', 
                color: '#fff', 
                border: 'none', 
                padding: '12px', 
                borderRadius: '50%', 
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.15s ease',
                zIndex: 1001
              }}
            >
              <X size={20} />
            </button>
            
            {/* Modal Header */}
            <header style={{ 
              textAlign: 'center', 
              marginBottom: '40px',
              paddingTop: '20px'
            }}>
              <div style={{ 
                fontSize: '11px', 
                fontWeight: '700', 
                textTransform: 'uppercase', 
                color: '#dc2626',
                letterSpacing: '0.1em',
                marginBottom: '16px'
              }}>
                {selectedOpinion.writerType || 'Guest Essay'}
                {selectedOpinion.category && (
                  <span style={{ color: '#a8a29e', margin: '0 8px' }}>•</span>
                )}
                {selectedOpinion.category && (
                  <span style={{ color: '#78716c' }}>{selectedOpinion.category}</span>
                )}
              </div>
              <h1 
                className="headline-xl" 
                style={{ 
                  marginBottom: '20px',
                  paddingLeft: '20px',
                  paddingRight: '20px'
                }}
              >
                {selectedOpinion.headline}
              </h1>
              <p style={{ 
                fontSize: 'clamp(1.2rem, 4vw, 1.5rem)', 
                fontStyle: 'italic', 
                color: '#57534e',
                lineHeight: '1.4',
                maxWidth: '600px',
                margin: '0 auto'
              }}>
                {selectedOpinion.subHeadline}
              </p>
              <div style={{ 
                marginTop: '24px', 
                fontWeight: '900', 
                textTransform: 'uppercase', 
                fontSize: '12px',
                letterSpacing: '0.05em'
              }}>
                By {selectedOpinion.authorName}
                {selectedOpinion.authorTitle && (
                  <span style={{ 
                    fontWeight: '400', 
                    fontStyle: 'italic',
                    display: 'block',
                    marginTop: '4px',
                    textTransform: 'none'
                  }}>
                    {selectedOpinion.authorTitle}
                  </span>
                )}
              </div>
              {selectedOpinion.publishedAt && (
                <div style={{ 
                  marginTop: '12px', 
                  fontSize: '12px', 
                  color: '#a8a29e',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}>
                  <Clock size={14} />
                  {new Date(selectedOpinion.publishedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              )}
            </header>
            
            {/* Featured Image */}
            <div style={{ 
              position: 'relative',
              marginBottom: '40px' 
            }}>
              <img 
                src={getDynamicImage(selectedOpinion, 1200)} 
                alt={selectedOpinion.headline}
                style={{ 
                  width: '100%',
                  borderRadius: '4px'
                }} 
              />
              <div style={{ 
                position: 'absolute',
                bottom: '12px',
                right: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '10px',
                color: '#fff',
                backgroundColor: 'rgba(0,0,0,0.6)',
                padding: '4px 8px',
                borderRadius: '4px'
              }}>
                <Camera size={12} />
                Unsplash
              </div>
            </div>
            
            {/* Essay Body */}
            <div 
              className="essay-body drop-cap" 
              style={{ 
                whiteSpace: 'pre-wrap',
                fontSize: 'clamp(1.1rem, 3vw, 1.25rem)',
                lineHeight: '1.8',
                color: '#1f2937'
              }} 
              dangerouslySetInnerHTML={{ __html: selectedOpinion.body }} 
            />
            
            {/* Share Actions */}
            <div style={{ 
              marginTop: '60px',
              paddingTop: '24px',
              borderTop: '1px solid #e7e5e4',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '16px'
            }}>
              <button 
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: selectedOpinion.headline,
                      text: selectedOpinion.subHeadline,
                      url: window.location.href
                    });
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 24px',
                  backgroundColor: '#000',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}
              >
                <Share2 size={14} />
                Share Essay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OpinionFeed;
