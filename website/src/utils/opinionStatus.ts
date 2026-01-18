/**
 * Opinion Status Utility
 * Maps between database status values and UI labels
 * 
 * UPDATED: 5-Stage Editorial Workflow
 * Database statuses: 'draft' | 'pending' | 'in-review' | 'published' | 'rejected' | 'archived'
 */

export const UI_STATUS_LABELS = {
  'draft': 'Draft',
  'pending': 'Pending Review',
  'in-review': 'In Edit',
  'published': 'Published',
  'rejected': 'Rejected',
  'archived': 'Archived',
} as const;

export type DbStatus = 'draft' | 'pending' | 'in-review' | 'published' | 'rejected' | 'archived';
export type UIStatusLabel = 'Draft' | 'Pending Review' | 'In Edit' | 'Published' | 'Rejected' | 'Archived';

/**
 * Convert database status to UI-friendly label
 */
export const getUIStatusLabel = (dbStatus: string): string => {
  return UI_STATUS_LABELS[dbStatus as DbStatus] || dbStatus;
};

/**
 * Map UI status selection back to database status
 * Used in admin dropdowns
 */
export const UI_TO_DB_STATUS: Record<UIStatusLabel, DbStatus> = {
  'Draft': 'draft',
  'Pending Review': 'pending',
  'In Edit': 'in-review',
  'Published': 'published',
  'Rejected': 'rejected',
  'Archived': 'archived',
} as const;

/**
 * Convert UI status to database status
 */
export const getDbStatus = (uiStatus: UIStatusLabel): DbStatus => {
  return UI_TO_DB_STATUS[uiStatus] || 'pending';
};

/**
 * Check if status is draft
 */
export const isDraftStatus = (status: string): boolean => {
  return status === 'draft';
};

/**
 * Check if status is pending (awaiting editor claim)
 */
export const isPendingStatus = (status: string): boolean => {
  return status === 'pending';
};

/**
 * Check if status is in-review (claimed by editor)
 */
export const isInReviewStatus = (status: string): boolean => {
  return status === 'in-review';
};

/**
 * Check if status is published
 */
export const isPublishedStatus = (status: string): boolean => {
  return status === 'published';
};

/**
 * Check if status is rejected
 */
export const isRejectedStatus = (status: string): boolean => {
  return status === 'rejected';
};

/**
 * Check if status is archived
 */
export const isArchivedStatus = (status: string): boolean => {
  return status === 'archived';
};

/**
 * Get status color for UI
 */
export const getStatusColor = (status: string): { bg: string; text: string; border?: string } => {
  switch (status) {
    case 'draft':
      return { bg: '#f3f4f6', text: '#6b7280', border: '#d1d5db' };
    case 'pending':
      return { bg: '#fef3c7', text: '#92400e', border: '#fde68a' };
    case 'in-review':
      return { bg: '#dbeafe', text: '#1e40af', border: '#93c5fd' };
    case 'published':
      return { bg: '#d1fae5', text: '#065f46', border: '#86efac' };
    case 'rejected':
      return { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' };
    case 'archived':
      return { bg: '#e5e7eb', text: '#374151', border: '#9ca3af' };
    default:
      return { bg: '#f9fafb', text: '#111827' };
  }
};
