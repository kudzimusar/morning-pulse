import React, { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { NewsStory } from '../../types';

interface MobileSearchProps {
  isOpen: boolean;
  onClose: () => void;
  newsData?: { [category: string]: NewsStory[] };
  onArticleClick?: (article: NewsStory) => void;
}

const MobileSearch: React.FC<MobileSearchProps> = ({
  isOpen,
  onClose,
  newsData = {},
  onArticleClick,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<NewsStory[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const searchTerm = query.toLowerCase();
    const allArticles: NewsStory[] = [];
    
    Object.values(newsData).forEach(categoryArticles => {
      allArticles.push(...categoryArticles);
    });

    const filtered = allArticles.filter(article => {
      const headline = article.headline?.toLowerCase() || '';
      const detail = article.detail?.toLowerCase() || '';
      const source = article.source?.toLowerCase() || '';
      const category = article.category?.toLowerCase() || '';
      
      return headline.includes(searchTerm) ||
             detail.includes(searchTerm) ||
             source.includes(searchTerm) ||
             category.includes(searchTerm);
    });

    // Sort by relevance (headline matches first)
    const sorted = filtered.sort((a, b) => {
      const aHeadline = a.headline?.toLowerCase() || '';
      const bHeadline = b.headline?.toLowerCase() || '';
      const aHeadlineMatch = aHeadline.includes(searchTerm);
      const bHeadlineMatch = bHeadline.includes(searchTerm);
      
      if (aHeadlineMatch && !bHeadlineMatch) return -1;
      if (!aHeadlineMatch && bHeadlineMatch) return 1;
      return 0;
    });

    setResults(sorted.slice(0, 20)); // Limit to 20 results
  }, [query, newsData]);

  const handleArticleClick = (article: NewsStory) => {
    if (onArticleClick) {
      onArticleClick(article);
    } else if (article.url) {
      window.open(article.url, '_blank', 'noopener,noreferrer');
    }
    onClose();
    setQuery('');
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="mobile-search-backdrop"
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1998,
          animation: 'fadeIn 0.2s ease',
        }}
      />

      {/* Search Panel */}
      <div
        className="mobile-search-panel"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          background: '#ffffff',
          zIndex: 1999,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
          paddingTop: 'env(safe-area-inset-top)',
          maxHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Search Input */}
        <div style={{
          padding: '16px',
          borderBottom: '1px solid #e0e0e0',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            flex: 1,
            background: '#f3f4f6',
            borderRadius: '8px',
            padding: '0 12px',
            gap: '8px',
          }}>
            <Search size={20} color="#666" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search articles..."
              style={{
                flex: 1,
                border: 'none',
                background: 'transparent',
                padding: '12px 0',
                fontSize: '1rem',
                outline: 'none',
              }}
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <X size={18} color="#666" />
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              fontSize: '0.9375rem',
              color: '#1a1a1a',
              fontWeight: 500,
            }}
          >
            Cancel
          </button>
        </div>

        {/* Results */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}>
          {query && results.length === 0 && (
            <div style={{
              padding: '32px 16px',
              textAlign: 'center',
              color: '#666666',
            }}>
              No results found for "{query}"
            </div>
          )}

          {query && results.length > 0 && (
            <div style={{ padding: '8px 0' }}>
              <div style={{
                padding: '12px 16px',
                fontSize: '0.75rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: '#666666',
              }}>
                {results.length} {results.length === 1 ? 'Result' : 'Results'}
              </div>
              {results.map((article) => (
                <button
                  key={article.id}
                  onClick={() => handleArticleClick(article)}
                  style={{
                    width: '100%',
                    padding: '16px',
                    background: 'none',
                    border: 'none',
                    borderBottom: '1px solid #e0e0e0',
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}
                  className="mobile-search-result"
                >
                  <div style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: '#666666',
                    textTransform: 'uppercase',
                    marginBottom: '4px',
                  }}>
                    {article.category}
                  </div>
                  <div style={{
                    fontSize: '1rem',
                    fontWeight: 600,
                    color: '#1a1a1a',
                    marginBottom: '4px',
                    lineHeight: 1.4,
                  }}>
                    {article.headline}
                  </div>
                  {article.detail && (
                    <div style={{
                      fontSize: '0.875rem',
                      color: '#666666',
                      lineHeight: 1.5,
                      marginBottom: '4px',
                    }}>
                      {article.detail.substring(0, 100)}...
                    </div>
                  )}
                  <div style={{
                    fontSize: '0.75rem',
                    color: '#999999',
                    marginTop: '4px',
                  }}>
                    {article.source}
                  </div>
                </button>
              ))}
            </div>
          )}

          {!query && (
            <div style={{
              padding: '32px 16px',
              textAlign: 'center',
              color: '#666666',
            }}>
              <Search size={48} color="#e0e0e0" style={{ marginBottom: '16px', opacity: 0.5 }} />
              <div style={{ fontSize: '1rem', marginBottom: '8px' }}>Search Articles</div>
              <div style={{ fontSize: '0.875rem' }}>Type to search headlines, content, and sources</div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .mobile-search-result:active {
          background-color: #f3f4f6;
        }
      `}</style>
    </>
  );
};

export default MobileSearch;
