/**
 * Global TypeScript definitions for the Morning Pulse application.
 * This file serves as the single source of truth for data structures.
 */

// Defines the specific sub-types a staff member with the 'writer' role can have.
export type WriterType = 'journalist' | 'pitch_writer';

// Represents a staff member in the Firestore /staff collection.
export interface StaffMember {
  uid: string;
  email: string;
  name: string;
  role: string;           // The user's primary role (e.g., 'admin', 'editor', 'writer').
  writerType?: WriterType;  // Specific type if the role is 'writer'.
  isActive: boolean;
  createdAt?: Date;
  lastActive?: Date;
  updatedAt?: Date;
  suspendedAt?: Date | null;
  suspendedBy?: string | null;
  suspendedByName?: string | null;
  invitedBy?: string;
  invitedByName?: string;
}

// Represents a pending invitation for a new staff member.
export interface StaffInvite {
  id: string;
  email: string;
  name: string;
  role: string;
  writerType?: WriterType;
  createdAt: Date;
  expiresAt: Date;
  invitedBy: string;
  invitedByName: string;
}

// Represents a log entry in the /auditLog collection.
export interface AuditLog {
  id: string;
  action: string; // e.g., 'INVITE_CREATED', 'ROLE_CHANGED'
  timestamp: Date;
  performedByUid: string;
  performedByName: string;
  targetUid?: string;
  targetName?: string;
  oldState?: any;
  newState?: any;
  details?: { [key: string]: any };
}
