import React, { useEffect, useState } from 'react';
import { LiveEvent, LiveEventUpdate } from '../../types';
import { subscribeToActiveLiveEvent } from '../services/liveCoverageService';
import { Clock, AlertCircle } from 'lucide-react';

const LiveCoveragePage: React.FC = () => {
    const [event, setEvent] = useState<LiveEvent | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = subscribeToActiveLiveEvent(
            (updatedEvent) => {
                setEvent(updatedEvent);
                setLoading(false);
            },
            (error) => {
                console.error('Live coverage error:', error);
                setLoading(false);
            }
        );
        return () => unsubscribe();
    }, []);

    if (loading) return <div className="loading-state">Loading live coverage...</div>;

    if (!event) return (
        <div className="no-live-event" style={{ padding: '60px 20px', textAlign: 'center' }}>
            <h2>No Active Live Coverage</h2>
            <p>Check back later for breaking news and special events.</p>
        </div>
    );

    return (
        <div className="live-coverage-page">
            <div className="live-header" style={{
                backgroundColor: '#b91c1c',
                color: 'white',
                padding: '24px 20px',
                textAlign: 'center',
                position: 'relative'
            }}>
                <div className="live-indicator" style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    backgroundColor: '#fff',
                    color: '#b91c1c',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontWeight: '900',
                    textTransform: 'uppercase',
                    fontSize: '12px',
                    letterSpacing: '0.05em',
                    marginBottom: '16px'
                }}>
                    <span className="pulsing-dot" style={{ width: '8px', height: '8px', backgroundColor: '#ef4444', borderRadius: '50%' }}></span>
                    Live Updating
                </div>
                <h1 style={{ fontSize: '2.5rem', fontWeight: '900', margin: 0 }}>{event.title}</h1>
                <p style={{ fontSize: '1.2rem', opacity: 0.9, marginTop: '8px', maxWidth: '800px', margin: '8px auto' }}>{event.summary}</p>
            </div>

            <div className="live-container container" style={{ maxWidth: '800px', margin: '40px auto', padding: '0 20px' }}>
                <div className="timeline-feed">
                    {event.updates && event.updates.length > 0 ? (
                        event.updates.slice().reverse().map((update: LiveEventUpdate) => (
                            <div key={update.id} className={`timeline-item ${update.important ? 'important' : ''}`} style={{
                                marginBottom: '40px',
                                paddingLeft: '24px',
                                borderLeft: update.important ? '4px solid #b91c1c' : '2px solid #e5e7eb',
                                position: 'relative'
                            }}>
                                {/* Dot */}
                                <div style={{
                                    position: 'absolute',
                                    left: update.important ? '-10px' : '-7px',
                                    top: '0',
                                    width: update.important ? '16px' : '12px',
                                    height: update.important ? '16px' : '12px',
                                    borderRadius: '50%',
                                    backgroundColor: update.important ? '#b91c1c' : '#9ca3af',
                                    border: '2px solid #fff'
                                }}></div>

                                {/* header */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                    <time style={{ fontSize: '14px', fontWeight: '700', color: '#4b5563' }}>
                                        {new Date(update.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </time>
                                    {update.important && (
                                        <span style={{
                                            backgroundColor: '#fee2e2', color: '#991b1b', fontSize: '10px',
                                            fontWeight: '800', textTransform: 'uppercase', padding: '2px 8px', borderRadius: '4px'
                                        }}>
                                            Key Update
                                        </span>
                                    )}
                                </div>

                                {/* content */}
                                <div
                                    style={{ fontSize: '1.1rem', lineHeight: '1.6', color: '#1f2937' }}
                                    dangerouslySetInnerHTML={{ __html: update.content }} // Assuming sanitized or simple HTML
                                />
                            </div>
                        ))
                    ) : (
                        <div style={{ textAlign: 'center', color: '#6b7280', fontStyle: 'italic' }}>
                            Waiting for updates...
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LiveCoveragePage;
