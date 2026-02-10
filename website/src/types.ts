
// ==================================================================
// ROLE & PERMISSION TYPES
// ==================================================================

// Defines the single, authoritative role for a staff member.
export type StaffRole = 'super_admin' | 'bureau_chief' | 'admin' | 'editor' | 'writer';

// Defines the sub-category for writers to distinguish their function.
export type WriterType = 'journalist' | 'pitch_writer';

// ==================================================================
// INTERFACES
// ==================================================================

/**
 * Represents a staff member's complete record in the Firestore 'staff' collection.
 */
export interface StaffMember {
  uid: string;                    // Firebase Auth User ID
  email: string;                  // Contact email
  name: string;                   // Display name
  role: StaffRole;                // The user's assigned role
  writerType?: WriterType;        // Specific to the 'writer' role
  isActive: boolean;              // Account status
  createdAt: any;                 // Firestore Timestamp
  lastActive?: any;               // Firestore Timestamp
  updatedAt?: any;                // Firestore Timestamp
}

/**
 * Represents an invitation for a new staff member, stored in the 'staff_invites' collection.
 */
export interface StaffInvite {
  id: string;                     // Document ID
  email: string;                  // Email the invite was sent to
  name: string;                   // Name of the invitee
  role: StaffRole;                // Role to be assigned upon acceptance
  writerType?: WriterType;        // Sub-type if the role is 'writer'
  createdAt: any;                 // Firestore Timestamp
  expiresAt: any;                 // Firestore Timestamp
  invitedBy: string;              // UID of the admin who sent the invite
  invitedByName: string;          // Name of the admin
}

/**
 * Represents a log entry for significant actions taken by admins.
 */
export interface AuditLog {
  id: string;                     // Document ID
  action: string;                 // e.g., 'update_role', 'delete_user', 'approve_article'
  timestamp: any;                 // Firestore Timestamp
  performedByUid: string;         // UID of the actor
  performedByName: string;        // Name of the actor
  targetUid?: string;             // UID of the user or object being acted upon
  targetName?: string;            // Name of the target
  oldState?: any;                 // Previous state of the data (e.g., old role)
  newState?: any;                 // New state of the data (e.g., new role)
  details?: Record<string, any>;  // Any other relevant information
}
