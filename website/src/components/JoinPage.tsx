/**
 * Join Page - Staff Invitation Acceptance
 * Allows invited users to sign up with password and join the team
 */

import React, { useEffect, useState } from 'react';
import { validateInviteToken, createStaffFromInvite } from '../services/inviteService';
import { StaffInvite } from '../../types';

const JoinPage: React.FC = () => {
  const [token, setToken] = useState<string | null>(null);
  const [invite, setInvite] = useState<StaffInvite | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Parse token from URL hash: #join?token=XYZ
    const parseToken = () => {
      const hash = window.location.hash;
      console.log('🔍 [JOIN] Parsing hash:', hash);
      
      // Handle both #join?token=XYZ and join?token=XYZ formats
      const hashWithoutHash = hash.replace('#', '');
      const params = new URLSearchParams(hashWithoutHash.split('?')[1] || '');
      const tokenParam = params.get('token');
      
      console.log('🔍 [JOIN] Extracted token:', tokenParam ? 'Found' : 'Not found');
      
      if (!tokenParam) {
        console.error('❌ [JOIN] No token found in URL hash');
        setError('No invitation token found in URL. Please check the invitation link.');
        setLoading(false);
        return;
      }
      
      setToken(tokenParam);
      console.log('✅ [JOIN] Token set:', tokenParam.substring(0, 8) + '...');
    };

    parseToken();
  }, []);

  useEffect(() => {
    if (!token) return;

    // Validate the token
    const validateToken = async () => {
      try {
        setLoading(true);
        console.log('🔍 [JOIN] Validating token:', token.substring(0, 8) + '...');
        const inviteData = await validateInviteToken(token);
        
        if (!inviteData) {
          console.error('❌ [JOIN] Token validation failed - invalid, expired, or used');
          setError('This invitation is invalid, expired, or has already been used.');
          setInvite(null);
        } else {
          console.log('✅ [JOIN] Token validated successfully for:', inviteData.email);
          setInvite(inviteData);
          setError(null);
        }
      } catch (err: any) {
        console.error('❌ [JOIN] Error validating token:', err);
        setError(`Failed to validate invitation: ${err.message || 'Please try again.'}`);
      } finally {
        setLoading(false);
      }
    };

    validateToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token || !invite) {
      setError('Invalid invitation');
      return;
    }

    // Validation
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Create staff account from invite
      await createStaffFromInvite(token, password);
      
      setSuccess(true);
      
      // Redirect to admin dashboard after 2 seconds
      setTimeout(() => {
        window.location.hash = '#admin';
      }, 2000);

    } catch (err: any) {
      console.error('Error creating account:', err);
      setError(err.message || 'Failed to create account. Please try again.');
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
        fontFamily: 'system-ui, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '4px solid #e5e7eb',
            borderTopColor: '#000',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <p style={{ color: '#666', fontSize: '14px' }}>Validating invitation...</p>
        </div>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
        fontFamily: 'system-ui, sans-serif'
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '40px',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          width: '100%',
          maxWidth: '400px',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '48px',
            marginBottom: '16px'
          }}>
            🎉
          </div>
          <h2 style={{
            marginTop: 0,
            marginBottom: '16px',
            fontSize: '24px',
            fontWeight: '600',
            color: '#10b981'
          }}>
            Welcome to the Team!
          </h2>
          <p style={{
            color: '#666',
            fontSize: '14px',
            marginBottom: '24px'
          }}>
            Your account has been created successfully.
            <br />
            Redirecting to dashboard...
          </p>
          <div style={{
            width: '32px',
            height: '32px',
            border: '3px solid #e5e7eb',
            borderTopColor: '#10b981',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto'
          }} />
        </div>
      </div>
    );
  }

  // Error state (invalid/expired token)
  if (error && !invite) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
        fontFamily: 'system-ui, sans-serif'
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '40px',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          width: '100%',
          maxWidth: '400px',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '48px',
            marginBottom: '16px'
          }}>
            ⚠️
          </div>
          <h2 style={{
            marginTop: 0,
            marginBottom: '16px',
            fontSize: '24px',
            fontWeight: '600',
            color: '#dc2626'
          }}>
            Invalid Invitation
          </h2>
          <p style={{
            color: '#666',
            fontSize: '14px',
            marginBottom: '24px'
          }}>
            {error}
          </p>
          <p style={{
            color: '#999',
            fontSize: '12px'
          }}>
            Please contact your administrator for a new invitation link.
          </p>
        </div>
      </div>
    );
  }

  // Main form (valid invite)
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
      fontFamily: 'system-ui, sans-serif',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        width: '100%',
        maxWidth: '400px'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            fontSize: '48px',
            marginBottom: '16px'
          }}>
            🌅
          </div>
          <h1 style={{
            marginTop: 0,
            marginBottom: '8px',
            fontSize: '28px',
            fontWeight: '700'
          }}>
            Welcome to Morning Pulse
          </h1>
          <p style={{
            color: '#666',
            fontSize: '14px',
            margin: 0
          }}>
            Join the editorial team
          </p>
        </div>

        {/* Invitation Details */}
        {invite && (
          <div style={{
            backgroundColor: '#f0fdf4',
            border: '1px solid #10b981',
            borderRadius: '6px',
            padding: '16px',
            marginBottom: '24px'
          }}>
            <p style={{
              margin: '0 0 8px 0',
              fontSize: '14px',
              color: '#065f46',
              fontWeight: '600'
            }}>
              You've been invited as:
            </p>
            <p style={{
              margin: '0 0 4px 0',
              fontSize: '16px',
              fontWeight: '600',
              color: '#000'
            }}>
              {invite.name}
            </p>
            <p style={{
              margin: '0 0 8px 0',
              fontSize: '14px',
              color: '#666'
            }}>
              {invite.email}
            </p>
            <div style={{
              display: 'flex',
              gap: '6px',
              flexWrap: 'wrap'
            }}>
              {invite.roles.map(role => (
                <span
                  key={role}
                  style={{
                    padding: '4px 8px',
                    backgroundColor: '#10b981',
                    color: '#fff',
                    borderRadius: '4px',
                    fontSize: '12px',
                    textTransform: 'capitalize',
                    fontWeight: '500'
                  }}
                >
                  {role}
                </span>
              ))}
            </div>
            <p style={{
              margin: '12px 0 0 0',
              fontSize: '11px',
              color: '#6b7280'
            }}>
              Invited by {invite.invitedByName}
            </p>
          </div>
        )}

        {/* Sign Up Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              Create Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isSubmitting}
              placeholder="Minimum 6 characters"
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '14px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={isSubmitting}
              placeholder="Re-enter password"
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '14px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {error && (
            <div style={{
              marginBottom: '16px',
              padding: '12px',
              backgroundColor: '#fee',
              color: '#c33',
              borderRadius: '4px',
              fontSize: '14px',
              border: '1px solid #fcc'
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '16px',
              fontWeight: '600',
              color: 'white',
              backgroundColor: isSubmitting ? '#9ca3af' : '#000',
              border: 'none',
              borderRadius: '4px',
              cursor: isSubmitting ? 'not-allowed' : 'pointer'
            }}
          >
            {isSubmitting ? 'Creating Account...' : 'Join the Team'}
          </button>
        </form>

        {/* Footer */}
        <p style={{
          marginTop: '24px',
          textAlign: 'center',
          fontSize: '12px',
          color: '#999'
        }}>
          By joining, you agree to our editorial guidelines and policies.
        </p>
      </div>
    </div>
  );
};

export default JoinPage;
