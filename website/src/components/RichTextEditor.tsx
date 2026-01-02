import React, { useRef, useEffect, useState } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Write your content here...',
  disabled = false,
  className = '',
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [wordCount, setWordCount] = useState(0);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
      // Update word count when value changes externally
      const text = editorRef.current.innerText || editorRef.current.textContent || '';
      const words = text.trim().split(/\s+/).filter(word => word.length > 0);
      setWordCount(words.length);
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
      // Calculate word count (strip HTML tags and count words)
      const text = editorRef.current.innerText || editorRef.current.textContent || '';
      const words = text.trim().split(/\s+/).filter(word => word.length > 0);
      setWordCount(words.length);
    }
  };

  // Handle paste events - allow default browser behavior to preserve HTML formatting
  const handlePaste = (e: React.ClipboardEvent) => {
    // Allow default paste behavior to preserve formatting from Word/Google Docs
    // The browser will handle HTML paste automatically
    setTimeout(() => {
      handleInput();
    }, 0);
  };

  const execCommand = (command: string, value?: string | null) => {
    document.execCommand(command, false, value || null);
    editorRef.current?.focus();
    handleInput();
  };

  const handleBold = () => execCommand('bold', null);
  const handleItalic = () => execCommand('italic', null);
  const handleUnderline = () => execCommand('underline', null);
  const handleH1 = () => execCommand('formatBlock', '<h1>');
  const handleH2 = () => execCommand('formatBlock', '<h2>');
  const handleBlockquote = () => execCommand('formatBlock', '<blockquote>');
  const handleBulletList = () => execCommand('insertUnorderedList', null);
  const handleLink = () => {
    const url = prompt('Enter URL:');
    if (url) {
      execCommand('createLink', url);
    }
  };

  return (
    <div 
      className={className}
      style={{
        border: '2px solid #334155',
        borderRadius: '8px',
        overflow: 'hidden'
      }}
    >
      {/* Toolbar */}
      <div
        style={{
          display: 'flex',
          gap: '10px',
          padding: '10px',
          background: '#f8fafc',
          borderBottom: '1px solid #e2e8f0'
        }}
      >
        <button
          type="button"
          onClick={handleBold}
          disabled={disabled}
          title="Bold"
          style={{
            padding: '6px 12px',
            border: '1px solid #cbd5e1',
            borderRadius: '4px',
            background: 'white',
            cursor: disabled ? 'not-allowed' : 'pointer',
            fontWeight: 'bold'
          }}
        >
          B
        </button>
        <button
          type="button"
          onClick={handleItalic}
          disabled={disabled}
          title="Italic"
          style={{
            padding: '6px 12px',
            border: '1px solid #cbd5e1',
            borderRadius: '4px',
            background: 'white',
            cursor: disabled ? 'not-allowed' : 'pointer',
            fontStyle: 'italic'
          }}
        >
          I
        </button>
        <button
          type="button"
          onClick={handleUnderline}
          disabled={disabled}
          title="Underline"
          style={{
            padding: '6px 12px',
            border: '1px solid #cbd5e1',
            borderRadius: '4px',
            background: 'white',
            cursor: disabled ? 'not-allowed' : 'pointer',
            textDecoration: 'underline'
          }}
        >
          U
        </button>
        <button
          type="button"
          onClick={handleH1}
          disabled={disabled}
          title="Heading 1"
          style={{
            padding: '6px 12px',
            border: '1px solid #cbd5e1',
            borderRadius: '4px',
            background: 'white',
            cursor: disabled ? 'not-allowed' : 'pointer'
          }}
        >
          H1
        </button>
        <button
          type="button"
          onClick={handleH2}
          disabled={disabled}
          title="Heading 2"
          style={{
            padding: '6px 12px',
            border: '1px solid #cbd5e1',
            borderRadius: '4px',
            background: 'white',
            cursor: disabled ? 'not-allowed' : 'pointer'
          }}
        >
          H2
        </button>
        <button
          type="button"
          onClick={handleBlockquote}
          disabled={disabled}
          title="Blockquote"
          style={{
            padding: '6px 12px',
            border: '1px solid #cbd5e1',
            borderRadius: '4px',
            background: 'white',
            cursor: disabled ? 'not-allowed' : 'pointer',
            fontSize: '18px'
          }}
        >
          &ldquo;
        </button>
        <button
          type="button"
          onClick={handleBulletList}
          disabled={disabled}
          title="Bullet List"
          style={{
            padding: '6px 12px',
            border: '1px solid #cbd5e1',
            borderRadius: '4px',
            background: 'white',
            cursor: disabled ? 'not-allowed' : 'pointer',
            fontSize: '18px'
          }}
        >
          &bull;
        </button>
        <button
          type="button"
          onClick={handleLink}
          disabled={disabled}
          title="Insert Link"
          style={{
            padding: '6px 12px',
            border: '1px solid #cbd5e1',
            borderRadius: '4px',
            background: 'white',
            cursor: disabled ? 'not-allowed' : 'pointer'
          }}
        >
          🔗
        </button>
      </div>
      
      {/* Editor Area */}
      <div
        ref={editorRef}
        contentEditable={!disabled}
        onInput={handleInput}
        onPaste={handlePaste}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        data-placeholder={placeholder}
        suppressContentEditableWarning={true}
        style={{
          minHeight: '500px',
          padding: '24px',
          outline: 'none',
          fontFamily: "'Georgia', serif",
          lineHeight: '1.6',
          ...(isFocused ? {} : {
            color: editorRef.current?.innerHTML ? 'inherit' : '#9ca3af'
          })
        }}
      />
      {/* Word Count Indicator - bottom-right */}
      <div
        style={{
          padding: '10px 24px',
          borderTop: '1px solid #e2e8f0',
          backgroundColor: '#f8fafc',
          fontSize: '0.875rem',
          color: '#6b7280',
          textAlign: 'right'
        }}
      >
        {wordCount} {wordCount === 1 ? 'word' : 'words'}
      </div>
      <style>{`
        [contenteditable][data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
};

export default RichTextEditor;
