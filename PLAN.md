# Morning Pulse - Editorial Workflow Plan

**Last Updated**: January 18, 2026  
**Status**: In Implementation  
**Phase**: Professional Newsroom Workflow

---

## Overview

This document serves as the single source of truth for all development decisions related to the Morning Pulse editorial workflow system.

## Current Implementation: 5-Stage Editorial Workflow

### Goals
- Implement a professional newsroom workflow (Writer → Editor → Public)
- Support collaborative editing with claim/lock mechanism
- Enable draft management for writers
- Provide scheduled publishing for editors
- Add feedback loop between editors and writers

---

## Data Schema

### Opinion Interface (types.ts)

**New Fields Added:**
```typescript
authorId?: string;           // Firebase UID of the journalist/writer
status: 'draft' | 'pending' | 'in-review' | 'published' | 'archived';
editorNotes?: string;         // Feedback from editor to writer
scheduledFor?: Date | null;   // Future publish timestamp
claimedBy?: string | null;    // Editor UID who claimed the story
claimedAt?: Date | null;      // When the story was claimed
originalBody?: string;        // Store original text for reference
```

**Existing Fields (Retained):**
- All previous fields remain for backward compatibility
- `authorName` still used for display
- `writerType` indicates editorial vs guest submissions

---

## 5-Stage Workflow Pipeline

| Stage | Status Value | Description | Visible To | Actions Available |
|-------|-------------|-------------|------------|-------------------|
| 1. Draft | `draft` | Writer is composing | Writer only | Save, Submit for Review |
| 2. Pending Review | `pending` | Awaiting editor claim | Editors | Claim, Reject |
| 3. In Edit | `in-review` | Editor is working on it | Assigned Editor | Edit, Return to Writer, Publish |
| 4. Ready to Publish | `published` | Live on site | Public | Unpublish, Archive |
| 5. Archived | `archived` | Removed from active site | Admins | Restore, Delete |

---

## Key Features

### 1. Claim/Lock System
- When editor clicks "Claim", story status changes to `in-review`
- `claimedBy` field stores editor's UID
- Other editors see "Claimed by [Name]" and cannot edit
- Editor can "Release" claim to return story to pending

### 2. Draft Management
- Writers save stories as `draft` (not visible in editor queue)
- Writers click "Submit for Review" to change status to `pending`
- Drafts visible only in Writer Dashboard

### 3. Split-Pane Editor
- Left pane: Original journalist text (read-only reference)
- Right pane: Editor's version (editable)
- Highlights differences for transparency

### 4. Editor Feedback Loop
- Editors add notes in `editorNotes` field
- "Return to Writer" button changes status to `pending` with notes
- Writer sees notes in their dashboard

### 5. Scheduled Publishing
- Editors set `scheduledFor` timestamp
- Cloud Function publishes automatically at scheduled time
- Status shows "Scheduled for [Date/Time]"

### 6. Permissions Guard
- **Publish Button**: `admin` or `editor` roles only
- **Submit for Review**: `writer` role
- **Claim Stories**: `editor` or `admin` roles only

---

## File Structure

### Modified Files
1. **types.ts** - Updated Opinion interface
2. **opinionStatus.ts** - 5-stage status mappings
3. **EditorialQueueTab.tsx** - Sections for Drafts/Pending/In-Review
4. **opinionsService.ts** - New workflow functions
5. **WriterDashboard.tsx** - Draft support, feedback display
6. **authService.ts** - Writer role validation

### New Functions (opinionsService.ts)
```typescript
claimStory(storyId: string, editorId: string, editorName: string)
releaseStory(storyId: string)
returnToWriter(storyId: string, editorNotes: string)
schedulePublication(storyId: string, scheduledFor: Date)
submitForReview(storyId: string) // Changes draft → pending
```

---

## UI Components

### EditorialQueueTab Structure
```
┌─────────────────────────────────────────┐
│ [✏️ Create New Editorial]              │
├─────────────────────────────────────────┤
│ Drafts (3)     │                        │
│ - Draft 1      │  [Editor View]         │
│ - Draft 2      │  ┌──────────────────┐  │
│ - Draft 3      │  │ Title            │  │
├────────────────│  │ Sub-headline     │  │
│ Pending (5)    │  │                  │  │
│ - Story A      │  │ [Original Text]  │  │
│ - Story B      │  │ Reference pane   │  │
├────────────────│  │                  │  │
│ In Review (2)  │  │ [Editor Version] │  │
│ - Story X      │  │ Main edit pane   │  │
│ - Story Y      │  │                  │  │
└────────────────┴──┴──────────────────┴──┘
```

### WriterDashboard Structure
```
┌─────────────────────────────────────────┐
│ Overview | My Submissions | Profile     │
├─────────────────────────────────────────┤
│ Drafts (2)                              │
│ - [Edit Draft] [Submit for Review]      │
├─────────────────────────────────────────┤
│ Pending Review (3)                      │
│ - Awaiting editor...                    │
├─────────────────────────────────────────┤
│ Published (5)                           │
│ - Published on [Date]                   │
├─────────────────────────────────────────┤
│ Returned (1)                            │
│ 📝 Editor Notes: "Please add sources..." │
└─────────────────────────────────────────┘
```

---

## Implementation Phases

### ✅ Phase 1: Data Schema (COMPLETE)
- [x] Update types.ts
- [x] Update opinionStatus.ts

### ✅ Phase 2: Editorial Queue Enhancement (COMPLETE)
- [x] Add Drafts section
- [x] Add Submissions section with Claim button
- [x] Add In-Review section
- [x] Implement claim/lock logic
- [x] Add Return to Writer functionality

### ✅ Phase 3: Live Editor View (COMPLETE)
- [x] Build split-pane layout
- [x] Add change tracking
- [x] Implement reference/editable panes

### ✅ Phase 4: Writer Dashboard Updates (COMPLETE)
- [x] Add draft management
- [x] Show editor feedback
- [x] Add Submit for Review button

### ✅ Phase 5: Scheduled Publishing (COMPLETE)
- [x] Add date/time picker
- [x] Background auto-publisher (30s interval)
- [x] Status indicators (calendar icons)

### ✅ Phase 6: SEO Slug Management (COMPLETE)
- [x] Add slug field to Opinion interface
- [x] Auto-generate slugs from headlines
- [x] Validate uniqueness (append 3-digit number if duplicate)
- [x] Manual slug override with validation
- [x] Display slug in editor metadata section

### ✅ Phase 7: Public Slug Routing (COMPLETE)
- [x] Create getOpinionBySlug service function
- [x] Slug-based lookup with ID fallback
- [x] Published-only filtering
- [x] Frontend routing integration in App.tsx
- [x] URL updates when clicking opinions
- [x] Canonical slug URLs in browser address bar
- [x] 404 handling for invalid slugs

### ✅ Phase 8: Version History System (COMPLETE)
- [x] Add OpinionVersion interface
- [x] Create versions sub-collection structure
- [x] Auto-snapshot on every save operation
- [x] Build History UI modal in EditorialQueueTab
- [x] Implement restore/rollback functionality
- [x] Safety: Snapshot current before restore
- [x] Full audit trail with timestamps and authors

### ✅ Phase 9: Metadata Polish for SEO (COMPLETE)
- [x] Add author names to all opinion cards
- [x] Display publishedAt dates on cards
- [x] "By [Author] • [Date]" byline format
- [x] Enhanced modal header with full date
- [x] Canonical URL display in modal footer
- [x] E-E-A-T compliance (Expertise, Authoritativeness, Trustworthiness)

### ✅ Phase 10: Push Notifications System (COMPLETE)
- [x] Enhanced notificationService with push infrastructure
- [x] Browser Notification API integration
- [x] Firestore-based notification storage
- [x] Real-time notifications for writers:
  * Article published (with slug link)
  * Article returned (with feedback preview)
  * Article claimed (editor started working)
- [x] Integrated into all workflow handlers
- [x] Permission handling for browser notifications

### ✅ Phase 11: Email Newsletter Generator (COMPLETE)
- [x] Created newsletterService.ts
- [x] Auto-generates responsive HTML email templates
- [x] Customizable options (date range, article count, images)
- [x] Professional email design with branding
- [x] Newsletter Generator UI tab
- [x] Preview in browser functionality
- [x] Download HTML for email platforms
- [x] Best practices guide included

### ✅ Phase 12: Enhanced Analytics Dashboard (COMPLETE)
- [x] Top Performing Opinions by view count
- [x] Top Contributors by published count & views
- [x] Workflow pipeline metrics
- [x] Average time to publish calculation
- [x] Status breakdown (drafts, pending, in-review, scheduled)
- [x] View tracking on OpinionFeed
- [x] Author analytics with avg views per article
- [x] Real-time article performance data

---

## Quality Gates

### Before Each Commit:
1. TypeScript compiles without errors
2. All existing features still work
3. No console errors in browser
4. Firestore rules allow new operations

### Before Marking Complete:
1. Full workflow test: Draft → Pending → In-Review → Published
2. Test claim/lock with multiple editors
3. Test writer feedback loop
4. Test permissions for all roles

---

## Technology Stack

**Frontend**: React + TypeScript + Vite  
**Backend**: Firebase (Firestore + Cloud Functions)  
**Auth**: Firebase Authentication (Email/Password for staff, Anonymous for public)  
**Storage**: Firebase Storage (images)  
**State Management**: Enhanced Firestore with retry logic

---

## Firestore Structure

```
/artifacts/morning-pulse-app/public/data/opinions/{opinionId}
  - authorId: string
  - authorName: string
  - status: 'draft' | 'pending' | 'in-review' | 'published' | 'archived'
  - claimedBy: string | null
  - claimedAt: timestamp | null
  - editorNotes: string
  - scheduledFor: timestamp | null
  - originalBody: string (stored when claimed)
  - body: string (editor's version)
  - [... other existing fields]

/staff/{uid}
  - roles: ['editor', 'admin', 'super_admin', 'writer']
  - name: string
  - email: string
  - isActive: boolean
  - suspendedAt: timestamp | null
  - suspendedBy: string | null
  - suspendedByName: string | null
  - invitedBy: string
  - invitedByName: string
  - lastActive: timestamp
  - createdAt: timestamp
  - updatedAt: timestamp

/artifacts/{appId}/public/data/invites/{token}
  - email: string
  - name: string
  - roles: string[]
  - invitedBy: string
  - invitedByName: string
  - createdAt: timestamp
  - expiresAt: timestamp (7 days)
  - status: 'pending' | 'used' | 'revoked' | 'expired'
  - usedBy: string | null
  - usedAt: timestamp | null

/artifacts/{appId}/public/data/audit_logs/{logId}
  - action: string
  - performedBy: string
  - performedByName: string
  - targetUid: string | null
  - targetName: string | null
  - oldValue: any
  - newValue: any
  - timestamp: timestamp
  - metadata: object

/writers/{uid}
  - status: 'pending' | 'approved' | 'rejected'
  - name: string
  - email: string
  - bio: string
```

---

## Commit Standards

All commits must reference this PLAN.md:
```
feat: Add 5-stage editorial workflow - PLAN.md Phase 2
fix: Claim lock logic preventing duplicate claims - PLAN.md Phase 2
```

---

## Future Enhancements (Post-MVP)

✅ **COMPLETED**:
- ~~Slug Management~~ - SEO-friendly slugs with auto-generation & validation
- ~~Scheduled Publishing~~ - Auto-publish at specified times (30s interval)
- ~~Version History~~ - Full edit history with rollback protection
- ~~Staff Management System~~ - Complete invitation, suspend/activate, audit logging (January 2026)

🔄 **IN PROGRESS**:
1. **Public Slug Routing**: Display opinions at `/opinion/{slug}` URLs (backend API ready, frontend integration pending)

⏳ **UPCOMING**:
1. **Collaborative Comments**: Inline comments like Google Docs  
2. **Fact-Check Stage**: Optional stage for investigative pieces
3. **Push Notifications**: Real-time alerts for writers and editors
4. **Multimedia Integration**: Upload videos, audio clips alongside articles
5. **Analytics Dashboard**: Track article performance
6. **Image Alt Text**: Accessibility compliance for all images
7. **Social Media Preview**: Auto-generate OG tags from slug URLs
8. **Advanced Search**: Full-text search across all published opinions
9. **Email Newsletters**: Auto-generate from published content
10. **Mobile App**: React Native version of editorial dashboard

---

## Notes

- Maintain backward compatibility with existing 3-status system
- Use `EnhancedFirestore` for all subscriptions (retry logic)
- All writes go through `opinionsService.ts`
- Never bypass Firestore security rules

---

## Staff Management System (Completed January 2026)

### Overview
Professional staff management with invitation system, activity tracking, suspend/activate controls, and comprehensive audit logging.

### ✅ Phase 1: Data Models & Core Services (COMPLETE)
- [x] Updated types.ts with StaffMember, StaffInvite, AuditLog interfaces
- [x] Created inviteService.ts with token generation (crypto.randomUUID)
- [x] Implemented secure 7-day expiring invitation tokens
- [x] Added isActive, suspendedAt, invitedBy fields to StaffMember

### ✅ Phase 2: Invitation System (COMPLETE)
- [x] Enhanced StaffManagementTab with invitation form
- [x] "Copy Join Link" functionality with shareable URLs
- [x] Pending invitations display with revoke capability
- [x] Created JoinPage component for token-based signup
- [x] Auto-creates /staff/{uid} on successful signup
- [x] Integrated routing in App.tsx (#join?token=XYZ)

### ✅ Phase 3: Search & Filters (COMPLETE)
- [x] Search bar (filter by name or email)
- [x] Role filter dropdown (All, Admin, Editor, Writer)
- [x] Status filter dropdown (All, Active, Suspended)
- [x] Activity status badges:
  - 🟢 Online (< 15 minutes)
  - ⚪ Away (< 24 hours)
  - ⚫ Offline (> 24 hours)
- [x] Real-time filtering with count display

### ✅ Phase 4: Suspend/Activate System (COMPLETE)
- [x] Suspend/Activate buttons in staff cards
- [x] Suspension metadata tracking (who, when)
- [x] Auth guard blocks suspended users from logging in
- [x] Visual indicators (yellow border, suspension badge)
- [x] Activity heartbeat (updates lastActive every 5 minutes)

### ✅ Phase 5: Audit Logging (COMPLETE)
- [x] Created auditService.ts with comprehensive logging
- [x] Firestore collection: /artifacts/{appId}/public/data/audit_logs
- [x] Integrated logging into all staff operations:
  - Role changes
  - Staff creation/deletion
  - Suspend/activate actions
  - Invitation creation/revocation
- [x] "Recent Activity" modal in StaffManagementTab
- [x] Console logs for immediate visibility

### ✅ Phase 6: Security & Documentation (COMPLETE)
- [x] Created firestore.rules with comprehensive security:
  - /staff: Admin-write only (users can update own lastActive)
  - /invites: Admin-write, public-read (for token validation)
  - /audit_logs: Admin-read, authenticated-create, immutable
- [x] Updated PLAN.md with complete documentation
- [x] All 12 tasks completed

### Key Features
1. **Invitation System**: Secure token-based invites with 7-day expiry
2. **Search & Filters**: Real-time filtering by name, email, role, status
3. **Activity Tracking**: Online/Away/Offline indicators with auto-updating heartbeat
4. **Suspend/Activate**: One-click suspension with login blocking
5. **Audit Logging**: Complete action history with before/after values
6. **Security Rules**: Firestore rules enforce admin-only writes
7. **Recent Activity**: Modal showing last 20 audit log entries

### Audit Actions Tracked
- STAFF_CREATED - New staff member added
- ROLE_CHANGED - Staff roles modified
- STAFF_SUSPENDED - Account suspended
- STAFF_ACTIVATED - Account reactivated
- STAFF_DELETED - Staff member removed
- INVITE_CREATED - Invitation generated
- INVITE_USED - Invitation accepted
- INVITE_REVOKED - Invitation cancelled

### Security Implementation
- ✅ Client-side role checks
- ✅ Firestore security rules
- ✅ Suspended user login blocking
- ✅ Audit trail for all actions
- ✅ Token-based invitation system
- ✅ Activity monitoring

### Files Created/Modified
**New Files:**
- website/src/services/inviteService.ts (370 lines)
- website/src/services/auditService.ts (230 lines)
- website/src/components/JoinPage.tsx (450 lines)
- firestore.rules (150 lines)

**Modified Files:**
- types.ts - Added 3 new interfaces
- website/src/components/admin/StaffManagementTab.tsx - Enhanced with all features
- website/src/services/staffService.ts - Added suspend/activate functions
- website/src/services/authService.ts - Added suspension check
- website/src/components/AdminDashboard.tsx - Added activity heartbeat
- website/src/App.tsx - Added JoinPage routing

---

**End of PLAN.md**
