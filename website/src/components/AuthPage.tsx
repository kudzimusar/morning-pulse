/**
 * Auth Page - Unified Sign In / Sign Up for All Users
 * Modern, innovative design matching Morning Pulse theme
 */

import React, { useState } from 'react';
import { PenTool } from 'lucide-react';
import { registerReader, signInReader, getCurrentReader } from '../services/readerService';
import { activateNewsletterTrial } from '../services/readerService';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { getApp } from 'firebase/app';

interface AuthPageProps {
  onSuccess?: () => void;
  onBack?: () => void;
}

type AuthMode = 'signin' | 'signup';

const APP_ID = (window as any).__app_id || 'morning-pulse-app';

const AuthPage: React.FC<AuthPageProps> = ({ onSuccess, onBack }) => {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Get Firestore instance
  const getDb = () => {
    try {
      const app = getApp();
      return getFirestore(app);
    } catch (error) {
      console.error('Firebase initialization error:', error);
      throw new Error('Firebase not initialized');
    }
  };

  // Ensure user has reader role (for existing users)
  const ensureReaderRole = async (uid: string, email: string, name?: string) => {
    const db = getDb();
    const readerRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'readers', uid);
    
    try {
      const { getDoc } = await import('firebase/firestore');
      const readerSnap = await getDoc(readerRef);
      
      if (!readerSnap.exists()) {
        // User doesn't have reader document - create it
        await setDoc(readerRef, {
          email: email.toLowerCase().trim(),
          name: name || email.split('@')[0],
          role: 'reader',
          preferences: {
            categories: [],
            newsletterSubscribed: false,
            newsletterTrialUsed: false
          },
          createdAt: serverTimestamp(),
        });
        console.log('✅ Reader role added for existing user:', uid);
      } else {
        // Reader exists, ensure role is set
        const data = readerSnap.data();
        if (data.role !== 'reader') {
          await updateDoc(readerRef, {
            role: 'reader',
            updatedAt: serverTimestamp()
          });
          console.log('✅ Reader role updated for user:', uid);
        }
      }
    } catch (error: any) {
      console.error('Error ensuring reader role:', error);
      // Don't throw - allow sign-in to continue even if reader doc creation fails
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!email.trim() || !password) {
      setError('Please enter your email and password');
      return;
    }

    setLoading(true);

    try {
      const auth = getAuth();
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const uid = userCredential.user.uid;
      
      // Ensure user has reader role (for existing users who don't have it)
      await ensureReaderRole(uid, email.trim());
      
      // Success - reload to update user state
      if (onSuccess) {
        onSuccess();
      } else {
        window.location.hash = 'news';
        window.location.reload();
      }
    } catch (err: any) {
      console.error('Sign-in error:', err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Invalid email or password');
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email address');
      } else {
        setError(err.message || 'Failed to sign in. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!email.trim() || !password || !name.trim()) {
      setError('Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      const auth = getAuth();
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const uid = userCredential.user.uid;
      
      // Create reader document
      const db = getDb();
      const readerRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'readers', uid);
      
      await setDoc(readerRef, {
        email: email.trim().toLowerCase(),
        name: name.trim(),
        role: 'reader',
        preferences: {
          categories: [],
          newsletterSubscribed: false,
          newsletterTrialUsed: false
        },
        createdAt: serverTimestamp(),
      });
      
      // Activate newsletter trial
      try {
        await activateNewsletterTrial(uid, email.trim());
        setSuccessMessage('Account created! You have 7 days free newsletter access.');
      } catch (trialError) {
        console.warn('Newsletter trial activation failed:', trialError);
        // Don't fail registration if trial fails
      }

      // Success - reload to update user state
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        } else {
          window.location.hash = 'news';
          window.location.reload();
        }
      }, 2000);
    } catch (err: any) {
      console.error('Sign-up error:', err);
      if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Please sign in instead.');
        setMode('signin');
      } else if (err.code === 'auth/weak-password') {
        setError('Password is too weak. Please use a stronger password.');
      } else {
        setError(err.message || 'Failed to create account. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGuestContinue = () => {
    window.location.hash = 'news';
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f9fafb', // var(--bg-color)
      padding: '20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'var(--font-body, system-ui, -apple-system, sans-serif)'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '480px'
      }}>
        {/* Logo */}
        <div style={{ 
          textAlign: 'center', 
          marginBottom: '32px' 
        }}>
          <h1 style={{
            fontFamily: 'var(--font-heading, "Playfair Display", Georgia, serif)',
            fontSize: 'clamp(1.75rem, 4vw, 2.25rem)',
            fontWeight: 900,
            color: '#000033', // var(--primary-color)
            margin: 0,
            letterSpacing: '-0.02em',
            cursor: 'pointer',
            transition: 'opacity 0.2s'
          }}
          onClick={() => window.location.hash = 'news'}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            Morning Pulse
          </h1>
          <p style={{
            margin: '6px 0 0 0',
            fontSize: '14px',
            color: '#666666', // var(--light-text)
            fontWeight: 400
          }}>
            Your trusted source for news and insights
          </p>
        </div>

        {/* Main Auth Card */}
        <div style={{
          backgroundColor: '#ffffff', // var(--card-bg)
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          padding: '32px',
          marginBottom: '16px'
        }}>
          {/* Mode Toggle */}
          <div style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '24px',
            borderBottom: '2px solid #e0e0e0', // var(--border-color)
            paddingBottom: '12px'
          }}>
            <button
              onClick={() => {
                setMode('signin');
                setError(null);
                setPassword('');
                setName('');
              }}
              style={{
                flex: 1,
                padding: '10px',
                fontSize: '15px',
                fontWeight: mode === 'signin' ? 600 : 500,
                color: mode === 'signin' ? '#000033' : '#666666',
                backgroundColor: 'transparent',
                border: 'none',
                borderBottom: mode === 'signin' ? '3px solid #000033' : '3px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.2s',
                marginBottom: '-12px',
                paddingBottom: '15px'
              }}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setMode('signup');
                setError(null);
                setPassword('');
                setName('');
              }}
              style={{
                flex: 1,
                padding: '10px',
                fontSize: '15px',
                fontWeight: mode === 'signup' ? 600 : 500,
                color: mode === 'signup' ? '#000033' : '#666666',
                backgroundColor: 'transparent',
                border: 'none',
                borderBottom: mode === 'signup' ? '3px solid #000033' : '3px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.2s',
                marginBottom: '-12px',
                paddingBottom: '15px'
              }}
            >
              Create Account
            </button>
          </div>

          {/* Sign In Form */}
          {mode === 'signin' && (
            <form onSubmit={handleSignIn}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: '#1a1a1a' // var(--text-color)
                }}>
                  Email address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    fontSize: '15px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    boxSizing: 'border-box',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    fontFamily: 'inherit'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#000033'}
                  onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: '#1a1a1a'
                }}>
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    fontSize: '15px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    boxSizing: 'border-box',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    fontFamily: 'inherit'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#000033'}
                  onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                />
              </div>

              {error && (
                <div style={{
                  marginBottom: '16px',
                  padding: '10px 14px',
                  backgroundColor: '#fee',
                  color: '#c33',
                  borderRadius: '8px',
                  fontSize: '13px',
                  border: '1px solid #fcc'
                }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '15px',
                  fontWeight: 600,
                  color: 'white',
                  backgroundColor: loading ? '#9ca3af' : '#000033',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'background-color 0.2s',
                  marginBottom: '12px'
                }}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          )}

          {/* Sign Up Form */}
          {mode === 'signup' && (
            <form onSubmit={handleSignUp}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: '#1a1a1a'
                }}>
                  Full name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  required
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    fontSize: '15px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    boxSizing: 'border-box',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    fontFamily: 'inherit'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#000033'}
                  onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: '#1a1a1a'
                }}>
                  Email address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    fontSize: '15px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    boxSizing: 'border-box',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    fontFamily: 'inherit'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#000033'}
                  onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: '#1a1a1a'
                }}>
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  required
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    fontSize: '15px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    boxSizing: 'border-box',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    fontFamily: 'inherit'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#000033'}
                  onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                />
              </div>

              {error && (
                <div style={{
                  marginBottom: '16px',
                  padding: '10px 14px',
                  backgroundColor: '#fee',
                  color: '#c33',
                  borderRadius: '8px',
                  fontSize: '13px',
                  border: '1px solid #fcc'
                }}>
                  {error}
                </div>
              )}

              {successMessage && (
                <div style={{
                  marginBottom: '16px',
                  padding: '10px 14px',
                  backgroundColor: '#d1f2eb',
                  color: '#059669',
                  borderRadius: '8px',
                  fontSize: '13px',
                  border: '1px solid #10b981'
                }}>
                  {successMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '15px',
                  fontWeight: 600,
                  color: 'white',
                  backgroundColor: loading ? '#9ca3af' : '#000033',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'background-color 0.2s',
                  marginBottom: '12px'
                }}
              >
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>
          )}

          {/* Divider */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginTop: '20px',
            marginBottom: '20px'
          }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#e0e0e0' }} />
            <span style={{ padding: '0 12px', fontSize: '13px', color: '#666666' }}>or</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#e0e0e0' }} />
          </div>

          {/* Guest Continue */}
          <button
            onClick={handleGuestContinue}
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '15px',
              fontWeight: 500,
              color: '#000033',
              backgroundColor: 'transparent',
              border: '1px solid #000033',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f0f0f0';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            Continue as guest
          </button>
        </div>

        {/* Guest Writer Solicitation */}
        <div style={{
          marginTop: '16px',
          padding: '20px',
          backgroundColor: '#f3f4f6', // var(--section-bg)
          borderRadius: '12px',
          border: '1px solid #e0e0e0',
          textAlign: 'center'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            gap: '8px',
            marginBottom: '10px'
          }}>
            <PenTool size={20} color="#000033" />
            <h3 style={{ 
              margin: 0, 
              fontSize: '16px', 
              fontWeight: 600,
              color: '#1a1a1a'
            }}>
              Have an opinion? Do you want to write for us?
            </h3>
          </div>
          <p style={{ 
            margin: '0 0 12px 0', 
            fontSize: '13px', 
            color: '#666666',
            lineHeight: '1.5'
          }}>
            Submit a Guest Essay, Letter, or Editorial piece. No account required.
          </p>
          <button
            onClick={() => window.location.hash = 'opinion/submit'}
            style={{
              padding: '10px 24px',
              fontSize: '13px',
              fontWeight: 600,
              color: 'white',
              backgroundColor: '#000033',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'opacity 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            <PenTool size={14} />
            Submit Essay
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
