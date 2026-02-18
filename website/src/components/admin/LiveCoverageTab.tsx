import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, setDoc, updateDoc, serverTimestamp, arrayUnion } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { LiveEvent, LiveEventUpdate } from '../../types';
import { Plus, Radio, Send, PlayCircle, StopCircle, Edit2, AlertCircle } from 'lucide-react';

interface LiveCoverageTabProps {
    userRoles: string[];
    showToast: (message: string, type: 'success' | 'error') => void;
    currentUserEmail?: string;
}

const LiveCoverageTab: React.FC<LiveCoverageTabProps> = ({ userRoles, showToast, currentUserEmail }) => {
    const [events, setEvents] = useState<LiveEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedEvent, setSelectedEvent] = useState<LiveEvent | null>(null);

    // New Event State
    const [isCreating, setIsCreating] = useState(false);
    const [newEvent, setNewEvent] = useState<Partial<LiveEvent>>({
        title: '',
        slug: '',
        summary: '',
        isActive: false
    });

    // Update State
    const [newUpdateContent, setNewUpdateContent] = useState('');
    const [isUpdateImportant, setIsUpdateImportant] = useState(false);
    const [sendingUpdate, setSendingUpdate] = useState(false);

    // Subscribe to events
    useEffect(() => {
        const q = query(collection(db, 'live_events'), orderBy('startedAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const eventsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LiveEvent));
            setEvents(eventsData);
            setLoading(false);

            // Update selected event if it exists in the new data
            if (selectedEvent) {
                const updatedSelected = eventsData.find(e => e.id === selectedEvent.id);
                if (updatedSelected) setSelectedEvent(updatedSelected);
            }
        });

        return () => unsubscribe();
    }, [selectedEvent?.id]); // Re-subscribe not strictly needed here but keeps logic clean if query changes

    const handleCreateEvent = async () => {
        if (!newEvent.title || !newEvent.slug) {
            showToast('Title and Slug are required', 'error');
            return;
        }

        try {
            const eventId = newEvent.slug; // Use slug as ID for simplicity or auto-id
            const eventRef = doc(db, 'live_events', eventId);

            const eventData: LiveEvent = {
                id: eventId,
                slug: newEvent.slug,
                title: newEvent.title || '',
                summary: newEvent.summary || '',
                startedAt: Date.now(),
                isActive: newEvent.isActive || false,
                updates: []
            };

            await setDoc(eventRef, eventData);
            showToast('Live Event created successfully', 'success');
            setIsCreating(false);
            setNewEvent({ title: '', slug: '', summary: '', isActive: false });
        } catch (error) {
            console.error('Error creating event:', error);
            showToast('Failed to create event', 'error');
        }
    };

    const handlePushUpdate = async () => {
        if (!selectedEvent || !newUpdateContent.trim()) return;

        setSendingUpdate(true);
        try {
            const update: LiveEventUpdate = {
                id: Date.now().toString(),
                timestamp: Date.now(),
                content: newUpdateContent,
                author: currentUserEmail || 'Editor',
                important: isUpdateImportant
            };

            const eventRef = doc(db, 'live_events', selectedEvent.id);
            await updateDoc(eventRef, {
                updates: arrayUnion(update),
                updatedAt: serverTimestamp()
            });

            setNewUpdateContent('');
            setIsUpdateImportant(false);
            showToast('Update published to live feed', 'success');
        } catch (error) {
            console.error('Error pushing update:', error);
            showToast('Failed to push update', 'error');
        } finally {
            setSendingUpdate(false);
        }
    };

    const toggleEventStatus = async (event: LiveEvent) => {
        try {
            const eventRef = doc(db, 'live_events', event.id);
            await updateDoc(eventRef, {
                isActive: !event.isActive,
                endedAt: !event.isActive ? null : Date.now() // Set endedAt when stopping
            });
            showToast(`Event ${event.isActive ? 'ended' : 'started'}`, 'success');
        } catch (error) {
            showToast('Failed to update status', 'error');
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading live coverage feeds...</div>;

    return (
        <div className="live-coverage-tab" style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto', display: 'grid', gridTemplateColumns: '350px 1fr', gap: '24px', height: 'calc(100vh - 100px)' }}>
            {/* Sidebar: Event List */}
            <div style={{ borderRight: '1px solid #e5e7eb', paddingRight: '24px', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 'bold' }}>Live Events</h2>
                    <button
                        onClick={() => setIsCreating(true)}
                        style={{ padding: '8px', borderRadius: '50%', backgroundColor: '#000', color: '#fff', border: 'none', cursor: 'pointer' }}
                        title="Create New Event"
                    >
                        <Plus size={16} />
                    </button>
                </div>

                {isCreating && (
                    <div style={{ padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px', marginBottom: '16px', border: '1px solid #e5e7eb' }}>
                        <input
                            type="text"
                            placeholder="Event Title"
                            value={newEvent.title}
                            onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                            style={{ width: '100%', marginBottom: '8px', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                        />
                        <input
                            type="text"
                            placeholder="Slug (e.g. election-2025)"
                            value={newEvent.slug}
                            onChange={(e) => setNewEvent({ ...newEvent, slug: e.target.value })}
                            style={{ width: '100%', marginBottom: '8px', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                        />
                        <textarea
                            placeholder="Brief Summary"
                            value={newEvent.summary}
                            onChange={(e) => setNewEvent({ ...newEvent, summary: e.target.value })}
                            rows={2}
                            style={{ width: '100%', marginBottom: '8px', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                            <button onClick={() => setIsCreating(false)} style={{ padding: '6px 12px', background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}>Cancel</button>
                            <button onClick={handleCreateEvent} style={{ padding: '6px 12px', backgroundColor: '#000', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Create</button>
                        </div>
                    </div>
                )}

                <div className="event-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {events.map(event => (
                        <div
                            key={event.id}
                            onClick={() => setSelectedEvent(event)}
                            style={{
                                padding: '12px',
                                borderRadius: '8px',
                                backgroundColor: selectedEvent?.id === event.id ? '#f3f4f6' : '#fff',
                                border: selectedEvent?.id === event.id ? '1px solid #d1d5db' : '1px solid transparent',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                                <span className={`status-dot ${event.isActive ? 'active' : ''}`} style={{
                                    display: 'inline-block',
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: '50%',
                                    backgroundColor: event.isActive ? '#ef4444' : '#9ca3af',
                                    animation: event.isActive ? 'pulse 2s infinite' : 'none'
                                }} />
                                <span style={{ fontSize: '11px', color: '#6b7280' }}>{new Date(event.startedAt).toLocaleDateString()}</span>
                            </div>
                            <h3 style={{ fontSize: '14px', fontWeight: '600', margin: '0 0 4px 0' }}>{event.title}</h3>
                            <p style={{ fontSize: '12px', color: '#6b7280', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>/{event.slug}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Area: Updates Console */}
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                {selectedEvent ? (
                    <>
                        <div style={{ paddingBottom: '16px', borderBottom: '1px solid #e5e7eb', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    {selectedEvent.title}
                                    {selectedEvent.isActive && (
                                        <span style={{ padding: '2px 8px', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '12px', fontSize: '12px', fontWeight: '700' }}>LIVE</span>
                                    )}
                                </h1>
                                <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: '#6b7280' }}>
                                    <span>Updates: {selectedEvent.updates?.length || 0}</span>
                                    <span>Started: {new Date(selectedEvent.startedAt).toLocaleString()}</span>
                                </div>
                            </div>

                            <button
                                onClick={() => toggleEventStatus(selectedEvent)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '8px 16px',
                                    borderRadius: '6px',
                                    border: '1px solid #d1d5db',
                                    backgroundColor: selectedEvent.isActive ? '#fff' : '#000',
                                    color: selectedEvent.isActive ? '#ef4444' : '#fff',
                                    cursor: 'pointer',
                                    fontWeight: '600'
                                }}
                            >
                                {selectedEvent.isActive ? <><StopCircle size={18} /> End Coverage</> : <><PlayCircle size={18} /> Go Live</>}
                            </button>
                        </div>

                        {/* Editor Input */}
                        <div style={{ marginBottom: '24px', backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                            <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#374151', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Edit2 size={14} /> Post New Update
                            </h3>
                            <textarea
                                value={newUpdateContent}
                                onChange={(e) => setNewUpdateContent(e.target.value)}
                                placeholder="What's happening right now? (Supports basic HTML like <b>bold</b>)"
                                rows={4}
                                style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #d1d5db', marginBottom: '12px', fontFamily: 'inherit', resize: 'vertical' }}
                            />
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer', color: isUpdateImportant ? '#b91c1c' : '#4b5563' }}>
                                    <input
                                        type="checkbox"
                                        checked={isUpdateImportant}
                                        onChange={(e) => setIsUpdateImportant(e.target.checked)}
                                        style={{ accentColor: '#dc2626' }}
                                    />
                                    <AlertCircle size={16} /> Mark as Major Development
                                </label>
                                <button
                                    onClick={handlePushUpdate}
                                    disabled={sendingUpdate || !newUpdateContent.trim()}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        padding: '10px 24px',
                                        backgroundColor: '#dc2626',
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: '6px',
                                        fontWeight: '600',
                                        cursor: sendingUpdate || !newUpdateContent.trim() ? 'not-allowed' : 'pointer',
                                        opacity: sendingUpdate || !newUpdateContent.trim() ? 0.6 : 1
                                    }}
                                >
                                    {sendingUpdate ? 'Posting...' : <><Send size={16} /> Post Update</>}
                                </button>
                            </div>
                        </div>

                        {/* Updates Feed */}
                        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '12px' }}>
                            <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#6b7280' }}>Update History</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {selectedEvent.updates && [...selectedEvent.updates].reverse().map((update) => (
                                    <div key={update.id} style={{
                                        display: 'flex',
                                        gap: '16px',
                                        padding: '16px',
                                        backgroundColor: update.important ? '#fef2f2' : '#f9fafb',
                                        borderLeft: update.important ? '4px solid #dc2626' : '4px solid #e5e7eb',
                                        borderRadius: '4px'
                                    }}>
                                        <div style={{ minWidth: '80px', textAlign: 'right', fontSize: '12px', color: '#6b7280' }}>
                                            {new Date(update.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div
                                                dangerouslySetInnerHTML={{ __html: update.content }}
                                                style={{ fontSize: '15px', lineHeight: '1.5', color: '#1f2937' }}
                                            />
                                            <div style={{ marginTop: '8px', fontSize: '12px', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span>By {update.author}</span>
                                                {update.important && <span style={{ color: '#dc2626', fontWeight: '600' }}>MAJOR UPDATE</span>}
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {(!selectedEvent.updates || selectedEvent.updates.length === 0) && (
                                    <div style={{ padding: '32px', textAlign: 'center', color: '#9ca3af', fontStyle: 'italic' }}>
                                        No updates posted yet.
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#9ca3af', flexDirection: 'column', gap: '16px' }}>
                        <Radio size={48} strokeWidth={1} />
                        <p>Select a live event to manage coverage</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LiveCoverageTab;
