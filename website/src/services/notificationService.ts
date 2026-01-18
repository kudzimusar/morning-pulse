/**
 * Notification Service
 * Handles push notifications and email notifications for writers, editors, and system events
 * 
 * Push Notifications: Real-time browser notifications when articles are published, edited, etc.
 * Email Notifications: Placeholder structure for Firebase Cloud Functions integration
 */

import { getFirestore, collection, addDoc, serverTimestamp, Firestore } from 'firebase/firestore';
import { getApp } from 'firebase/app';

export interface NotificationData {
  to: string;
  subject: string;
  body: string;
  type: 'writer_approved' | 'writer_rejected' | 'article_published' | 'article_rejected' | 'submission_received' | 'article_returned' | 'article_scheduled' | 'article_claimed';
}

export interface PushNotification {
  userId: string; // Writer or editor UID
  title: string;
  message: string;
  type: NotificationData['type'];
  articleId?: string;
  articleSlug?: string;
  timestamp: Date;
  read: boolean;
}

// Get Firestore instance
const getDb = (): Firestore => {
  try {
    const app = getApp();
    return getFirestore(app);
  } catch (error) {
    console.error('Firebase initialization error:', error);
    throw new Error('Firebase not initialized');
  }
};

/**
 * Send notification (placeholder - implement with actual email service)
 */
export const sendNotification = async (data: NotificationData): Promise<void> => {
  // TODO: Implement actual email sending via:
  // - Firebase Cloud Functions with SendGrid/Mailgun
  // - Firebase Extensions (Trigger Email)
  // - Third-party service API
  
  console.log('📧 Notification (placeholder):', {
    to: data.to,
    subject: data.subject,
    type: data.type
  });
  
  // For now, just log the notification
  // In production, this should call a Cloud Function or email API
};

/**
 * Send writer approval notification
 */
export const notifyWriterApproved = async (writerEmail: string, writerName: string): Promise<void> => {
  await sendNotification({
    to: writerEmail,
    subject: 'Your Writer Account Has Been Approved - Morning Pulse',
    body: `Hello ${writerName},\n\nYour writer account has been approved! You can now log in and start submitting articles.\n\nVisit: https://kudzimusar.github.io/morning-pulse/#writer/login\n\nBest regards,\nMorning Pulse Editorial Team`,
    type: 'writer_approved'
  });
};

/**
 * Send writer rejection notification
 */
export const notifyWriterRejected = async (writerEmail: string, writerName: string, reason: string): Promise<void> => {
  await sendNotification({
    to: writerEmail,
    subject: 'Writer Account Application - Morning Pulse',
    body: `Hello ${writerName},\n\nUnfortunately, your writer account application was not approved at this time.\n\nReason: ${reason}\n\nIf you have questions, please contact us at info@morningpulse.net\n\nBest regards,\nMorning Pulse Editorial Team`,
    type: 'writer_rejected'
  });
};

/**
 * Send article published notification
 */
export const notifyArticlePublished = async (writerEmail: string, writerName: string, articleTitle: string): Promise<void> => {
  await sendNotification({
    to: writerEmail,
    subject: `Your Article Has Been Published - "${articleTitle}"`,
    body: `Hello ${writerName},\n\nGreat news! Your article "${articleTitle}" has been published and is now live on Morning Pulse.\n\nView it here: https://kudzimusar.github.io/morning-pulse/#opinion\n\nThank you for your contribution!\n\nBest regards,\nMorning Pulse Editorial Team`,
    type: 'article_published'
  });
};

/**
 * Send article rejection notification
 */
export const notifyArticleRejected = async (writerEmail: string, writerName: string, articleTitle: string, reason?: string): Promise<void> => {
  await sendNotification({
    to: writerEmail,
    subject: `Article Submission Update - "${articleTitle}"`,
    body: `Hello ${writerName},\n\nYour article "${articleTitle}" was not published at this time.${reason ? `\n\nReason: ${reason}` : ''}\n\nYou can submit a new article or revise this one and resubmit.\n\nBest regards,\nMorning Pulse Editorial Team`,
    type: 'article_rejected'
  });
};

/**
 * Send submission received notification
 */
export const notifySubmissionReceived = async (writerEmail: string, writerName: string, articleTitle: string): Promise<void> => {
  await sendNotification({
    to: writerEmail,
    subject: `Submission Received - "${articleTitle}"`,
    body: `Hello ${writerName},\n\nWe've received your article submission "${articleTitle}" and it's now under editorial review. We'll notify you once a decision has been made.\n\nThank you for your submission!\n\nBest regards,\nMorning Pulse Editorial Team`,
    type: 'submission_received'
  });
};

/**
 * NEW: Send article returned notification (editor sent back with feedback)
 */
export const notifyArticleReturned = async (writerEmail: string, writerName: string, articleTitle: string, editorNotes: string): Promise<void> => {
  await sendNotification({
    to: writerEmail,
    subject: `Article Returned for Revision - "${articleTitle}"`,
    body: `Hello ${writerName},\n\nYour article "${articleTitle}" has been reviewed and returned for revisions.\n\nEditor Feedback:\n${editorNotes}\n\nPlease make the requested changes and resubmit.\n\nBest regards,\nMorning Pulse Editorial Team`,
    type: 'article_returned'
  });
};

/**
 * NEW: Send article scheduled notification
 */
export const notifyArticleScheduled = async (writerEmail: string, writerName: string, articleTitle: string, scheduledFor: Date): Promise<void> => {
  await sendNotification({
    to: writerEmail,
    subject: `Article Scheduled for Publication - "${articleTitle}"`,
    body: `Hello ${writerName},\n\nGreat news! Your article "${articleTitle}" has been scheduled for publication.\n\nGo Live Date: ${scheduledFor.toLocaleString()}\n\nWe'll notify you when it's published.\n\nBest regards,\nMorning Pulse Editorial Team`,
    type: 'article_scheduled'
  });
};

/**
 * NEW: Create push notification in Firestore
 * Stores in user's notification collection for real-time updates
 */
export const createPushNotification = async (notification: Omit<PushNotification, 'id' | 'timestamp' | 'read'>): Promise<void> => {
  const db = getDb();
  const APP_ID = 'morning-pulse-app';
  
  try {
    const notificationsRef = collection(db, 'artifacts', APP_ID, 'users', notification.userId, 'notifications');
    
    await addDoc(notificationsRef, {
      title: notification.title,
      message: notification.message,
      type: notification.type,
      articleId: notification.articleId || null,
      articleSlug: notification.articleSlug || null,
      timestamp: serverTimestamp(),
      read: false,
    });
    
    // NEW: Also trigger browser notification if permission granted
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
      });
    }
    
    console.log('✅ Push notification created for user:', notification.userId);
  } catch (error: any) {
    console.error('❌ Error creating push notification:', error);
    // Don't throw - notifications shouldn't break main flow
  }
};

/**
 * NEW: Request browser notification permission
 */
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.warn('Browser does not support notifications');
    return false;
  }
  
  if (Notification.permission === 'granted') {
    return true;
  }
  
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  
  return false;
};

/**
 * NEW: Notify writer when article published
 */
export const notifyWriterArticlePublished = async (
  writerId: string,
  articleTitle: string,
  articleSlug?: string
): Promise<void> => {
  await createPushNotification({
    userId: writerId,
    title: '🎉 Article Published!',
    message: `Your article "${articleTitle}" is now live on Morning Pulse.`,
    type: 'article_published',
    articleSlug,
  });
};

/**
 * NEW: Notify writer when article returned with feedback
 */
export const notifyWriterArticleReturned = async (
  writerId: string,
  articleTitle: string,
  editorNotes: string
): Promise<void> => {
  await createPushNotification({
    userId: writerId,
    title: '📝 Article Returned',
    message: `Your article "${articleTitle}" has been returned with feedback: ${editorNotes.substring(0, 80)}...`,
    type: 'article_returned',
  });
};

/**
 * NEW: Notify writer when article is claimed by editor
 */
export const notifyWriterArticleClaimed = async (
  writerId: string,
  articleTitle: string,
  editorName: string
): Promise<void> => {
  await createPushNotification({
    userId: writerId,
    title: '✍️ Article Under Review',
    message: `${editorName} is now editing your article "${articleTitle}".`,
    type: 'article_claimed',
  });
};
