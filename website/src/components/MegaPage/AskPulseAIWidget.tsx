import React, { useState } from 'react';
import { MessageCircle, Send, Sparkles } from 'lucide-react';

/**
 * AskPulseAIWidget
 * A compact version of AskPulseAI designed for the Right Rail (Sidebar).
 */
export const AskPulseAIWidget: React.FC = () => {
    const [query, setQuery] = useState('');
    // In a real implementation, this would trigger the main AI modal or a popover
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        // Dispatch custom event to open main AI modal with this query
        const event = new CustomEvent('open-ask-ai', { detail: { initialQuery: query } });
        window.dispatchEvent(event);
        setQuery('');
    };

    return (
        <div style={{
            padding: '24px 20px',
            backgroundColor: '#ffffff',
            borderTop: '2px solid #000',
            borderLeft: '1px solid #e5e7eb',
            borderRight: '1px solid #e5e7eb',
            borderBottom: '1px solid #000',
            width: '100%',
            maxWidth: '300px'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: '#000', fontWeight: '900', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'sans-serif' }}>
                <Sparkles size={14} fill="#000" /> AskPulse AI
            </div>
            <div style={{ fontSize: '14px', color: '#4b5563', marginBottom: '16px', lineHeight: '1.4', fontFamily: 'Georgia, serif' }}>
                Get instant answers, summaries, and context about any story.
            </div>
            <form onSubmit={handleSearch} style={{ position: 'relative' }}>
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Ask about this story..."
                    style={{
                        width: '100%',
                        padding: '12px',
                        paddingRight: '40px',
                        border: '1px solid #d1d5db',
                        fontSize: '13px',
                        fontFamily: 'sans-serif',
                        backgroundColor: '#FFFFFF',
                        color: '#000'
                    }}
                />
                <button
                    type="submit"
                    style={{
                        position: 'absolute',
                        right: '8px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: '#000',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '6px'
                    }}
                >
                    <Send size={12} />
                </button>
            </form>
        </div>
    );
};
