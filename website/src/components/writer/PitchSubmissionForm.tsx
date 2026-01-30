/**
 * PitchSubmissionForm Component
 * Allows writers to submit story pitches for editorial approval
 */

import React, { useState } from 'react';
import { createPitch } from '../../services/pitchService';

interface PitchSubmissionFormProps {
  onSuccess?: (pitchId: string) => void;
  onCancel?: () => void;
}

const CATEGORIES = [
  'Politics',
  'Business',
  'Culture',
  'Technology',
  'Health',
  'Sports',
  'Opinion',
  'Investigation',
  'Feature',
  'Breaking News',
  'Other'
];

const PitchSubmissionForm: React.FC<PitchSubmissionFormProps> = ({ onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    angle: '',
    proposedCategory: '',
    estimatedWordCount: '',
    proposedDeadline: '',
    sources: '',
    relevance: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (saveAsDraft: boolean = false) => {
    // Validation
    if (!formData.title.trim()) {
      setError('Please enter a title for your pitch');
      return;
    }
    if (!formData.summary.trim()) {
      setError('Please provide a summary of your story idea');
      return;
    }
    if (!formData.angle.trim()) {
      setError('Please describe your unique angle on this story');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const pitchId = await createPitch(
        {
          title: formData.title.trim(),
          summary: formData.summary.trim(),
          angle: formData.angle.trim(),
          proposedCategory: formData.proposedCategory || undefined,
          estimatedWordCount: formData.estimatedWordCount 
            ? parseInt(formData.estimatedWordCount, 10) 
            : undefined,
          proposedDeadline: formData.proposedDeadline 
            ? new Date(formData.proposedDeadline) 
            : undefined,
          sources: formData.sources.trim() || undefined,
          relevance: formData.relevance.trim() || undefined,
        },
        !saveAsDraft // submitImmediately = true if not saving as draft
      );

      const message = saveAsDraft 
        ? 'Pitch saved as draft!' 
        : 'Pitch submitted for editorial review!';
      alert(message);
      
      if (onSuccess) {
        onSuccess(pitchId);
      }
    } catch (err: any) {
      console.error('Error creating pitch:', err);
      setError(err.message || 'Failed to create pitch');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      padding: '32px',
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
    }}>
      <h2 style={{ 
        margin: '0 0 8px 0', 
        fontSize: '1.5rem',
        fontWeight: '600'
      }}>
        Submit a Story Pitch
      </h2>
      <p style={{ 
        margin: '0 0 24px 0', 
        color: '#6b7280',
        fontSize: '0.875rem'
      }}>
        Share your story idea with our editorial team. Approved pitches will be assigned for writing.
      </p>

      {error && (
        <div style={{
          padding: '12px 16px',
          backgroundColor: '#fee2e2',
          border: '1px solid #fca5a5',
          borderRadius: '6px',
          color: '#991b1b',
          marginBottom: '24px',
          fontSize: '0.875rem'
        }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Title */}
        <div>
          <label style={{
            display: 'block',
            marginBottom: '6px',
            fontWeight: '500',
            fontSize: '0.875rem'
          }}>
            Proposed Headline *
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="e.g., 'The Hidden Cost of Zimbabwe's Gold Rush'"
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '1rem',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Summary */}
        <div>
          <label style={{
            display: 'block',
            marginBottom: '6px',
            fontWeight: '500',
            fontSize: '0.875rem'
          }}>
            Story Summary * <span style={{ color: '#6b7280', fontWeight: '400' }}>(elevator pitch)</span>
          </label>
          <textarea
            name="summary"
            value={formData.summary}
            onChange={handleChange}
            placeholder="In 2-3 sentences, what is this story about? Who are the key players and what's at stake?"
            rows={3}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '1rem',
              boxSizing: 'border-box',
              resize: 'vertical',
              fontFamily: 'inherit'
            }}
          />
        </div>

        {/* Angle */}
        <div>
          <label style={{
            display: 'block',
            marginBottom: '6px',
            fontWeight: '500',
            fontSize: '0.875rem'
          }}>
            Your Unique Angle * <span style={{ color: '#6b7280', fontWeight: '400' }}>(what makes this different)</span>
          </label>
          <textarea
            name="angle"
            value={formData.angle}
            onChange={handleChange}
            placeholder="What's your unique perspective or access? Why are you the right person to tell this story?"
            rows={3}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '1rem',
              boxSizing: 'border-box',
              resize: 'vertical',
              fontFamily: 'inherit'
            }}
          />
        </div>

        {/* Two-column row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {/* Category */}
          <div>
            <label style={{
              display: 'block',
              marginBottom: '6px',
              fontWeight: '500',
              fontSize: '0.875rem'
            }}>
              Category
            </label>
            <select
              name="proposedCategory"
              value={formData.proposedCategory}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '1rem',
                boxSizing: 'border-box',
                backgroundColor: 'white'
              }}
            >
              <option value="">Select category...</option>
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Estimated Word Count */}
          <div>
            <label style={{
              display: 'block',
              marginBottom: '6px',
              fontWeight: '500',
              fontSize: '0.875rem'
            }}>
              Estimated Word Count
            </label>
            <input
              type="number"
              name="estimatedWordCount"
              value={formData.estimatedWordCount}
              onChange={handleChange}
              placeholder="e.g., 1500"
              min="100"
              max="10000"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '1rem',
                boxSizing: 'border-box'
              }}
            />
          </div>
        </div>

        {/* Proposed Deadline */}
        <div>
          <label style={{
            display: 'block',
            marginBottom: '6px',
            fontWeight: '500',
            fontSize: '0.875rem'
          }}>
            When Can You Deliver?
          </label>
          <input
            type="date"
            name="proposedDeadline"
            value={formData.proposedDeadline}
            onChange={handleChange}
            min={new Date().toISOString().split('T')[0]}
            style={{
              width: '100%',
              maxWidth: '200px',
              padding: '10px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '1rem',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Sources */}
        <div>
          <label style={{
            display: 'block',
            marginBottom: '6px',
            fontWeight: '500',
            fontSize: '0.875rem'
          }}>
            Proposed Sources <span style={{ color: '#6b7280', fontWeight: '400' }}>(optional)</span>
          </label>
          <textarea
            name="sources"
            value={formData.sources}
            onChange={handleChange}
            placeholder="Who will you interview? What documents or data will you access?"
            rows={2}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '1rem',
              boxSizing: 'border-box',
              resize: 'vertical',
              fontFamily: 'inherit'
            }}
          />
        </div>

        {/* Relevance */}
        <div>
          <label style={{
            display: 'block',
            marginBottom: '6px',
            fontWeight: '500',
            fontSize: '0.875rem'
          }}>
            Why Now? <span style={{ color: '#6b7280', fontWeight: '400' }}>(timeliness)</span>
          </label>
          <textarea
            name="relevance"
            value={formData.relevance}
            onChange={handleChange}
            placeholder="Why is this story relevant now? Is there a news peg or upcoming event?"
            rows={2}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '1rem',
              boxSizing: 'border-box',
              resize: 'vertical',
              fontFamily: 'inherit'
            }}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{
        marginTop: '32px',
        paddingTop: '24px',
        borderTop: '1px solid #e5e7eb',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <button
          onClick={onCancel}
          disabled={submitting}
          style={{
            padding: '10px 20px',
            backgroundColor: 'transparent',
            color: '#6b7280',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            cursor: submitting ? 'not-allowed' : 'pointer',
            fontSize: '0.875rem'
          }}
        >
          Cancel
        </button>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => handleSubmit(true)}
            disabled={submitting}
            style={{
              padding: '10px 20px',
              backgroundColor: '#f3f4f6',
              color: '#374151',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              cursor: submitting ? 'not-allowed' : 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500',
              opacity: submitting ? 0.6 : 1
            }}
          >
            {submitting ? 'Saving...' : 'Save as Draft'}
          </button>
          
          <button
            onClick={() => handleSubmit(false)}
            disabled={submitting}
            style={{
              padding: '10px 24px',
              backgroundColor: '#000',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: submitting ? 'not-allowed' : 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500',
              opacity: submitting ? 0.6 : 1
            }}
          >
            {submitting ? 'Submitting...' : 'Submit for Review'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PitchSubmissionForm;
