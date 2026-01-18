/**
 * Inline Comments Component
 * Provides Google Docs-style commenting for collaborative editing
 * Supports threaded replies, @mentions, and real-time updates
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  addComment,
  updateComment,
  resolveComment,
  deleteComment,
  subscribeToArticleComments,
  getCommentThreads,
  Comment,
  CommentThread
} from '../services/commentsService';
import MentionsInput from './MentionsInput';

interface User {
  id: string;
  name: string;
  role: 'writer' | 'editor' | 'admin';
  email?: string;
}

interface InlineCommentsProps {
  articleId: string;
  currentUser: User;
  users: User[]; // All available users for mentions
  isReadOnly?: boolean;
  onSelectionChange?: (selection: Selection | null) => void;
}

interface CommentBubbleProps {
  thread: CommentThread;
  currentUser: InlineCommentsProps['currentUser'];
  onResolve: (commentId: string) => void;
  onDelete: (commentId: string) => void;
  onReply: (parentId: string, content: string) => void;
  onUpdate: (commentId: string, content: string) => void;
}

const CommentBubble: React.FC<CommentBubbleProps> = ({
  thread,
  currentUser,
  onResolve,
  onDelete,
  onReply,
  onUpdate
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const handleReply = async () => {
    if (!replyContent.trim()) return;

    try {
      await onReply(thread.rootComment.id, replyContent);
      setReplyContent('');
      setShowReplyForm(false);
    } catch (error) {
      console.error('Failed to add reply:', error);
    }
  };

  const handleEdit = async (commentId: string) => {
    if (!editContent.trim()) return;

    try {
      await onUpdate(commentId, editContent);
      setEditingComment(null);
      setEditContent('');
    } catch (error) {
      console.error('Failed to update comment:', error);
    }
  };

  const startEdit = (comment: Comment) => {
    setEditingComment(comment.id);
    setEditContent(comment.content);
  };

  const renderComment = (comment: Comment, isReply = false) => (
    <div key={comment.id} style={{
      padding: isReply ? '8px 12px' : '12px 16px',
      borderBottom: isReply ? 'none' : '1px solid #e5e5e5',
      backgroundColor: comment.status === 'resolved' ? '#f0fdf4' : '#fff'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
        <div style={{
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          backgroundColor: getRoleColor(comment.authorRole),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontSize: '12px',
          fontWeight: 'bold',
          marginRight: '8px'
        }}>
          {comment.authorName.charAt(0).toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <span style={{ fontWeight: '600', fontSize: '14px' }}>
            {comment.authorName}
          </span>
          <span style={{
            fontSize: '12px',
            color: '#666',
            marginLeft: '8px'
          }}>
            {comment.authorRole} • {formatTimeAgo(comment.createdAt)}
          </span>
          {comment.status === 'resolved' && (
            <span style={{
              fontSize: '12px',
              color: '#10b981',
              marginLeft: '8px',
              fontWeight: '500'
            }}>
              ✓ Resolved
            </span>
          )}
        </div>
      </div>

      {editingComment === comment.id ? (
        <div style={{ marginBottom: '8px' }}>
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            style={{
              width: '100%',
              minHeight: '60px',
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px',
              resize: 'vertical'
            }}
          />
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <button
              onClick={() => handleEdit(comment.id)}
              style={{
                padding: '4px 12px',
                backgroundColor: '#3b82f6',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              Save
            </button>
            <button
              onClick={() => setEditingComment(null)}
              style={{
                padding: '4px 12px',
                backgroundColor: '#6b7280',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div style={{
          fontSize: '14px',
          lineHeight: '1.5',
          marginBottom: '8px',
          whiteSpace: 'pre-wrap'
        }}>
          {comment.content}
        </div>
      )}

      {/* Selected text highlight */}
      <div style={{
        fontSize: '12px',
        color: '#666',
        fontStyle: 'italic',
        marginBottom: '8px',
        padding: '4px 8px',
        backgroundColor: '#f9fafb',
        borderLeft: '2px solid #3b82f6'
      }}>
        "{comment.selection.text}"
      </div>

      {/* Action buttons */}
      {editingComment !== comment.id && (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {!isReply && (
            <button
              onClick={() => setShowReplyForm(!showReplyForm)}
              style={{
                padding: '2px 8px',
                backgroundColor: 'transparent',
                color: '#3b82f6',
                border: '1px solid #3b82f6',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              Reply
            </button>
          )}

          {(currentUser.id === comment.authorId || currentUser.role === 'admin') && (
            <>
              <button
                onClick={() => startEdit(comment)}
                style={{
                  padding: '2px 8px',
                  backgroundColor: 'transparent',
                  color: '#6b7280',
                  border: '1px solid #6b7280',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                Edit
              </button>

              <button
                onClick={() => onResolve(comment.id)}
                style={{
                  padding: '2px 8px',
                  backgroundColor: 'transparent',
                  color: '#10b981',
                  border: '1px solid #10b981',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                {comment.status === 'resolved' ? 'Unresolve' : 'Resolve'}
              </button>

              <button
                onClick={() => onDelete(comment.id)}
                style={{
                  padding: '2px 8px',
                  backgroundColor: 'transparent',
                  color: '#ef4444',
                  border: '1px solid #ef4444',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                Delete
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div style={{
      position: 'absolute',
      backgroundColor: '#fff',
      border: '1px solid #e5e5e5',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      zIndex: 1000,
      minWidth: '300px',
      maxWidth: '400px'
    }}>
      {/* Header */}
      <div
        style={{
          padding: '12px 16px',
          backgroundColor: thread.rootComment.status === 'resolved' ? '#f0fdf4' : '#f9fafb',
          borderBottom: '1px solid #e5e5e5',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            backgroundColor: getRoleColor(thread.rootComment.authorRole),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: '10px',
            fontWeight: 'bold',
            marginRight: '8px'
          }}>
            {thread.rootComment.authorName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: '600' }}>
              {thread.rootComment.authorName}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              {thread.totalCount} comment{thread.totalCount !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
        <div style={{
          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s'
        }}>
          ▼
        </div>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <>
          {/* Root comment */}
          {renderComment(thread.rootComment)}

          {/* Replies */}
          {thread.replies.map(reply => renderComment(reply, true))}

          {/* Reply form */}
          {showReplyForm && (
            <div style={{
              padding: '12px 16px',
              borderTop: '1px solid #e5e5e5',
              backgroundColor: '#f9fafb'
            }}>
              <MentionsInput
                value={replyContent}
                onChange={setReplyContent}
                placeholder="Write a reply... @mention colleagues"
                users={users}
                currentUser={currentUser}
                style={{
                  minHeight: '60px',
                  marginBottom: '8px'
                }}
              />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={handleReply}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#3b82f6',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  Reply
                </button>
                <button
                  onClick={() => {
                    setShowReplyForm(false);
                    setReplyContent('');
                  }}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#6b7280',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

const InlineComments: React.FC<InlineCommentsProps> = ({
  articleId,
  currentUser,
  users,
  isReadOnly = false,
  onSelectionChange
}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentThreads, setCommentThreads] = useState<CommentThread[]>([]);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [commentContent, setCommentContent] = useState('');
  const [selectedText, setSelectedText] = useState<string>('');
  const [selectionRange, setSelectionRange] = useState<Range | null>(null);
  const [commentPosition, setCommentPosition] = useState<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Subscribe to real-time comment updates
  useEffect(() => {
    const unsubscribe = subscribeToArticleComments(articleId, (updatedComments) => {
      setComments(updatedComments);
      setCommentThreads(getCommentThreads(updatedComments));
    });

    return unsubscribe;
  }, [articleId]);

  // Handle text selection
  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) {
        setSelectedText('');
        setSelectionRange(null);
        setCommentPosition(null);
        setShowCommentForm(false);
        onSelectionChange?.(null);
        return;
      }

      const range = selection.getRangeAt(0);
      const text = range.toString().trim();

      if (text.length > 0 && containerRef.current?.contains(range.commonAncestorContainer)) {
        setSelectedText(text);
        setSelectionRange(range);

        // Calculate position for comment bubble
        const rect = range.getBoundingClientRect();
        setCommentPosition({
          x: rect.left + rect.width / 2,
          y: rect.top - 10
        });

        setShowCommentForm(true);
        onSelectionChange?.(selection);
      } else {
        setSelectedText('');
        setSelectionRange(null);
        setCommentPosition(null);
        setShowCommentForm(false);
        onSelectionChange?.(null);
      }
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, [onSelectionChange]);

  const handleAddComment = async () => {
    if (!commentContent.trim() || !selectionRange || !selectedText) return;

    try {
      // Calculate selection offsets within the content
      const selection = {
        startOffset: selectionRange.startOffset,
        endOffset: selectionRange.endOffset,
        text: selectedText,
        xpath: getXPath(selectionRange.startContainer)
      };

      await addComment(
        articleId,
        currentUser.id,
        currentUser.name,
        currentUser.role,
        commentContent,
        selection,
        commentPosition!,
        undefined // root comment
      );

      setCommentContent('');
      setShowCommentForm(false);
      setSelectedText('');
      setSelectionRange(null);
      setCommentPosition(null);

      // Clear selection
      window.getSelection()?.removeAllRanges();
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  };

  const handleResolveComment = async (commentId: string) => {
    try {
      await resolveComment(commentId);
    } catch (error) {
      console.error('Failed to resolve comment:', error);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Delete this comment permanently?')) return;

    try {
      await deleteComment(commentId);
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  };

  const handleReply = async (parentId: string, content: string) => {
    try {
      // Use parent comment's selection for reply
      const parentComment = comments.find(c => c.id === parentId);
      if (!parentComment) return;

      await addComment(
        articleId,
        currentUser.id,
        currentUser.name,
        currentUser.role,
        content,
        parentComment.selection,
        { x: 0, y: 0 }, // Position will be calculated
        parentId
      );
    } catch (error) {
      console.error('Failed to add reply:', error);
    }
  };

  const handleUpdateComment = async (commentId: string, content: string) => {
    try {
      await updateComment(commentId, content);
    } catch (error) {
      console.error('Failed to update comment:', error);
    }
  };

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      {/* Comment bubbles */}
      {commentThreads.map((thread) => (
        <div
          key={thread.rootComment.id}
          style={{
            position: 'absolute',
            left: thread.rootComment.position.x,
            top: thread.rootComment.position.y,
            zIndex: 1000
          }}
        >
          <CommentBubble
            thread={thread}
            currentUser={currentUser}
            onResolve={handleResolveComment}
            onDelete={handleDeleteComment}
            onReply={handleReply}
            onUpdate={handleUpdateComment}
          />
        </div>
      ))}

      {/* New comment form */}
      {showCommentForm && commentPosition && !isReadOnly && (
        <div
          style={{
            position: 'absolute',
            left: commentPosition.x,
            top: commentPosition.y,
            zIndex: 1001,
            backgroundColor: '#fff',
            border: '2px solid #3b82f6',
            borderRadius: '8px',
            padding: '16px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            minWidth: '300px'
          }}
        >
          <div style={{
            fontSize: '12px',
            color: '#666',
            marginBottom: '8px',
            fontStyle: 'italic'
          }}>
            "{selectedText}"
          </div>

          <MentionsInput
            value={commentContent}
            onChange={setCommentContent}
            placeholder="Add a comment... @mention colleagues"
            users={users}
            currentUser={currentUser}
            style={{
              minHeight: '80px',
              marginBottom: '12px'
            }}
          />

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button
              onClick={handleAddComment}
              style={{
                padding: '6px 12px',
                backgroundColor: '#3b82f6',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              Comment
            </button>
            <button
              onClick={() => {
                setShowCommentForm(false);
                setCommentContent('');
                setSelectedText('');
                setSelectionRange(null);
                setCommentPosition(null);
                window.getSelection()?.removeAllRanges();
              }}
              style={{
                padding: '6px 12px',
                backgroundColor: '#6b7280',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Comments panel toggle */}
      <div style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 999
      }}>
        <button
          onClick={() => {/* Toggle comments panel */}}
          style={{
            padding: '8px 12px',
            backgroundColor: '#3b82f6',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          💬 {comments.length} Comments
        </button>
      </div>
    </div>
  );
};

// Helper functions
const getRoleColor = (role: string): string => {
  switch (role) {
    case 'admin': return '#ef4444';
    case 'editor': return '#f59e0b';
    case 'writer': return '#10b981';
    default: return '#6b7280';
  }
};

const formatTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
};

const getXPath = (element: Node): string => {
  if (element.nodeType === Node.TEXT_NODE) {
    return getXPath(element.parentNode!) + '/text()[' + Array.from(element.parentNode!.childNodes).indexOf(element as ChildNode) + 1 + ']';
  }

  if (element.nodeType === Node.ELEMENT_NODE) {
    const elementName = (element as Element).tagName.toLowerCase();
    let path = '/' + elementName;
    let sibling = element.previousSibling;
    let count = 1;

    while (sibling) {
      if (sibling.nodeType === Node.ELEMENT_NODE && (sibling as Element).tagName.toLowerCase() === elementName) {
        count++;
      }
      sibling = sibling.previousSibling;
    }

    if (count > 1) {
      path += '[' + count + ']';
    }

    return getXPath(element.parentNode!) + path;
  }

  return '';
};

export default InlineComments;