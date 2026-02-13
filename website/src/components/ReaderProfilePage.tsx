/**
 * Reader Profile Page
 * Shows profile details and preferences. Guests see a sign-up prompt modal.
 */

import React, { useState, useEffect } from 'react';
import { ArrowLeft, X, User, Mail, Settings, Save } from 'lucide-react';
import { getCurrentReader, updateReaderProfile, updateReaderPreferences, Reader } from '../services/readerService';
import { getAuth } from 'firebase/auth';

const AVAILABLE_CATEGORIES = [
  'Local (Zim)',
  'Business (Zim)',
  'World News',
  'Sports',
  'Tech & AI',
  'African Focus',
  'Opinion',
  'Culture'
];

interface ReaderProfilePageProps {
  onBack?: () => void;
}

const ReaderProfilePage: React.FC<ReaderProfilePageProps> = ({ onBack }) => {
  const [reader, setReader] = useState<Reader | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [editName, setEditName] = useState('');
  const [saving, setSaving] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [prefsSaving, setPrefsSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user || user.isAnonymous) {
          setIsGuest(true);
          setReader(null);
          setShowGuestModal(true);
          return;
        }
        const r = await getCurrentReader();
        if (r) {
          setReader(r);
          setEditName(r.name);
          setSelectedCategories(r.preferences?.categories || []);
          setIsGuest(false);
          setShowGuestModal(false);
        } else {
          setIsGuest(true);
          setShowGuestModal(true);
        }
      } catch (e) {
        console.error('Error loading reader profile:', e);
        setIsGuest(true);
        setShowGuestModal(true);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSaveName = async () => {
    if (!reader || !editName.trim()) return;
    setSaving(true);
    try {
      await updateReaderProfile(reader.uid, { name: editName.trim() });
      setReader(prev => prev ? { ...prev, name: editName.trim() } : null);
      setEditingName(false);
    } catch (e: any) {
      alert(e?.message || 'Failed to update name');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleCategory = (cat: string) => {
    setSelectedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const handleSavePreferences = async () => {
    if (!reader) return;
    setPrefsSaving(true);
    try {
      await updateReaderPreferences(reader.uid, { categories: selectedCategories });
    } catch (e: any) {
      alert(e?.message || 'Failed to save preferences');
    } finally {
      setPrefsSaving(false);
    }
  };

  const handleSignUpClick = () => {
    setShowGuestModal(false);
    window.location.hash = 'auth';
  };

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: '#666' }}>
        Loading profile...
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f9fafb',
      padding: '20px 20px 80px',
      fontFamily: 'var(--font-body, system-ui, sans-serif)'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '24px'
      }}>
        <button
          onClick={onBack || (() => { window.location.hash = 'news'; })}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          aria-label="Back"
        >
          <ArrowLeft size={24} color="#000033" />
        </button>
        <h1 style={{
          margin: 0,
          fontSize: '1.5rem',
          fontWeight: 700,
          color: '#1a1a1a',
          fontFamily: 'var(--font-heading, Georgia, serif)'
        }}>
          Profile & Preferences
        </h1>
      </div>

      {/* Guest: Show prompt card (modal appears on first visit) */}
      {isGuest && (
        <div style={{
          backgroundColor: '#fff',
          borderRadius: '12px',
          padding: '32px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          textAlign: 'center'
        }}>
          <User size={48} color="#9ca3af" style={{ marginBottom: '16px' }} />
          <p style={{ color: '#666', marginBottom: '16px', fontSize: '15px' }}>
            Create a free account to save your preferences, personalize your feed, and comment with your name.
          </p>
          <button
            onClick={handleSignUpClick}
            style={{
              padding: '12px 24px',
              fontSize: '15px',
              fontWeight: 600,
              color: 'white',
              backgroundColor: '#000033',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Sign Up
          </button>
        </div>
      )}

      {/* Logged-in reader: Full profile + preferences */}
      {!isGuest && reader && (
        <>
          {/* Profile section */}
          <section style={{
            backgroundColor: '#fff',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
          }}>
            <h2 style={{
              margin: '0 0 20px 0',
              fontSize: '1rem',
              fontWeight: 600,
              color: '#1a1a1a',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <User size={18} color="#000033" />
              Profile
            </h2>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '13px', color: '#666', display: 'block', marginBottom: '4px' }}>Name</label>
              {editingName ? (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '10px 12px',
                      fontSize: '15px',
                      border: '1px solid #e0e0e0',
                      borderRadius: '8px'
                    }}
                  />
                  <button
                    onClick={handleSaveName}
                    disabled={saving}
                    style={{
                      padding: '10px 16px',
                      fontSize: '14px',
                      fontWeight: 600,
                      color: 'white',
                      backgroundColor: '#000033',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: saving ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '15px' }}>{reader.name}</span>
                  <button
                    onClick={() => setEditingName(true)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#000033',
                      cursor: 'pointer',
                      fontSize: '13px',
                      textDecoration: 'underline'
                    }}
                  >
                    Edit
                  </button>
                </div>
              )}
            </div>
            <div>
              <label style={{ fontSize: '13px', color: '#666', display: 'block', marginBottom: '4px' }}>Email</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px' }}>
                <Mail size={16} color="#666" />
                {reader.email}
              </div>
            </div>
          </section>

          {/* Preferences section */}
          <section style={{
            backgroundColor: '#fff',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
          }}>
            <h2 style={{
              margin: '0 0 16px 0',
              fontSize: '1rem',
              fontWeight: 600,
              color: '#1a1a1a',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Settings size={18} color="#000033" />
              Category Preferences
            </h2>
            <p style={{ fontSize: '13px', color: '#666', marginBottom: '16px' }}>
              Select the topics you're interested in to personalize your feed.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
              {AVAILABLE_CATEGORIES.map(cat => (
                <label
                  key={cat}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '8px 14px',
                    borderRadius: '20px',
                    border: selectedCategories.includes(cat) ? '2px solid #000033' : '1px solid #e0e0e0',
                    backgroundColor: selectedCategories.includes(cat) ? '#f0f4ff' : '#fff',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(cat)}
                    onChange={() => handleToggleCategory(cat)}
                    style={{ marginRight: '8px' }}
                  />
                  {cat}
                </label>
              ))}
            </div>
            <button
              onClick={handleSavePreferences}
              disabled={prefsSaving}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                fontSize: '14px',
                fontWeight: 600,
                color: 'white',
                backgroundColor: '#000033',
                border: 'none',
                borderRadius: '8px',
                cursor: prefsSaving ? 'not-allowed' : 'pointer'
              }}
            >
              <Save size={16} />
              {prefsSaving ? 'Saving...' : 'Save Preferences'}
            </button>
          </section>

          {/* Newsletter status */}
          <section style={{
            backgroundColor: '#fff',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
          }}>
            <h2 style={{ margin: '0 0 12px 0', fontSize: '1rem', fontWeight: 600, color: '#1a1a1a' }}>
              Newsletter
            </h2>
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '12px' }}>
              {reader.preferences?.newsletterSubscribed
                ? 'You are subscribed to our newsletter.'
                : 'Subscribe to get our best stories delivered to your inbox.'}
            </p>
            <button
              onClick={() => { window.location.hash = 'subscribe'; }}
              style={{
                padding: '10px 20px',
                fontSize: '14px',
                fontWeight: 600,
                color: '#000033',
                backgroundColor: 'transparent',
                border: '1px solid #000033',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              {reader.preferences?.newsletterSubscribed ? 'Manage Subscription' : 'Subscribe'}
            </button>
          </section>
        </>
      )}

      {/* Guest Sign-Up Modal */}
      {showGuestModal && isGuest && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
          onClick={() => setShowGuestModal(false)}
        >
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: '12px',
              padding: '28px',
              maxWidth: '400px',
              width: '100%',
              position: 'relative',
              boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
            }}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setShowGuestModal(false)}
              aria-label="Close"
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={24} color="#666" />
            </button>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <User size={48} color="#000033" style={{ marginBottom: '12px' }} />
              <h3 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', color: '#1a1a1a' }}>
                Create an Account
              </h3>
              <p style={{ margin: 0, fontSize: '14px', color: '#666', lineHeight: 1.5 }}>
                Sign up to save your preferences, personalize your feed, and comment with your name.
              </p>
            </div>
            <button
              onClick={handleSignUpClick}
              style={{
                width: '100%',
                padding: '14px',
                fontSize: '15px',
                fontWeight: 600,
                color: 'white',
                backgroundColor: '#000033',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              Sign Up
            </button>
            <p style={{ margin: '16px 0 0', fontSize: '13px', color: '#666', textAlign: 'center' }}>
              Already have an account?{' '}
              <button
                onClick={handleSignUpClick}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#000033',
                  cursor: 'pointer',
                  fontWeight: 600,
                  textDecoration: 'underline'
                }}
              >
                Sign In
              </button>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReaderProfilePage;
