/**
 * Opinion Status Utility
 * Maps between database status values and UI labels
 * 
 * IMPORTANT: Database status values remain unchanged ('pending', 'published', 'rejected')
 * This utility only provides UI-friendly labels and mappings
 */

export const UI_STATUS_LABELS = {
  'pending': 'Submitted',
  'published': 'Published',
  'rejected': 'Rejected',
} as const;

export type DbStatus = 'pending' | 'published' | 'rejected';
export type UIStatusLabel = 'Submitted' | 'Under Review' | 'Published' | 'Rejected';

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
  'Submitted': 'pending',
  'Under Review': 'pending', // UI-only state, maps to 'pending' in DB
  'Published': 'published',
  'Rejected': 'rejected',
} as const;

/**
 * Convert UI status to database status
 */
export const getDbStatus = (uiStatus: UIStatusLabel): DbStatus => {
  return UI_TO_DB_STATUS[uiStatus] || 'pending';
};

/**
 * Check if status is pending (includes both Submitted and Under Review in UI)
 */
export const isPendingStatus = (status: string): boolean => {
  return status === 'pending';
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
