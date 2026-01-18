/**
 * Subscriber Management Tab
 * Manage newsletter subscribers and their preferences
 */

import React, { useState, useEffect } from 'react';
import { subscribeToNewsletter, unsubscribeFromNewsletter, updateNewsletterPreferences } from '../../services/newsletterService';

interface Subscriber {
  id: string;
  email: string;
  name?: string;
  interests?: string[];
  subscribedAt: Date;
  status: 'active' | 'inactive';
}

const SubscriberTab: React.FC = () => {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingSubscriber, setEditingSubscriber] = useState<Subscriber | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    interests: ''
  });

  // Mock data for demonstration - in production, this would fetch from Firestore
  useEffect(() => {
    // Simulate loading subscribers
    setTimeout(() => {
      setSubscribers([
        {
          id: '1',
          email: 'john.doe@example.com',
          name: 'John Doe',
          interests: ['politics', 'business'],
          subscribedAt: new Date('2024-01-15'),
          status: 'active'
        },
        {
          id: '2',
          email: 'jane.smith@example.com',
          name: 'Jane Smith',
          interests: ['tech', 'global'],
          subscribedAt: new Date('2024-01-20'),
          status: 'active'
        },
        {
          id: '3',
          email: 'mike.johnson@example.com',
          name: 'Mike Johnson',
          interests: ['sports', 'business'],
          subscribedAt: new Date('2024-01-25'),
          status: 'active'
        }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const handleAddSubscriber = async () => {
    try {
      const interests = formData.interests.split(',').map(i => i.trim()).filter(i => i);
      const result = await subscribeToNewsletter(formData.email, formData.name, interests);

      if (result.success) {
        const newSubscriber: Subscriber = {
          id: Date.now().toString(),
          email: formData.email,
          name: formData.name,
          interests,
          subscribedAt: new Date(),
          status: 'active'
        };
        setSubscribers([...subscribers, newSubscriber]);
        setFormData({ email: '', name: '', interests: '' });
        setShowAddForm(false);
        alert('Subscriber added successfully!');
      }
    } catch (error: any) {
      alert(`Failed to add subscriber: ${error.message}`);
    }
  };

  const handleUnsubscribe = async (subscriber: Subscriber) => {
    if (!confirm(`Unsubscribe ${subscriber.email}?`)) return;

    try {
      const result = await unsubscribeFromNewsletter(subscriber.email);
      if (result.success) {
        setSubscribers(subscribers.map(sub =>
          sub.id === subscriber.id ? { ...sub, status: 'inactive' as const } : sub
        ));
        alert('Subscriber unsubscribed successfully!');
      }
    } catch (error: any) {
      alert(`Failed to unsubscribe: ${error.message}`);
    }
  };

  const handleUpdatePreferences = async () => {
    if (!editingSubscriber) return;

    try {
      const interests = formData.interests.split(',').map(i => i.trim()).filter(i => i);
      const result = await updateNewsletterPreferences(editingSubscriber.email, formData.name, interests);

      if (result.success) {
        setSubscribers(subscribers.map(sub =>
          sub.id === editingSubscriber.id
            ? { ...sub, name: formData.name, interests }
            : sub
        ));
        setEditingSubscriber(null);
        setFormData({ email: '', name: '', interests: '' });
        alert('Preferences updated successfully!');
      }
    } catch (error: any) {
      alert(`Failed to update preferences: ${error.message}`);
    }
  };

  const startEditing = (subscriber: Subscriber) => {
    setEditingSubscriber(subscriber);
    setFormData({
      email: subscriber.email,
      name: subscriber.name || '',
      interests: subscriber.interests?.join(', ') || ''
    });
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading subscribers...</div>;
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <h2 style={{ marginTop: 0, marginBottom: '24px', fontSize: '24px', fontWeight: '600' }}>
        👥 Subscriber Management
      </h2>

      {/* Stats Overview */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '32px'
      }}>
        <div style={{
          border: '1px solid #e5e5e5',
          borderRadius: '8px',
          padding: '20px',
          backgroundColor: '#fff'
        }}>
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
            Total Subscribers
          </div>
          <div style={{
            fontSize: '32px',
            fontWeight: '700',
            color: '#10b981'
          }}>
            {subscribers.filter(s => s.status === 'active').length}
          </div>
        </div>

        <div style={{
          border: '1px solid #e5e5e5',
          borderRadius: '8px',
          padding: '20px',
          backgroundColor: '#fff'
        }}>
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
            This Month
          </div>
          <div style={{
            fontSize: '32px',
            fontWeight: '700',
            color: '#3b82f6'
          }}>
            {subscribers.filter(s =>
              s.status === 'active' &&
              s.subscribedAt.getMonth() === new Date().getMonth()
            ).length}
          </div>
        </div>

        <div style={{
          border: '1px solid #e5e5e5',
          borderRadius: '8px',
          padding: '20px',
          backgroundColor: '#fff'
        }}>
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
            Top Interest
          </div>
          <div style={{
            fontSize: '18px',
            fontWeight: '600',
            color: '#f59e0b'
          }}>
            {getTopInterest(subscribers)}
          </div>
        </div>
      </div>

      {/* Add Subscriber Button */}
      <div style={{ marginBottom: '24px' }}>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          style={{
            padding: '12px 24px',
            backgroundColor: '#000',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600'
          }}
        >
          {showAddForm ? 'Cancel' : '+ Add Subscriber'}
        </button>
      </div>

      {/* Add Subscriber Form */}
      {showAddForm && (
        <div style={{
          border: '1px solid #e5e5e5',
          borderRadius: '8px',
          padding: '24px',
          backgroundColor: '#fff',
          marginBottom: '24px'
        }}>
          <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Add New Subscriber</h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
                placeholder="john@example.com"
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
                placeholder="John Doe"
              />
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Interests (comma-separated)
            </label>
            <input
              type="text"
              value={formData.interests}
              onChange={(e) => setFormData({ ...formData, interests: e.target.value })}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
              placeholder="politics, business, tech"
            />
          </div>

          <button
            onClick={handleAddSubscriber}
            style={{
              padding: '12px 24px',
              backgroundColor: '#10b981',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            Add Subscriber
          </button>
        </div>
      )}

      {/* Edit Subscriber Modal */}
      {editingSubscriber && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '8px',
            padding: '24px',
            width: '500px',
            maxWidth: '90vw'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Edit Subscriber</h3>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                disabled
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  backgroundColor: '#f9fafb'
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                Interests
              </label>
              <input
                type="text"
                value={formData.interests}
                onChange={(e) => setFormData({ ...formData, interests: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
                placeholder="politics, business, tech"
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setEditingSubscriber(null)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#6b7280',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleUpdatePreferences}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#3b82f6',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Subscribers List */}
      <div style={{
        border: '1px solid #e5e5e5',
        borderRadius: '8px',
        backgroundColor: '#fff'
      }}>
        <div style={{
          padding: '16px 24px',
          borderBottom: '1px solid #e5e5e5',
          fontWeight: '600'
        }}>
          Subscribers ({subscribers.filter(s => s.status === 'active').length})
        </div>

        {subscribers.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
            No subscribers yet. Add your first subscriber above.
          </div>
        ) : (
          subscribers.map((subscriber) => (
            <div
              key={subscriber.id}
              style={{
                padding: '16px 24px',
                borderBottom: '1px solid #f3f4f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                opacity: subscriber.status === 'inactive' ? 0.6 : 1
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                  {subscriber.name || 'Anonymous'}
                  {subscriber.status === 'inactive' && (
                    <span style={{
                      fontSize: '12px',
                      color: '#ef4444',
                      marginLeft: '8px',
                      fontWeight: 'normal'
                    }}>
                      (Unsubscribed)
                    </span>
                  )}
                </div>
                <div style={{ color: '#666', fontSize: '14px', marginBottom: '4px' }}>
                  {subscriber.email}
                </div>
                <div style={{ fontSize: '12px', color: '#999' }}>
                  Interests: {subscriber.interests?.join(', ') || 'None'}
                  <br />
                  Subscribed: {subscriber.subscribedAt.toLocaleDateString()}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                {subscriber.status === 'active' && (
                  <button
                    onClick={() => startEditing(subscriber)}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#3b82f6',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    Edit
                  </button>
                )}

                {subscriber.status === 'active' && (
                  <button
                    onClick={() => handleUnsubscribe(subscriber)}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#ef4444',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    Unsubscribe
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// Helper function to get top interest
function getTopInterest(subscribers: Subscriber[]): string {
  const interestCounts: Record<string, number> = {};

  subscribers
    .filter(s => s.status === 'active')
    .forEach(sub => {
      sub.interests?.forEach(interest => {
        interestCounts[interest] = (interestCounts[interest] || 0) + 1;
      });
    });

  const sorted = Object.entries(interestCounts).sort(([,a], [,b]) => b - a);
  return sorted[0]?.[0] || 'None';
}

export default SubscriberTab;