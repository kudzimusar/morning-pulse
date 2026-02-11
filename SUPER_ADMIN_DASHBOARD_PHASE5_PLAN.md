# Phase 5: Advanced Features & Optimization — Plan

**Status:** In progress → Implemented  
**Last updated:** February 2026

This document describes the Phase 5 scope for the Super Admin Dashboard: Permission Matrix, System Health Monitoring, and Content Audit (SEO). It aligns with `SUPER_ADMIN_DASHBOARD_PLAN.md` and `PLAN.md`.

---

## Current phase focus

1. **Permission Editor** — Granular Permission Matrix in Staff Management tab  
2. **System Health Monitoring** — Real-time Firestore latency and Critical System Events  
3. **Content Audit** — Advanced filtering in Published Content tab to identify SEO gaps  

---

## A. Permission Editor (Permission Matrix)

**Goal:** Super admins see what each role can do via a read-only Permission Matrix.

### Implementation

- **Source of truth:** `website/src/constants/permissionMatrix.ts`
  - `PERMISSION_KEYS`: manage_staff, invite_staff, publish_content, manage_content, view_analytics, manage_ads, access_newsletter, manage_system
  - `ROLE_PERMISSIONS`: map of `StaffRole` → permissions (super_admin has all)
  - Helpers: `getRolesOrder()`, `roleHasPermission()`, `getPermissionsForRole()`
- **UI:** Staff Management tab — new “Permission Matrix” card below the staff table
  - Table: rows = permissions, columns = roles (super_admin, bureau_chief, admin, editor, writer)
  - Cells: ✓ or — (read-only)
  - Styling: `admin-card`, `admin-table`, `permission-matrix`, CSS variables

### Success criteria

- [x] Matrix visible in Staff Management tab
- [x] All 5 roles and 8 permissions represented
- [x] Read-only view; styling consistent with `AdminDashboard.css`
- [ ] Optional later: per-user permission overrides (Firestore + UI)

---

## B. System Health Monitoring

**Goal:** Real-time Firestore latency and live Critical System Events.

### Implementation

- **Service:** `website/src/services/systemHealthService.ts`
  - `startHealthPolling(db, intervalMs)` — pings Firestore (e.g. `staff` collection `limit(1)`), measures latency
  - Status: healthy (&lt; 500 ms), warning (500–2000 ms), critical (&gt; 2000 ms)
  - Pushes events to in-memory list when latency is warning/critical or on error
  - `getHealth()`, `subscribeToHealth()`, `getRecentEvents()`, `stopHealthPolling()`
- **UI:** System tab
  - Receives `firebaseInstances` from AdminDashboard; starts polling when `db` is available
  - “Firestore latency” MetricCard shows live value and status color
  - Alert banner when status is warning or critical
  - “Infrastructure Pulse” banner reflects health (healthy / elevated / high latency)
  - “Firestore Multi-Region DB” row shows Operational / High latency / Degraded
  - “Critical System Events” list: live events from health service; fallback to static placeholders when no live data

### Success criteria

- [x] Firestore latency measured and displayed (value + status)
- [x] Alert banner when latency exceeds threshold
- [x] Critical System Events include live source (latency/error events)
- [ ] Optional: build/deploy status (e.g. GitHub Actions API or Firestore status doc)

---

## C. Content Audit (SEO)

**Goal:** In Published Content tab, filter by SEO gaps (missing slug, summary, bad headline length, etc.).

### Implementation

- **SEO flags (client-side):** For each published opinion:
  - missingSlug, missingSummary, shortHeadline (&lt; 30), longHeadline (&gt; 70), missingCategory, noImage
  - Helper `getSEOAuditFlags(op)` in `PublishedContentTab.tsx`
- **UI:** Published Content tab
  - “Content audit” summary line when there are issues: counts per type + “Show X with issues” button
  - Audit filter dropdown: All | SEO issues only | Missing slug | Missing summary | Short headline | Long headline | Missing category | No image
  - Applied after existing search / category / author filters
  - Styling: `admin-card`, `admin-input`, same filter bar pattern; CSS variables

### Success criteria

- [x] Audit filter with All, SEO issues only, and specific issue types
- [x] Filtering works with existing search/category/author
- [x] Audit summary counts and “Show with issues” when applicable
- [x] Styling matches `AdminDashboard.css`

---

## Order of implementation (done)

1. **Content Audit** — Implemented first (front-end only)
2. **Permission Matrix** — Implemented second (constants + Staff Management section)
3. **System Health** — Implemented third (service + System tab + AdminDashboard prop)

---

## Design and styling (all three)

- **Single source:** `website/src/components/admin/AdminDashboard.css`
- **Use:** `admin-card`, `admin-table`, `admin-input`, `admin-button`, `admin-button-primary`, `admin-button-secondary`, `status-badge`, `role-badge`, `.permission-matrix`
- **Variables:** `--admin-primary`, `--admin-success`, `--admin-warning`, `--admin-error`, `--admin-border`, `--admin-bg`, `--admin-text-main`, `--admin-text-muted`
- **Tab headers:** `<h2>` (24px, 700) + subtitle `<p>` (14px, muted)

---

## Files touched

| Item | Files |
|------|--------|
| Content Audit | `website/src/components/admin/PublishedContentTab.tsx` |
| Permission Matrix | `website/src/constants/permissionMatrix.ts`, `website/src/components/admin/StaffManagementTab.tsx`, `AdminDashboard.css` (role-badge.bureau_chief, .permission-matrix) |
| System Health | `website/src/services/systemHealthService.ts`, `website/src/components/admin/SystemTab.tsx`, `website/src/components/AdminDashboard.tsx` (pass firebaseInstances to SystemTab) |
| Plan | `SUPER_ADMIN_DASHBOARD_PHASE5_PLAN.md` (this file) |

---

## Relation to SUPER_ADMIN_DASHBOARD_PLAN.md

- Phase 0–3 (Quick Wins, Foundation, Core Features, Polish) remain as in the main plan.
- **Phase 5 (current)** is this document: Permission Matrix, System Health alerting, Content Audit.
- When Phase 5 success criteria are complete, the dashboard delivers enterprise-grade permission visibility, real-time health awareness, and SEO content auditing.
