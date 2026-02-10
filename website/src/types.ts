/**
 * Global TypeScript definitions for the Morning Pulse application.
 * This file serves as the single source of truth for data structures.
 */

// Defines all possible staff roles
export type StaffRole = 'super_admin' | 'bureau_chief' | 'admin' | 'editor' | 'writer';

// Defines the specific sub-types a staff member with the 'writer' role can have
export type WriterType = 'journalist' | 'pitch_writer';

// Represents a staff member in the Firestore /staff collection
export interface StaffMember {
  uid: string;
  email: string;
  name: string;
  role: StaffRole;        // Primary role (legacy)
  roles: StaffRole[];    // Multi-role support
  writerType?: WriterType;
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

// Represents a pending invitation for a new staff member
export interface StaffInvite {
  id: string;
  email: string;
  name: string;
  role: StaffRole;        // Primary role (legacy)
  roles: StaffRole[];    // Multi-role support
  writerType?: WriterType;
  status: 'pending' | 'used' | 'revoked' | 'expired';
  createdAt: Date;
  expiresAt: Date;
  invitedBy: string;
  invitedByName: string;
  usedBy?: string;
  usedAt?: Date;
  revokedBy?: string;
  revokedAt?: Date;
}

// Represents an Opinion/Article piece
export interface Opinion {
  id: string;
  title: string;
  author: string;
  authorUid: string;
  content: string;
  category: string;
  status: 'pending' | 'published' | 'rejected' | 'scheduled';
  createdAt: any;
  updatedAt?: any;
  publishedAt?: any;
  image?: string;
  summary?: string;
  slug?: string;
}

// Represents a log entry in the /auditLog collection
export interface AuditLog {
  id: string;
  action: string;
  timestamp: Date;
  performedByUid: string;
  performedByName: string;
  targetUid?: string;
  targetName?: string;
  oldState?: any;
  newState?: any;
  details?: { [key: string]: any };
}
