import React, { useState } from 'react';
import { OpinionSubmissionData } from '../../../types';
import { submitOpinion } from '../services/opinionsService';
import RichTextEditor from './RichTextEditor';

interface OpinionSubmissionFormProps {
  onBack?: () => void;
  onSuccess?: () => void;
}

const OpinionSubmissionForm: React.FC<OpinionSubmissionFormProps> = ({ onBack, onSuccess }) => {
  const [formData, setFormData] = useState<OpinionSubmissionData>({
    writerType: 'Guest Essay',
    authorName: '',
    authorTitle: '',
    headline: '',
    subHeadline: '',
    body: '',
    category: 'General',
    country: 'Global',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({
    type: null,
    message: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
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

    setIsSubmitting(true);
    setSubmitStatus({ type: null, message: '' });

    try {
      await submitOpinion(formData);
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
        category: 'General',
        country: 'Global',
      });

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
    <div className="institutional-page">
      <div className="page-header">
        {onBack && (
          <button onClick={onBack} className="back-button">
            ← Back
          </button>
        )}
        <h1 className="page-title">Submit a Guest Essay</h1>
      </div>

      <div className="page-content">
        <div className="content-section">
          <p className="lead-text">
            Share your perspective with Morning Pulse readers. All submissions are reviewed by our editorial team before publication.
          </p>

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
                placeholder="e.g., Here's What MAGA Gets Wrong About..."
                required
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  borderBottom: '2px solid #e5e7eb',
                  borderTop: 'none',
                  borderLeft: 'none',
                  borderRight: 'none',
                  padding: '12px 0',
                  fontSize: '1.25rem',
                  fontFamily: 'Georgia, serif',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  ...(isSubmitting ? { opacity: 0.6, cursor: 'not-allowed' } : {})
                }}
                onFocus={(e) => e.target.style.borderBottomColor = '#000000'}
                onBlur={(e) => e.target.style.borderBottomColor = '#e5e7eb'}
              />
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

            <div className="form-group">
              <label htmlFor="category" className="form-label">
                Category (Optional)
              </label>
              <select
                id="category"
                className="form-select"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                disabled={isSubmitting}
              >
                <option value="General">General</option>
                <option value="Politics">Politics</option>
                <option value="Tech">Tech</option>
                <option value="Society">Society</option>
                <option value="Business">Business</option>
                <option value="Culture">Culture</option>
              </select>
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
              disabled={isSubmitting}
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
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s',
                ...(isSubmitting ? { opacity: 0.6 } : {})
              }}
              onMouseEnter={(e) => {
                if (!isSubmitting) e.currentTarget.style.backgroundColor = '#1f2937';
              }}
              onMouseLeave={(e) => {
                if (!isSubmitting) e.currentTarget.style.backgroundColor = '#000000';
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
