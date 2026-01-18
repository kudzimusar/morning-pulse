// Global variable declarations injected by the environment
declare global {
  interface Window {
    __app_id?: string;
    __firebase_config?: string;
    __initial_auth_token?: string;
  }
}

export interface NewsStory {
  id: string;
  headline: string;
  detail: string;
  source: string;
  category: string;
  url?: string;
  urlToImage?: string;
  date?: string;
  timestamp?: number;
}

export interface PollData {
  id: string;
  question: string;
  options: Record<string, number>;
  voters: Record<string, string>; // userId -> optionKey
  totalVotes: number;
  timestamp: number;
}

export interface UserPreferences {
  isPremium: boolean;
  alertKeywords: string[];
}

export type SenderType = 'user' | 'bot' | 'system';

export type MessageType = 'text' | 'news-feed' | 'poll';

export interface Message {
  id: string;
  text?: string;
  html?: string; // For rich text answers
  sender: SenderType;
  type: MessageType;
  timestamp: number;
  data?: any; // For holding Poll or News data locally if needed
}

export interface GroundingSource {
  title: string;
  uri: string;
}

// Opinion & Editorial Types
export interface Opinion {
  id: string;
  writerType: string;
  authorName: string;
  authorTitle?: string;
  authorId?: string; // NEW: Firebase UID of the journalist/writer
  headline: string;
  subHeadline: string;
  body: string;
  originalBody?: string; // NEW: Store original text when claimed for reference
  slug?: string; // NEW: SEO-friendly URL slug (e.g., "big-news-in-zimbabwe")
  category?: string;
  country?: string;
  imageUrl?: string;
  imageGeneratedAt?: string;
  suggestedImageUrl?: string;
  finalImageUrl?: string;
  isPublished?: boolean;
  status: 'draft' | 'pending' | 'in-review' | 'scheduled' | 'published' | 'rejected' | 'archived'; // NEW: Added 'scheduled'
  submittedAt: Date;
  publishedAt?: Date | null;
  reviewedBy?: string;
  editorNotes?: string; // Internal notes visible only to editors
  type?: 'editorial' | 'opinion'; // Flag to distinguish editorials from user submissions
  scheduledFor?: Date | null; // NEW: Future publish timestamp
  claimedBy?: string | null; // NEW: Editor UID who claimed the story
  claimedAt?: Date | null; // NEW: When the story was claimed
  claimedByName?: string; // NEW: Editor name for display
}

export interface OpinionSubmissionData {
  writerType?: string;
  authorName: string;
  authorTitle?: string;
  headline: string;
  subHeadline: string;
  body: string;
  category?: string;
  country?: string;
  suggestedImageUrl?: string;
}

// NEW: Version History for Opinion Snapshots
export interface OpinionVersion {
  id: string;
  opinionId: string; // Parent opinion document ID
  headline: string;
  subHeadline: string;
  body: string;
  savedBy: string; // UID or name of editor/writer who saved
  savedByName: string; // Display name
  savedAt: Date;
  versionNumber: number; // Incremental version counter
}

// Staff Management Types
export interface StaffMember {
  uid: string;
  email: string;
  name: string;
  roles: string[]; // ['writer', 'editor', 'admin', 'super_admin']
  createdAt?: Date;
  lastActive?: Date;
  updatedAt?: Date;
  // NEW: Enhanced fields
  isActive: boolean; // true = active, false = suspended
  suspendedAt?: Date | null;
  suspendedBy?: string | null; // Admin UID who suspended
  suspendedByName?: string | null; // Admin name for display
  invitedBy?: string; // Admin UID who created invite
  invitedByName?: string; // Admin name who invited
  profilePicture?: string; // Future: Avatar URL
}

// Staff Invitation System
export interface StaffInvite {
  id: string; // Unique token (UUID)
  email: string;
  name: string;
  roles: string[];
  invitedBy: string; // Admin UID
  invitedByName: string; // Admin display name
  createdAt: Date;
  expiresAt: Date; // 7 days from creation
  status: 'pending' | 'used' | 'revoked' | 'expired';
  usedBy?: string; // UID of staff member who used the invite
  usedAt?: Date; // When the invite was used
  revokedBy?: string; // Admin UID who revoked
  revokedAt?: Date; // When revoked
}

// Audit Log System
export interface AuditLog {
  id: string;
  action: string; // 'staff_created', 'role_changed', 'staff_suspended', etc.
  performedBy: string; // Admin UID
  performedByName: string; // Admin display name
  targetUid?: string; // Staff member affected
  targetName?: string; // Staff member name
  oldValue?: any; // Previous value (for changes)
  newValue?: any; // New value (for changes)
  timestamp: Date;
  metadata?: Record<string, any>; // Additional context
  ipAddress?: string; // Future: Track IP for security
}
