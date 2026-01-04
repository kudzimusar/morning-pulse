import React, { useEffect, useState } from 'react';
import { Opinion } from '../../../types';
import { subscribeToPublishedOpinions } from '../services/opinionsService';

interface OpinionFeedProps {
  onOpinionClick?: (opinion: Opinion) => void;
  onNavigateToSubmit?: () => void;
}

const OpinionFeed: React.FC<OpinionFeedProps> = ({ onOpinionClick, onNavigateToSubmit }) => {
  const [opinions, setOpinions] = useState<Opinion[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('Latest');

  useEffect(() => {
    setLoading(true);
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

  // Improved Fallback Logic with robust image handling
  const getImageUrl = (opinion: Opinion, index: number = 0) => {
    // Use the provided image if it exists and is not empty
    if (opinion.imageUrl && opinion.imageUrl.trim() !== "") {
      return opinion.imageUrl;
    }
    
    // High-quality magazine-style fallback seeds
    const fallbacks = [
      '1504711434812-13ee07f6fa43', // Abstract tech
      '1488190211421-dd24b4761e27', // Workspace/Design
      '1499750310107-5fef28a66643', // Newspaper/Typewriter
      '1451187580459-43490279c0fa'  // Global network
    ];
    
    const seed = fallbacks[index % fallbacks.length];
    return `https://images.unsplash.com/photo-${seed}?auto=format&fit=crop&q=80&w=1200`;
  };

  // Fallback image URL for onError handler
  const fallbackImageUrl = 'https://images.unsplash.com/photo-1504711434812-13ee07f6fa43?auto=format&fit=crop&q=80&w=1200';

  const categories = ['Latest', 'The Board', 'Guest Essays', 'Letters', 'Culture'];
  const filtered = activeCategory === 'Latest' 
    ? opinions 
    : opinions.filter(o => o.category === activeCategory || (activeCategory === 'Guest Essays' && o.writerType === 'Guest Essay'));

  const leadEssay = filtered[0];
  const secondaryEssays = filtered.slice(1, 4);
  const remainingEssays = filtered.slice(4);

  if (loading && opinions.length === 0) {
    return (
      <div style={{ padding: '80px', textAlign: 'center', fontFamily: 'Georgia, serif', fontStyle: 'italic', color: '#78716c' }}>
        Loading the day's perspectives...
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'Georgia, serif', backgroundColor: '#fffdfa', minHeight: '100vh', color: '#1a1a1a' }}>
      {/* Category Navigation */}
      <div style={{ position: 'sticky', top: '56px', zIndex: 30, backgroundColor: '#fff', borderBottom: '1px solid #e7e5e4', height: '48px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', overflowX: 'auto' }}>
          <div style={{ display: 'flex', gap: '24px', whiteSpace: 'nowrap' }}>
            {categories.map(cat => (
              <button 
                key={cat} 
                onClick={() => setActiveCategory(cat)}
                style={{
                  fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.15em',
                  color: activeCategory === cat ? '#991b1b' : '#a8a29e', background: 'none', border: 'none', cursor: 'pointer', padding: '0'
                }}
              >
                {cat}
              </button>
            ))}
          </div>
          {onNavigateToSubmit && (
            <button 
              onClick={onNavigateToSubmit} 
              style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', border: '1px solid #000', padding: '4px 12px', cursor: 'pointer', backgroundColor: 'transparent' }}
            >
              Submit Essay
            </button>
          )}
        </div>
      </div>

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
        {/* Responsive Grid Styles */}
        <style>{`
          @media (min-width: 1024px) {
            .mag-grid { grid-template-columns: repeat(12, 1fr) !important; }
            .mag-main { grid-column: span 8 !important; }
            .mag-sidebar { grid-column: span 4 !important; border-left: 1px solid #e7e5e4 !important; padding-left: 40px !important; border-top: none !important; margin-top: 0 !important; padding-top: 0 !important; }
          }
        `}</style>

        <div className="mag-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '60px' }}>
          {/* Main Column */}
          <div className="mag-main">
            {leadEssay && (
              <article onClick={() => onOpinionClick?.(leadEssay)} style={{ cursor: 'pointer', marginBottom: '60px' }}>
                <div style={{ position: 'relative', aspectRatio: '16/9', marginBottom: '32px', overflow: 'hidden', backgroundColor: '#f5f5f4' }}>
                  <img 
                    src={getImageUrl(leadEssay, 0)} 
                    alt={leadEssay.headline || 'Featured essay image'}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = fallbackImageUrl;
                    }}
                  />
                  <div style={{ position: 'absolute', top: '20px', left: '20px', backgroundColor: '#991b1b', color: '#fff', fontSize: '10px', fontWeight: '900', padding: '4px 10px', textTransform: 'uppercase' }}>
                    Featured
                  </div>
                </div>
                <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: '900', lineHeight: '0.95', letterSpacing: '-0.04em', marginBottom: '20px' }}>
                  {leadEssay.headline}
                </h1>
                <p style={{ fontSize: '1.25rem', color: '#57534e', fontStyle: 'italic', marginBottom: '20px', lineHeight: '1.5' }}>
                  {leadEssay.subHeadline}
                </p>
                <div style={{ fontSize: '12px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  By {leadEssay.authorName}
                </div>
              </article>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px', borderTop: '1px solid #e7e5e4', paddingTop: '40px' }}>
              {secondaryEssays.map((op, i) => (
                <article key={op.id} onClick={() => onOpinionClick?.(op)} style={{ cursor: 'pointer' }}>
                  <div style={{ aspectRatio: '16/9', backgroundColor: '#f5f5f4', overflow: 'hidden', marginBottom: '16px' }}>
                    <img 
                      src={getImageUrl(op, i + 1)} 
                      alt={op.headline || 'Essay image'}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = fallbackImageUrl;
                      }}
                    />
                  </div>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: '900', lineHeight: '1.2', marginBottom: '10px' }}>{op.headline}</h3>
                  <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#a8a29e', textTransform: 'uppercase' }}>{op.authorName}</div>
                </article>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <aside className="mag-sidebar" style={{ borderTop: '1px solid #e7e5e4', paddingTop: '40px', marginTop: '40px' }}>
            <div style={{ borderBottom: '2px solid #000', paddingBottom: '8px', marginBottom: '32px' }}>
              <h2 style={{ fontSize: '12px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.2em' }}>The Board</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              {remainingEssays.length > 0 ? remainingEssays.map(op => (
                <div key={op.id} onClick={() => onOpinionClick?.(op)} style={{ cursor: 'pointer', borderBottom: '1px solid #f5f5f4', paddingBottom: '20px' }}>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 'bold', lineHeight: '1.3', marginBottom: '8px' }}>{op.headline}</h4>
                  <div style={{ fontSize: '10px', color: '#a8a29e', textTransform: 'uppercase' }}>{op.authorName}</div>
                </div>
              )) : (
                <div style={{ color: '#a8a29e', fontSize: '14px', fontStyle: 'italic' }}>
                  Additional perspectives arriving soon.
                </div>
              )}
            </div>
            
            <div style={{ marginTop: '60px', padding: '30px', backgroundColor: '#000', color: '#fff', borderRadius: '2px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '900', marginBottom: '12px', textTransform: 'uppercase' }}>Join the Dialogue</h3>
              <p style={{ fontSize: '13px', color: '#a8a29e', marginBottom: '20px', lineHeight: '1.6' }}>
                Morning Pulse is looking for bold voices to challenge the digital status quo.
              </p>
              <button 
                onClick={onNavigateToSubmit} 
                style={{ width: '100%', padding: '12px', backgroundColor: '#fff', color: '#000', fontWeight: 'bold', fontSize: '11px', textTransform: 'uppercase', border: 'none', cursor: 'pointer' }}
              >
                Write for Us
              </button>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default OpinionFeed;
