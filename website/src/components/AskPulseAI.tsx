import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Loader2, ArrowUp, ExternalLink, Clock, BookOpen } from 'lucide-react';
import { generateAskPulseAIResponseStream, convertToChatHistory, formatResponseWithCitations } from '../services/askPulseAIService';
import { subscribeToPublishedOpinions } from '../services/opinionsService';
import { NewsStory, Opinion } from '../../types';

interface AskPulseAIProps {
  onClose?: () => void;
  newsData?: {
    [category: string]: NewsStory[];
  };
}

interface MessageWithSources {
  role: 'user' | 'ai';
  content: string;
  sources?: Array<{ title: string; url?: string; index?: number }>;
  citations?: Map<number, { title: string; url?: string }>;
  articles?: NewsStory[]; // Enhanced: Full article data for cards
  opinions?: Opinion[]; // Enhanced: Related opinions
}

const AskPulseAI: React.FC<AskPulseAIProps> = ({ onClose, newsData }) => {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<MessageWithSources[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [opinions, setOpinions] = useState<Opinion[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Subscribe to opinions
  useEffect(() => {
    const unsubscribe = subscribeToPublishedOpinions(
      (fetched) => {
        setOpinions(fetched);
      },
      (err) => {
        console.error("Opinion Fetch Error:", err);
      }
    );
    return () => unsubscribe();
  }, []);

  // Suggested prompts (editorial, not system instructions)
  const suggestedPrompts = [
    "What are today's top stories?",
    "What does this mean for Zimbabwe?",
    "What should I know this morning?",
    "Tell me about the latest business news",
  ];

  const handlePromptClick = (prompt: string) => {
    setQuery(prompt);
    // Call handleSubmit with undefined for event (since it's a button click, not form submit)
    handleSubmit(undefined, prompt);
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText]);

  // Helper: Get article from sources
  const getArticleFromSource = (source: { title: string; url?: string; index?: number }): NewsStory | null => {
    if (!newsData) return null;
    
    // Search through all categories
    for (const category of Object.keys(newsData)) {
      const article = newsData[category].find(
        (a: NewsStory) => a.headline === source.title || a.url === source.url
      );
      if (article) return article;
    }
    return null;
  };

  // Helper: Get related opinions based on category/keywords
  const getRelatedOpinions = (sources: Array<{ title: string; url?: string }>, limit: number = 2): Opinion[] => {
    if (opinions.length === 0) return [];
    
    // Extract keywords from source titles
    const keywords = sources.flatMap(s => 
      s.title.toLowerCase().split(/\s+/).filter(w => w.length > 3)
    );
    
    // Find opinions matching keywords or categories
    const related = opinions
      .filter(op => op.isPublished && op.publishedAt)
      .filter(op => {
        const headlineLower = (op.headline || '').toLowerCase();
        const categoryLower = (op.category || '').toLowerCase();
        return keywords.some(kw => 
          headlineLower.includes(kw) || categoryLower.includes(kw)
        );
      })
      .sort((a, b) => {
        // Sort by published date (newest first)
        const dateA = a.publishedAt?.getTime() || 0;
        const dateB = b.publishedAt?.getTime() || 0;
        return dateB - dateA;
      })
      .slice(0, limit);
    
    return related;
  };

  // Helper: Format time ago
  const getTimeAgo = (timestamp?: number): string => {
    if (!timestamp) return '';
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  // Helper: Estimate read time
  const estimateReadTime = (text: string): number => {
    const words = text.split(/\s+/).length;
    return Math.max(1, Math.ceil(words / 200));
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
    setStreamingText('');

    // Add user message
    const userMessage: MessageWithSources = { role: 'user', content: queryText };
    setMessages(prev => [...prev, userMessage]);

    try {
      // Convert previous messages to chat history (excluding current user message)
      const previousMessages = messages.filter(m => m.role === 'ai' || (m.role === 'user' && m.content !== queryText));
      const chatHistory = convertToChatHistory(previousMessages);
      
      // Create streaming generator
      const streamGenerator = generateAskPulseAIResponseStream(
        queryText,
        newsData || {},
        chatHistory.length > 0 ? chatHistory : undefined
      );
      
      let accumulatedText = '';
      let finalResponse: { text: string; sources?: Array<{ title: string; url?: string; index?: number }> } | null = null;
      
      // Stream the response
      // The generator yields chunks and returns the final response when done
      let generator = streamGenerator;
      let result = await generator.next();
      
      while (!result.done) {
        if (result.value && result.value.text) {
          accumulatedText += result.value.text;
          setStreamingText(accumulatedText);
        }
        result = await generator.next();
      }
      
      // Get final response from generator return value
      if (result.done && result.value) {
        finalResponse = result.value;
      }
      
      // Format response with citations
      const responseText = finalResponse?.text || accumulatedText;
      const responseSources = finalResponse?.sources || [];
      
      const { formattedText, citations } = formatResponseWithCitations(
        responseText,
        responseSources
      );

      // Enhanced: Get full article data and related opinions
      const articleData = responseSources
        .map(source => getArticleFromSource(source))
        .filter((article): article is NewsStory => article !== null);
      
      const relatedOpinions = getRelatedOpinions(responseSources, 2);

      const aiMessage: MessageWithSources = {
        role: 'ai',
        content: formattedText,
        sources: responseSources,
        citations,
        articles: articleData,
        opinions: relatedOpinions
      };
      
      setMessages(prev => [...prev, aiMessage]);
      setStreamingText('');
      
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
      setStreamingText('');
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

  // Article Card Component
  const ArticleCard: React.FC<{ article: NewsStory; index: number }> = ({ article, index }) => {
    const handleClick = () => {
      if (article.url) {
        // Open in same tab to drive traffic to main site
        if (article.url.startsWith('#')) {
          window.location.hash = article.url.substring(1);
        } else if (article.url.startsWith('http')) {
          window.open(article.url, '_blank', 'noopener,noreferrer');
        } else {
          window.location.href = article.url;
        }
      }
    };

    return (
      <div
        onClick={handleClick}
        style={{
          background: '#ffffff',
          border: '2px solid #e5e7eb',
          borderRadius: '12px',
          overflow: 'hidden',
          cursor: article.url ? 'pointer' : 'default',
          transition: 'all 0.3s ease',
          marginTop: '12px'
        }}
        onMouseEnter={(e) => {
          if (article.url) {
            e.currentTarget.style.borderColor = 'var(--primary-color)';
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.15)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = '#e5e7eb';
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        {article.urlToImage && (
          <div style={{
            width: '100%',
            height: '150px',
            overflow: 'hidden',
            background: '#f3f4f6'
          }}>
            <img
              src={article.urlToImage}
              alt={article.headline}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
          </div>
        )}
        
        <div style={{ padding: '16px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px'
          }}>
            <span style={{
              background: 'var(--primary-color)',
              color: 'white',
              padding: '4px 12px',
              borderRadius: '12px',
              fontSize: '0.75rem',
              fontWeight: 600,
              textTransform: 'uppercase'
            }}>
              {article.category}
            </span>
            {article.timestamp && (
              <span style={{
                fontSize: '0.75rem',
                color: '#6b7280',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <Clock size={12} />
                {getTimeAgo(article.timestamp)}
              </span>
            )}
          </div>
          
          <h3 style={{
            margin: '0 0 8px 0',
            fontSize: '1.1rem',
            fontWeight: 700,
            color: '#111827',
            lineHeight: 1.4
          }}>
            {article.headline}
          </h3>
          
          <p style={{
            margin: '0 0 12px 0',
            fontSize: '0.875rem',
            color: '#6b7280',
            lineHeight: 1.6,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}>
            {article.detail}
          </p>
          
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: '12px',
            borderTop: '1px solid #e5e7eb'
          }}>
            <span style={{
              fontSize: '0.75rem',
              color: '#6b7280',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <BookOpen size={12} />
              {estimateReadTime(article.detail)} min read
            </span>
            {article.url && (
              <span style={{
                color: 'var(--primary-color)',
                fontWeight: 600,
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                Read full story <ExternalLink size={14} />
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Opinion Card Component
  const OpinionCard: React.FC<{ opinion: Opinion }> = ({ opinion }) => {
    const handleClick = () => {
      if (opinion.slug) {
        window.location.hash = `opinion/${opinion.slug}`;
      }
    };

    return (
      <div
        onClick={handleClick}
        style={{
          display: 'flex',
          gap: '12px',
          padding: '16px',
          background: 'rgba(102, 126, 234, 0.05)',
          border: '2px solid rgba(102, 126, 234, 0.2)',
          borderRadius: '12px',
          cursor: opinion.slug ? 'pointer' : 'default',
          transition: 'all 0.2s ease',
          marginTop: '12px'
        }}
        onMouseEnter={(e) => {
          if (opinion.slug) {
            e.currentTarget.style.background = 'rgba(102, 126, 234, 0.1)';
            e.currentTarget.style.borderColor = 'var(--primary-color)';
            e.currentTarget.style.transform = 'translateX(4px)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(102, 126, 234, 0.05)';
          e.currentTarget.style.borderColor = 'rgba(102, 126, 234, 0.2)';
          e.currentTarget.style.transform = 'translateX(0)';
        }}
      >
        <div style={{ fontSize: '2rem', flexShrink: 0 }}>💭</div>
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: '0.75rem',
            color: '#6b7280',
            marginBottom: '4px',
            textTransform: 'uppercase',
            fontWeight: 600
          }}>
            Opinion
          </div>
          <h4 style={{
            margin: '0 0 4px 0',
            fontSize: '1rem',
            fontWeight: 700,
            color: '#111827'
          }}>
            {opinion.headline}
          </h4>
          {opinion.authorName && (
            <p style={{
              margin: '0 0 8px 0',
              fontSize: '0.8rem',
              color: '#6b7280',
              fontStyle: 'italic'
            }}>
              by {opinion.authorName}
            </p>
          )}
          <p style={{
            margin: '0 0 8px 0',
            fontSize: '0.85rem',
            color: '#6b7280',
            lineHeight: 1.5,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}>
            {opinion.subHeadline}
          </p>
          {opinion.slug && (
            <span style={{
              color: 'var(--primary-color)',
              fontWeight: 600,
              fontSize: '0.85rem'
            }}>
              Read opinion →
            </span>
          )}
        </div>
      </div>
    );
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
                  {/* Render message with clickable citations */}
                  {message.role === 'ai' ? (
                    <div>
                      {message.content.split(/(\[CITATION:\d+\])/).map((part, idx) => {
                        const citationMatch = part.match(/\[CITATION:(\d+)\]/);
                        if (citationMatch) {
                          const citationIndex = parseInt(citationMatch[1], 10);
                          const citation = message.citations?.get(citationIndex);
                          if (citation) {
                            return (
                              <span
                                key={idx}
                                style={{
                                  color: 'var(--primary-color)',
                                  textDecoration: 'underline',
                                  cursor: 'pointer',
                                  fontWeight: 500
                                }}
                                onClick={() => {
                                  if (citation.url) {
                                    if (citation.url.startsWith('#')) {
                                      window.location.hash = citation.url.substring(1);
                                    } else {
                                      window.open(citation.url, '_blank', 'noopener,noreferrer');
                                    }
                                  }
                                }}
                                title={citation.title}
                              >
                                [{citationIndex}]
                              </span>
                            );
                          }
                          return <span key={idx}>[{citationIndex}]</span>;
                        }
                        return <span key={idx}>{part}</span>;
                      })}
                      
                      {/* Enhanced: Article Cards */}
                      {message.articles && message.articles.length > 0 && (
                        <div style={{ marginTop: '16px' }}>
                          {message.articles.map((article, idx) => (
                            <ArticleCard key={idx} article={article} index={idx} />
                          ))}
                        </div>
                      )}

                      {/* Enhanced: Opinion Cards */}
                      {message.opinions && message.opinions.length > 0 && (
                        <div style={{ marginTop: '16px' }}>
                          <div style={{
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            color: '#6b7280',
                            marginBottom: '8px',
                            textTransform: 'uppercase'
                          }}>
                            💭 Related Opinions
                          </div>
                          {message.opinions.map((opinion, idx) => (
                            <OpinionCard key={idx} opinion={opinion} />
                          ))}
                        </div>
                      )}

                      {/* Sources list (fallback if no article cards) */}
                      {(!message.articles || message.articles.length === 0) && message.sources && message.sources.length > 0 && (
                        <div style={{
                          marginTop: '12px',
                          paddingTop: '12px',
                          borderTop: '1px solid rgba(0,0,0,0.1)',
                          fontSize: '0.8125rem'
                        }}>
                          <div style={{ fontWeight: 600, marginBottom: '8px' }}>Sources:</div>
                          {message.sources.map((source, idx) => (
                            <div
                              key={idx}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                marginBottom: '4px',
                                cursor: source.url ? 'pointer' : 'default'
                              }}
                              onClick={() => {
                                if (source.url) {
                                  if (source.url.startsWith('#')) {
                                    window.location.hash = source.url.substring(1);
                                  } else {
                                    window.open(source.url, '_blank', 'noopener,noreferrer');
                                  }
                                }
                              }}
                            >
                              <span style={{ fontWeight: 500 }}>[{source.index || idx + 1}]</span>
                              <span>{source.title}</span>
                              {source.url && (
                                <ExternalLink size={12} style={{ flexShrink: 0 }} />
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    message.content
                  )}
                </div>
              </div>
            ))}
            
            {/* Streaming text display */}
            {loading && streamingText && (
              <div
                style={{
                  marginBottom: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start'
                }}
              >
                <div style={{
                  maxWidth: '85%',
                  padding: '12px 16px',
                  background: '#f3f4f6',
                  color: 'var(--text-color)',
                  borderRadius: '16px 16px 16px 4px',
                  fontSize: '0.9375rem',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'var(--font-body)'
                }}>
                  {streamingText}
                  <span style={{ 
                    display: 'inline-block',
                    width: '8px',
                    height: '16px',
                    background: 'var(--primary-color)',
                    marginLeft: '2px',
                    animation: 'blink 1s infinite'
                  }} />
                </div>
              </div>
            )}
            
            {loading && !streamingText && (
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
            
            <div ref={messagesEndRef} />
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
