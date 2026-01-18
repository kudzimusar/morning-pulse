/**
 * Newsletter Generator Tab
 * Auto-generates HTML email newsletters from published content
 */

import React, { useState } from 'react';
import { generateNewsletter, downloadNewsletter, previewNewsletter, NewsletterOptions } from '../../services/newsletterService';

const NewsletterTab: React.FC = () => {
  const [generating, setGenerating] = useState(false);
  const [generatedHTML, setGeneratedHTML] = useState<string | null>(null);
  const [options, setOptions] = useState<NewsletterOptions>({
    title: 'Weekly Opinion Digest',
    dateRange: 'week',
    maxArticles: 10,
    includeImages: true,
  });

  const handleGenerate = async () => {
    setGenerating(true);
    
    try {
      const html = await generateNewsletter(options);
      setGeneratedHTML(html);
    } catch (error: any) {
      alert(`Failed to generate newsletter: ${error.message}`);
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedHTML) return;
    
    const filename = `morning-pulse-${options.dateRange}-${new Date().toISOString().split('T')[0]}.html`;
    downloadNewsletter(generatedHTML, filename);
  };

  const handlePreview = () => {
    if (!generatedHTML) return;
    previewNewsletter(generatedHTML);
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <h2 style={{ marginTop: 0, marginBottom: '24px', fontSize: '24px', fontWeight: '600' }}>
        📧 Newsletter Generator
      </h2>

      <div style={{
        backgroundColor: '#f0f9ff',
        border: '1px solid #bae6fd',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '32px'
      }}>
        <div style={{
          fontSize: '14px',
          color: '#0c4a6e',
          fontWeight: '600',
          marginBottom: '8px'
        }}>
          ℹ️ How It Works
        </div>
        <div style={{ fontSize: '13px', color: '#0369a1', lineHeight: '1.6' }}>
          This tool auto-generates beautiful HTML email newsletters from your published content.
          Select a time period, customize settings, and click "Generate". You can preview the newsletter
          or download the HTML file to send via your email platform (Mailchimp, SendGrid, etc.).
        </div>
      </div>

      {/* Options Form */}
      <div style={{
        border: '1px solid #e5e5e5',
        borderRadius: '8px',
        padding: '24px',
        backgroundColor: '#fff',
        marginBottom: '24px'
      }}>
        <h3 style={{ marginTop: 0, marginBottom: '20px', fontSize: '18px', fontWeight: '600' }}>
          Newsletter Settings
        </h3>

        {/* Title */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            fontSize: '14px',
            fontWeight: '500'
          }}>
            Newsletter Title
          </label>
          <input
            type="text"
            value={options.title}
            onChange={(e) => setOptions({ ...options, title: e.target.value })}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px'
            }}
            placeholder="Weekly Opinion Digest"
          />
        </div>

        {/* Date Range */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            fontSize: '14px',
            fontWeight: '500'
          }}>
            Time Period
          </label>
          <select
            value={options.dateRange}
            onChange={(e) => setOptions({ ...options, dateRange: e.target.value as 'today' | 'week' | 'month' })}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          >
            <option value="today">Today's Articles</option>
            <option value="week">Past Week</option>
            <option value="month">Past Month</option>
          </select>
        </div>

        {/* Max Articles */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            fontSize: '14px',
            fontWeight: '500'
          }}>
            Maximum Articles
          </label>
          <input
            type="number"
            min="1"
            max="50"
            value={options.maxArticles}
            onChange={(e) => setOptions({ ...options, maxArticles: parseInt(e.target.value) || 10 })}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          />
        </div>

        {/* Include Images */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}>
            <input
              type="checkbox"
              checked={options.includeImages}
              onChange={(e) => setOptions({ ...options, includeImages: e.target.checked })}
              style={{ cursor: 'pointer' }}
            />
            Include article images
          </label>
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={generating}
          style={{
            padding: '12px 24px',
            backgroundColor: '#000',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: generating ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            opacity: generating ? 0.6 : 1
          }}
        >
          {generating ? '⏳ Generating...' : '✨ Generate Newsletter'}
        </button>
      </div>

      {/* Preview/Download Section */}
      {generatedHTML && (
        <div style={{
          border: '1px solid #e5e5e5',
          borderRadius: '8px',
          padding: '24px',
          backgroundColor: '#fff'
        }}>
          <h3 style={{ marginTop: 0, marginBottom: '20px', fontSize: '18px', fontWeight: '600' }}>
            ✅ Newsletter Ready
          </h3>

          <div style={{
            backgroundColor: '#f0fdf4',
            border: '1px solid #86efac',
            borderRadius: '6px',
            padding: '16px',
            marginBottom: '20px'
          }}>
            <div style={{ fontSize: '14px', color: '#065f46', fontWeight: '600', marginBottom: '4px' }}>
              Success!
            </div>
            <div style={{ fontSize: '13px', color: '#16a34a' }}>
              Your newsletter has been generated and is ready to send.
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
            <button
              onClick={handlePreview}
              style={{
                padding: '10px 20px',
                backgroundColor: '#3b82f6',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              👁️ Preview in Browser
            </button>
            
            <button
              onClick={handleDownload}
              style={{
                padding: '10px 20px',
                backgroundColor: '#10b981',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              ⬇️ Download HTML
            </button>
          </div>

          <div style={{
            padding: '16px',
            backgroundColor: '#f9fafb',
            borderRadius: '6px',
            border: '1px solid #e5e5e5'
          }}>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px', fontWeight: '600' }}>
              📋 Next Steps:
            </div>
            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '12px', color: '#666', lineHeight: '1.8' }}>
              <li>Preview the newsletter to ensure formatting looks good</li>
              <li>Download the HTML file</li>
              <li>Upload to your email platform (Mailchimp, SendGrid, etc.)</li>
              <li>Send to your subscriber list</li>
            </ul>
          </div>
        </div>
      )}

      {/* Usage Guide */}
      <div style={{
        border: '1px solid #e5e5e5',
        borderRadius: '8px',
        padding: '24px',
        backgroundColor: '#fafafa',
        marginTop: '32px'
      }}>
        <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '16px', fontWeight: '600' }}>
          📚 Newsletter Best Practices
        </h3>
        <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#666', lineHeight: '1.8' }}>
          <li><strong>Daily Digest:</strong> Use "Today's Articles" with 5-8 articles</li>
          <li><strong>Weekly Roundup:</strong> Use "Past Week" with 10-15 top articles</li>
          <li><strong>Monthly Magazine:</strong> Use "Past Month" with 20-30 best pieces</li>
          <li><strong>Send Time:</strong> Mornings (6-9 AM) get highest open rates</li>
          <li><strong>Subject Line:</strong> Keep it under 50 characters for mobile</li>
          <li><strong>Testing:</strong> Always preview before sending to subscribers</li>
        </ul>
      </div>
    </div>
  );
};

export default NewsletterTab;
