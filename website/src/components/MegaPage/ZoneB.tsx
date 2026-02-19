import React from 'react';
import { MegaGrid } from './MegaGrid';
import { Radio, ChevronRight } from 'lucide-react';

interface ZoneBProps {
    breakingNews?: string[];
    liveEventActive?: boolean;
}

/**
 * ZONE B: The "Multimedia Strip" (The Breaker)
 * - Ticker
 * - Audio Placeholder
 * - Live Indicator
 */
export const ZoneB: React.FC<ZoneBProps> = ({ breakingNews = [], liveEventActive = false }) => {
    const defaultTicker = "Breaking: Global Technology Summit Announces Major AI Regulations • Markets React Positively • Oil Prices Stabilize";
    const tickerText = breakingNews.length > 0 ? breakingNews.join(" • ") : defaultTicker;

    return (
        <div className="mega-page-container">
            <section className="zone-b" style={{
                background: 'linear-gradient(90deg, #111827 0%, #1F2937 100%)',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '40px',
                boxShadow: 'var(--shadow-md)'
            }}>
                {/* Left: Ticker */}
                <div style={{ display: 'flex', alignItems: 'center', overflow: 'hidden', flex: 1, whiteSpace: 'nowrap', marginRight: '24px' }}>
                    <span className="ticker-label" style={{
                        backgroundColor: 'var(--mp-brand-red)', color: 'white', padding: '4px 8px', borderRadius: '4px',
                        fontWeight: '800', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', marginRight: '16px'
                    }}>
                        BREAKING
                    </span>
                    <div style={{ fontSize: '14px', fontWeight: '500', fontFamily: 'var(--font-ui)' }}>
                        {tickerText}
                    </div>
                </div>

                {/* Right: Audio / Live Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    {liveEventActive && (
                        <span style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            color: '#EF4444',
                            fontWeight: '700',
                            fontSize: '12px',
                            textTransform: 'uppercase'
                        }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#EF4444', display: 'inline-block' }}></span>
                            Live Coverage
                        </span>
                    )}

                    <button className="mp-card-hover" style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '6px 14px',
                        backgroundColor: 'rgba(255,255,255,0.1)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '20px',
                        color: '#fff',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        backdropFilter: 'blur(4px)'
                    }}>
                        <Radio size={14} /> Listen to Briefing
                    </button>
                </div>
            </section>
        </div>
    );
};
