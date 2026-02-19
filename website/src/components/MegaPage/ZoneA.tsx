import React from 'react';
import { NewsStory, Opinion } from '../../types';
import { MegaGrid } from './MegaGrid';
import { Clock, MessageCircle, ArrowRight } from 'lucide-react';
// Placeholders for now - will integrate real components later
import MorningBriefCard from '../MorningBriefCard'; // We need to adapt this
import AskPulseAI from '../AskPulseAI'; // We need a widget version of this

interface ZoneAProps {
    heroStory?: Opinion | NewsStory;
    briefingData?: any; // To be typed properly
    onArticleClick: (id: string, slug?: string) => void;
}

/**
 * ZONE A: The "Morning Prime" (Active Hero)
 * - Left: Personal Briefing
 * - Center: Hero Story
 * - Right: AI & Widgets
 */
export const ZoneA: React.FC<ZoneAProps> = ({ heroStory, briefingData, onArticleClick }) => {

    // Fallback if no hero assigned
    const title = heroStory?.headline || "Global Markets Rally as Tech Sector Rebounds";
    const subtitle = heroStory?.subHeadline || "Major indices hit record highs following positive earnings reports from key semiconductor manufacturers.";
    const author = heroStory?.author || heroStory?.authorName || "Editorial Team";
    const image = heroStory?.finalImageUrl || heroStory?.imageUrl || "https://images.unsplash.com/photo-1611974765270-ca1258634369?auto=format&fit=crop&q=80&w=1600";
    const timestamp = heroStory?.publishedAt ? new Date(heroStory.publishedAt).toLocaleDateString() : "Today";

    return (
        <section className="zone-a">
            <MegaGrid>
                {/* LEFT RAIL: The Personal Brief */}
                <div className="zone-a-left-rail">
                    {/* Needs 'variant="column"' prop eventually */}
                    <div style={{ padding: '10px' }}>
                        <h3 style={{ fontFamily: 'Georgia', fontSize: '18px', marginBottom: '12px', color: '#B45309' }}>
                            Your Briefing
                        </h3>
                        {/* Temporary placeholder for the adapted card */}
                        <div style={{ fontSize: '14px', lineHeight: '1.6', color: '#4B5563' }}>
                            Good morning. Here is your personalized summary for today. Markets are up, and there is breaking news in Tech.
                        </div>
                        <button style={{
                            marginTop: '16px',
                            fontSize: '13px',
                            color: '#B45309',
                            fontWeight: '600',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            padding: 0
                        }}>
                            Read Full Brief <ArrowRight size={14} style={{ marginLeft: '4px' }} />
                        </button>
                    </div>
                </div>

                {/* CENTER STAGE: The Hero Story */}
                <div className="zone-a-center-stage">
                    {/* Ad Placeholder (Above Fold) */}
                    <div style={{
                        width: '100%',
                        height: '90px',
                        backgroundColor: '#F3F4F6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#9CA3AF',
                        fontSize: '11px',
                        marginBottom: '24px',
                        border: '1px dashed #E5E7EB'
                    }}>
                        ADVERTISEMENT (970x90)
                    </div>

                    <div
                        className="hero-container"
                        style={{ cursor: 'pointer' }}
                        onClick={() => heroStory && onArticleClick(heroStory.id, heroStory.slug)}
                    >
                        <h1 className="hero-headline">{title}</h1>
                        <p className="hero-subheadline">{subtitle}</p>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', fontSize: '12px', color: '#6B7280' }}>
                            <span style={{ fontWeight: '600', color: '#111827' }}>{author.toUpperCase()}</span>
                            <span>•</span>
                            <span>{timestamp}</span>
                            <span>•</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Clock size={12} /> 4 min read
                            </span>
                        </div>

                        <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', overflow: 'hidden', borderRadius: '4px' }}>
                            <img
                                src={image}
                                alt={title}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                            {/* Active Layer Buttons */}
                            <div style={{
                                position: 'absolute',
                                bottom: '16px',
                                left: '16px',
                                display: 'flex',
                                gap: '8px'
                            }}>
                                <button style={{
                                    padding: '6px 12px',
                                    backgroundColor: 'rgba(255,255,255,0.9)',
                                    border: 'none',
                                    borderRadius: '20px',
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    cursor: 'pointer',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                }}>
                                    ✨ Summarize
                                </button>
                                <button style={{
                                    padding: '6px 12px',
                                    backgroundColor: 'rgba(255,255,255,0.9)',
                                    border: 'none',
                                    borderRadius: '20px',
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    cursor: 'pointer',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                }}>
                                    💬 Explain
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT RAIL: Engagement */}
                <div className="zone-a-right-rail">
                    {/* AskPulseAI Widget */}
                    <div style={{
                        padding: '16px',
                        backgroundColor: '#EFF6FF',
                        border: '1px solid #DBEAFE',
                        borderRadius: '8px'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: '#1E40AF', fontWeight: 'bold', fontSize: '14px' }}>
                            <MessageCircle size={16} /> AskPulse AI
                        </div>
                        <input
                            type="text"
                            placeholder="Ask about this story..."
                            style={{
                                width: '100%',
                                padding: '8px',
                                borderRadius: '4px',
                                border: '1px solid #BFDBFE',
                                fontSize: '13px'
                            }}
                        />
                    </div>

                    {/* MPU Ad */}
                    <div style={{
                        width: '100%',
                        height: '250px',
                        backgroundColor: '#F3F4F6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#9CA3AF',
                        fontSize: '11px',
                        border: '1px dashed #E5E7EB'
                    }}>
                        ADVERTISEMENT (300x250)
                    </div>

                    {/* Market Data / Weather Chips */}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '11px', padding: '4px 8px', backgroundColor: '#ECFDF5', color: '#065F46', borderRadius: '4px' }}>S&P 500 +1.2%</span>
                        <span style={{ fontSize: '11px', padding: '4px 8px', backgroundColor: '#FEF2F2', color: '#991B1B', borderRadius: '4px' }}>NASDAQ -0.4%</span>
                        <span style={{ fontSize: '11px', padding: '4px 8px', backgroundColor: '#F9FAFB', color: '#374151', borderRadius: '4px' }}>Tokyo ☀️ 24°C</span>
                    </div>
                </div>
            </MegaGrid>
        </section>
    );
};
