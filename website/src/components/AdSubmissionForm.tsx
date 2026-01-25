import React, { useState } from 'react';
import { submitAd, uploadAdCreative, getCurrentAdvertiser } from '../services/advertiserService';

interface AdSubmissionFormProps {
  onSuccess?: () => void;
  onBack?: () => void;
}

const AdSubmissionForm: React.FC<AdSubmissionFormProps> = ({ onSuccess, onBack }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    destinationUrl: '',
    placement: 'sidebar' as 'header' | 'sidebar' | 'inline',
    startDate: '',
    endDate: '',
  });
  const [creativeFile, setCreativeFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.title.trim()) {
      setError('Please enter an ad title');
      return;
    }
    if (!formData.destinationUrl.trim()) {
      setError('Please enter a destination URL');
      return;
    }
    if (!creativeFile) {
      setError('Please upload an ad creative');
      return;
    }
    if (!formData.startDate || !formData.endDate) {
      setError('Please select start and end dates');
      return;
    }
    if (new Date(formData.startDate) >= new Date(formData.endDate)) {
      setError('End date must be after start date');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Get current advertiser
      const advertiser = await getCurrentAdvertiser();
      if (!advertiser || advertiser.status !== 'approved') {
        throw new Error('You must be an approved advertiser to submit ads');
      }

      // 2. Upload creative
      const creativeUrl = await uploadAdCreative(creativeFile, advertiser.uid);

      // 3. Submit ad
      await submitAd(advertiser.uid, {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        destinationUrl: formData.destinationUrl.trim(),
        creativeUrl,
        placement: formData.placement,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
      });

      setSuccess(true);
      setFormData({
        title: '',
        description: '',
        destinationUrl: '',
        placement: 'sidebar',
        startDate: '',
        endDate: '',
      });
      setCreativeFile(null);

      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        } else {
          window.location.hash = 'advertiser/dashboard';
        }
      }, 3000);
    } catch (err: any) {
      console.error('Submission error:', err);
      setError(err.message || 'Failed to submit ad. Please try again.');
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
            Ad Submitted!
          </h2>
          <p style={{
            fontSize: '1rem',
            color: '#4b5563',
            marginBottom: '24px',
            lineHeight: '1.6'
          }}>
            Your ad has been submitted for review. You will be notified once it's approved.
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
        maxWidth: '700px',
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
          Submit New Ad
        </h1>
        <p style={{
          fontSize: '1rem',
          color: '#6b7280',
          marginBottom: '32px'
        }}>
          Upload your ad creative and set campaign dates.
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
            <label htmlFor="title" style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '8px'
            }}>
              Ad Title <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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
              placeholder="e.g., Summer Sale 2024"
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label htmlFor="description" style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '8px'
            }}>
              Description (Optional)
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
              placeholder="Brief description of your ad campaign..."
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label htmlFor="destinationUrl" style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '8px'
            }}>
              Destination URL (Where users go when they click) <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="url"
              id="destinationUrl"
              value={formData.destinationUrl}
              onChange={(e) => setFormData({ ...formData, destinationUrl: e.target.value })}
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
              placeholder="https://counthwithdad.com"
            />
            <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '4px' }}>
              The website URL users will visit when they click your ad
            </p>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label htmlFor="placement" style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '8px'
            }}>
              Placement <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <select
              id="placement"
              value={formData.placement}
              onChange={(e) => setFormData({ ...formData, placement: e.target.value as 'header' | 'sidebar' | 'inline' })}
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
              <option value="sidebar">Sidebar</option>
              <option value="header">Header Banner</option>
              <option value="inline">Inline Content</option>
            </select>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label htmlFor="creative" style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '8px'
            }}>
              Ad Creative (Image) <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="file"
              id="creative"
              accept="image/*"
              onChange={(e) => setCreativeFile(e.target.files?.[0] || null)}
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
            />
            <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '4px' }}>
              Recommended: 2000px width, max 5MB
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
            <div>
              <label htmlFor="startDate" style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '8px'
              }}>
                Start Date <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="date"
                id="startDate"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
                disabled={isSubmitting}
                min={new Date().toISOString().split('T')[0]}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <div>
              <label htmlFor="endDate" style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '8px'
              }}>
                End Date <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="date"
                id="endDate"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                required
                disabled={isSubmitting}
                min={formData.startDate || new Date().toISOString().split('T')[0]}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
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
            {isSubmitting ? 'Submitting...' : 'Submit Ad for Review'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdSubmissionForm;
