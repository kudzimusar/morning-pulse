/**
 * Audit Log Service
 * Tracks all staff management actions for accountability and transparency
 */

import {
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  getDocs,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { AuditLog } from '../types';

const getDb = () => db;
const APP_ID = (window as any).__app_id || 'morning-pulse-app';

/**
 * Log a staff management action
 */
export const logStaffAction = async (
  action: string,
  performedBy: string,
  performedByName: string,
  targetUid?: string,
  targetName?: string,
  oldValue?: any,
  newValue?: any,
  metadata?: Record<string, any>
): Promise<void> => {
  const db = getDb();

  try {
    // Standardized to root collection: auditLog
    const auditLogsRef = collection(db, 'auditLog');

    const logEntry = {
      action,
      performedBy,
      performedByName,
      targetUid: targetUid || null,
      targetName: targetName || null,
      oldValue: oldValue || null,
      newValue: newValue || null,
      metadata: metadata || null,
      timestamp: serverTimestamp()
    };

    await addDoc(auditLogsRef, logEntry);

    // Console log for immediate visibility
    const consoleMsg = targetName
      ? `[AUDIT] ${performedByName} performed ${action} on ${targetName}`
      : `[AUDIT] ${performedByName} performed ${action}`;
    console.log(consoleMsg, { oldValue, newValue });

  } catch (error) {
    // Don't throw - audit logging should not break core functionality
    console.error('❌ [AUDIT] Failed to log action:', error);
  }
};

/**
 * Get recent audit logs
 */
export const getRecentAuditLogs = async (limitCount: number = 10): Promise<AuditLog[]> => {
  const db = getDb();

  try {
    const auditLogsRef = collection(db, 'auditLog');
    const q = query(
      auditLogsRef,
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    const logs: AuditLog[] = [];

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      logs.push({
        id: docSnap.id,
        action: data.action,
        performedBy: data.performedBy,
        performedByName: data.performedByName,
        targetUid: data.targetUid || undefined,
        targetName: data.targetName || undefined,
        oldValue: data.oldValue,
        newValue: data.newValue,
        timestamp: data.timestamp?.toDate() || new Date(),
        metadata: data.metadata || undefined
      });
    });

    return logs;
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return [];
  }
};

/**
 * Get audit logs for a specific staff member
 */
export const getStaffAuditLogs = async (
  targetUid: string,
  limitCount: number = 20
): Promise<AuditLog[]> => {
  const db = getDb();

  try {
    const auditLogsRef = collection(db, 'auditLog');
    const q = query(
      auditLogsRef,
      orderBy('timestamp', 'desc'),
      limit(100) // Get more to filter
    );

    const snapshot = await getDocs(q);
    const logs: AuditLog[] = [];

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      // Filter by targetUid
      if (data.targetUid === targetUid) {
        logs.push({
          id: docSnap.id,
          action: data.action,
          performedBy: data.performedBy,
          performedByName: data.performedByName,
          targetUid: data.targetUid || undefined,
          targetName: data.targetName || undefined,
          oldValue: data.oldValue,
          newValue: data.newValue,
          timestamp: data.timestamp?.toDate() || new Date(),
          metadata: data.metadata || undefined
        });
      }
    });

    return logs.slice(0, limitCount);
  } catch (error) {
    console.error('Error fetching staff audit logs:', error);
    return [];
  }
};

/**
 * Action type constants for consistency
 */
export const AuditActions = {
  // Staff management
  STAFF_CREATED: 'STAFF_CREATED',
  ROLE_CHANGED: 'ROLE_CHANGED',
  STAFF_SUSPENDED: 'STAFF_SUSPENDED',
  STAFF_ACTIVATED: 'STAFF_ACTIVATED',
  STAFF_DELETED: 'STAFF_DELETED',

  // Invitation system
  INVITE_CREATED: 'INVITE_CREATED',
  INVITE_USED: 'INVITE_USED',
  INVITE_REVOKED: 'INVITE_REVOKED',

  // Authentication
  LOGIN_BLOCKED_SUSPENDED: 'LOGIN_BLOCKED_SUSPENDED',

  // Other
  LAST_ACTIVE_UPDATED: 'LAST_ACTIVE_UPDATED',
} as const;

/**
 * Helper to format audit log action for display
 */
export const formatAuditAction = (action: string): string => {
  const actionMap: Record<string, string> = {
    'STAFF_CREATED': '👤 Created Staff',
    'ROLE_CHANGED': '🔄 Changed Roles',
    'STAFF_SUSPENDED': '🚫 Suspended Staff',
    'STAFF_ACTIVATED': '✅ Activated Staff',
    'STAFF_DELETED': '🗑️ Deleted Staff',
    'INVITE_CREATED': '✉️ Created Invite',
    'INVITE_USED': '🎉 Invite Used',
    'INVITE_REVOKED': '❌ Revoked Invite',
    'LOGIN_BLOCKED_SUSPENDED': '🔒 Blocked Suspended Login',
  };

  return actionMap[action] || action;
};

/**
 * Helper to format audit log details for display
 */
export const formatAuditDetails = (log: AuditLog): string => {
  const parts: string[] = [];

  if (log.targetName) {
    parts.push(`Target: ${log.targetName}`);
  }

  if (log.oldValue !== null && log.oldValue !== undefined) {
    parts.push(`Old: ${JSON.stringify(log.oldValue)}`);
  }

  if (log.newValue !== null && log.newValue !== undefined) {
    parts.push(`New: ${JSON.stringify(log.newValue)}`);
  }

  return parts.join(' • ');
};
