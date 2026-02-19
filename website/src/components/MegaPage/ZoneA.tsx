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
                    <div className="brief-card-styled mp-card-hover">
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px', gap: '8px' }}>
                            <div style={{ width: '24px', height: '24px', backgroundColor: 'var(--mp-brand-gold)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <span style={{ color: 'white', fontSize: '14px' }}>⚡</span>
                            </div>
                            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', color: 'var(--mp-ink)', margin: 0 }}>
                                Your Briefing
                            </h3>
                        </div>

                        {/* Brief Content */}
                        <div style={{ fontSize: '0.95rem', lineHeight: '1.6', color: 'var(--mp-slate)' }}>
                            <p style={{ marginBottom: '12px' }}>
                                <strong>Good morning.</strong> Markets are rallying on tech earnings, while global climate talks reach a pivotal moment.
                            </p>
                            <ul style={{ paddingLeft: '20px', margin: 0, fontSize: '0.9rem', color: 'var(--mp-gray)' }}>
                                <li style={{ marginBottom: '8px' }}>S&P 500 hits record high</li>
                                <li style={{ marginBottom: '8px' }}>New AI chip unveiled</li>
                            </ul>
                        </div>

                        <button style={{
                            marginTop: '20px',
                            fontSize: '13px',
                            color: 'var(--mp-brand-blue)',
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
                    <div
                        className="hero-container"
                        style={{ cursor: 'pointer' }}
                        onClick={() => heroStory && onArticleClick(heroStory.id, heroStory.slug)}
                    >
                        <h1 className="hero-headline">{title}</h1>
                        <p className="hero-subheadline">{subtitle}</p>

                        <div className="hero-meta">
                            <span style={{ color: 'var(--mp-brand-red)' }}>{author}</span>
                            <span style={{ color: 'var(--mp-light-gray)' }}>|</span>
                            <span>{timestamp}</span>
                            <span style={{ color: 'var(--mp-light-gray)' }}>|</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Clock size={14} /> 4 min read
                            </span>
                        </div>

                        <div className="hero-image-wrapper">
                            <img
                                src={image}
                                alt={title}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                            {/* Glass Overlay Buttons */}
                            <div style={{
                                position: 'absolute',
                                bottom: '20px',
                                left: '20px',
                                display: 'flex',
                                gap: '10px'
                            }}>
                                <button className="mp-glass" style={{
                                    padding: '8px 16px',
                                    color: 'var(--mp-ink)',
                                    borderRadius: '24px',
                                    fontSize: '12px',
                                    fontWeight: '700',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    cursor: 'pointer',
                                    boxShadow: 'var(--shadow-md)'
                                }}>
                                    ✨ Summarize
                                </button>
                                <button className="mp-glass" style={{
                                    padding: '8px 16px',
                                    color: 'var(--mp-ink)',
                                    borderRadius: '24px',
                                    fontSize: '12px',
                                    fontWeight: '700',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    cursor: 'pointer',
                                    boxShadow: 'var(--shadow-md)'
                                }}>
                                    💬 Discuss
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
