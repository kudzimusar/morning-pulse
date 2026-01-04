import React, { useEffect, useState } from 'react';
import { Opinion } from '../../../types';
import { subscribeToPublishedOpinions } from '../services/opinionsService';
import { X, Mic2, Clock, Share2, ChevronRight } from 'lucide-react';

interface OpinionFeedProps {
  onOpinionClick?: (opinion: Opinion) => void;
  onNavigateToSubmit?: () => void;
}

const OpinionFeed: React.FC<OpinionFeedProps> = ({ onNavigateToSubmit }) => {
  const [opinions, setOpinions] = useState<Opinion[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('Latest');
  const [selectedOpinion, setSelectedOpinion] = useState<Opinion | null>(null);

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

  const getImageUrl = (opinion: Opinion, seed: number = 0) => {
    if (opinion.imageUrl && opinion.imageUrl.startsWith('http')) return opinion.imageUrl;
    const fallbacks = [
      'https://images.unsplash.com/photo-1504711434812-13ee07f6fa43',
      'https://images.unsplash.com/photo-1488190211421-dd24b4761e27',
      'https://images.unsplash.com/photo-1499750310107-5fef28a66643',
      'https://images.unsplash.com/photo-1457369804613-52c61a468e7d'
    ];
    return `${fallbacks[seed % fallbacks.length]}?auto=format&fit=crop&q=80&w=1200`;
  };

  const categories = ['Latest', 'The Board', 'Guest Essays', 'Letters', 'Culture'];
  
  const filtered = activeCategory === 'Latest' 
    ? opinions 
    : opinions.filter(o => o.category === activeCategory || (activeCategory === 'Guest Essays' && o.writerType === 'Guest Essay'));

  const leadEssay = filtered[0];
  const secondaryEssays = filtered.slice(1, 5);
  const sidebarEssays = filtered.slice(5);

  if (loading && opinions.length === 0) {
    return <div style={{ padding: '100px 20px', textAlign: 'center', fontFamily: 'serif', fontStyle: 'italic', color: '#78716c' }}>Loading the day's perspectives...</div>;
  }

  return (
    <div style={{ fontFamily: 'Georgia, serif', backgroundColor: '#fffdfa', minHeight: '100vh', color: '#1a1a1a' }}>
      
      {/* Responsive Navigation Bar */}
      <nav style={{ position: 'sticky', top: '56px', zIndex: 30, backgroundColor: '#fff', borderBottom: '1px solid #e7e5e4' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 16px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '20px', overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}>
            {categories.map(cat => (
              <button 
                key={cat} 
                onClick={() => setActiveCategory(cat)}
                style={{
                  fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em',
                  color: activeCategory === cat ? '#991b1b' : '#a8a29e', background: 'none', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap'
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 16px' }}>
        {/* Mobile-Friendly Grid Styles */}
        <style>{`
          .mag-grid { display: grid; grid-template-columns: 1fr; gap: 40px; }
          @media (min-width: 1024px) {
            .mag-grid { grid-template-columns: repeat(12, 1fr); }
            .mag-main { grid-column: span 8; }
            .mag-sidebar { grid-column: span 4; border-left: 1px solid #e7e5e4; padding-left: 32px; margin-top: 0; }
          }
          .drop-cap::first-letter {
            float: left; font-size: 5rem; line-height: 0.8; padding-top: 4px; padding-right: 12px; font-weight: 900; color: #000;
          }
          .essay-content p { margin-bottom: 1.5rem; font-size: 1.2rem; line-height: 1.7; }
        `}</style>

        <div className="mag-grid">
          {/* Main Column */}
          <div className="mag-main">
            {leadEssay && (
              <article onClick={() => setSelectedOpinion(leadEssay)} style={{ cursor: 'pointer', marginBottom: '48px' }}>
                <div style={{ width: '100%', aspectRatio: '16/9', marginBottom: '24px', overflow: 'hidden', backgroundColor: '#f5f5f4' }}>
                  <img src={getImageUrl(leadEssay, 0)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Feature" />
                </div>
                <h1 style={{ fontSize: 'clamp(2.2rem, 6vw, 3.8rem)', fontWeight: '900', lineHeight: '0.95', marginBottom: '16px', letterSpacing: '-0.04em' }}>
                  {leadEssay.headline}
                </h1>
                <p style={{ fontSize: 'clamp(1.1rem, 2vw, 1.3rem)', color: '#57534e', fontStyle: 'italic', lineHeight: '1.4', marginBottom: '16px' }}>
                  {leadEssay.subHeadline}
                </p>
                <div style={{ fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  By {leadEssay.authorName}
                </div>
              </article>
            )}

            {/* Secondary Stories Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '32px', borderTop: '1px solid #e7e5e4', paddingTop: '32px' }}>
              {secondaryEssays.map((op, i) => (
                <article key={op.id} onClick={() => setSelectedOpinion(op)} style={{ cursor: 'pointer' }}>
                  <div style={{ width: '100%', aspectRatio: '3/2', backgroundColor: '#f5f5f4', overflow: 'hidden', marginBottom: '12px' }}>
                    <img src={getImageUrl(op, i + 1)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Post" />
                  </div>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: '900', lineHeight: '1.2', marginBottom: '8px' }}>{op.headline}</h3>
                  <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#a8a29e', textTransform: 'uppercase' }}>{op.authorName}</div>
                </article>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <aside className="mag-sidebar" style={{ marginTop: '40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #000', paddingBottom: '8px', marginBottom: '24px' }}>
              <Mic2 size={16} />
              <h2 style={{ fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em' }}>The Board</h2>
            </div>
            {sidebarEssays.length > 0 ? sidebarEssays.map(op => (
              <div key={op.id} onClick={() => setSelectedOpinion(op)} style={{ cursor: 'pointer', borderBottom: '1px solid #f5f5f4', paddingBottom: '16px', marginBottom: '16px' }}>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 'bold', lineHeight: '1.3' }}>{op.headline}</h4>
                <p style={{ fontSize: '10px', color: '#a8a29e', textTransform: 'uppercase', marginTop: '4px' }}>{op.authorName}</p>
              </div>
            )) : (
              <p style={{ fontSize: '13px', fontStyle: 'italic', color: '#a8a29e' }}>More opinions coming soon.</p>
            )}

            <div style={{ marginTop: '48px', padding: '32px', backgroundColor: '#000', color: '#fff' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '900', marginBottom: '12px', textTransform: 'uppercase' }}>Submit</h3>
              <p style={{ fontSize: '13px', color: '#a8a29e', marginBottom: '24px', lineHeight: '1.6' }}>Share your perspective with the Morning Pulse community.</p>
              <button onClick={onNavigateToSubmit} style={{ width: '100%', padding: '12px', backgroundColor: '#fff', color: '#000', fontWeight: 'bold', fontSize: '11px', textTransform: 'uppercase', border: 'none', cursor: 'pointer' }}>Write for Us</button>
            </div>
          </aside>
        </div>
      </main>

      {/* FULL ESSAY MODAL */}
      {selectedOpinion && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, backgroundColor: '#fffdfa', overflowY: 'auto' }}>
          {/* Modal Header */}
          <div style={{ position: 'sticky', top: 0, backgroundColor: '#fffdfa', borderBottom: '1px solid #e7e5e4', padding: '12px 20px', display: 'flex', justifyContent: 'flex-end', zIndex: 10 }}>
            <button onClick={() => setSelectedOpinion(null)} style={{ background: '#000', color: '#fff', border: 'none', padding: '8px', borderRadius: '50%', cursor: 'pointer', display: 'flex' }}>
              <X size={20} />
            </button>
          </div>

          <article style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px' }}>
            <header style={{ textAlign: 'center', marginBottom: '48px' }}>
              <div style={{ color: '#991b1b', fontWeight: '900', fontSize: '12px', textTransform: 'uppercase', marginBottom: '20px', letterSpacing: '0.1em' }}>
                {selectedOpinion.writerType || 'Guest Essay'}
              </div>
              <h1 style={{ fontSize: 'clamp(2.5rem, 7vw, 4rem)', fontWeight: '900', lineHeight: '0.95', marginBottom: '24px', letterSpacing: '-0.04em' }}>
                {selectedOpinion.headline}
              </h1>
              <p style={{ fontSize: '1.5rem', color: '#57534e', fontStyle: 'italic', marginBottom: '32px', lineHeight: '1.3' }}>
                {selectedOpinion.subHeadline}
              </p>
              
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: '16px', borderTop: '1px solid #e7e5e4', paddingTop: '24px' }}>
                <div style={{ fontWeight: '900', textTransform: 'uppercase', fontSize: '12px' }}>By {selectedOpinion.authorName}</div>
                <div style={{ display: 'flex', gap: '16px', color: '#a8a29e', fontSize: '12px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={14}/> 6 min read</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Share2 size={14}/> Share</span>
                </div>
              </div>
            </header>

            <div style={{ width: '100%', aspectRatio: '16/9', marginBottom: '48px', overflow: 'hidden' }}>
              <img src={getImageUrl(selectedOpinion, 0)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Article Visual" />
            </div>

            <div className="essay-content drop-cap" 
                 style={{ fontSize: '1.25rem', lineHeight: '1.8', color: '#1a1a1a', whiteSpace: 'pre-wrap' }} 
                 dangerouslySetInnerHTML={{ __html: selectedOpinion.body }} />
          </article>
        </div>
      )}
    </div>
  );
};

export default OpinionFeed;
