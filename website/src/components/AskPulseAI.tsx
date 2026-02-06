import React, { useState } from 'react';
import { Send, Sparkles, Loader2, ArrowUp } from 'lucide-react';

interface AskPulseAIProps {
  onClose?: () => void;
  newsData?: {
    [category: string]: any[];
  };
}

const AskPulseAI: React.FC<AskPulseAIProps> = ({ onClose, newsData }) => {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'ai'; content: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Suggested prompts (editorial, not system instructions)
  const suggestedPrompts = [
    "What are today's top stories?",
    "What does this mean for Zimbabwe?",
    "What should I know this morning?",
    "Tell me about the latest business news",
  ];

  const handlePromptClick = (prompt: string) => {
    setQuery(prompt);
    handleSubmit(prompt);
  };

  const handleSubmit = async (e?: React.FormEvent, promptText?: string) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    const queryText = promptText || query;
    if (!queryText.trim()) return;

    setHasInteracted(true);
    setLoading(true);
    setError(null);

    // Add user message
    const userMessage = { role: 'user' as const, content: queryText };
    setMessages(prev => [...prev, userMessage]);

    try {
      // Import the service dynamically to avoid issues if API key is not configured
      const { generateAskPulseAIResponse } = await import('../services/askPulseAIService');
      
      // Generate real AI response using Gemini with RAG
      const response = await generateAskPulseAIResponse(
        queryText,
        newsData || {}
      );
      
      // Format response with sources if available
      let formattedResponse = response.text;
      if (response.sources && response.sources.length > 0) {
        formattedResponse += '\n\n**Sources:**\n' + 
          response.sources.map((source, idx) => 
            `${idx + 1}. ${source.title}${source.url ? ` (${source.url})` : ''}`
          ).join('\n');
      }
      
      setMessages(prev => [...prev, { role: 'ai', content: formattedResponse }]);
      setQuery(''); // Clear input after sending
    } catch (err: any) {
      const errorMessage = err?.message || 'Sorry, I encountered an error. Please try again.';
      setError(errorMessage);
      console.error('AI query error:', err);
      
      // Add error message to chat for user visibility
      setMessages(prev => [...prev, { 
        role: 'ai', 
        content: `I'm sorry, I encountered an error: ${errorMessage}. Please try again.` 
      }]);
    } finally {
      setLoading(false);
    }
  };

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="mobile-content-with-nav" style={{ 
      minHeight: 'calc(100vh - 200px)',
      padding: '0',
      maxWidth: '100%',
      display: 'flex',
      flexDirection: 'column',
      height: '100%'
    }}>
      {/* Pre-Interaction Screen */}
      {!hasInteracted && (
        <div style={{ padding: '24px 16px', flex: 1 }}>
          {/* Greeting */}
          <div style={{ marginBottom: '32px' }}>
            <h1 style={{
              fontSize: 'clamp(1.75rem, 5vw, 2.25rem)',
              fontWeight: 700,
              color: 'var(--text-color)',
              marginBottom: '8px',
              lineHeight: 1.2
            }}>
              {getGreeting()}
            </h1>
            <p style={{
              fontSize: '1rem',
              color: 'var(--light-text)',
              lineHeight: 1.5
            }}>
              Ask us about today's news.
            </p>
          </div>

          {/* Suggested Prompts */}
          <div style={{ marginBottom: '32px' }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              {suggestedPrompts.map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => handlePromptClick(prompt)}
                  style={{
                    padding: '16px',
                    background: '#ffffff',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '0.9375rem',
                    color: 'var(--text-color)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    transition: 'all 0.2s',
                    fontFamily: 'var(--font-body)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--primary-color)';
                    e.currentTarget.style.background = '#f9fafb';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                    e.currentTarget.style.background = '#ffffff';
                  }}
                >
                  <Sparkles size={18} color="var(--primary-color)" style={{ flexShrink: 0 }} />
                  <span style={{ flex: 1 }}>{prompt}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Disclaimer - Bottom Aligned */}
          <div style={{
            marginTop: 'auto',
            paddingTop: '24px',
            fontSize: '0.6875rem', /* 11px */
            color: '#666666',
            lineHeight: 1.5
          }}>
            <em>Ask Pulse AI delivers AI-generated answers from published Morning Pulse reporting. This is an experiment. Please verify by consulting the provided articles.</em>
          </div>
        </div>
      )}

      {/* Conversation View */}
      {hasInteracted && (
        <div style={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column',
          padding: '16px',
          overflowY: 'auto'
        }}>
          {/* Messages */}
          <div style={{ flex: 1, marginBottom: '16px' }}>
            {messages.map((message, index) => (
              <div
                key={index}
                style={{
                  marginBottom: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: message.role === 'user' ? 'flex-end' : 'flex-start'
                }}
              >
                <div style={{
                  maxWidth: '85%',
                  padding: '12px 16px',
                  background: message.role === 'user' 
                    ? 'var(--primary-color)' 
                    : '#f3f4f6',
                  color: message.role === 'user' ? 'white' : 'var(--text-color)',
                  borderRadius: message.role === 'user' 
                    ? '16px 16px 4px 16px' 
                    : '16px 16px 16px 4px',
                  fontSize: '0.9375rem',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'var(--font-body)'
                }}>
                  {message.content}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: 'var(--light-text)',
                fontSize: '0.875rem',
                marginBottom: '24px'
              }}>
                <Loader2 size={16} className="animate-spin" />
                <span>Thinking...</span>
              </div>
            )}
          </div>

          {/* Disclaimer - Always visible in conversation */}
          <div style={{
            padding: '12px 0',
            fontSize: '0.6875rem', /* 11px */
            color: '#666666',
            lineHeight: 1.5,
            textAlign: 'center',
            borderTop: '1px solid var(--border-color)'
          }}>
            <em>Answers are AI generated from Morning Pulse reporting. Because AI can make mistakes, verify information by referencing provided sources for each answer.</em>
          </div>
        </div>
      )}

      {/* Input Field - Always visible, pinned to bottom */}
      <div style={{
        padding: '16px',
        borderTop: '1px solid var(--border-color)',
        background: '#ffffff',
        position: 'sticky',
        bottom: 0
      }}>
        <form onSubmit={(e) => handleSubmit(e)}>
          <div style={{
            display: 'flex',
            gap: '8px',
            alignItems: 'center'
          }}>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="What do you want to know?"
              style={{
                flex: 1,
                padding: '12px 16px',
                border: '1px solid var(--border-color)',
                borderRadius: '24px',
                fontSize: '0.9375rem',
                fontFamily: 'var(--font-body)',
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
            <button
              type="submit"
              disabled={loading || !query.trim()}
              style={{
                width: '44px',
                height: '44px',
                background: loading || !query.trim() 
                  ? 'var(--border-color)' 
                  : 'var(--primary-color)',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                cursor: loading || !query.trim() ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'opacity 0.2s',
                flexShrink: 0
              }}
              aria-label="Send message"
            >
              {loading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <ArrowUp size={20} />
              )}
            </button>
          </div>
        </form>
        {error && (
          <div style={{
            marginTop: '8px',
            padding: '8px 12px',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '6px',
            color: '#991b1b',
            fontSize: '0.8125rem'
          }}>
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default AskPulseAI;
