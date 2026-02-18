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

  // Product Upgrade: Context Stack & AI
  context?: ArticleContext;
  aiMetadata?: AIMetadata;
}

export interface ArticleContext {
  whyItMatters?: string;
  keyFacts?: string[]; // Bullet points
  timeline?: {
    date: string; // ISO date or "Jan 2024"
    title: string;
    summary: string;
  }[];
  relatedArticleIds?: string[]; // Manual clustering
}

export interface AIMetadata {
  summary60s?: string;     // 60-second read
  opposingViews?: string;  // Counter-arguments
  simpleExplanation?: string; // "Explain like I'm 5"
  generatedAt?: number;
  modelUsed?: string;
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
  // Super Admin Media Override audit trail
  lastMediaOverride?: {
    timestamp: Date;
    performedBy: string; // Super Admin UID
    performedByName: string; // Super Admin display name
    previousImageUrl?: string;
    newImageUrl: string;
  };

  // ============================================
  // EDITORIAL META - SLA & Ownership (Sprint 2)
  // ============================================
  editorialMeta?: {
    assignedEditorId?: string;      // Editor responsible for this story
    assignedEditorName?: string;    // Editor display name
    priority?: 'low' | 'normal' | 'high' | 'urgent';  // Story priority
    slaHours?: number;              // Target review time (e.g., 24, 48, 72)
    firstResponseAt?: Date;         // When editor first claimed/responded
    approvalAt?: Date;              // When approved/published
    returnCount?: number;           // Number of times returned to writer
    lastReturnedAt?: Date;          // When last returned to writer
    lastReturnReason?: string;      // Why it was returned
  };

  // Product Upgrade: Context Stack & AI
  context?: ArticleContext;
  aiMetadata?: AIMetadata;
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

// ============================================
// STORY PITCHING SYSTEM (Sprint 0)
// ============================================

export type PitchStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | 'converted';

export interface StoryPitch {
  id: string;
  writerId: string; // Firebase UID of the writer
  writerName: string; // Writer display name
  writerEmail: string; // Writer email for notifications

  // Pitch content
  title: string; // Proposed headline
  summary: string; // Brief description (elevator pitch)
  angle: string; // Unique angle/perspective
  proposedCategory?: string; // e.g., 'politics', 'culture', 'business'
  estimatedWordCount?: number; // Proposed article length
  proposedDeadline?: Date; // When writer can deliver

  // Supporting information
  sources?: string; // Proposed sources/interviews
  relevance?: string; // Why this story matters now

  // Workflow
  status: PitchStatus;
  submittedAt?: Date;
  createdAt: Date;
  updatedAt?: Date;

  // Editorial response
  reviewedBy?: string; // Editor UID
  reviewedByName?: string; // Editor name
  reviewedAt?: Date;
  editorFeedback?: string; // Notes from editor
  rejectionReason?: string; // If rejected

  // Conversion tracking (when approved pitch becomes article)
  convertedToOpinionId?: string; // Links to created opinion
  convertedAt?: Date;

  // Priority/Assignment
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  assignedEditorId?: string; // Editor assigned to review
  assignedEditorName?: string;
}

// ============================================
// WRITER PERFORMANCE METRICS (Sprint 3)
// ============================================

export interface WriterMetrics {
  writerId: string;  // Firebase UID
  writerName: string;

  // Rolling 30-day metrics
  rolling30d: {
    submitted: number;        // Articles submitted
    published: number;        // Articles published
    rejected: number;         // Articles rejected
    avgReviewHours: number;   // Average time from submission to publish
    rejectionRate: number;    // Percentage (0-100)
    totalViews: number;       // Total article views
    avgViewsPerArticle: number;
  };

  // Lifetime metrics
  lifetime: {
    totalSubmitted: number;
    totalPublished: number;
    totalRejected: number;
    totalViews: number;
    avgViewsPerArticle: number;
    firstPublishedAt?: Date;
    lastPublishedAt?: Date;
  };

  // Computed at
  lastComputed: Date;

  // Optional: Category breakdown
  categoryBreakdown?: {
    [category: string]: {
      published: number;
      views: number;
    };
  };
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
  layoutConfig: 'grid' | 'timeline' | 'feature';
  isActive: boolean;
  order: number;
}

// Live Coverage Mode
export interface LiveEvent {
  id: string;
  title: string;
  slug: string;
  summary: string;
  isActive: boolean;
  startedAt: number;
  endedAt?: number;
  mainStoryId?: string; // Link to a full article
  updates: LiveEventUpdate[];
}

export interface LiveEventUpdate {
  id: string;
  timestamp: number;
  content: string; // Markdown supported
  type: 'text' | 'image' | 'alert' | 'stat';
  authorName?: string;
  important?: boolean;
}

// Extended User Profile
export interface UserProfileExtension {
  uid: string;
  savedArticles: string[]; // List of article IDs
  readingHistory: {
    articleId: string;
    timestamp: number;
    percentScrolled?: number;
  }[];
  preferences: {
    fontScale: number; // 1.0 base
    compactMode: boolean;
    theme: 'light' | 'dark' | 'system';
    reducedMotion: boolean;
  };
  briefs: {
    id: string;
    date: string; // YYYY-MM-DD
    content: string;
    isRead: boolean;
  }[];
}
