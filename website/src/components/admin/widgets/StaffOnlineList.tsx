import React, { useEffect, useState } from 'react';
import {
    collection,
    query,
    where,
    onSnapshot,
    Timestamp,
    orderBy
} from 'firebase/firestore';
import { db } from '../../../services/firebase';

interface StaffStatus {
    uid: string;
    name: string;
    roles: string[];
    lastActive: any;
    isActive: boolean;
}

const StaffOnlineList: React.FC = () => {
    const [staff, setStaff] = useState<StaffStatus[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // We fetch all staff and filter in memory for "online" (active in last 10 mins)
        // This is easier than complex Firestore timestamp queries for real-time status
        const q = query(collection(db, 'staff'), orderBy('name', 'asc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const results = snapshot.docs.map(doc => ({
                uid: doc.id,
                ...doc.data()
            })) as StaffStatus[];
            setStaff(results);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching staff status:", error);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const isOnline = (lastActive: any) => {
        if (!lastActive) return false;
        const date = lastActive instanceof Timestamp ? lastActive.toDate() : new Date(lastActive);
        const diff = (Date.now() - date.getTime()) / 1000 / 60; // in minutes
        return diff < 10; // Online if active in last 10 minutes
    };

    const onlineStaff = staff.filter(s => s.isActive !== false && isOnline(s.lastActive));
    const offlineStaff = staff.filter(s => !onlineStaff.find(os => os.uid === s.uid));

    if (loading) {
        return <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>Loading staff status...</div>;
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
                    👥 Staff Presence
                </h3>
                <span style={{
                    fontSize: '11px',
                    fontWeight: '700',
                    color: '#10b981',
                    backgroundColor: '#ecfdf5',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    textTransform: 'uppercase'
                }}>
                    {onlineStaff.length} Online
                </span>
            </div>

            <div style={{ maxHeight: '400px', overflowY: 'auto', padding: '12px' }}>
                {staff.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#9ca3af' }}>
                        No staff members found.
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {onlineStaff.map((member) => (
                            <div
                                key={member.uid}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '8px 12px',
                                    borderRadius: '8px',
                                    backgroundColor: '#f0fdf4'
                                }}
                            >
                                <div style={{ position: 'relative' }}>
                                    <div style={{
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '50%',
                                        backgroundColor: '#10b981',
                                        color: 'white',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '14px',
                                        fontWeight: '600'
                                    }}>
                                        {member.name.charAt(0)}
                                    </div>
                                    <div style={{
                                        position: 'absolute',
                                        bottom: '-1px',
                                        right: '-1px',
                                        width: '10px',
                                        height: '10px',
                                        borderRadius: '50%',
                                        backgroundColor: '#10b981',
                                        border: '2px solid white'
                                    }} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#111827' }}>{member.name}</div>
                                    <div style={{ fontSize: '11px', color: '#059669' }}>
                                        {member.roles?.join(', ') || 'Staff'} • Active now
                                    </div>
                                </div>
                            </div>
                        ))}

                        {offlineStaff.length > 0 && (
                            <div style={{ marginTop: '8px' }}>
                                <div style={{
                                    fontSize: '11px',
                                    fontWeight: '600',
                                    color: '#9ca3af',
                                    textTransform: 'uppercase',
                                    padding: '0 12px 8px 12px'
                                }}>
                                    Away ({offlineStaff.length})
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    {offlineStaff.slice(0, 10).map((member) => (
                                        <div
                                            key={member.uid}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '12px',
                                                padding: '6px 12px',
                                                borderRadius: '8px',
                                                opacity: 0.7
                                            }}
                                        >
                                            <div style={{
                                                width: '24px',
                                                height: '24px',
                                                borderRadius: '50%',
                                                backgroundColor: '#e5e7eb',
                                                color: '#6b7280',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '11px',
                                                fontWeight: '600'
                                            }}>
                                                {member.name.charAt(0)}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: '12px', fontWeight: '500', color: '#374151' }}>{member.name}</div>
                                            </div>
                                        </div>
                                    ))}
                                    {offlineStaff.length > 10 && (
                                        <div style={{ fontSize: '11px', color: '#9ca3af', textAlign: 'center', py: 1 }}>
                                            + {offlineStaff.length - 10} more staff
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
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
                        cursor: 'pointer'
                    }}
                    onClick={() => {/* Navigate to staff tab */ }}
                >
                    Manage All Staff
                </button>
            </div>
        </div>
    );
};

export default StaffOnlineList;
