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
            padding: '20px',
            backgroundColor: '#EFF6FF',
            border: '1px solid #DBEAFE',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(37, 99, 235, 0.05)'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: '#1E40AF', fontWeight: 'bold', fontSize: '15px' }}>
                <Sparkles size={16} fill="#1E40AF" /> AskPulse AI
            </div>
            <div style={{ fontSize: '13px', color: '#60A5FA', marginBottom: '16px', lineHeight: '1.4' }}>
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
                        padding: '10px 12px',
                        paddingRight: '36px',
                        borderRadius: '6px',
                        border: '1px solid #BFDBFE',
                        fontSize: '13px',
                        backgroundColor: '#FFFFFF',
                        color: '#1E3A8A'
                    }}
                />
                <button
                    type="submit"
                    style={{
                        position: 'absolute',
                        right: '8px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#2563EB',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <Send size={14} />
                </button>
            </form>
        </div>
    );
};
