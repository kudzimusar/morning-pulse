import React, { useState } from 'react';
import { Send, Sparkles, Loader2 } from 'lucide-react';

interface AskPulseAIProps {
  onClose?: () => void;
}

const AskPulseAI: React.FC<AskPulseAIProps> = ({ onClose }) => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      // TODO: Integrate with Gemini API or similar AI service
      // For now, simulate a response
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setResponse(`I understand you're asking about "${query}". This feature is currently in development. We're working on integrating AI-powered news insights to help you understand the stories that matter most to you.`);
    } catch (err) {
      setError('Sorry, I encountered an error. Please try again.');
      console.error('AI query error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mobile-content-with-nav" style={{ 
      minHeight: 'calc(100vh - 200px)',
      padding: '16px',
      maxWidth: '100%'
    }}>
      <div style={{
        marginBottom: '24px',
        textAlign: 'center'
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--primary-color) 0%, #1a1a3a 100%)',
          marginBottom: '16px'
        }}>
          <Sparkles size={32} color="white" />
        </div>
        <h1 style={{
          fontSize: '1.5rem',
          fontWeight: 700,
          color: 'var(--text-color)',
          marginBottom: '8px'
        }}>
          Ask The Pulse AI
        </h1>
        <p style={{
          fontSize: '0.9375rem',
          color: 'var(--light-text)',
          lineHeight: 1.6
        }}>
          Get AI-powered insights about the news that matters to you
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ marginBottom: '24px' }}>
        <div style={{
          display: 'flex',
          gap: '8px',
          alignItems: 'flex-end'
        }}>
          <div style={{ flex: 1 }}>
            <label htmlFor="ai-query" style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: 'var(--text-color)',
              marginBottom: '8px'
            }}>
              What would you like to know?
            </label>
            <textarea
              id="ai-query"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask about current events, news topics, or get context on breaking stories..."
              style={{
                width: '100%',
                minHeight: '120px',
                padding: '12px',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                fontSize: '0.9375rem',
                fontFamily: 'var(--font-body)',
                resize: 'vertical',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--primary-color)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--border-color)';
              }}
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={loading || !query.trim()}
          style={{
            width: '100%',
            padding: '14px',
            background: loading || !query.trim() 
              ? 'var(--border-color)' 
              : 'linear-gradient(135deg, var(--primary-color) 0%, #1a1a3a 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '1rem',
            fontWeight: 600,
            cursor: loading || !query.trim() ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            marginTop: '12px',
            transition: 'opacity 0.2s'
          }}
        >
          {loading ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              <span>Thinking...</span>
            </>
          ) : (
            <>
              <Send size={20} />
              <span>Ask AI</span>
            </>
          )}
        </button>
      </form>

      {error && (
        <div style={{
          padding: '16px',
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          color: '#991b1b',
          marginBottom: '24px',
          fontSize: '0.9375rem'
        }}>
          {error}
        </div>
      )}

      {response && (
        <div style={{
          padding: '20px',
          background: 'var(--section-bg)',
          borderRadius: '8px',
          border: '1px solid var(--border-color)',
          marginTop: '24px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '12px'
          }}>
            <Sparkles size={20} color="var(--primary-color)" />
            <h3 style={{
              fontSize: '1rem',
              fontWeight: 600,
              color: 'var(--text-color)'
            }}>
              AI Response
            </h3>
          </div>
          <p style={{
            fontSize: '0.9375rem',
            color: 'var(--text-color)',
            lineHeight: 1.7,
            whiteSpace: 'pre-wrap'
          }}>
            {response}
          </p>
        </div>
      )}

      <div style={{
        marginTop: '32px',
        padding: '16px',
        background: 'var(--section-bg)',
        borderRadius: '8px',
        fontSize: '0.875rem',
        color: 'var(--light-text)',
        lineHeight: 1.6
      }}>
        <strong style={{ color: 'var(--text-color)' }}>Note:</strong> This feature is currently in development. 
        We're working on integrating advanced AI capabilities to provide you with personalized news insights.
      </div>
    </div>
  );
};

export default AskPulseAI;
