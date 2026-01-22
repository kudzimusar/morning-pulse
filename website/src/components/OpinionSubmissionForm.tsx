import React, { useState, useEffect, useMemo } from 'react';
import { OpinionSubmissionData } from '../../types';
import { submitOpinion, uploadOpinionImage, ensureAuthenticated } from '../services/opinionsService';
import { generateSlug } from '../utils/slugUtils';
import RichTextEditor from './RichTextEditor';

interface OpinionSubmissionFormProps {
  onBack?: () => void;
  onSuccess?: () => void;
}

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB

// The 5 categories for opinion submissions
const OPINION_CATEGORIES = [
  { value: 'the-board', label: 'The Board' },
  { value: 'guest-essays', label: 'Guest Essays' },
  { value: 'letters', label: 'Letters' },
  { value: 'culture', label: 'Culture' },
  { value: 'general', label: 'General' }
] as const;

const OpinionSubmissionForm: React.FC<OpinionSubmissionFormProps> = ({ onBack, onSuccess }) => {
  const [formData, setFormData] = useState<OpinionSubmissionData>({
    writerType: 'Guest Essay',
    authorName: '',
    authorTitle: '',
    headline: '',
    subHeadline: '',
    body: '',
    category: '', // Start empty - required field
    country: 'Global',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({
    type: null,
    message: '',
  });
  const [suggestedImage, setSuggestedImage] = useState<File | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [slug, setSlug] = useState<string>('');

  // Auto-generate slug from headline in real-time
  useEffect(() => {
    if (formData.headline.trim()) {
      const generatedSlug = generateSlug(formData.headline);
      setSlug(generatedSlug);
    } else {
      setSlug('');
    }
  }, [formData.headline]);

  // Sanitize form data before submission
  const sanitizeFormData = (data: OpinionSubmissionData): OpinionSubmissionData => {
    const sanitizedCategory = data.category.trim().toLowerCase() || 'general';
    const validCategory = OPINION_CATEGORIES.some(cat => cat.value === sanitizedCategory) 
      ? sanitizedCategory 
      : 'general';

    return {
      ...data,
      authorName: data.authorName.trim(),
      authorTitle: data.authorTitle?.trim() || '',
      headline: data.headline.trim(),
      subHeadline: data.subHeadline.trim(),
      body: data.body.trim(),
      category: validCategory,
      country: data.country?.trim() || 'Global',
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Enhanced Validation
    if (!formData.authorName.trim()) {
      setSubmitStatus({ type: 'error', message: 'Please enter your name' });
      return;
    }
    if (!formData.headline.trim()) {
      setSubmitStatus({ type: 'error', message: 'Please enter a headline' });
      return;
    }
    if (!formData.subHeadline.trim()) {
      setSubmitStatus({ type: 'error', message: 'Please enter a sub-headline' });
      return;
    }
    if (!formData.body.trim()) {
      setSubmitStatus({ type: 'error', message: 'Please enter the body of your essay' });
      return;
    }
    // NEW: Category is now required
    if (!formData.category || !formData.category.trim()) {
      setSubmitStatus({ type: 'error', message: 'Please select a category' });
      return;
    }
    // NEW: Validate slug is generated (headline must be valid)
    if (!slug || slug.length < 3) {
      setSubmitStatus({ type: 'error', message: 'Headline must be at least 3 characters to generate a valid URL slug' });
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus({ type: null, message: '' });

    try {
      // 🔐 Ensure authenticated before starting upload/submission
      await ensureAuthenticated();

      // Sanitize data before submission
      const sanitizedData = sanitizeFormData(formData);

      // Upload suggested image (optional) to Storage pending_uploads/
      let suggestedImageUrl: string | undefined;
      if (suggestedImage) {
        try {
          suggestedImageUrl = await uploadOpinionImage(suggestedImage, 'pending_uploads');
        } catch (uploadErr: any) {
          console.error('Image upload failed, continuing without image:', uploadErr);
          // Don't fail the whole submission if just the image fails
        }
      }

      // Submit with sanitized data
      await submitOpinion({
        ...sanitizedData,
        suggestedImageUrl,
      });
      setSubmitStatus({
        type: 'success',
        message: 'Your essay has been submitted for editorial review. We will notify you once it has been reviewed.',
      });
      
      // Reset form
      setFormData({
        writerType: 'Guest Essay',
        authorName: '',
        authorTitle: '',
        headline: '',
        subHeadline: '',
        body: '',
        category: '',
        country: 'Global',
      });
      setSuggestedImage(null);
      setImageError(null);
      setSlug('');

      // Call success callback after a delay
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 3000);
      }
    } catch (error: any) {
      console.error('Submission error:', error);
      setSubmitStatus({
        type: 'error',
        message: error.message || 'Failed to submit your essay. Please try again.',
      });
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
        maxWidth: '768px',
        margin: '0 auto',
        backgroundColor: 'white',
        padding: '64px 48px',
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
          fontSize: '2.5rem',
          fontWeight: 'bold',
          fontFamily: 'Georgia, serif',
          marginBottom: '16px',
          color: '#000'
        }}>
          Submit a Guest Essay
        </h1>
        
        <p style={{
          fontSize: '1.125rem',
          color: '#4b5563',
          fontFamily: 'Georgia, serif',
          marginBottom: '48px',
          lineHeight: '1.6'
        }}>
          Share your perspective with Morning Pulse readers. All submissions are reviewed by our editorial team before publication.
        </p>

        <div className="content-section">
          <form onSubmit={handleSubmit} className="opinion-submit-form">
            <div className="form-group">
              <label htmlFor="authorName" className="form-label">
                Your Full Name <span className="required">*</span>
              </label>
              <input
                type="text"
                id="authorName"
                className="form-input"
                value={formData.authorName}
                onChange={(e) => setFormData({ ...formData, authorName: e.target.value })}
                placeholder="e.g., John Smith"
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="form-group">
              <label htmlFor="authorTitle" className="form-label">
                Your Title/Position (Optional)
              </label>
              <input
                type="text"
                id="authorTitle"
                className="form-input"
                value={formData.authorTitle}
                onChange={(e) => setFormData({ ...formData, authorTitle: e.target.value })}
                placeholder="e.g., Economist at University of Tokyo"
                disabled={isSubmitting}
              />
            </div>

            <div className="form-group">
              <label htmlFor="suggestedImage" className="form-label">
                Suggested Image (Optional)
              </label>
              <div style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: '10px' }}>
                Recommended size: 2000px × 1125px (16:9 ratio). Max file size: 5MB.
              </div>
              <input
                type="file"
                id="suggestedImage"
                accept="image/*"
                disabled={isSubmitting}
                onChange={(e) => {
                  setImageError(null);
                  const f = e.target.files?.[0] || null;
                  if (!f) {
                    setSuggestedImage(null);
                    return;
                  }
                  if (f.size > MAX_IMAGE_BYTES) {
                    setSuggestedImage(null);
                    setImageError('Image too large. Max file size is 5MB.');
                    return;
                  }
                  setSuggestedImage(f);
                }}
              />
              {imageError && (
                <div style={{ marginTop: '8px', color: '#dc2626', fontSize: '0.9rem' }}>
                  {imageError}
                </div>
              )}
            </div>

            <div className="form-group">
              <label 
                htmlFor="headline" 
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: '#6b7280',
                  display: 'block',
                  marginBottom: '0.5rem'
                }}
              >
                Guest Essay Headline <span className="required">*</span>
              </label>
              <input
                type="text"
                id="headline"
                value={formData.headline}
                onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                placeholder="Enter your essay headline..."
                required
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  border: 'none',
                  borderBottom: '2px solid #e5e7eb',
                  padding: '16px 0',
                  fontSize: '2rem',
                  fontWeight: 'bold',
                  fontFamily: 'Georgia, serif',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  backgroundColor: 'transparent',
                  ...(isSubmitting ? { opacity: 0.6, cursor: 'not-allowed' } : {})
                }}
                onFocus={(e) => e.target.style.borderBottomColor = '#000000'}
                onBlur={(e) => e.target.style.borderBottomColor = '#e5e7eb'}
              />
              {/* Auto-generated slug preview */}
              {slug && (
                <div style={{
                  marginTop: '8px',
                  fontSize: '0.75rem',
                  color: '#6b7280',
                  fontFamily: 'monospace',
                  padding: '4px 8px',
                  backgroundColor: '#f3f4f6',
                  borderRadius: '4px',
                  display: 'inline-block'
                }}>
                  URL Slug: <strong>{slug}</strong>
                </div>
              )}
            </div>

            <div className="form-group">
              <label 
                htmlFor="subHeadline"
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: '#6b7280',
                  display: 'block',
                  marginBottom: '0.5rem'
                }}
              >
                Sub-headline / Summary <span className="required">*</span>
              </label>
              <textarea
                id="subHeadline"
                value={formData.subHeadline}
                onChange={(e) => setFormData({ ...formData, subHeadline: e.target.value })}
                placeholder="A brief summary or sub-headline for your essay"
                required
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  border: '2px solid #e5e7eb',
                  borderRadius: '4px',
                  padding: '12px',
                  fontSize: '1.25rem',
                  fontFamily: 'Georgia, serif',
                  outline: 'none',
                  resize: 'vertical',
                  minHeight: '100px',
                  transition: 'border-color 0.2s',
                  ...(isSubmitting ? { opacity: 0.6, cursor: 'not-allowed' } : {})
                }}
                onFocus={(e) => e.target.style.borderColor = '#000000'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              />
            </div>

            <div className="form-group">
              <label htmlFor="body" className="form-label">
                The Narrative (Body) <span className="required">*</span>
              </label>
              <RichTextEditor
                value={formData.body}
                onChange={(html) => setFormData({ ...formData, body: html })}
                placeholder="Write your full essay here (up to 1,500 words). Paste from Word or Google Docs to preserve formatting. Use the toolbar above to format text."
                disabled={isSubmitting}
                className="form-textarea-large"
              />
            </div>

            {/* Enhanced Category Picker */}
            <div className="form-group">
              <label htmlFor="category" className="form-label">
                Category <span className="required">*</span>
              </label>
              <select
                id="category"
                className="form-select"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '4px',
                  fontSize: '1rem',
                  fontFamily: 'system-ui, sans-serif',
                  backgroundColor: 'white',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  transition: 'border-color 0.2s',
                  ...(isSubmitting ? { opacity: 0.6 } : {}),
                  ...(!formData.category ? { borderColor: '#dc2626' } : {})
                }}
                onFocus={(e) => {
                  if (!isSubmitting) e.target.style.borderColor = '#000000';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = formData.category ? '#e5e7eb' : '#dc2626';
                }}
              >
                <option value="">-- Select a category --</option>
                {OPINION_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
              {!formData.category && (
                <div style={{ marginTop: '4px', fontSize: '0.875rem', color: '#dc2626' }}>
                  Category is required
                </div>
              )}
            </div>

            {submitStatus.type && (
              <div
                className={`submit-status ${submitStatus.type === 'success' ? 'submit-status-success' : 'submit-status-error'}`}
              >
                {submitStatus.message}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !formData.headline.trim() || !formData.category}
              style={{
                width: '100%',
                backgroundColor: '#000000',
                color: 'white',
                padding: '20px 40px',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                border: 'none',
                marginTop: '2rem',
                cursor: (isSubmitting || !formData.headline.trim() || !formData.category) ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s',
                ...((isSubmitting || !formData.headline.trim() || !formData.category) ? { opacity: 0.6 } : {})
              }}
              onMouseEnter={(e) => {
                if (!isSubmitting && formData.headline.trim() && formData.category) {
                  e.currentTarget.style.backgroundColor = '#1f2937';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSubmitting) {
                  e.currentTarget.style.backgroundColor = '#000000';
                }
              }}
            >
              {isSubmitting ? 'Verifying Authentication & Sending...' : 'Submit for Editorial Review'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default OpinionSubmissionForm;
