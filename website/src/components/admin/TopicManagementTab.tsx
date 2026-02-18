import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc, deleteDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { TopicHub } from '../../types';
import { Plus, Edit2, Trash2, Save, X, Layout, Check, AlertCircle } from 'lucide-react';

interface TopicManagementTabProps {
    userRoles: string[];
    showToast: (message: string, type: 'success' | 'error') => void;
}

const TopicManagementTab: React.FC<TopicManagementTabProps> = ({ userRoles, showToast }) => {
    const [topics, setTopics] = useState<TopicHub[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editingTopic, setEditingTopic] = useState<Partial<TopicHub>>({});
    const [saving, setSaving] = useState(false);

    // Fetch topics
    useEffect(() => {
        fetchTopics();
    }, []);

    const fetchTopics = async () => {
        try {
            setLoading(true);
            const q = query(collection(db, 'topics'), orderBy('order', 'asc'));
            const snapshot = await getDocs(q);
            const topicsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TopicHub));
            setTopics(topicsData);
        } catch (error) {
            console.error('Error fetching topics:', error);
            showToast('Failed to load topics', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleAddNew = () => {
        setEditingTopic({
            id: '',
            title: '',
            slug: '',
            description: '',
            layoutConfig: 'grid',
            isActive: true,
            order: topics.length + 1,
            featuredArticleIds: []
        });
        setIsEditing(true);
    };

    const handleEdit = (topic: TopicHub) => {
        setEditingTopic({ ...topic });
        setIsEditing(true);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this topic hub? This action cannot be undone.')) return;

        try {
            await deleteDoc(doc(db, 'topics', id));
            showToast('Topic deleted successfully', 'success');
            fetchTopics();
        } catch (error) {
            console.error('Error deleting topic:', error);
            showToast('Failed to delete topic', 'error');
        }
    };

    const handleSave = async () => {
        if (!editingTopic.title || !editingTopic.slug || !editingTopic.id) {
            showToast('Please fill in all required fields (ID, Title, Slug)', 'error');
            return;
        }

        try {
            setSaving(true);
            const topicData = {
                ...editingTopic,
                updatedAt: serverTimestamp()
            };

            // Create or update
            await setDoc(doc(db, 'topics', editingTopic.id), topicData, { merge: true });

            showToast('Topic saved successfully', 'success');
            setIsEditing(false);
            fetchTopics();
        } catch (error) {
            console.error('Error saving topic:', error);
            showToast('Failed to save topic', 'error');
        } finally {
            setSaving(false);
        }
    };

    const generateSlug = (text: string) => {
        return text
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/--+/g, '-');
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading topics...</div>;

    return (
        <div className="topic-management-tab" style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 8px 0' }}>Topic Hubs</h2>
                    <p style={{ color: '#6b7280' }}>Manage topic pages and their configurations.</p>
                </div>
                <button
                    onClick={handleAddNew}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 20px',
                        backgroundColor: '#000',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        fontWeight: '600',
                        cursor: 'pointer'
                    }}
                >
                    <Plus size={18} />
                    Add Topic
                </button>
            </div>

            {isEditing ? (
                <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #e5e7eb' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>{editingTopic.id ? 'Edit Topic' : 'New Topic'}</h3>
                        <button
                            onClick={() => setIsEditing(false)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}
                        >
                            <X size={24} />
                        </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Topic ID <span style={{ color: 'red' }}>*</span></label>
                            <input
                                type="text"
                                value={editingTopic.id || ''}
                                onChange={(e) => setEditingTopic({ ...editingTopic, id: generateSlug(e.target.value) })}
                                placeholder="e.g. ai-and-technology"
                                style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px' }}
                                disabled={!!topics.find(t => t.id === editingTopic.id) && editingTopic !== topics.find(t => t.id === editingTopic.id)}
                            />
                            <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>Unique identifier used in database.</p>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>URL Slug <span style={{ color: 'red' }}>*</span></label>
                            <input
                                type="text"
                                value={editingTopic.slug || ''}
                                onChange={(e) => setEditingTopic({ ...editingTopic, slug: generateSlug(e.target.value) })}
                                placeholder="e.g. ai-and-technology"
                                style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px' }}
                            />
                        </div>

                        <div style={{ gridColumn: '1 / -1' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Title <span style={{ color: 'red' }}>*</span></label>
                            <input
                                type="text"
                                value={editingTopic.title || ''}
                                onChange={(e) => setEditingTopic({ ...editingTopic, title: e.target.value })}
                                placeholder="Display Title"
                                style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '16px' }}
                            />
                        </div>

                        <div style={{ gridColumn: '1 / -1' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Description</label>
                            <textarea
                                value={editingTopic.description || ''}
                                onChange={(e) => setEditingTopic({ ...editingTopic, description: e.target.value })}
                                placeholder="Brief description for SEO and header..."
                                rows={3}
                                style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px' }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Layout</label>
                            <select
                                value={editingTopic.layoutConfig || 'grid'}
                                onChange={(e) => setEditingTopic({ ...editingTopic, layoutConfig: e.target.value as any })}
                                style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px' }}
                            >
                                <option value="grid">Grid (Standard)</option>
                                <option value="timeline">Timeline (Chronological)</option>
                                <option value="feature">Feature (Magazine Style)</option>
                            </select>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Display Order</label>
                            <input
                                type="number"
                                value={editingTopic.order || 0}
                                onChange={(e) => setEditingTopic({ ...editingTopic, order: parseInt(e.target.value) })}
                                style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px' }}
                            />
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={editingTopic.isActive || false}
                                    onChange={(e) => setEditingTopic({ ...editingTopic, isActive: e.target.checked })}
                                    style={{ width: '18px', height: '18px' }}
                                />
                                <span style={{ fontWeight: '500' }}>Active (Visible on site)</span>
                            </label>
                        </div>
                    </div>

                    <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                        <button
                            onClick={() => setIsEditing(false)}
                            style={{ padding: '10px 20px', border: '1px solid #d1d5db', borderRadius: '6px', backgroundColor: '#fff', cursor: 'pointer' }}
                            disabled={saving}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '10px 24px',
                                backgroundColor: '#000',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '6px',
                                fontWeight: '600',
                                cursor: saving ? 'not-allowed' : 'pointer',
                                opacity: saving ? 0.7 : 1
                            }}
                        >
                            {saving ? 'Saving...' : <><Save size={18} /> Save Topic</>}
                        </button>
                    </div>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
                    {topics.map(topic => (
                        <div key={topic.id} style={{
                            backgroundColor: '#fff',
                            border: '1px solid #e5e7eb',
                            borderRadius: '12px',
                            padding: '24px',
                            position: 'relative',
                            opacity: topic.isActive ? 1 : 0.6,
                            transition: 'all 0.2s ease',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                        }}>
                            <div style={{ position: 'absolute', top: '16px', right: '16px', display: 'flex', gap: '8px' }}>
                                <button
                                    onClick={() => handleEdit(topic)}
                                    style={{ padding: '8px', borderRadius: '6px', border: '1px solid #e5e7eb', backgroundColor: '#fff', cursor: 'pointer', color: '#4b5563' }}
                                    title="Edit"
                                >
                                    <Edit2 size={16} />
                                </button>
                                <button
                                    onClick={() => handleDelete(topic.id)}
                                    style={{ padding: '8px', borderRadius: '6px', border: '1px solid #fee2e2', backgroundColor: '#fff', cursor: 'pointer', color: '#ef4444' }}
                                    title="Delete"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                <span style={{
                                    padding: '4px 10px',
                                    backgroundColor: '#f3f4f6',
                                    borderRadius: '20px',
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    color: '#4b5563'
                                }}>
                                    #{topic.order}
                                </span>
                                {!topic.isActive && (
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#ef4444', fontWeight: '500' }}>
                                        <AlertCircle size={12} /> Inactive
                                    </span>
                                )}
                            </div>

                            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px', paddingRight: '60px' }}>{topic.title}</h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#6b7280', fontSize: '13px', marginBottom: '16px' }}>
                                <code style={{ backgroundColor: '#f9fafb', padding: '2px 6px', borderRadius: '4px', border: '1px solid #e5e7eb' }}>/{topic.slug}</code>
                            </div>

                            <p style={{ color: '#4b5563', fontSize: '14px', lineHeight: '1.5', marginBottom: '20px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                {topic.description || 'No description provided.'}
                            </p>

                            <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: '#6b7280' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Layout size={14} />
                                    <span style={{ textTransform: 'capitalize' }}>{topic.layoutConfig} Layout</span>
                                </div>
                                <div>
                                    {topic.featuredArticleIds?.length || 0} Featured Articles
                                </div>
                            </div>
                        </div>
                    ))}

                    {topics.length === 0 && (
                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '48px', backgroundColor: '#f9fafb', borderRadius: '12px', border: '1px dashed #d1d5db' }}>
                            <div style={{ color: '#9ca3af', marginBottom: '16px' }}>
                                <Layout size={48} style={{ margin: '0 auto' }} />
                            </div>
                            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>No Topics Found</h3>
                            <p style={{ color: '#6b7280', marginBottom: '24px' }}>Get started by creating your first topic hub.</p>
                            <button
                                onClick={handleAddNew}
                                style={{
                                    padding: '10px 20px',
                                    backgroundColor: '#000',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                }}
                            >
                                Create First Topic
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default TopicManagementTab;
