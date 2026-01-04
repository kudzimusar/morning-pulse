import React, { useEffect, useState } from 'react';
import { Opinion } from '../../../types';
import { subscribeToPublishedOpinions } from '../services/opinionsService';
import { X, Mic2, Clock, Share2, Camera } from 'lucide-react';

const UNSPLASH_ACCESS_KEY = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;

interface OpinionFeedProps {
  onOpinionClick?: (opinion: Opinion) => void;
  onNavigateToSubmit?: () => void;
}

const OpinionFeed: React.FC<OpinionFeedProps> = ({ onNavigateToSubmit }) => {
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
    return <div style={{ padding: '100px 20px', textAlign: 'center', fontFamily: 'serif', fontStyle: 'italic', color: '#78716c' }}>Curating today's perspectives...</div>;
  }

  return (
    <div style={{ fontFamily: 'Georgia, serif', backgroundColor: '#fffdfa', minHeight: '100vh', color: '#1a1a1a' }}>
      <style>{`
        .mag-container { max-width: 1280px; margin: 0 auto; padding: 20px; }
        .mag-grid { display: grid; grid-template-columns: 1fr; gap: 40px; }
        @media (min-width: 1024px) {
          .mag-grid { grid-template-columns: repeat(12, 1fr); }
          .mag-main { grid-column: span 8; }
          .mag-sidebar { grid-column: span 4; border-left: 1px solid #e7e5e4; padding-left: 40px; }
        }
        .headline-xl { font-size: clamp(2.2rem, 7vw, 4rem); line-height: 0.95; font-weight: 900; letter-spacing: -0.04em; }
        .drop-cap::first-letter {
          float: left; font-size: 5rem; line-height: 0.8; padding-top: 4px; padding-right: 12px; font-weight: 900;
        }
        .essay-body p { margin-bottom: 1.8rem; font-size: 1.25rem; line-height: 1.7; }
      `}</style>

      <main className="mag-container">
        <div className="mag-grid">
          <div className="mag-main">
            {opinions[0] && (
              <article onClick={() => setSelectedOpinion(opinions[0])} style={{ cursor: 'pointer', marginBottom: '60px' }}>
                <div style={{ aspectRatio: '16/9', marginBottom: '24px', overflow: 'hidden', backgroundColor: '#f5f5f4' }}>
                  <img src={getDynamicImage(opinions[0], 1200)} alt={opinions[0].headline} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <h1 className="headline-xl">{opinions[0].headline}</h1>
                <p style={{ fontSize: '1.3rem', color: '#57534e', fontStyle: 'italic', marginTop: '16px' }}>{opinions[0].subHeadline}</p>
                <div style={{ marginTop: '20px', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase' }}>By {opinions[0].authorName}</div>
              </article>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '32px', borderTop: '4px solid #000', paddingTop: '32px' }}>
              {opinions.slice(1, 4).map((op, i) => (
                <article key={op.id} onClick={() => setSelectedOpinion(op)} style={{ cursor: 'pointer' }}>
                  <div style={{ aspectRatio: '3/2', marginBottom: '12px', overflow: 'hidden', backgroundColor: '#f5f5f4' }}>
                    <img src={getDynamicImage(op, 600)} alt={op.headline} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: '900', lineHeight: '1.2' }}>{op.headline}</h3>
                  <div style={{ fontSize: '10px', color: '#a8a29e', textTransform: 'uppercase', marginTop: '8px', fontWeight: 'bold' }}>{op.authorName}</div>
                </article>
              ))}
            </div>
            </div>

          <aside className="mag-sidebar">
            <div style={{ borderBottom: '2px solid #000', paddingBottom: '8px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Mic2 size={16} />
              <h2 style={{ fontSize: '12px', fontWeight: '900', textTransform: 'uppercase' }}>The Board</h2>
            </div>
            {opinions.slice(4).length > 0 ? opinions.slice(4).map(op => (
              <div key={op.id} onClick={() => setSelectedOpinion(op)} style={{ cursor: 'pointer', borderBottom: '1px solid #e7e5e4', paddingBottom: '16px', marginBottom: '16px' }}>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{op.headline}</h4>
                <div style={{ fontSize: '10px', color: '#a8a29e', textTransform: 'uppercase', marginTop: '4px' }}>{op.authorName}</div>
              </div>
            )) : (
              <p style={{ fontSize: '13px', fontStyle: 'italic', color: '#a8a29e' }}>More perspectives arriving soon.</p>
            )}

            {/* Submit CTA */}
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
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, backgroundColor: '#fffdfa', overflowY: 'auto', padding: '20px' }}>
          <div style={{ maxWidth: '800px', margin: '40px auto' }}>
            <button onClick={() => setSelectedOpinion(null)} style={{ position: 'fixed', top: '20px', right: '20px', background: '#000', color: '#fff', border: 'none', padding: '10px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={20} />
            </button>
            <header style={{ textAlign: 'center', marginBottom: '40px' }}>
              <div style={{ color: '#991b1b', fontWeight: '900', fontSize: '12px', textTransform: 'uppercase', marginBottom: '16px', letterSpacing: '0.1em' }}>
                {selectedOpinion.writerType || 'Guest Essay'}
              </div>
              <h1 className="headline-xl" style={{ marginBottom: '20px' }}>{selectedOpinion.headline}</h1>
              <p style={{ fontSize: '1.5rem', fontStyle: 'italic', color: '#57534e' }}>{selectedOpinion.subHeadline}</p>
              <div style={{ marginTop: '24px', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: '16px', borderTop: '1px solid #e7e5e4', paddingTop: '20px' }}>
                <div style={{ fontWeight: '900', textTransform: 'uppercase', fontSize: '12px' }}>By {selectedOpinion.authorName}</div>
                <div style={{ display: 'flex', gap: '16px', color: '#a8a29e', fontSize: '12px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={14}/> 6 min read</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Share2 size={14}/> Share</span>
                </div>
              </div>
            </header>
            <div style={{ aspectRatio: '16/9', marginBottom: '40px', overflow: 'hidden', backgroundColor: '#f5f5f4' }}>
              <img src={getDynamicImage(selectedOpinion, 1200)} alt={selectedOpinion.headline} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div className="essay-body drop-cap" style={{ whiteSpace: 'pre-wrap', fontSize: '1.25rem', lineHeight: '1.8', color: '#1a1a1a' }} dangerouslySetInnerHTML={{ __html: selectedOpinion.body }} />
          </div>
        </div>
      )}
    </div>
  );
};

export default OpinionFeed;
