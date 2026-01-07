import React, { useState } from 'react';
import { registerSubscriber, processPayment, activateSubscription } from '../services/subscriptionService';

interface SubscriberRegistrationProps {
  onSuccess?: () => void;
  onBack?: () => void;
}

const SubscriberRegistration: React.FC<SubscriberRegistrationProps> = ({ onSuccess, onBack }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    whatsapp: '',
    tier: 'micro-pulse' as 'micro-pulse' | 'premium',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);

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
    if (!formData.whatsapp.trim()) {
      setError('Please enter your WhatsApp number');
      return;
    }

    setIsSubmitting(true);
    setProcessingPayment(true);

    try {
      // 1. Register subscriber
      const uid = await registerSubscriber(
        formData.email.trim(),
        formData.password,
        formData.whatsapp.trim(),
        formData.tier
      );

      // 2. Process payment
      const tierPrices: { [key: string]: number } = {
        'micro-pulse': 0.50,
        'premium': 5.00,
      };
      const amount = tierPrices[formData.tier];

      const paymentResult = await processPayment(amount, 'USD', 'mock_payment_method');
      
      if (!paymentResult.success || !paymentResult.paymentId) {
        throw new Error(paymentResult.error || 'Payment processing failed');
      }

      // 3. Activate subscription
      await activateSubscription(uid, paymentResult.paymentId);

      setSuccess(true);
      setFormData({
        email: '',
        password: '',
        confirmPassword: '',
        whatsapp: '',
        tier: 'micro-pulse',
      });

      // Redirect after 3 seconds
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        } else {
          window.location.hash = 'subscriber/dashboard';
        }
      }, 3000);
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'Failed to register. Please try again.');
    } finally {
      setIsSubmitting(false);
      setProcessingPayment(false);
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
            Subscription Activated!
          </h2>
          <p style={{
            fontSize: '1rem',
            color: '#4b5563',
            marginBottom: '24px',
            lineHeight: '1.6'
          }}>
            Welcome to Morning Pulse Premium! Your subscription is now active.
            You'll receive daily WhatsApp digests and have access to all premium features.
          </p>
          <p style={{
            fontSize: '0.875rem',
            color: '#6b7280',
            marginBottom: '24px'
          }}>
            Redirecting to your dashboard...
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
          Subscribe to Morning Pulse
        </h1>
        <p style={{
          fontSize: '1rem',
          color: '#6b7280',
          marginBottom: '32px'
        }}>
          Get ad-free access, full archive, and daily WhatsApp digest.
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
            <label htmlFor="tier" style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '8px'
            }}>
              Subscription Plan <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <select
              id="tier"
              value={formData.tier}
              onChange={(e) => setFormData({ ...formData, tier: e.target.value as 'micro-pulse' | 'premium' })}
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '1rem',
                outline: 'none',
                boxSizing: 'border-box',
                backgroundColor: 'white'
              }}
            >
              <option value="micro-pulse">Micro-Pulse Plan - $0.50/month</option>
              <option value="premium">Premium Plan - $5.00/month</option>
            </select>
          </div>

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
            <label htmlFor="whatsapp" style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '8px'
            }}>
              WhatsApp Number <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="tel"
              id="whatsapp"
              value={formData.whatsapp}
              onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
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
              placeholder="+263 XXX XXX XXX"
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

          <div style={{ marginBottom: '24px' }}>
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

          <div style={{
            backgroundColor: '#f9fafb',
            padding: '16px',
            borderRadius: '6px',
            marginBottom: '24px',
            fontSize: '0.875rem',
            color: '#6b7280'
          }}>
            <p style={{ margin: '0 0 8px 0', fontWeight: '500', color: '#374151' }}>
              What you get:
            </p>
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              <li>Ad-free browsing experience</li>
              <li>Access to full News Archive</li>
              <li>Daily WhatsApp Morning Digest</li>
              <li>Priority support</li>
            </ul>
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
            {processingPayment ? 'Processing Payment...' : isSubmitting ? 'Subscribing...' : `Subscribe - $${formData.tier === 'micro-pulse' ? '0.50' : '5.00'}/month`}
          </button>

          <p style={{
            fontSize: '0.875rem',
            color: '#6b7280',
            marginTop: '16px',
            textAlign: 'center'
          }}>
            Already have an account?{' '}
            <a 
              href="#subscriber/login" 
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

export default SubscriberRegistration;
