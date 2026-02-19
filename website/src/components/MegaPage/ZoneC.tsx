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
                {/* LEFT: Text List - "THE WIRE" (Sticky) */}
                <div className="zone-c-left sticky-rail">
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
                                    style={{ fontSize: '15px', fontWeight: '600', lineHeight: '1.4', marginBottom: '6px', color: 'var(--mp-ink)', fontFamily: 'var(--font-ui)' }}
                                >
                                    {article.headline}
                                </div>
                                <div style={{ fontSize: '12px', color: 'var(--mp-gray)', display: 'flex', gap: '8px' }}>
                                    <span style={{ fontWeight: '600', color: 'var(--mp-brand-blue)' }}>{article.category || 'Global'}</span>
                                    <span>•</span>
                                    <span>{article.author || article.authorName || 'Staff'}</span>
                                    <span>•</span>
                                    <span style={{ color: 'var(--mp-gray)' }}>2h ago</span>
                                </div>
                            </div>
                        ))}
                        {/* Add dummy items to lengthen list if short */}
                        <div style={{ paddingBottom: '16px', borderBottom: '1px solid var(--mp-light-gray)', opacity: 0.6 }}>
                            <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>Tech stocks rally on AI news</div>
                            <div style={{ fontSize: '12px' }}>Markets • 3h ago</div>
                        </div>
                        <div style={{ paddingBottom: '16px', borderBottom: '1px solid var(--mp-light-gray)', opacity: 0.6 }}>
                            <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>Climate summit reaches deal</div>
                            <div style={{ fontSize: '12px' }}>World • 4h ago</div>
                        </div>
                    </div>
                </div>

                {/* CENTER: Visual Grid - "ANALYSIS & OPINION" (Not Sticky, Main feed) */}
                <div className="zone-c-center" style={{ borderLeft: '1px solid var(--mp-light-gray)', borderRight: '1px solid var(--mp-light-gray)', padding: '0 24px' }}>
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

                    {/* Featured Top Story (Full Width) */}
                    {centerArticles.length > 0 && (
                        <div className="mp-card-standard mp-card-hover" style={{ marginBottom: '32px', cursor: 'pointer' }} onClick={() => onArticleClick(centerArticles[0].id, centerArticles[0].slug)}>
                            <div className="mp-image-container" style={{ aspectRatio: '16/9' }}>
                                {(centerArticles[0].finalImageUrl || centerArticles[0].imageUrl) && (
                                    <img src={centerArticles[0].finalImageUrl || centerArticles[0].imageUrl} alt={centerArticles[0].headline} />
                                )}
                            </div>
                            <h3 className="mp-headline-serif mp-headline-large" style={{ marginTop: '12px', fontSize: '1.75rem' }}>
                                {centerArticles[0].headline}
                            </h3>
                            <p className="mp-excerpt" style={{ fontSize: '1.05rem' }}>
                                {centerArticles[0].body ? centerArticles[0].body.substring(0, 150).replace(/<[^>]*>/g, '') + '...' : centerArticles[0].summary || centerArticles[0].subHeadline}
                            </p>
                            <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--mp-brand-red)', textTransform: 'uppercase', marginTop: '8px' }}>
                                Read Analysis <ArrowRight size={12} style={{ display: 'inline', marginLeft: '4px' }} />
                            </div>
                        </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                        {centerArticles.slice(1).map(article => (
                            <div key={article.id} onClick={() => onArticleClick(article.id, article.slug)} className="mp-card-standard mp-card-hover" style={{ cursor: 'pointer' }}>
                                <div className="mp-image-container">
                                    {(article.finalImageUrl || article.imageUrl) && (
                                        <img src={article.finalImageUrl || article.imageUrl} alt={article.headline} />
                                    )}
                                </div>
                                <h3 className="mp-headline-serif mp-headline-medium">
                                    {article.headline}
                                </h3>
                                <p className="mp-excerpt">
                                    {article.body ? article.body.substring(0, 100).replace(/<[^>]*>/g, '') : article.summary || article.subHeadline}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* RIGHT: Ads + Trending - "MARKETPLACE" (Sticky) */}
                <div className="zone-c-right sticky-rail">
                    {/* Sticky Ad */}
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
            </MegaGrid>
        </section>
    );
};
