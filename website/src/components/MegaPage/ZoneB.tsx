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
            <section className="zone-b">
                {/* Left: Ticker */}
                <div style={{ display: 'flex', alignItems: 'center', overflow: 'hidden', flex: 1, whiteSpace: 'nowrap', marginRight: '24px' }}>
                    <span className="ticker-label">BREAKING</span>
                    <div style={{ fontSize: '14px', fontWeight: '500' }}>
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

                    <button style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '6px 12px',
                        backgroundColor: 'rgba(255,255,255,0.1)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '20px',
                        color: '#fff',
                        fontSize: '12px',
                        cursor: 'pointer'
                    }}>
                        <Radio size={14} /> Listen to Briefing
                    </button>
                </div>
            </section>
        </div>
    );
};
