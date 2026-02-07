/**
 * Auth Page - Unified Sign In / Sign Up for Regular Readers
 * Washington Post-style email-first authentication flow
 */

import React, { useState, useEffect } from 'react';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { PenTool } from 'lucide-react';
import { registerReader, signInReader, checkReaderExists, getCurrentReader } from '../services/readerService';
import { activateNewsletterTrial } from '../services/readerService';

interface AuthPageProps {
  onSuccess?: () => void;
  onBack?: () => void;
}

type AuthStep = 'email' | 'signin' | 'signup';

const AuthPage: React.FC<AuthPageProps> = ({ onSuccess, onBack }) => {
  const [step, setStep] = useState<AuthStep>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [checkingEmail, setCheckingEmail] = useState(false);

  // Check if account exists when email is entered
  const handleEmailNext = async () => {
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address');
      return;
    }

    setError(null);
    setCheckingEmail(true);

    try {
      // Check if reader account exists
      const exists = await checkReaderExists(email.trim());
      
      if (exists) {
        setStep('signin');
      } else {
        setStep('signup');
      }
    } catch (err: any) {
      console.error('Error checking email:', err);
      // Default to signup if check fails
      setStep('signup');
    } finally {
      setCheckingEmail(false);
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
      await signInReader(email.trim(), password);
      
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
      const uid = await registerReader(email.trim(), password, name.trim());
      
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
        setStep('signin');
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

  const handleBack = () => {
    if (step === 'signin' || step === 'signup') {
      setStep('email');
      setPassword('');
      setName('');
      setError(null);
    } else if (onBack) {
      onBack();
    } else {
      window.location.hash = 'news';
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#fafafa',
      padding: '24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '440px',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        padding: '40px'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{
            margin: '0 0 8px 0',
            fontSize: '24px',
            fontWeight: '700',
            color: '#212529'
          }}>
            Morning Pulse
          </h1>
          <h2 style={{
            margin: 0,
            fontSize: '20px',
            fontWeight: '600',
            color: '#495057'
          }}>
            Sign in or create account
          </h2>
        </div>

        {/* Email Step */}
        {step === 'email' && (
          <div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#212529'
              }}>
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleEmailNext()}
                placeholder="Enter your email"
                disabled={checkingEmail}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: '16px',
                  border: '1px solid #ced4da',
                  borderRadius: '6px',
                  boxSizing: 'border-box',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#2563eb'}
                onBlur={(e) => e.target.style.borderColor = '#ced4da'}
              />
            </div>

            {error && (
              <div style={{
                marginBottom: '16px',
                padding: '12px',
                backgroundColor: '#fee',
                color: '#c33',
                borderRadius: '6px',
                fontSize: '14px',
                border: '1px solid #fcc'
              }}>
                {error}
              </div>
            )}

            <button
              onClick={handleEmailNext}
              disabled={checkingEmail || !email.trim()}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '16px',
                fontWeight: '600',
                color: 'white',
                backgroundColor: checkingEmail || !email.trim() ? '#9ca3af' : '#2563eb',
                border: 'none',
                borderRadius: '6px',
                cursor: checkingEmail || !email.trim() ? 'not-allowed' : 'pointer',
                marginBottom: '24px'
              }}
            >
              {checkingEmail ? 'Checking...' : 'Next'}
            </button>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '24px'
            }}>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#e9ecef' }} />
              <span style={{ padding: '0 16px', fontSize: '14px', color: '#6c757d' }}>or</span>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#e9ecef' }} />
            </div>

            <button
              onClick={handleGuestContinue}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '16px',
                fontWeight: '500',
                color: '#2563eb',
                backgroundColor: 'transparent',
                border: '1px solid #2563eb',
                borderRadius: '6px',
                cursor: 'pointer',
                marginBottom: '32px'
              }}
            >
              Continue as guest
            </button>
          </div>
        )}

        {/* Sign In Step */}
        {step === 'signin' && (
          <form onSubmit={handleSignIn}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#212529'
              }}>
                Email address
              </label>
              <input
                type="email"
                value={email}
                disabled
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: '16px',
                  border: '1px solid #e9ecef',
                  borderRadius: '6px',
                  boxSizing: 'border-box',
                  backgroundColor: '#f8f9fa',
                  color: '#6c757d'
                }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#212529'
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
                  padding: '12px 16px',
                  fontSize: '16px',
                  border: '1px solid #ced4da',
                  borderRadius: '6px',
                  boxSizing: 'border-box',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#2563eb'}
                onBlur={(e) => e.target.style.borderColor = '#ced4da'}
              />
            </div>

            {error && (
              <div style={{
                marginBottom: '16px',
                padding: '12px',
                backgroundColor: '#fee',
                color: '#c33',
                borderRadius: '6px',
                fontSize: '14px',
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
                fontSize: '16px',
                fontWeight: '600',
                color: 'white',
                backgroundColor: loading ? '#9ca3af' : '#2563eb',
                border: 'none',
                borderRadius: '6px',
                cursor: loading ? 'not-allowed' : 'pointer',
                marginBottom: '16px'
              }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

            <button
              type="button"
              onClick={handleBack}
              style={{
                width: '100%',
                padding: '8px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#6c757d',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              ← Back
            </button>
          </form>
        )}

        {/* Sign Up Step */}
        {step === 'signup' && (
          <form onSubmit={handleSignUp}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#212529'
              }}>
                Email address
              </label>
              <input
                type="email"
                value={email}
                disabled
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: '16px',
                  border: '1px solid #e9ecef',
                  borderRadius: '6px',
                  boxSizing: 'border-box',
                  backgroundColor: '#f8f9fa',
                  color: '#6c757d'
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#212529'
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
                  padding: '12px 16px',
                  fontSize: '16px',
                  border: '1px solid #ced4da',
                  borderRadius: '6px',
                  boxSizing: 'border-box',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#2563eb'}
                onBlur={(e) => e.target.style.borderColor = '#ced4da'}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#212529'
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
                  padding: '12px 16px',
                  fontSize: '16px',
                  border: '1px solid #ced4da',
                  borderRadius: '6px',
                  boxSizing: 'border-box',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#2563eb'}
                onBlur={(e) => e.target.style.borderColor = '#ced4da'}
              />
            </div>

            {error && (
              <div style={{
                marginBottom: '16px',
                padding: '12px',
                backgroundColor: '#fee',
                color: '#c33',
                borderRadius: '6px',
                fontSize: '14px',
                border: '1px solid #fcc'
              }}>
                {error}
              </div>
            )}

            {successMessage && (
              <div style={{
                marginBottom: '16px',
                padding: '12px',
                backgroundColor: '#d1f2eb',
                color: '#059669',
                borderRadius: '6px',
                fontSize: '14px',
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
                fontSize: '16px',
                fontWeight: '600',
                color: 'white',
                backgroundColor: loading ? '#9ca3af' : '#2563eb',
                border: 'none',
                borderRadius: '6px',
                cursor: loading ? 'not-allowed' : 'pointer',
                marginBottom: '16px'
              }}
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>

            <button
              type="button"
              onClick={handleBack}
              style={{
                width: '100%',
                padding: '8px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#6c757d',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              ← Back
            </button>
          </form>
        )}

        {/* Guest Writer Solicitation */}
        <div style={{
          marginTop: '32px',
          padding: '20px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          border: '1px solid #e9ecef',
          textAlign: 'center'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            gap: '8px',
            marginBottom: '12px'
          }}>
            <PenTool size={20} color="#2563eb" />
            <h3 style={{ 
              margin: 0, 
              fontSize: '18px', 
              fontWeight: '600',
              color: '#212529'
            }}>
              Have an opinion? Do you want to write for us?
            </h3>
          </div>
          <p style={{ 
            margin: '0 0 16px 0', 
            fontSize: '14px', 
            color: '#6c757d' 
          }}>
            Submit a Guest Essay, Letter, or Editorial piece. No account required.
          </p>
          <button
            onClick={() => window.location.hash = 'opinion/submit'}
            style={{
              padding: '10px 24px',
              fontSize: '14px',
              fontWeight: '600',
              color: 'white',
              backgroundColor: '#2563eb',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <PenTool size={16} />
            Submit Essay
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
