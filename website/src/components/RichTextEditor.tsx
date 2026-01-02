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

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  // Handle paste events to preserve formatting from Word/Google Docs
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/html') || e.clipboardData.getData('text/plain');
    
    if (editorRef.current) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        
        // Create a temporary div to parse HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = text;
        
        // Insert the formatted content
        const fragment = document.createDocumentFragment();
        while (tempDiv.firstChild) {
          fragment.appendChild(tempDiv.firstChild);
        }
        range.insertNode(fragment);
        
        // Move cursor to end of inserted content
        range.setStartAfter(fragment.lastChild || range.startContainer);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
      }
      
      handleInput();
    }
  };

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput();
  };

  const handleBold = () => execCommand('bold');
  const handleItalic = () => execCommand('italic');
  const handleUnderline = () => execCommand('underline');
  const handleH1 = () => execCommand('formatBlock', '<h1>');
  const handleH2 = () => execCommand('formatBlock', '<h2>');
  const handleBlockquote = () => execCommand('formatBlock', '<blockquote>');
  const handleBulletList = () => execCommand('insertUnorderedList');
  const handleLink = () => {
    const url = prompt('Enter URL:');
    if (url) {
      execCommand('createLink', url);
    }
  };

  const isCommandActive = (command: string): boolean => {
    try {
      return document.queryCommandState(command);
    } catch {
      return false;
    }
  };

  const isFormatBlockActive = (tag: string): boolean => {
    try {
      return document.queryCommandValue('formatBlock') === tag;
    } catch {
      return false;
    }
  };

  return (
    <div className={`rich-text-editor ${className} ${disabled ? 'disabled' : ''}`}>
      <div className="rich-text-toolbar">
        <button
          type="button"
          className={`toolbar-button ${isCommandActive('bold') ? 'active' : ''}`}
          onClick={handleBold}
          disabled={disabled}
          title="Bold"
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          className={`toolbar-button ${isCommandActive('italic') ? 'active' : ''}`}
          onClick={handleItalic}
          disabled={disabled}
          title="Italic"
        >
          <em>I</em>
        </button>
        <button
          type="button"
          className={`toolbar-button ${isCommandActive('underline') ? 'active' : ''}`}
          onClick={handleUnderline}
          disabled={disabled}
          title="Underline"
        >
          <u>U</u>
        </button>
        <div className="toolbar-separator" />
        <button
          type="button"
          className={`toolbar-button ${isFormatBlockActive('h1') ? 'active' : ''}`}
          onClick={handleH1}
          disabled={disabled}
          title="Heading 1"
        >
          H1
        </button>
        <button
          type="button"
          className={`toolbar-button ${isFormatBlockActive('h2') ? 'active' : ''}`}
          onClick={handleH2}
          disabled={disabled}
          title="Heading 2"
        >
          H2
        </button>
        <div className="toolbar-separator" />
        <button
          type="button"
          className={`toolbar-button ${isFormatBlockActive('blockquote') ? 'active' : ''}`}
          onClick={handleBlockquote}
          disabled={disabled}
          title="Blockquote"
        >
          &ldquo;
        </button>
        <button
          type="button"
          className={`toolbar-button ${isCommandActive('insertUnorderedList') ? 'active' : ''}`}
          onClick={handleBulletList}
          disabled={disabled}
          title="Bullet List"
        >
          &bull;
        </button>
        <div className="toolbar-separator" />
        <button
          type="button"
          className="toolbar-button"
          onClick={handleLink}
          disabled={disabled}
          title="Insert Link"
        >
          🔗
        </button>
      </div>
      <div
        ref={editorRef}
        contentEditable={!disabled}
        onInput={handleInput}
        onPaste={handlePaste}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={`rich-text-content ${isFocused ? 'focused' : ''}`}
        data-placeholder={placeholder}
        suppressContentEditableWarning={true}
      />
    </div>
  );
};

export default RichTextEditor;
