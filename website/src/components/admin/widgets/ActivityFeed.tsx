import React, { useEffect, useState } from 'react';
import {
    collection,
    query,
    orderBy,
    limit,
    onSnapshot,
    Timestamp
} from 'firebase/firestore';
import { db } from '../../../services/firebase';

interface ActivityItem {
    id: string;
    timestamp: any;
    userId: string;
    userName: string;
    action: string;
    details: {
        title?: string;
        type?: string;
        [key: string]: any;
    };
    icon?: string;
}

const ActivityFeed: React.FC = () => {
    const [activities, setActivities] = useState<ActivityItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(
            collection(db, 'auditLog'),
            orderBy('timestamp', 'desc'),
            limit(15)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const results = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    timestamp: data.timestamp,
                    userId: data.performedBy,
                    userName: data.performedByName,
                    action: data.action,
                    details: {
                        title: data.targetName,
                        ...data.metadata
                    }
                };
            }) as ActivityItem[];
            setActivities(results);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching activity:", error);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const formatTime = (ts: any) => {
        if (!ts) return 'just now';
        const date = ts instanceof Timestamp ? ts.toDate() : new Date(ts);
        const diff = Date.now() - date.getTime();

        if (diff < 60000) return 'just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        return date.toLocaleDateString();
    };

    const getActionIcon = (action: string) => {
        const a = action.toLowerCase();
        if (a.includes('publish') || a.includes('approve')) return '🚀';
        if (a.includes('submit') || a.includes('create')) return '📝';
        if (a.includes('edit') || a.includes('update')) return '✏️';
        if (a.includes('delete') || a.includes('reject')) return '❌';
        if (a.includes('login')) return '🔑';
        if (a.includes('subscriber')) return '👥';
        return '🔔';
    };

    if (loading) {
        return <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>Loading activity...</div>;
    }

    return (
        <div style={{
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            overflow: 'hidden'
        }}>
            <div style={{
                padding: '16px 20px',
                borderBottom: '1px solid #e5e7eb',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#111827' }}>
                    🔴 Live Activity
                </h3>
                <span style={{ fontSize: '12px', color: '#6b7280', backgroundColor: '#f3f4f6', padding: '2px 8px', borderRadius: '12px' }}>
                    {activities.length} Recent
                </span>
            </div>

            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {activities.length === 0 ? (
                    <div style={{ padding: '40px 20px', textAlign: 'center', color: '#9ca3af' }}>
                        No recent activity detected.
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {activities.map((activity, index) => (
                            <div
                                key={activity.id}
                                style={{
                                    padding: '12px 20px',
                                    borderBottom: index === activities.length - 1 ? 'none' : '1px solid #f3f4f6',
                                    display: 'flex',
                                    gap: '12px',
                                    transition: 'background-color 0.2s',
                                    cursor: 'default'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                                <div style={{ fontSize: '20px', marginTop: '2px' }}>
                                    {getActionIcon(activity.action)}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '14px', color: '#374151', lineHeight: '1.4' }}>
                                        <span style={{ fontWeight: '600', color: '#111827' }}>{activity.userName}</span>
                                        {' '}{activity.action.toLowerCase()}{' '}
                                        {activity.details?.title && (
                                            <span style={{ color: '#4f46e5', fontWeight: '500' }}>"{activity.details.title}"</span>
                                        )}
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
                                        {formatTime(activity.timestamp)}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div style={{
                padding: '12px 20px',
                borderTop: '1px solid #e5e7eb',
                textAlign: 'center',
                backgroundColor: '#f9fafb'
            }}>
                <button
                    style={{
                        background: 'none',
                        border: 'none',
                        color: '#4f46e5',
                        fontSize: '13px',
                        fontWeight: '600',
                        cursor: 'not-allowed', // Need Audit Tab first
                        opacity: 0.8
                    }}
                >
                    View Full Audit Log
                </button>
            </div>
        </div>
    );
};

export default ActivityFeed;
