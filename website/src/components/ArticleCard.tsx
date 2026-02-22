import React, { useState, useEffect, useRef } from 'react';
import { NewsStory } from '../../types';
import { CountryInfo } from '../services/locationService';
import { generateArticleAIAction } from '../services/askPulseAIService'; // NEW
import { lazyLoadImage } from '../utils/lazyLoadImages';
import { Sparkles, X, Brain, Bookmark, BookmarkCheck } from 'lucide-react'; // NEW: Icons for AI Summary & Save

interface ArticleCardProps {
  article: NewsStory;
  variant?: 'grid' | 'compact' | 'text' | 'feature';
  userCountry?: CountryInfo;
  opinionSlug?: string; // NEW: Slug for editorials/opinions to route to detail page
  isEditorial?: boolean; // NEW: Flag to indicate if this is an editorial/opinion
}

const ArticleCard: React.FC<ArticleCardProps> = ({ article, variant = 'grid', userCountry, opinionSlug, isEditorial }) => {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [imageLoaded, setImageLoaded] = useState(false);
  const imageRef = useRef<HTMLDivElement>(null);

  // NEW: AI Summary State
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryData, setSummaryData] = useState<{ summary?: string; opposingViews?: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'summary' | 'opposing'>('summary');

  // NEW: Save State
  const [isSaved, setIsSaved] = useState(false);

  // Load save state on mount
  useEffect(() => {
    // Check local storage or user prefs
    const savedIds = JSON.parse(localStorage.getItem('savedArticles') || '[]');
    setIsSaved(savedIds.includes(article.id));
  }, [article.id]);

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    const savedIds = JSON.parse(localStorage.getItem('savedArticles') || '[]');
    let newSavedIds;

    if (isSaved) {
      newSavedIds = savedIds.filter((id: string) => id !== article.id);
    } else {
      newSavedIds = [...savedIds, article.id];
    }

    localStorage.setItem('savedArticles', JSON.stringify(newSavedIds));
    setIsSaved(!isSaved);

    // Dispatch custom event for immediate UI updates elsewhere
    window.dispatchEvent(new Event('savedArticlesUpdated'));
  };

  // NEW: Handler for toggling summary
  const handleToggleSummary = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click

    if (isSummaryExpanded) {
      setIsSummaryExpanded(false);
      return;
    }

    setIsSummaryExpanded(true);

    // Check if we already have data (in-memory cache)
    if (summaryData) return;

    // Fetch data via Cloud Function
    setSummaryLoading(true);
    try {
      // 1. Fetch Summary
      const summaryText = await generateArticleAIAction(
        article.detail || article.headline, // Use detail if available, else headline
        'summarize'
      );

      // 2. Fetch Opposing Views (Parallel or sequential - sequential for now to save tokens if first fails)
      // Only fetch if summary succeeded
      let opposingText = "";
      if (summaryText && !summaryText.includes("unavailable")) {
        opposingText = await generateArticleAIAction(
          article.detail || article.headline,
          'opposing_views'
        );
      }

      setSummaryData({
        summary: summaryText,
        opposingViews: opposingText
      });
    } catch (error) {
      console.error("Failed to load summary", error);
      setSummaryData({ summary: "Summary unavailable at this time." });
    } finally {
      setSummaryLoading(false);
    }
  };

  // Fetch image URL on mount
  useEffect(() => {
    let isMounted = true;

    const loadImageUrl = async () => {
      if (article.urlToImage) {
        if (isMounted) {
          setImageUrl(article.urlToImage);
        }
      } else {
        if (isMounted) {
          setImageUrl('');
        }
      }
    };

    loadImageUrl();

    return () => {
      isMounted = false;
    };
  }, [article.id, article.urlToImage, article.category, article.headline]);

  // Lazy load image when it enters viewport
  useEffect(() => {
    if (!imageRef.current || !imageUrl) {
      // If no image URL, mark as loaded to show gradient
      setImageLoaded(true);
      return;
    }

    const observer = lazyLoadImage(imageRef.current, () => {
      setImageLoaded(true);
    });

    return () => {
      if (observer && imageRef.current) {
        observer.unobserve(imageRef.current);
      }
    };
  }, [imageUrl]);

  const handleClick = () => {
    // NEW: Route to opinion detail page if this is an editorial/opinion
    if (isEditorial && opinionSlug) {
      window.location.hash = `opinion/${opinionSlug}`;
      return;
    }

    // Fallback to external URL if available
    if (article.url) {
      window.open(article.url, '_blank', 'noopener,noreferrer');
    }
  };

  // Generate gradient based on category
  const getCategoryGradient = (category: string) => {
    const gradients: { [key: string]: string } = {
      'Local (Zim)': 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
      'Business (Zim)': 'linear-gradient(135deg, #065f46 0%, #10b981 100%)',
      'African Focus': 'linear-gradient(135deg, #b45309 0%, #f59e0b 100%)',
      'Global': 'linear-gradient(135deg, #991b1b 0%, #ef4444 100%)',
      'Sports': 'linear-gradient(135deg, #1e40af 0%, #60a5fa 100%)',
      'Tech': 'linear-gradient(135deg, #6b21a8 0%, #a78bfa 100%)',
      'General News': 'linear-gradient(135deg, #0c4a6e 0%, #06b6d4 100%)',
    };
    return gradients[category] || gradients['General News'];
  };

  // Get category icon
  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: string } = {
      'Local (Zim)': '📍',
      'Business (Zim)': '💼',
      'African Focus': '🌍',
      'Global': '🌎',
      'Sports': '⚽',
      'Tech': '💻',
      'General News': '📰',
    };
    return icons[category] || icons['General News'];
  };

  // Generate tags
  const getTags = () => {
    const tags = [`#${article.category.replace(/\s+/g, '')}`];

    // Dynamically add country tag based on userCountry prop
    if (article.category.includes('Local')) {
      if (userCountry?.code) {
        tags.push(`#${userCountry.code}News`);
      } else if (userCountry?.name) {
        tags.push(`#${userCountry.name.replace(/\s+/g, '')}News`);
      } else {
        tags.push('#ZimNews'); // Fallback
      }
    }

    if (article.category.includes('Business')) tags.push('#Business');
    if (article.category.includes('African')) tags.push('#Africa');

    return tags;
  };

  // Determine if card is clickable
  const isClickable = article.url || (isEditorial && opinionSlug);

  return (
    <article
      className={`article-card ${variant} ${isClickable ? 'clickable' : ''}`}
      onClick={handleClick}
    >
      <div
        ref={imageRef}
        className={`article-image ${imageLoaded ? 'loaded' : 'lazy'}`}
        style={{
          backgroundImage: (imageUrl && imageLoaded)
            ? `url(${imageUrl})`
            : getCategoryGradient(article.category),
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: imageLoaded ? 1 : 0.7,
          transition: 'opacity 0.3s ease',
        }}
      >
        {/* Glassmorphism overlay with tags */}
        <div className="article-image-overlay glassmorphism">
          <div className="article-tags-overlay">
            {getTags().map((tag, index) => (
              <span key={index} className="article-tag-overlay">{tag}</span>
            ))}
          </div>
        </div>
      </div>
      <div className="article-content">
        <h3 className="article-headline">{article.headline}</h3>
        <p className="article-detail">{article.detail}</p>

        {/* NEW: Inline AI Summary Trigger */}
        <div style={{ margin: '12px 0 8px 0' }}>
          <button
            onClick={handleToggleSummary}
            aria-expanded={isSummaryExpanded}
            aria-label="Toggle AI Summary"
            style={{
              background: 'none',
              border: '1px solid #e5e7eb',
              borderRadius: '20px',
              padding: '6px 12px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              fontSize: '0.85rem',
              color: '#4b5563',
              fontWeight: '500',
              fontFamily: 'system-ui, sans-serif',
              transition: 'all 0.2s ease',
              backgroundColor: isSummaryExpanded ? '#f3f4f6' : 'transparent'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f9fafb';
              e.currentTarget.style.borderColor = '#d1d5db';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = isSummaryExpanded ? '#f3f4f6' : 'transparent';
              e.currentTarget.style.borderColor = '#e5e7eb';
            }}
          >
            <Sparkles size={variant === 'compact' || variant === 'text' ? 14 : 16} strokeWidth={1.5} color="currentColor" />
            <span>Quick Summary</span>
            {isSummaryExpanded ? <X size={14} style={{ marginLeft: '4px' }} /> : null}
          </button>
        </div>

        {/* NEW: Expanded Summary Panel */}
        {isSummaryExpanded && (
          <div
            className="ai-summary-panel"
            style={{
              backgroundColor: '#f9fafb',
              border: '1px solid #f3f4f6',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '16px',
              marginTop: '8px',
              fontSize: '0.95rem',
              lineHeight: '1.6',
              color: '#1f2937',
              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)',
              animation: 'fadeIn 0.2s ease-out'
            }}
            onClick={(e) => e.stopPropagation()} // Prevent closing
          >
            {summaryLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6b7280', fontSize: '0.9rem' }}>
                <div className="pulsing-dot" style={{ width: '6px', height: '6px', backgroundColor: '#9ca3af', borderRadius: '50%' }}></div>
                Generated by Morning Pulse AI...
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', marginBottom: '12px', gap: '16px' }}>
                  <button
                    onClick={() => setActiveTab('summary')}
                    style={{
                      background: 'none',
                      border: 'none',
                      borderBottom: activeTab === 'summary' ? '2px solid #000' : '2px solid transparent',
                      padding: '0 0 8px 0',
                      fontSize: '0.9rem',
                      fontWeight: activeTab === 'summary' ? '700' : '500',
                      color: activeTab === 'summary' ? '#000' : '#6b7280',
                      cursor: 'pointer'
                    }}
                  >
                    AI Summary
                  </button>
                  {summaryData?.opposingViews && (
                    <button
                      onClick={() => setActiveTab('opposing')}
                      style={{
                        background: 'none',
                        border: 'none',
                        borderBottom: activeTab === 'opposing' ? '2px solid #000' : '2px solid transparent',
                        padding: '0 0 8px 0',
                        fontSize: '0.9rem',
                        fontWeight: activeTab === 'opposing' ? '700' : '500',
                        color: activeTab === 'opposing' ? '#000' : '#6b7280',
                        cursor: 'pointer'
                      }}
                    >
                      Opposing Views
                    </button>
                  )}
                </div>

                <div style={{ minHeight: '60px' }}>
                  {activeTab === 'summary' ? (
                    <p style={{ margin: 0 }}>{summaryData?.summary}</p>
                  ) : (
                    <p style={{ margin: 0 }}>{summaryData?.opposingViews}</p>
                  )}
                </div>
                <div style={{ marginTop: '12px', fontSize: '0.75rem', color: '#9ca3af', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Brain size={12} /> AI-generated content. Verify important details.
                </div>
              </>
            )}
          </div>
        )}

        <div className="article-footer">
          <div className="article-meta">
            <span className="article-source">{article.source}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* Save Button */}
              <button
                onClick={handleSave}
                aria-label={isSaved ? "Remove from saved" : "Save article"}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  color: isSaved ? '#000' : '#9ca3af',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {isSaved ? <BookmarkCheck size={18} fill="#000" /> : <Bookmark size={18} />}
              </button>

              {isClickable && (
                <span className="article-link">Read more →</span>
              )}
            </div>
          </div>
          <div className="article-tags">
            {getTags().map((tag, index) => (
              <span key={index} className="article-tag">{tag}</span>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
};

export default ArticleCard;
