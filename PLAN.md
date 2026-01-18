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

### ✅ Phase 7: Public Slug Routing (READY - Backend Complete)
- [x] Create getOpinionBySlug service function
- [x] Slug-based lookup with ID fallback
- [x] Published-only filtering
- [ ] Frontend routing integration (ready to implement)
- [ ] Add canonical URLs for SEO

### ✅ Phase 8: Version History System (COMPLETE)
- [x] Add OpinionVersion interface
- [x] Create versions sub-collection structure
- [x] Auto-snapshot on every save operation
- [x] Build History UI modal in EditorialQueueTab
- [x] Implement restore/rollback functionality
- [x] Safety: Snapshot current before restore
- [x] Full audit trail with timestamps and authors

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
  - roles: ['editor'] | ['admin'] | ['super_admin']
  - name: string
  - email: string

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

**End of PLAN.md**
