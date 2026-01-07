import React, { useState } from 'react';
import { registerWriter } from '../services/writerService';
import { useNavigate } from 'react-router-dom';

interface WriterRegistrationProps {
  onSuccess?: () => void;
  onBack?: () => void;
}

const WriterRegistration: React.FC<WriterRegistrationProps> = ({ onSuccess, onBack }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    bio: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.email.trim()) {
      setError('Please enter your email address');
      return;
    }
    if (!formData.password || formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (!formData.name.trim()) {
      setError('Please enter your full name');
      return;
    }

    setIsSubmitting(true);

    try {
      await registerWriter(
        formData.email.trim(),
        formData.password,
        formData.name.trim(),
        formData.bio.trim() || undefined
      );

      setSuccess(true);
      setFormData({
        email: '',
        password: '',
        confirmPassword: '',
        name: '',
        bio: '',
      });

      // Show success message for 3 seconds, then redirect
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        }
      }, 3000);
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'Failed to register. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#fafafa',
        padding: '48px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          maxWidth: '500px',
          backgroundColor: 'white',
          padding: '48px',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            marginBottom: '16px',
            color: '#000'
          }}>
            Registration Successful!
          </h2>
          <p style={{
            fontSize: '1rem',
            color: '#4b5563',
            marginBottom: '24px',
            lineHeight: '1.6'
          }}>
            Your writer account has been created and is pending approval by our editorial team.
            You will receive an email notification once your account is approved.
          </p>
          <p style={{
            fontSize: '0.875rem',
            color: '#6b7280',
            marginBottom: '24px'
          }}>
            Redirecting to login...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#fafafa',
      padding: '48px 24px'
    }}>
      <div style={{
        maxWidth: '600px',
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
          Become a Writer
        </h1>
        <p style={{
          fontSize: '1rem',
          color: '#6b7280',
          marginBottom: '32px'
        }}>
          Join Morning Pulse as a contributor. Your account will be reviewed by our editorial team.
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
              Email Address <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              disabled={isSubmitting}
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

          <div style={{ marginBottom: '20px' }}>
            <label htmlFor="password" style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '8px'
            }}>
              Password <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="password"
              id="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              disabled={isSubmitting}
              minLength={6}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '1rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              placeholder="At least 6 characters"
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label htmlFor="confirmPassword" style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '8px'
            }}>
              Confirm Password <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              required
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '1rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              placeholder="Re-enter your password"
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label htmlFor="name" style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '8px'
            }}>
              Full Name <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '1rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              placeholder="John Smith"
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label htmlFor="bio" style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '8px'
            }}>
              Bio (Optional)
            </label>
            <textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              disabled={isSubmitting}
              rows={4}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '1rem',
                outline: 'none',
                boxSizing: 'border-box',
                resize: 'vertical',
                fontFamily: 'inherit'
              }}
              placeholder="Tell us about yourself, your expertise, and why you want to write for Morning Pulse..."
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
              transition: 'background-color 0.2s'
            }}
          >
            {isSubmitting ? 'Registering...' : 'Register as Writer'}
          </button>

          <p style={{
            fontSize: '0.875rem',
            color: '#6b7280',
            marginTop: '16px',
            textAlign: 'center'
          }}>
            Already have an account?{' '}
            <a 
              href="#writer/login" 
              style={{ color: '#000', textDecoration: 'underline' }}
            >
              Log in
            </a>
          </p>
        </form>
      </div>
    </div>
  );
};

export default WriterRegistration;
