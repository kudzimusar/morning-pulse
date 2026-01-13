## PLAN.md — Morning Pulse Development Plan (Single Source of Truth)

This document is the canonical reference for development decisions, phased work, and quality gates.

### Phase 1 — Fix public Opinion feed auth-lag blank state

#### Problem statement
- The public Opinion page can render blank because the Firestore listener starts before Firebase Anonymous Auth has produced a valid auth token, causing `permission-denied` on initial snapshot attempts.

#### Decision
- **Guard listeners on auth readiness**: do not start public Firestore subscriptions until `auth.currentUser` exists (anonymous user is fine).
- **Retry “permission-denied” briefly**: treat early `permission-denied` as an auth-lag signal and retry at least twice before surfacing the error.

#### Scope
- `website/src/services/enhancedFirestore.ts`: expand retry logic for `permission-denied` auth lag.
- `website/src/components/OpinionFeed.tsx` (and/or its calling service): ensure the subscription begins only after auth is ready.

#### Quality gates
- **Typecheck/build**: `website` builds successfully (`npm -C website run build`).
- **Manual UI verification**:
  - Load public Opinion page as a logged-out user.
  - Confirm opinions render after anonymous auth initializes.
  - Confirm no persistent `permission-denied` errors in console after auth is ready.

#### Commit standards
- Each commit message should reference this plan section: **“PLAN Phase 1 — Fix public Opinion feed auth-lag blank state”**.

