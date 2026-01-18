/**
 * Mentions Input Component
 * Provides @mention functionality with autocomplete for collaborative editing
 */

import React, { useState, useRef, useEffect } from 'react';

interface User {
  id: string;
  name: string;
  role: 'writer' | 'editor' | 'admin';
  email?: string;
}

interface MentionsInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  users: User[];
  currentUser: User;
  style?: React.CSSProperties;
}

const MentionsInput: React.FC<MentionsInputProps> = ({
  value,
  onChange,
  placeholder = "Type @ to mention someone...",
  users,
  currentUser,
  style
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [mentionStart, setMentionStart] = useState(-1);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const newCursorPosition = e.target.selectionStart || 0;

    onChange(newValue);
    setCursorPosition(newCursorPosition);

    // Check for @ mentions
    const textBeforeCursor = newValue.substring(0, newCursorPosition);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);

    if (mentionMatch) {
      const query = mentionMatch[1].toLowerCase();
      setMentionStart(newCursorPosition - query.length - 1); // -1 for the @

      // Filter users (exclude current user)
      const filteredUsers = users
        .filter(user =>
          user.id !== currentUser.id &&
          (user.name.toLowerCase().includes(query) ||
           user.email?.toLowerCase().includes(query))
        )
        .slice(0, 5); // Limit to 5 suggestions

      setSuggestions(filteredUsers);
      setShowSuggestions(filteredUsers.length > 0);
    } else {
      setShowSuggestions(false);
      setMentionStart(-1);
    }
  };

  // Handle suggestion selection
  const handleSuggestionClick = (user: User) => {
    if (mentionStart === -1) return;

    const beforeMention = value.substring(0, mentionStart);
    const afterMention = value.substring(cursorPosition);
    const mentionText = `@${user.name.replace(/\s+/g, '')}`;

    const newValue = beforeMention + mentionText + ' ' + afterMention;
    onChange(newValue);

    // Reset state
    setShowSuggestions(false);
    setMentionStart(-1);
    setCursorPosition(beforeMention.length + mentionText.length + 1);

    // Focus back to textarea
    setTimeout(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(cursorPosition, cursorPosition);
    }, 0);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === 'Escape') {
      setShowSuggestions(false);
      setMentionStart(-1);
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      // Could implement suggestion navigation here
    } else if (e.key === 'Enter' && showSuggestions) {
      e.preventDefault();
      if (suggestions.length > 0) {
        handleSuggestionClick(suggestions[0]);
      }
    }
  };

  // Hide suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (textareaRef.current && !textareaRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Calculate suggestion position
  const getSuggestionPosition = () => {
    if (!textareaRef.current || mentionStart === -1) return { top: 0, left: 0 };

    const textarea = textareaRef.current;
    const textBeforeMention = value.substring(0, mentionStart);
    const lines = textBeforeMention.split('\n');

    // Get text metrics
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return { top: 0, left: 0 };

    context.font = getComputedStyle(textarea).font;
    const lineHeight = parseInt(getComputedStyle(textarea).lineHeight) || 20;

    const currentLine = lines.length - 1;
    const currentLineText = lines[currentLine];
    const textWidth = context.measureText(currentLineText).width;

    const rect = textarea.getBoundingClientRect();
    const paddingLeft = parseInt(getComputedStyle(textarea).paddingLeft) || 0;
    const paddingTop = parseInt(getComputedStyle(textarea).paddingTop) || 0;

    return {
      top: rect.top + paddingTop + (currentLine * lineHeight) + lineHeight + 5,
      left: rect.left + paddingLeft + textWidth
    };
  };

  const suggestionPosition = getSuggestionPosition();

  return (
    <div style={{ position: 'relative', ...style }}>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        style={{
          width: '100%',
          minHeight: '80px',
          padding: '12px 16px',
          border: '1px solid #ddd',
          borderRadius: '8px',
          fontSize: '14px',
          lineHeight: '1.5',
          resize: 'vertical',
          fontFamily: 'inherit',
          outline: 'none',
          ...style
        }}
      />

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          style={{
            position: 'fixed',
            top: suggestionPosition.top,
            left: suggestionPosition.left,
            zIndex: 1000,
            backgroundColor: '#fff',
            border: '1px solid #ddd',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            minWidth: '200px',
            maxWidth: '300px',
            maxHeight: '200px',
            overflowY: 'auto'
          }}
        >
          {suggestions.map((user, index) => (
            <div
              key={user.id}
              onClick={() => handleSuggestionClick(user)}
              style={{
                padding: '8px 12px',
                cursor: 'pointer',
                borderBottom: index < suggestions.length - 1 ? '1px solid #f0f0f0' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'transparent',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f5f5f5';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                backgroundColor: getRoleColor(user.role),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: '12px',
                fontWeight: 'bold',
                flexShrink: 0
              }}>
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: '14px',
                  fontWeight: '500',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {user.name}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: '#666',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {user.role} {user.email && `• ${user.email}`}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Helper text */}
      <div style={{
        marginTop: '8px',
        fontSize: '12px',
        color: '#666'
      }}>
        💡 Type @ to mention team members
      </div>
    </div>
  );
};

// Helper function
const getRoleColor = (role: string): string => {
  switch (role) {
    case 'admin': return '#ef4444';
    case 'editor': return '#f59e0b';
    case 'writer': return '#10b981';
    default: return '#6b7280';
  }
};

export default MentionsInput;