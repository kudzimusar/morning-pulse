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
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('Latest');

  useEffect(() => {
    const unsubscribe = subscribeToPublishedOpinions(
      (fetchedOpinions) => {
        setOpinions(fetchedOpinions);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );
    return () => { if (unsubscribe) unsubscribe(); };
  }, []);

  const getImageUrl = (opinion: Opinion, index: number = 0) => {
    if (opinion.imageUrl) return opinion.imageUrl;
    const ids = ['1504711434812-13ee07f6fa43', '1488190211421-dd24b4761e27', '1499750310107-5fef28a66643'];
    return `https://images.unsplash.com/photo-${ids[index % ids.length]}?auto=format&fit=crop&q=80&w=1200`;
  };

  const filteredOpinions = activeCategory === 'Latest' ? opinions : opinions.filter(o => o.category === activeCategory);
  const leadEssay = filteredOpinions[0];
  const secondaryEssays = filteredOpinions.slice(1, 4);

  if (loading && opinions.length === 0) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>;

  return (
    <div style={{ fontFamily: 'Georgia, serif', backgroundColor: '#fffdfa', minHeight: '100vh' }}>
      <div style={{ position: 'sticky', top: '56px', zIndex: 30, backgroundColor: '#fff', borderBottom: '1px solid #e7e5e4', height: '48px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 16px', height: '100%', display: 'flex', alignItems: 'center', gap: '24px', overflowX: 'auto' }}>
          {['Latest', 'The Board', 'Guest Essays', 'Letters'].map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)} style={{ fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.15em', color: activeCategory === cat ? '#991b1b' : '#a8a29e', background: 'none', border: 'none', cursor: 'pointer' }}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 16px' }}>
        <div className="opinion-main-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '48px' }}>
          <style>{`
            @media (min-width: 1024px) {
              .opinion-main-grid { grid-template-columns: repeat(12, 1fr) !important; }
              .opinion-main-content { grid-column: span 8 !important; }
              .opinion-sidebar { grid-column: span 4 !important; border-left: 1px solid #e7e5e4 !important; padding-left: 40px !important; border-top: none !important; }
            }
          `}</style>
          
          <div className="opinion-main-content" style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
            {leadEssay && (
              <article onClick={() => onOpinionClick?.(leadEssay)} style={{ cursor: 'pointer' }}>
                <div style={{ aspectRatio: '16/9', marginBottom: '32px', overflow: 'hidden', backgroundColor: '#f5f5f4' }}>
                  <img src={getImageUrl(leadEssay, 0)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Lead" />
                </div>
                <h2 style={{ fontSize: '3rem', fontWeight: '900', lineHeight: '1', marginBottom: '24px' }}>{leadEssay.headline}</h2>
                <p style={{ fontStyle: 'italic', color: '#78716c', fontSize: '1.25rem' }}>{leadEssay.subHeadline}</p>
              </article>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '48px', borderTop: '1px solid #e7e5e4', paddingTop: '48px' }}>
              {secondaryEssays.map((op, i) => (
                <article key={op.id} onClick={() => onOpinionClick?.(op)} style={{ cursor: 'pointer' }}>
                  <div style={{ aspectRatio: '16/9', backgroundColor: '#f5f5f4', overflow: 'hidden', marginBottom: '16px' }}>
                    <img src={getImageUrl(op, i + 1)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Sec" />
                  </div>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: '900' }}>{op.headline}</h3>
                </article>
              ))}
            </div>
          </div>

          <aside className="opinion-sidebar" style={{ borderTop: '1px solid #e7e5e4', paddingTop: '48px' }}>
            <h3 style={{ fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.2em', borderBottom: '1px solid #000', paddingBottom: '4px', marginBottom: '24px' }}>The Board</h3>
            <div style={{ fontWeight: 'bold', fontSize: '1.25rem' }}>The Path to Digital Sovereignty</div>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default OpinionFeed;
