import React from 'react';
import { NewsStory, Opinion } from '../../types';
import { MegaGrid } from './MegaGrid';
import { ArrowRight } from 'lucide-react';

interface ZoneCProps {
    articles: (Opinion | NewsStory)[];
    onArticleClick: (id: string, slug?: string) => void;
}

/**
 * ZONE C: The "Deep Dive"
 * - Left: List View
 * - Center: Visual Grid
 * - Right: Ads / Trending
 */
export const ZoneC: React.FC<ZoneCProps> = ({ articles, onArticleClick }) => {
    // Simple distribution logic for now
    const leftArticles = articles.slice(0, 5);
    const centerArticles = articles.slice(5, 9); // 4 cards in 2x2 grid
    const rightArticles = articles.slice(9, 14);

    return (
        <section className="zone-c">
            <MegaGrid>
                {/* LEFT: Text List - "THE WIRE" */}
                <div className="zone-c-left">
                    <h4 style={{
                        fontFamily: 'var(--font-ui)',
                        fontSize: '13px',
                        fontWeight: '800',
                        color: 'var(--mp-brand-red)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        marginBottom: '20px',
                        borderBottom: '2px solid var(--mp-brand-red)',
                        paddingBottom: '8px',
                        display: 'inline-block'
                    }}>
                        The Wire
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {leftArticles.map(article => (
                            <div key={article.id} className="mp-card-hover" style={{ paddingBottom: '16px', borderBottom: '1px solid var(--mp-light-gray)', cursor: 'pointer' }} onClick={() => onArticleClick(article.id, article.slug)}>
                                <div
                                    style={{ fontSize: '16px', fontWeight: '600', lineHeight: '1.4', marginBottom: '6px', color: 'var(--mp-ink)' }}
                                >
                                    {article.headline}
                                </div>
                                <div style={{ fontSize: '12px', color: 'var(--mp-gray)', display: 'flex', gap: '8px' }}>
                                    <span style={{ fontWeight: '600', color: 'var(--mp-brand-blue)' }}>{article.category || 'Global'}</span>
                                    <span>•</span>
                                    <span>{article.author || article.authorName || 'Staff'}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* CENTER: Visual Grid - "ANALYSIS & OPINION" */}
                <div className="zone-c-center">
                    <h4 style={{
                        fontFamily: 'var(--font-ui)',
                        fontSize: '13px',
                        fontWeight: '800',
                        color: 'var(--mp-ink)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        marginBottom: '20px',
                        borderBottom: '2px solid var(--mp-ink)',
                        paddingBottom: '8px',
                        display: 'inline-block'
                    }}>
                        Analysis & Perspectives
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                        {centerArticles.map(article => (
                            <div key={article.id} onClick={() => onArticleClick(article.id, article.slug)} className="mp-card-hover" style={{ cursor: 'pointer' }}>
                                <div style={{ width: '100%', aspectRatio: '3/2', backgroundColor: 'var(--mp-light-gray)', marginBottom: '12px', borderRadius: '8px', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
                                    {(article.finalImageUrl || article.imageUrl) && (
                                        <img src={article.finalImageUrl || article.imageUrl} alt={article.headline} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s' }} />
                                    )}
                                </div>
                                <h3 style={{ fontSize: '18px', fontWeight: '700', fontFamily: 'var(--font-serif)', lineHeight: '1.3', marginBottom: '8px', color: 'var(--mp-ink)' }}>
                                    {article.headline}
                                </h3>
                                <p style={{ fontSize: '14px', color: 'var(--mp-slate)', lineHeight: '1.6', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                    {article.body ? article.body.substring(0, 100).replace(/<[^>]*>/g, '') : article.summary || article.subHeadline}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* RIGHT: Ads + Trending - "MARKETPLACE" */}
                <div className="zone-c-right">
                    {/* Sticky Ad */}
                    <div style={{
                        position: 'sticky',
                        top: '20px'
                    }}>
                        <div style={{
                            width: '100%',
                            height: '600px',
                            backgroundColor: 'var(--mp-faint-gray)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--mp-gray)',
                            fontSize: '11px',
                            marginBottom: '24px',
                            border: '1px solid var(--mp-light-gray)',
                            borderRadius: '8px',
                            position: 'relative'
                        }}>
                            <span style={{ position: 'absolute', top: '8px', left: '50%', transform: 'translateX(-50%)', opacity: 0.6, letterSpacing: '0.1em' }}>ADVERTISEMENT</span>
                            <div style={{ textAlign: 'center' }}>
                                <p style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Premium Partner</p>
                                <button style={{ padding: '8px 16px', backgroundColor: 'white', border: '1px solid var(--mp-light-gray)', borderRadius: '20px', cursor: 'pointer' }}>Learn More</button>
                            </div>
                        </div>
                    </div>
                </div>
            </MegaGrid>
        </section>
    );
};
