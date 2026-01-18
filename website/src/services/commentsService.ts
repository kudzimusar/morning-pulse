/**
 * Comments Service
 * Handles inline comments for collaborative editing
 * Supports @mentions, threaded conversations, and real-time updates
 */

import { collection, addDoc, updateDoc, deleteDoc, doc, query, where, orderBy, onSnapshot, serverTimestamp, Firestore } from 'firebase/firestore';
import { getApp } from 'firebase/app';

export interface Comment {
  id: string;
  articleId: string;
  authorId: string;
  authorName: string;
  authorRole: 'writer' | 'editor' | 'admin';
  content: string;
  selection: {
    startOffset: number;
    endOffset: number;
    text: string;
    xpath?: string;
  };
  position: {
    x: number;
    y: number;
  };
  parentId?: string; // For threaded replies
  mentions: string[]; // Array of mentioned user IDs
  status: 'active' | 'resolved' | 'deleted';
  createdAt: Date;
  updatedAt: Date;
}

export interface CommentThread {
  rootComment: Comment;
  replies: Comment[];
  totalCount: number;
}

// Get Firestore instance
const getDb = (): Firestore => {
  try {
    const app = getApp();
    return getDb();
  } catch (error) {
    console.error('Firebase initialization error:', error);
    throw new Error('Firebase not initialized');
  }
};

/**
 * Add a new inline comment
 */
export const addComment = async (
  articleId: string,
  authorId: string,
  authorName: string,
  authorRole: 'writer' | 'editor' | 'admin',
  content: string,
  selection: Comment['selection'],
  position: Comment['position'],
  parentId?: string
): Promise<string> => {
  const db = getDb();

  // Parse mentions from content (@username format)
  const mentions = extractMentions(content);

  const commentData = {
    articleId,
    authorId,
    authorName,
    authorRole,
    content,
    selection,
    position,
    parentId: parentId || null,
    mentions,
    status: 'active',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, 'comments'), commentData);
  return docRef.id;
};

/**
 * Extract @mentions from comment content
 */
const extractMentions = (content: string): string[] => {
  const mentionRegex = /@(\w+)/g;
  const mentions: string[] = [];
  let match;

  while ((match = mentionRegex.exec(content)) !== null) {
    mentions.push(match[1]); // username without @
  }

  return [...new Set(mentions)]; // Remove duplicates
};

/**
 * Update a comment
 */
export const updateComment = async (
  commentId: string,
  content: string,
  position?: Comment['position']
): Promise<void> => {
  const db = getDb();
  const commentRef = doc(db, 'comments', commentId);

  const updates: any = {
    content,
    updatedAt: serverTimestamp(),
  };

  if (position) {
    updates.position = position;
  }

  // Update mentions if content changed
  updates.mentions = extractMentions(content);

  await updateDoc(commentRef, updates);
};

/**
 * Delete/resolve a comment
 */
export const resolveComment = async (commentId: string): Promise<void> => {
  const db = getDb();
  const commentRef = doc(db, 'comments', commentId);

  await updateDoc(commentRef, {
    status: 'resolved',
    updatedAt: serverTimestamp(),
  });
};

/**
 * Permanently delete a comment
 */
export const deleteComment = async (commentId: string): Promise<void> => {
  const db = getDb();
  const commentRef = doc(db, 'comments', commentId);

  await updateDoc(commentRef, {
    status: 'deleted',
    updatedAt: serverTimestamp(),
  });
};

/**
 * Get all comments for an article
 */
export const getArticleComments = async (articleId: string): Promise<Comment[]> => {
  const db = getDb();

  const q = query(
    collection(db, 'comments'),
    where('articleId', '==', articleId),
    where('status', '!=', 'deleted'),
    orderBy('createdAt', 'asc')
  );

  const snapshot = await getDocs(q);
  const comments: Comment[] = [];

  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    comments.push({
      id: docSnap.id,
      ...data,
      createdAt: data.createdAt?.toDate?.() || new Date(),
      updatedAt: data.updatedAt?.toDate?.() || new Date(),
    } as Comment);
  });

  return comments;
};

/**
 * Subscribe to real-time comment updates for an article
 */
export const subscribeToArticleComments = (
  articleId: string,
  callback: (comments: Comment[]) => void
): (() => void) => {
  const db = getDb();

  const q = query(
    collection(db, 'comments'),
    where('articleId', '==', articleId),
    where('status', '!=', 'deleted'),
    orderBy('createdAt', 'asc')
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const comments: Comment[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      comments.push({
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || new Date(),
        updatedAt: data.updatedAt?.toDate?.() || new Date(),
      } as Comment);
    });
    callback(comments);
  });

  return unsubscribe;
};

/**
 * Get comment threads (organized by parent/child relationships)
 */
export const getCommentThreads = (comments: Comment[]): CommentThread[] => {
  const threads: CommentThread[] = [];
  const commentMap = new Map<string, Comment>();
  const repliesMap = new Map<string, Comment[]>();

  // Organize comments
  comments.forEach(comment => {
    commentMap.set(comment.id, comment);

    if (comment.parentId) {
      if (!repliesMap.has(comment.parentId)) {
        repliesMap.set(comment.parentId, []);
      }
      repliesMap.get(comment.parentId)!.push(comment);
    }
  });

  // Create threads
  comments.forEach(comment => {
    if (!comment.parentId) {
      // Root comment
      const replies = repliesMap.get(comment.id) || [];
      threads.push({
        rootComment: comment,
        replies: replies.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()),
        totalCount: 1 + replies.length
      });
    }
  });

  return threads.sort((a, b) => b.rootComment.createdAt.getTime() - a.rootComment.createdAt.getTime());
};

/**
 * Search comments by content or author
 */
export const searchComments = async (
  articleId: string,
  searchTerm: string
): Promise<Comment[]> => {
  const allComments = await getArticleComments(articleId);

  const term = searchTerm.toLowerCase();
  return allComments.filter(comment =>
    comment.content.toLowerCase().includes(term) ||
    comment.authorName.toLowerCase().includes(term) ||
    comment.selection.text.toLowerCase().includes(term)
  );
};

/**
 * Get unread comment count for a user
 */
export const getUnreadCommentCount = async (
  userId: string,
  articleId?: string
): Promise<number> => {
  // This would typically track last read timestamps per user
  // For now, return total active comments
  const comments = articleId
    ? await getArticleComments(articleId)
    : await getAllUserComments(userId);

  return comments.filter(c => c.status === 'active').length;
};

/**
 * Get all comments where user is mentioned or is the author
 */
export const getAllUserComments = async (userId: string): Promise<Comment[]> => {
  const db = getDb();

  const q = query(
    collection(db, 'comments'),
    where('authorId', '==', userId),
    where('status', '!=', 'deleted'),
    orderBy('createdAt', 'desc')
  );

  const snapshot = await getDocs(q);
  const comments: Comment[] = [];

  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    comments.push({
      id: docSnap.id,
      ...data,
      createdAt: data.createdAt?.toDate?.() || new Date(),
      updatedAt: data.updatedAt?.toDate?.() || new Date(),
    } as Comment);
  });

  return comments;
};