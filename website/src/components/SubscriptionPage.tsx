/**
 * Newsletter Subscription Page
 * Allows readers to subscribe to email newsletters
 */

import React, { useState } from 'react';
import { subscribeToNewsletter } from '../services/newsletterService';

const SubscriptionPage: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    interests: {
      politics: false,
      business: false,
      tech: false,
      global: false,
      sports: false
    }
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      // Convert interests object to array
      const selectedInterests = Object.entries(formData.interests)
        .filter(([, selected]) => selected)
        .map(([interest]) => interest);

      const result = await subscribeToNewsletter(
        formData.email,
        formData.name,
        selectedInterests.length > 0 ? selectedInterests : undefined
      );

      if (result.success) {
        setSubmitted(true);
      } else {
        setError(result.message || 'Failed to subscribe');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to subscribe. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleInterestChange = (interest: string, checked: boolean) => {
    setFormData({
      ...formData,
      interests: {
        ...formData.interests,
        [interest]: checked
      }
    });
  };

  if (submitted) {
    return (
      <div style={{
        maxWidth: '600px',
        margin: '40px auto',
        padding: '40px',
        textAlign: 'center',
        backgroundColor: '#f0fdf4',
        border: '1px solid #86efac',
        borderRadius: '8px'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>✅</div>
        <h2 style={{ marginTop: 0, marginBottom: '16px', color: '#166534' }}>
          Successfully Subscribed!
        </h2>
        <p style={{
          margin: '0 0 20px 0',
          color: '#16a34a',
          fontSize: '16px',
          lineHeight: '1.6'
        }}>
          Thank you for subscribing to Morning Pulse. You'll receive our latest journalism
          delivered directly to your inbox.
        </p>
        <div style={{
          fontSize: '14px',
          color: '#15803d',
          backgroundColor: '#dcfce7',
          padding: '12px',
          borderRadius: '4px'
        }}>
          <strong>What to expect:</strong><br />
          • Weekly digest of our best articles<br />
          • Breaking news alerts<br />
          • Exclusive subscriber-only content<br />
          • No spam, unsubscribe anytime
        </div>
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: '600px',
      margin: '40px auto',
      padding: '20px',
      fontFamily: 'system-ui, sans-serif'
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{
          margin: '0 0 16px 0',
          fontSize: '32px',
          fontWeight: '900',
          letterSpacing: '0.05em'
        }}>
          MORNING PULSE
        </h1>
        <p style={{
          margin: 0,
          fontSize: '18px',
          color: '#666',
          fontStyle: 'italic'
        }}>
          Subscribe to our newsletter
        </p>
      </div>

      {/* Description */}
      <div style={{
        backgroundColor: '#f9fafb',
        border: '1px solid #e5e5e5',
        borderRadius: '8px',
        padding: '24px',
        marginBottom: '32px'
      }}>
        <h3 style={{ marginTop: 0, marginBottom: '12px', fontSize: '18px' }}>
          📧 Stay Informed with Morning Pulse
        </h3>
        <p style={{ margin: 0, color: '#666', lineHeight: '1.6' }}>
          Get our curated selection of the week's most important stories delivered to your inbox.
          From breaking news to in-depth analysis, we bring you journalism that matters.
        </p>
      </div>

      {/* Subscription Form */}
      <div style={{
        border: '1px solid #e5e5e5',
        borderRadius: '8px',
        padding: '32px',
        backgroundColor: '#fff'
      }}>
        <form onSubmit={handleSubmit}>
          {/* Email */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: '600'
            }}>
              Email Address *
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '16px',
                boxSizing: 'border-box'
              }}
              placeholder="your.email@example.com"
            />
          </div>

          {/* Name */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: '600'
            }}>
              Name (Optional)
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '16px',
                boxSizing: 'border-box'
              }}
              placeholder="Your name"
            />
          </div>

          {/* Interests */}
          <div style={{ marginBottom: '32px' }}>
            <label style={{
              display: 'block',
              marginBottom: '12px',
              fontSize: '14px',
              fontWeight: '600'
            }}>
              What interests you? (Optional)
            </label>
            <p style={{
              margin: '0 0 16px 0',
              fontSize: '13px',
              color: '#666'
            }}>
              Select topics you're interested in to receive more relevant content:
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {Object.entries(formData.interests).map(([interest, checked]) => (
                <label
                  key={interest}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'pointer',
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid #e5e5e5',
                    backgroundColor: checked ? '#f0f9ff' : '#fff'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => handleInterestChange(interest, e.target.checked)}
                    style={{
                      marginRight: '8px',
                      cursor: 'pointer'
                    }}
                  />
                  <span style={{
                    textTransform: 'capitalize',
                    fontSize: '14px'
                  }}>
                    {interest}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div style={{
              padding: '12px',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '4px',
              marginBottom: '20px',
              color: '#dc2626',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            style={{
              width: '100%',
              padding: '16px',
              backgroundColor: '#000',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: submitting ? 'not-allowed' : 'pointer',
              opacity: submitting ? 0.6 : 1
            }}
          >
            {submitting ? '📧 Subscribing...' : '📧 Subscribe to Newsletter'}
          </button>
        </form>

        {/* Privacy Notice */}
        <div style={{
          marginTop: '20px',
          padding: '16px',
          backgroundColor: '#f9fafb',
          borderRadius: '4px',
          fontSize: '12px',
          color: '#666',
          textAlign: 'center'
        }}>
          <p style={{ margin: 0 }}>
            We respect your privacy. Unsubscribe at any time.
            <br />
            Read our <a href="#privacy" style={{ color: '#3b82f6', textDecoration: 'none' }}>
              Privacy Policy
            </a>.
          </p>
        </div>
      </div>

      {/* Benefits */}
      <div style={{
        marginTop: '32px',
        backgroundColor: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        padding: '24px'
      }}>
        <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '16px' }}>
          ✨ Subscriber Benefits
        </h3>
        <ul style={{
          margin: 0,
          paddingLeft: '20px',
          color: '#475569',
          lineHeight: '1.6'
        }}>
          <li><strong>Weekly Digest:</strong> Curated selection of our best journalism</li>
          <li><strong>Breaking News:</strong> Instant alerts on major stories</li>
          <li><strong>Exclusive Content:</strong> Subscriber-only articles and insights</li>
          <li><strong>No Spam:</strong> Only the content that matters, when it matters</li>
          <li><strong>Personalized:</strong> Content tailored to your interests</li>
        </ul>
      </div>
    </div>
  );
};

export default SubscriptionPage;