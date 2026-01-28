/**
 * Newsletter Generator Tab
 * Auto-generates HTML email newsletters from published content
 */

import React, { useState } from 'react';
import { generateNewsletter, downloadNewsletter, previewNewsletter, sendNewsletter, sendScheduledNewsletter, NewsletterOptions } from '../../services/newsletterService';

const NewsletterTab: React.FC = () => {
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [generatedHTML, setGeneratedHTML] = useState<string | null>(null);
  const [sendResult, setSendResult] = useState<{ success: boolean; message: string; stats?: any } | null>(null);
  const [options, setOptions] = useState<NewsletterOptions>({
    title: 'Weekly Opinion Digest',
    dateRange: 'week',
    maxArticles: 10,
    includeImages: true,
  });
  const handleGenerate = async () => {
    setGenerating(true);
    setGeneratedHTML(null);
    setSendResult(null);
    
    try {
      // Import the opinions service to fetch articles
      const { getPublishedOpinions } = await import('../../services/opinionsService');
      const allPublished = await getPublishedOpinions();
      
      // Filter by date range
      const now = new Date();
      let filtered = allPublished;
      
      if (options.dateRange === 'today') {
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        filtered = allPublished.filter(a => (a.publishedAt?.getTime() || 0) >= today.getTime());
      } else if (options.dateRange === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filtered = allPublished.filter(a => (a.publishedAt?.getTime() || 0) >= weekAgo.getTime());
      } else if (options.dateRange === 'month') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        filtered = allPublished.filter(a => (a.publishedAt?.getTime() || 0) >= monthAgo.getTime());
      }
      
      const articlesToSend = filtered.slice(0, options.maxArticles);
      
      if (articlesToSend.length === 0) {
        alert('No published articles found for the selected time period.');
        return;
      }

      const html = await generateNewsletter(articlesToSend, options.dateRange === 'today' ? 'daily' : 'weekly');
      setGeneratedHTML(html);
    } catch (error: any) {
      console.error('Newsletter generation error:', error);
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

  const handleSendNewsletter = async () => {
    if (!generatedHTML) return;

    setSending(true);
    setSendResult(null);

    try {
      const result = await sendNewsletter({
        subject: options.title,
        html: generatedHTML
      });

      setSendResult(result);
    } catch (error: any) {
      setSendResult({
        success: false,
        message: error.message || 'Failed to send newsletter'
      });
    } finally {
      setSending(false);
    }
  };

  const handleSendScheduledNewsletter = async (type: 'daily' | 'weekly') => {
    setSending(true);
    setSendResult(null);

    try {
      const result = await sendScheduledNewsletter(type);
      setSendResult(result);
    } catch (error: any) {
      setSendResult({
        success: false,
        message: error.message || 'Failed to send scheduled newsletter'
      });
    } finally {
      setSending(false);
    }
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

          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
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

            <button
              onClick={handleSendNewsletter}
              disabled={sending}
              style={{
                padding: '10px 20px',
                backgroundColor: '#8b5cf6',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: sending ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                opacity: sending ? 0.6 : 1
              }}
            >
              {sending ? '📧 Sending...' : '📧 Send Newsletter'}
            </button>
          </div>

          {/* Send Result */}
          {sendResult && (
            <div style={{
              padding: '16px',
              borderRadius: '6px',
              marginBottom: '20px',
              backgroundColor: sendResult.success ? '#f0fdf4' : '#fef2f2',
              border: `1px solid ${sendResult.success ? '#86efac' : '#fecaca'}`
            }}>
              <div style={{
                fontSize: '14px',
                fontWeight: '600',
                color: sendResult.success ? '#166534' : '#991b1b',
                marginBottom: '4px'
              }}>
                {sendResult.success ? '✅ Send Successful' : '❌ Send Failed'}
              </div>
              <div style={{
                fontSize: '13px',
                color: sendResult.success ? '#16a34a' : '#dc2626'
              }}>
                {sendResult.message}
              </div>
              {sendResult.stats && (
                <div style={{
                  fontSize: '12px',
                  color: '#666',
                  marginTop: '8px'
                }}>
                  Sent to {sendResult.stats.successfulSends || 0} subscribers
                  {sendResult.stats.targetedSubscribers && sendResult.stats.totalSubscribers &&
                    ` (targeted ${sendResult.stats.targetedSubscribers} of ${sendResult.stats.totalSubscribers})`}
                </div>
              )}
            </div>
          )}

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

      {/* Scheduled Newsletters */}
      <div style={{
        border: '1px solid #e5e5e5',
        borderRadius: '8px',
        padding: '24px',
        backgroundColor: '#f8fafc',
        marginTop: '32px'
      }}>
        <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>
          ⏰ Scheduled Newsletters
        </h3>

        <div style={{
          backgroundColor: '#e0f2fe',
          border: '1px solid #bae6fd',
          borderRadius: '6px',
          padding: '16px',
          marginBottom: '20px'
        }}>
          <div style={{ fontSize: '14px', color: '#0c4a6e', fontWeight: '600', marginBottom: '8px' }}>
            ⚡ Automated Delivery
          </div>
          <div style={{ fontSize: '13px', color: '#0369a1', lineHeight: '1.6' }}>
            These buttons send automated newsletters based on recently published content.
            Daily newsletters include articles from the last 24 hours.
            Weekly newsletters include articles from the last 7 days.
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
          <button
            onClick={() => handleSendScheduledNewsletter('daily')}
            disabled={sending}
            style={{
              padding: '12px 24px',
              backgroundColor: '#f59e0b',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: sending ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              opacity: sending ? 0.6 : 1
            }}
          >
            {sending ? '⏳ Sending...' : '📅 Send Daily Digest'}
          </button>

          <button
            onClick={() => handleSendScheduledNewsletter('weekly')}
            disabled={sending}
            style={{
              padding: '12px 24px',
              backgroundColor: '#7c3aed',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: sending ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              opacity: sending ? 0.6 : 1
            }}
          >
            {sending ? '⏳ Sending...' : '📊 Send Weekly Digest'}
          </button>
        </div>

        <div style={{
          fontSize: '12px',
          color: '#666',
          lineHeight: '1.6',
          padding: '12px',
          backgroundColor: '#f9fafb',
          borderRadius: '4px'
        }}>
          <strong>💡 Pro Tip:</strong> Set up Google Cloud Scheduler to call these endpoints automatically:
          <br />• Daily: Every day at 6:00 AM
          <br />• Weekly: Every Monday at 8:00 AM
          <br />
          <br />This creates a professional newsletter cadence that keeps readers engaged.
        </div>
      </div>
    </div>
  );
};

export default NewsletterTab;
