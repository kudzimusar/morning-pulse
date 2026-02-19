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
                {/* LEFT: Text List */}
                <div className="zone-c-left">
                    <h4 style={{
                        fontFamily: 'Inter',
                        fontSize: '12px',
                        fontWeight: '700',
                        color: '#B91C1C',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        marginBottom: '16px',
                        borderBottom: '1px solid #E5E7EB',
                        paddingBottom: '8px'
                    }}>
                        World News
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {leftArticles.map(article => (
                            <div key={article.id} style={{ paddingBottom: '16px', borderBottom: '1px solid #F3F4F6' }}>
                                <div
                                    style={{ fontSize: '15px', fontWeight: '600', lineHeight: '1.4', marginBottom: '4px', cursor: 'pointer' }}
                                    onClick={() => onArticleClick(article.id, article.slug)}
                                >
                                    {article.headline}
                                </div>
                                <div style={{ fontSize: '11px', color: '#6B7280' }}>
                                    {article.author || article.authorName} • 2h ago
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* CENTER: Visual Grid */}
                <div className="zone-c-center">
                    <h4 style={{
                        fontFamily: 'Inter',
                        fontSize: '12px',
                        fontWeight: '700',
                        color: '#111827',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        marginBottom: '16px',
                        borderBottom: '1px solid #E5E7EB',
                        paddingBottom: '8px'
                    }}>
                        Analysis & Opinion
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        {centerArticles.map(article => (
                            <div key={article.id} onClick={() => onArticleClick(article.id, article.slug)} style={{ cursor: 'pointer' }}>
                                <div style={{ width: '100%', aspectRatio: '3/2', backgroundColor: '#E5E7EB', marginBottom: '12px', borderRadius: '4px', overflow: 'hidden' }}>
                                    {(article.finalImageUrl || article.imageUrl) && (
                                        <img src={article.finalImageUrl || article.imageUrl} alt={article.headline} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    )}
                                </div>
                                <h3 style={{ fontSize: '16px', fontWeight: '700', fontFamily: 'Georgia', lineHeight: '1.3', marginBottom: '8px' }}>
                                    {article.headline}
                                </h3>
                                <p style={{ fontSize: '13px', color: '#4B5563', lineHeight: '1.5', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                    {article.body ? article.body.substring(0, 100).replace(/<[^>]*>/g, '') : article.summary || article.subHeadline}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* RIGHT: Ads + Trending */}
                <div className="zone-c-right">
                    {/* Sticky Ad */}
                    <div style={{
                        width: '100%',
                        height: '600px',
                        backgroundColor: '#F3F4F6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#9CA3AF',
                        fontSize: '11px',
                        marginBottom: '24px',
                        border: '1px dashed #E5E7EB',
                        position: 'sticky',
                        top: '20px'
                    }}>
                        ADVERTISEMENT (300x600)
                    </div>
                </div>
            </MegaGrid>
        </section>
    );
};
