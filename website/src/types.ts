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
  // Context Stack fields
  context?: ArticleContext;
  aiMetadata?: AIMetadata;
  // Compatibility fields for the feed
  headline?: string;
  subHeadline?: string;
  body?: string;
  // Generic
  [key: string]: any;
}

// Represents a log entry in the /auditLog collection
export interface AuditLog {
  id: string;
  action: string;
  timestamp: Date;
  performedBy: string;      // UID of performer
  performedByName: string;
  targetUid?: string;       // UID of affected member
  targetName?: string;
  oldValue?: any;
  newValue?: any;
  metadata?: { [key: string]: any };
}

// Represents a news story/article
export interface NewsStory {
  id: string;
  headline: string;
  detail: string;
  source: string;
  url: string;
  category: string;
  fetchedAt: string;
  date: string;
  timestamp?: number;
  image?: string;
  imageUrl?: string;
  urlToImage?: string;
  summary?: string;
  // Product Upgrade fields
  context?: ArticleContext;
  aiMetadata?: AIMetadata;
  slug?: string; // For consistency
  // Optional fields for extensibility
  [key: string]: any;
}

// ============================================
// WRITER PAYMENTS (Sprint 4)
// ============================================

export type PaymentStatementStatus = 'draft' | 'pending' | 'approved' | 'paid' | 'disputed' | 'cancelled';

export interface WriterPaymentStatement {
  id: string;
  writerId: string;
  writerName: string;
  writerEmail: string;

  // Payment period
  periodStart: Date;
  periodEnd: Date;
  periodLabel?: string; // e.g., "January 2026", "Week 4, 2026"

  // Payment calculation
  paymentModel: 'salary' | 'per-article' | 'per-word' | 'flat-fee';
  rate: number;          // Rate used for calculation
  currency: string;      // e.g., 'USD'

  // Article details
  articlesCount: number;
  articlesPublished: {
    opinionId: string;
    headline: string;
    publishedAt: Date;
    wordCount?: number;
    amount: number;       // Amount for this article
  }[];
  totalWordCount?: number;

  // Payment amounts
  grossAmount: number;    // Total before deductions
  totalAmountDue?: number; // Alias for netAmount (Cloud Function compatibility)
  wordsCount?: number;     // Alias for totalWordCount (Cloud Function compatibility)
  deductions?: {
    description: string;
    amount: number;
  }[];
  netAmount: number;      // Final amount after deductions

  // Workflow
  status: PaymentStatementStatus;
  createdAt: Date;
  generatedBy?: string;   // Admin UID who generated
  generatedByName?: string;

  // Approval
  approvedAt?: Date;
  approvedBy?: string;
  approvedByName?: string;

  // Payment processing
  paidAt?: Date;
  paidBy?: string;
  paidByName?: string;
  paymentReference?: string;  // Transaction ID, check number, etc.
  paymentMethod?: string;     // How it was paid

  // Notes
  adminNotes?: string;
  writerNotes?: string;
}

// Summary for admin dashboard
export interface WriterPaymentSummary {
  writerId: string;
  writerName: string;
  writerEmail: string;
  tier?: string;
  paymentModel?: string;
  currency?: string;

  // Current period stats
  currentPeriodArticles: number;
  currentPeriodAmount: number;

  // Pending payments
  pendingStatements: number;
  pendingAmount: number;

  // Lifetime
  totalPaid: number;
  totalStatements: number;
  lastPaymentDate?: Date;
}

// ============================================
// PRODUCT UPGRADE TYPES (Phase 1)
// ============================================

// Topic Hubs
export interface TopicHub {
  id: string; // e.g., 'ai-and-tech'
  slug: string;
  title: string;
  description: string;
  featuredArticleIds: string[]; // Curated list of IDs
  order: number;
  isActive: boolean;
  layoutConfig?: 'grid' | 'timeline' | 'feature';
}

// Live Coverage
export interface LiveEvent {
  id: string;
  slug: string;
  title: string;
  summary: string;
  startedAt: number;
  endedAt?: number;
  isActive: boolean;
  updates?: LiveEventUpdate[];
}

export interface LiveEventUpdate {
  id: string;
  timestamp: number;
  content: string; // HTML allowed
  author: string;
  important: boolean;
}

// Context Stack
export interface ArticleContext {
  whyItMatters?: string;
  keyFacts?: string[]; // Array of strings
  timeline?: {
    date: string;
    title: string;
    summary: string;
  }[];
  relatedArticleIds?: string[];
}

// AI Summaries
export interface AIMetadata {
  summary60s?: string;     // 60-second read
  opposingViews?: string;  // Counter-arguments
  simpleExplanation?: string; // Explain like I'm 5
  generatedAt?: number;
  modelUsed?: string;
}

// User Profile Extensions
export interface UserProfileExtension {
  savedArticleIds: string[];
  readingHistory: {
    articleId: string;
    viewedAt: number;
    timeSpent: number;
  }[];
  preferences: {
    newsletter: boolean;
    notifications: boolean;
    topics: string[];
  };
}

// Add MetricCardProps to fix the linter error in AdminDashboard if usually present there
// Or simply rely on generic types.

export interface OpinionSubmissionData {
  writerType: 'Guest Essay' | 'Letter';
  authorName: string;
  authorTitle?: string;
  headline: string;
  subHeadline: string;
  body: string;
  category: string;
  country: string;
  suggestedImageUrl?: string;
}
