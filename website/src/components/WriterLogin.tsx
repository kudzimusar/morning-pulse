import React, { useState } from 'react';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getCurrentWriter } from '../services/writerService';

interface WriterLoginProps {
  onSuccess?: () => void;
  onBack?: () => void;
}

const WriterLogin: React.FC<WriterLoginProps> = ({ onSuccess, onBack }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError('Please enter your email and password');
      return;
    }

    setIsSubmitting(true);

    try {
      const auth = getAuth();
      await signInWithEmailAndPassword(auth, email.trim(), password);

      // Check if user is an approved writer
      const writer = await getCurrentWriter();
      
      if (!writer) {
        setError('Writer account not found. Please register first.');
        await auth.signOut();
        return;
      }

      if (writer.status === 'pending_approval') {
        setError('Your account is pending approval. You will receive an email once approved.');
        await auth.signOut();
        return;
      }

      if (writer.status === 'rejected') {
        setError(
          writer.rejectedReason 
            ? `Your account was rejected: ${writer.rejectedReason}` 
            : 'Your account has been rejected. Please contact support.'
        );
        await auth.signOut();
        return;
      }

      // Check if writer is suspended (Sprint 1 - Writer Governance)
      if (writer.suspension?.isSuspended) {
        // Check if suspension has expired
        if (writer.suspension.suspendedUntil) {
          const now = new Date();
          const suspendedUntil = new Date(writer.suspension.suspendedUntil);
          if (now <= suspendedUntil) {
            setError(
              `Your account has been suspended${writer.suspension.reason ? `: ${writer.suspension.reason}` : ''}. ` +
              `Suspension ends: ${suspendedUntil.toLocaleDateString()}`
            );
            await auth.signOut();
            return;
          }
          // If past expiration, allow login (suspension auto-clears)
        } else {
          // Indefinite suspension
          setError(
            `Your account has been suspended${writer.suspension.reason ? `: ${writer.suspension.reason}` : ''}. ` +
            'Please contact editorial support for more information.'
          );
          await auth.signOut();
          return;
        }
      }

      if (writer.status === 'approved') {
        // Success - redirect to writer dashboard
        if (onSuccess) {
          onSuccess();
        } else {
          window.location.hash = 'writer/dashboard';
        }
      }
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Invalid email or password');
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email address');
      } else {
        setError(err.message || 'Failed to log in. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#fafafa',
      padding: '48px 24px'
    }}>
      <div style={{
        maxWidth: '500px',
        margin: '0 auto',
        backgroundColor: 'white',
        padding: '48px',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        {onBack && (
          <button 
            onClick={onBack} 
            style={{
              background: 'none',
              border: 'none',
              color: '#6b7280',
              cursor: 'pointer',
              fontSize: '0.875rem',
              marginBottom: '24px',
              padding: '8px 0'
            }}
          >
            ← Back
          </button>
        )}

        <h1 style={{
          fontSize: '2rem',
          fontWeight: 'bold',
          marginBottom: '8px',
          color: '#000'
        }}>
          Writer Login
        </h1>
        <p style={{
          fontSize: '1rem',
          color: '#6b7280',
          marginBottom: '32px'
        }}>
          Sign in to your writer account to submit articles and track your submissions.
        </p>

        {error && (
          <div style={{
            backgroundColor: '#fee2e2',
            border: '1px solid #fecaca',
            color: '#991b1b',
            padding: '12px 16px',
            borderRadius: '6px',
            marginBottom: '24px',
            fontSize: '0.875rem'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label htmlFor="email" style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '8px'
            }}>
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isSubmitting}
              autoComplete="email"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '1rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              placeholder="your@email.com"
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label htmlFor="password" style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '8px'
            }}>
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isSubmitting}
              autoComplete="current-password"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '1rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              width: '100%',
              padding: '12px 24px',
              backgroundColor: isSubmitting ? '#9ca3af' : '#000',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '1rem',
              fontWeight: '500',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s',
              marginBottom: '16px'
            }}
          >
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </button>

          <p style={{
            fontSize: '0.875rem',
            color: '#6b7280',
            textAlign: 'center'
          }}>
            Don't have an account?{' '}
            <a 
              href="#writer/register" 
              style={{ color: '#000', textDecoration: 'underline' }}
            >
              Register as a writer
            </a>
          </p>
        </form>
      </div>
    </div>
  );
};

export default WriterLogin;
