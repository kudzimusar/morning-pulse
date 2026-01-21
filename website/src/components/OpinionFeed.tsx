import React, { useEffect, useState } from 'react';
import { Opinion } from '../../types';
import { subscribeToPublishedOpinions, getOpinionBySlug } from '../services/opinionsService';
import { trackArticleView, trackArticleEngagement } from '../services/analyticsService';
import { X, PenTool } from 'lucide-react';
import { getImageByTopic } from '../utils/imageGenerator';

interface OpinionFeedProps {
  onNavigateToSubmit?: () => void;
  slug?: string | null; // NEW: Slug for single opinion view
}

const OpinionFeed: React.FC<OpinionFeedProps> = ({ onNavigateToSubmit, slug }) => {
  const [opinions, setOpinions] = useState<Opinion[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('Latest');
  const [selectedOpinion, setSelectedOpinion] = useState<Opinion | null>(null);
  const [slugOpinion, setSlugOpinion] = useState<Opinion | null>(null); // NEW: Opinion loaded by slug
  const [slugNotFound, setSlugNotFound] = useState(false); // NEW: Track if slug lookup failed

  // NEW: Fetch single opinion by slug if provided
  useEffect(() => {
    if (!slug) {
      setSlugOpinion(null);
      setSlugNotFound(false);
      return;
    }

    setLoading(true);
    setSlugNotFound(false);
    
    getOpinionBySlug(slug)
      .then((opinion) => {
        if (opinion) {
          setSlugOpinion(opinion);
          setSelectedOpinion(opinion); // Auto-open the opinion
          // NEW: Update URL to canonical slug if needed
          if (opinion.slug && window.location.hash !== `#opinion/${opinion.slug}`) {
            window.history.replaceState(null, '', `#opinion/${opinion.slug}`);
          }
        } else {
          setSlugNotFound(true);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching opinion by slug:', err);
        setSlugNotFound(true);
        setLoading(false);
      });
  }, [slug]);

  useEffect(() => {
    const unsubscribe = subscribeToPublishedOpinions(
      (fetched) => {
        setOpinions(fetched);
        setLoading(false);
      },
      (err) => {
        console.error("Opinion Fetch Error:", err);
        setLoading(false);
      }
    );
    return () => { if (unsubscribe) unsubscribe(); };
  }, []);

  const getDisplayImage = (opinion: Opinion) => {
    const fromDoc = opinion.finalImageUrl || opinion.suggestedImageUrl || opinion.imageUrl;
    if (typeof fromDoc === 'string' && /^https?:\/\//i.test(fromDoc)) return fromDoc;
    return getImageByTopic(opinion.headline || '', opinion.id);
  };

  const categories = ['Latest', 'The Board', 'Guest Essays', 'Letters', 'Culture'];
  
  const filtered = activeCategory === 'Latest' 
    ? opinions 
    : opinions.filter(o => o.category === activeCategory || (activeCategory === 'Guest Essays' && o.writerType === 'Guest Essay'));

  // NEW: Track view when opinion is opened
  useEffect(() => {
    if (selectedOpinion) {
      try {
        // Track detailed article view in Google Analytics
        trackArticleView(
          selectedOpinion.id,
          selectedOpinion.headline,
          selectedOpinion.authorName,
          selectedOpinion.category
        );

        // Track engagement start
        trackArticleEngagement(selectedOpinion.id, 'start_reading', {
          source: 'opinion_feed',
          category: selectedOpinion.category
        });
      } catch (err) {
        // Silently fail analytics - don't block UI
        console.warn('Failed to track view:', err);
      }
    }
  }, [selectedOpinion]);

  // NEW: Handle slug not found
  if (slugNotFound) {
    return (
      <div style={{ padding: '100px 20px', textAlign: 'center', fontFamily: 'serif' }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '16px', color: '#991b1b' }}>Opinion Not Found</h2>
        <p style={{ fontSize: '1.2rem', color: '#78716c', marginBottom: '24px' }}>
          The opinion you're looking for doesn't exist or has been removed.
        </p>
        <button
          onClick={() => {
            window.location.hash = 'opinion';
            setSlugNotFound(false);
          }}
          style={{
            padding: '12px 24px',
            backgroundColor: '#000',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          ← Back to Opinions
        </button>
      </div>
    );
  }

  if (loading && opinions.length === 0 && !slugOpinion) {
    return <div style={{ padding: '100px 20px', textAlign: 'center', fontFamily: 'serif', color: '#78716c' }}>Journalism in progress...</div>;
  }

  return (
    <div style={{ fontFamily: 'Georgia, serif', backgroundColor: '#fffdfa', minHeight: '100vh', color: '#1a1a1a' }}>
      
      {/* RESTORED NAVIGATION BAR */}
      <nav style={{ position: 'sticky', top: '56px', zIndex: 30, backgroundColor: '#fff', borderBottom: '1px solid #e7e5e4' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 16px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '24px', overflowX: 'auto', scrollbarWidth: 'none' }}>
            {categories.map(cat => (
              <button 
                key={cat} 
                onClick={() => setActiveCategory(cat)}
                style={{
                  fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em',
                  color: activeCategory === cat ? '#991b1b' : '#a8a29e', background: 'none', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap'
                }}
              >
                {cat}
              </button>
            ))}
          </div>
          <button 
            onClick={onNavigateToSubmit}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#000', color: '#fff', 
              fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', padding: '6px 12px', border: 'none', cursor: 'pointer' 
            }}
          >
            <PenTool size={12} /> <span className="hidden-mobile">Submit Essay</span>
          </button>
        </div>
      </nav>

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 16px' }}>
        <style>{`
          .mag-grid { display: grid; grid-template-columns: 1fr; gap: 40px; }
          @media (min-width: 1024px) {
            .mag-grid { grid-template-columns: repeat(12, 1fr); }
            .main-col { grid-column: span 8; }
            .side-col { grid-column: span 4; border-left: 1px solid #e7e5e4; padding-left: 32px; }
            .hidden-mobile { display: inline !important; }
          }
          @media (max-width: 600px) { .hidden-mobile { display: none; } }
          .drop-cap::first-letter { float: left; font-size: 5rem; line-height: 0.8; padding-right: 12px; font-weight: 900; }
        `}</style>

        <div className="mag-grid">
          <div className="main-col">
            {filtered[0] && (
              <article 
                onClick={() => {
                  setSelectedOpinion(filtered[0]);
                  // NEW: Update URL with slug
                  if (filtered[0].slug) {
                    window.history.pushState(null, '', `#opinion/${filtered[0].slug}`);
                  }
                }} 
                style={{ cursor: 'pointer', marginBottom: '60px' }}
              >
                <div style={{ width: '100%', aspectRatio: '16/9', overflow: 'hidden', backgroundColor: '#f5f5f4', marginBottom: '24px' }}>
                  <img
                    src={getDisplayImage(filtered[0])}
                    loading="lazy"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                </div>
                <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)', fontWeight: '900', lineHeight: '0.95', letterSpacing: '-0.04em' }}>{filtered[0].headline}</h1>
                <p style={{ fontSize: '1.4rem', color: '#57534e', fontStyle: 'italic', margin: '16px 0' }}>{filtered[0].subHeadline}</p>
                {/* NEW: Enhanced byline with date for E-E-A-T */}
                <div style={{ 
                  fontWeight: '600', 
                  fontSize: '13px',
                  color: '#44403c',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginTop: '12px'
                }}>
                  <span>By {filtered[0].authorName}</span>
                  {filtered[0].publishedAt && (
                    <>
                      <span style={{ color: '#a8a29e' }}>•</span>
                      <span style={{ color: '#78716c' }}>
                        {filtered[0].publishedAt.toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </span>
                    </>
                  )}
                </div>
              </article>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '32px', borderTop: '4px solid #000', paddingTop: '32px' }}>
              {filtered.slice(1, 5).map((op, i) => (
                <article 
                  key={op.id} 
                  onClick={() => {
                    setSelectedOpinion(op);
                    // NEW: Update URL with slug
                    if (op.slug) {
                      window.history.pushState(null, '', `#opinion/${op.slug}`);
                    }
                  }} 
                  style={{ cursor: 'pointer' }}
                >
                  <div style={{ width: '100%', aspectRatio: '16/9', overflow: 'hidden', backgroundColor: '#f5f5f4', marginBottom: '12px' }}>
                    <img
                      src={getDisplayImage(op)}
                      loading="lazy"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                  </div>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: '900', lineHeight: '1.2' }}>{op.headline}</h3>
                  {/* NEW: Enhanced metadata with author and date */}
                  <div style={{ 
                    fontSize: '11px', 
                    color: '#78716c', 
                    marginTop: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <span style={{ fontWeight: '600', color: '#44403c' }}>{op.authorName}</span>
                    {op.publishedAt && (
                      <>
                        <span style={{ color: '#d6d3d1' }}>•</span>
                        <span>
                          {op.publishedAt.toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </span>
                      </>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </div>

          <aside className="side-col">
            <h2 style={{ fontSize: '12px', fontWeight: '900', textTransform: 'uppercase', borderBottom: '2px solid #000', paddingBottom: '8px', marginBottom: '24px' }}>The Board</h2>
            {filtered.slice(5).map(op => (
              <div 
                key={op.id} 
                onClick={() => {
                  setSelectedOpinion(op);
                  // NEW: Update URL with slug
                  if (op.slug) {
                    window.history.pushState(null, '', `#opinion/${op.slug}`);
                  }
                }} 
                style={{ cursor: 'pointer', borderBottom: '1px solid #f5f5f4', paddingBottom: '16px', marginBottom: '16px' }}
              >
                <h4 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '6px' }}>{op.headline}</h4>
                {/* NEW: Enhanced metadata */}
                <div style={{ 
                  fontSize: '10px', 
                  color: '#78716c',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <span style={{ fontWeight: '600', color: '#44403c' }}>{op.authorName}</span>
                  {op.publishedAt && (
                    <>
                      <span style={{ color: '#d6d3d1' }}>•</span>
                      <span>
                        {op.publishedAt.toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </aside>
        </div>
      </main>

      {/* FULL ESSAY MODAL */}
      {selectedOpinion && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, backgroundColor: '#fffdfa', overflowY: 'auto' }}>
          <div style={{ maxWidth: '800px', margin: '40px auto', padding: '0 20px' }}>
            <button 
              onClick={() => {
                setSelectedOpinion(null);
                // NEW: Clear slug from URL when closing
                window.history.pushState(null, '', '#opinion');
              }} 
              style={{ position: 'fixed', top: '20px', right: '20px', background: '#000', color: '#fff', border: 'none', padding: '10px', borderRadius: '50%', cursor: 'pointer' }}
            >
              <X size={24} />
            </button>
            <header style={{ textAlign: 'center', marginBottom: '40px' }}>
              <div style={{ color: '#991b1b', fontWeight: '900', fontSize: '12px', textTransform: 'uppercase', marginBottom: '20px' }}>{selectedOpinion.category}</div>
              <h1 style={{ fontSize: 'clamp(2.5rem, 7vw, 4rem)', fontWeight: '900', lineHeight: '0.95', marginBottom: '24px' }}>{selectedOpinion.headline}</h1>
              {/* NEW: Enhanced byline with date and title for E-E-A-T */}
              <div style={{ 
                fontSize: '14px',
                color: '#44403c',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                marginTop: '16px'
              }}>
                <span style={{ fontWeight: '700' }}>By {selectedOpinion.authorName}</span>
                {selectedOpinion.publishedAt && (
                  <>
                    <span style={{ color: '#d6d3d1' }}>•</span>
                    <span style={{ color: '#78716c' }}>
                      {selectedOpinion.publishedAt.toLocaleDateString('en-US', { 
                        month: 'long', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}
                    </span>
                  </>
                )}
              </div>
              {/* NEW: Canonical URL display for SEO */}
              {selectedOpinion.slug && (
                <div style={{
                  marginTop: '12px',
                  fontSize: '11px',
                  color: '#a8a29e',
                  fontFamily: 'monospace'
                }}>
                  morningpulse.com/opinion/{selectedOpinion.slug}
                </div>
              )}
            </header>
            <div style={{ width: '100%', aspectRatio: '16/9', overflow: 'hidden', backgroundColor: '#f5f5f4', marginBottom: '40px' }}>
              <img
                src={getDisplayImage(selectedOpinion)}
                loading="lazy"
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            </div>
            <div className="drop-cap" style={{ fontSize: '1.3rem', lineHeight: '1.8', whiteSpace: 'pre-wrap' }} dangerouslySetInnerHTML={{ __html: selectedOpinion.body }} />
          </div>
        </div>
      )}
    </div>
  );
};

export default OpinionFeed;
