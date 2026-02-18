import React, { useState } from 'react';
import { ArticleContext } from '../../types';
import { ChevronDown, ChevronUp, Clock, Info, Link as LinkIcon, List } from 'lucide-react';

interface ArticleContextPanelProps {
    context?: ArticleContext;
    className?: string;
}

const ArticleContextPanel: React.FC<ArticleContextPanelProps> = ({ context, className = '' }) => {
    const [isTimelineExpanded, setIsTimelineExpanded] = useState(false);

    if (!context) return null;

    const hasContent = context.whyItMatters || (context.keyFacts && context.keyFacts.length > 0) || (context.timeline && context.timeline.length > 0);

    if (!hasContent) return null;

    return (
        <div className={`article-context-panel ${className}`} style={{
            backgroundColor: '#f9fafb',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '20px',
            margin: '24px 0 32px 0',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
        }}>
            {/* 1. Why It Matters */}
            {context.whyItMatters && (
                <div style={{ marginBottom: '20px' }}>
                    <h4 style={{
                        fontSize: '12px',
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        color: '#991b1b', // Brand Red
                        marginBottom: '8px',
                        letterSpacing: '0.05em',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                    }}>
                        <Info size={14} /> Why It Matters
                    </h4>
                    <p style={{
                        fontSize: '16px',
                        lineHeight: '1.5',
                        color: '#1f2937',
                        fontWeight: '500',
                        margin: 0
                    }}>
                        {context.whyItMatters}
                    </p>
                </div>
            )}

            {/* 2. Key Facts */}
            {context.keyFacts && context.keyFacts.length > 0 && (
                <div style={{ marginBottom: (context.timeline && context.timeline.length > 0) ? '20px' : '0' }}>
                    <h4 style={{
                        fontSize: '12px',
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        color: '#4b5563',
                        marginBottom: '12px',
                        letterSpacing: '0.05em',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                    }}>
                        <List size={14} /> Key Facts
                    </h4>
                    <ul style={{
                        margin: 0,
                        paddingLeft: '20px',
                        listStyleType: 'disc'
                    }}>
                        {context.keyFacts.map((fact, index) => (
                            <li key={index} style={{
                                fontSize: '15px',
                                lineHeight: '1.5',
                                color: '#374151',
                                marginBottom: '6px'
                            }}>
                                {fact}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* 3. Timeline (Collapsible) */}
            {context.timeline && context.timeline.length > 0 && (
                <div style={{ marginTop: '16px', borderTop: '1px solid #e5e7eb', paddingTop: '16px' }}>
                    <button
                        onClick={() => setIsTimelineExpanded(!isTimelineExpanded)}
                        style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            cursor: 'pointer',
                            color: '#4b5563',
                            fontSize: '13px',
                            fontWeight: '600',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                        }}
                    >
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Clock size={14} /> Timeline: How We Got Here
                        </span>
                        {isTimelineExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>

                    {isTimelineExpanded && (
                        <div style={{ marginTop: '16px', paddingLeft: '8px', borderLeft: '2px solid #e5e7eb' }}>
                            {context.timeline.map((event, index) => (
                                <div key={index} style={{ marginBottom: '16px', position: 'relative' }}>
                                    {/* Dot indicator */}
                                    <div style={{
                                        position: 'absolute',
                                        left: '-13px',
                                        top: '4px',
                                        width: '8px',
                                        height: '8px',
                                        borderRadius: '50%',
                                        backgroundColor: '#9ca3af',
                                        border: '2px solid #f9fafb'
                                    }} />
                                    <div style={{ fontSize: '12px', fontWeight: '700', color: '#6b7280', marginBottom: '2px' }}>
                                        {event.date}
                                    </div>
                                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827', marginBottom: '2px' }}>
                                        {event.title}
                                    </div>
                                    <div style={{ fontSize: '13px', color: '#4b5563', lineHeight: '1.4' }}>
                                        {event.summary}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ArticleContextPanel;
