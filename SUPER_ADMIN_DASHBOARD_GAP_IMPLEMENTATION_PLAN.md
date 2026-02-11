# Super Admin Dashboard — Gap Implementation Plan (Step-by-Stage)

**Purpose:** Implement remaining strategic plan items with clear stages, commits, and test steps after every push.  
**Reference:** Strategic plan blueprint, `SUPER_ADMIN_DASHBOARD_PHASE5_PLAN.md`.

**Quick test commands (run from repo root before/after each commit):**
```bash
cd website && npm run build && npm run lint
```

---

## Before Every Push / Commit

Run these **before** you commit and push:

```bash
# From repo root
cd website
npm run build          # Must succeed
npm run lint           # Fix any reported issues (if script exists)
```

**Quick smoke test (after each commit):**

1. Open the Super Admin dashboard in the browser (log in as super_admin).
2. Navigate to the tab(s) you changed.
3. Confirm no blank screen, no console errors (F12 → Console).
4. Perform the “How to test” steps for the change you just made.

---

## Stage A: Staff Management Enhancements

---

### Stage A1: Staff Overview Cards

**Goal:** Show role and status counts at the top of the Staff Management tab.

**Implementation steps:**

1. In `StaffManagementTab.tsx`, add `useMemo` to compute from `staff`:
   - `countByRole`: `{ super_admin, bureau_chief, admin, editor, writer }`
   - `activeCount`, `suspendedCount`, `onlineCount` (reuse existing `isOnline()` logic).
2. Add a “Staff Overview” section above the filters bar: one row of small cards/badges showing role counts and Active / Suspended / Online.
3. Use `admin-card` and existing CSS variables; keep responsive.

**Suggested commit message:**  
`feat(admin): add Staff Overview cards (role + status counts) to Staff Management tab`

**How to test (after commit):**

1. Log in as super_admin and open **Staff Management** tab.
2. **Check:** A “Staff Overview” (or similar) block appears **above** the search/filter bar.
3. **Check:** You see counts for each role (e.g. Super Admins: 1, Writers: 3). Numbers should match the staff list below.
4. **Check:** You see Active, Suspended, and Online counts. Active + Suspended should equal total staff; Online ≤ Active.
5. **Check:** Resize the window; layout wraps or stays readable (no overflow).
6. **Check:** Browser console (F12) has no errors.

---

### Stage A2: Articles Column in Staff Table

**Goal:** Add an “Articles” (or “Published”) column showing each staff member’s article count.

**Implementation steps:**

1. Decide data source: extend `staffMetricsService` (e.g. `getArticleCountByStaff()`) or in `StaffManagementTab` query/count opinions where `authorUid`/`authorId` equals each `member.uid` (status published). Cache counts keyed by `uid`.
2. Add `<th>Articles</th>` and `<td>{articleCountMap[member.uid] ?? '—'}</td>` in the staff table.
3. Keep table styling consistent (`admin-table`).

**Suggested commit message:**  
`feat(admin): add Articles column to Staff Management table`

**How to test (after commit):**

1. Open **Staff Management** tab.
2. **Check:** Table has a new column “Articles” (or “Published”).
3. **Check:** Each row shows a number or “—”. If you have published articles by known authors, their rows should show counts; others can be 0 or —.
4. **Check:** No layout break (column aligns, header matches).
5. **Check:** Console has no errors.

---

### Stage A3: Permissions & Access in Staff Profile Modal

**Goal:** Staff profile modal shows a “Permissions & Access” section (read-only from role).

**Implementation steps:**

1. In `StaffProfileModal.tsx`, import `PERMISSION_KEYS`, `PERMISSION_LABELS`, `roleHasPermission` from `permissionMatrix`.
2. For the member’s role(s), compute which permissions they have; render a list/grid of permission labels with ✅/❌.
3. Add or repurpose “Edit permissions” / “[Customize permissions]” to open a placeholder modal or show “Coming soon” toast.

**Suggested commit message:**  
`feat(admin): add Permissions & Access section to Staff Profile modal`

**How to test (after commit):**

1. Open **Staff Management** tab and **click a staff row** to open the profile modal.
2. **Check:** Modal includes a “Permissions & Access” (or similar) section.
3. **Check:** List shows permission labels (e.g. “Manage staff”, “Publish content”) with ✅ or ❌. Pattern should match the staff member’s role (e.g. editor has publish, writer does not).
4. **Check:** “Edit permissions” or “[Customize permissions]” is visible; clicking it shows toast or placeholder (no crash).
5. **Check:** Console has no errors. Close modal and open another staff; permissions update per role.

---

### Stage A4: Per-Row Actions [⋮] Menu

**Goal:** Each staff row has a ⋮ menu with View profile, Edit permissions, Activity log, Written articles, Change role, Suspend/Activate, Remove.

**Implementation steps:**

1. Add state `openMenuUid: string | null`; toggle on ⋮ click; close on outside click or after action.
2. Add a ⋮ button in the Actions column; render a dropdown (portal or positioned div) with menu items.
3. Wire: View profile → open `StaffProfileModal`; Change role → small role picker then `updateStaffRole`; Suspend/Remove → keep current behavior; Activity log → modal with `getStaffAuditLogs`; Written articles → navigate to Published Content (or Editorial) with author filter if available.
4. Optionally remove duplicate inline Suspend/Remove if they’re in the menu.

**Suggested commit message:**  
`feat(admin): add per-row actions menu (⋮) to Staff Management table`

**How to test (after commit):**

1. Open **Staff Management** tab.
2. **Check:** Each row has a ⋮ (or “Actions”) control. Click it; a dropdown opens.
3. **Check:** “View full profile” opens the same Staff Profile modal as row click (if you kept row click).
4. **Check:** “Change role” opens a role picker; changing role updates the row after success.
5. **Check:** “Suspend” / “Activate” and “Remove” work as before (confirmations, refresh).
6. **Check:** “View activity log” opens a modal or view with activity entries (or empty state).
7. **Check:** “View written articles” navigates to the right tab (and filters by author if implemented).
8. **Check:** Clicking outside the menu closes it; no console errors.

---

### Stage A5: Bulk Actions (Optional)

**Goal:** Select multiple staff and run Export selected, Suspend selected, or Change role.

**Implementation steps:**

1. Add `selectedUids: Set<string>` and a checkbox column; “Select all” for filtered rows.
2. When `selectedUids.size > 0`, show “Bulk actions” dropdown: Export CSV, Suspend, Activate, Change role.
3. Implement each action (export filtered list, loop suspend/activate, role picker then update all); add confirmations for destructive/role changes.

**Suggested commit message:**  
`feat(admin): add bulk actions (export, suspend, change role) to Staff Management`

**How to test (after commit):**

1. Open **Staff Management** tab.
2. **Check:** Each row has a checkbox; header has “Select all”.
3. Select 2–3 staff; **Check:** “Bulk actions” appears. Export selected → CSV contains only those rows.
4. **Check:** “Change role” opens picker; after confirm, all selected update.
5. **Check:** “Suspend selected” asks confirmation; after confirm, selected show Suspended. “Activate selected” works for suspended users.
6. **Check:** Console has no errors.

---

## Stage B: System Tab + Overview Charts

---

### Stage B1: Configuration & Settings Block (System Tab)

**Goal:** System tab shows a “Configuration & Settings” section with links to Settings, Integrations, etc.

**Implementation steps:**

1. In `SystemTab.tsx`, add a card “Configuration & Settings” with rows: Security settings, Email templates, Site appearance, Integrations, Analytics tracking, Advanced settings.
2. Each row: label + “[Configure]”/“[Manage]” that switches dashboard tab (e.g. `onNavigateToTab('settings')` or `('integrations')`). Pass `onNavigateToTab` from `AdminDashboard` to `SystemTab` if needed.
3. Style with same card/list pattern as “System Infrastructure Status”.

**Suggested commit message:**  
`feat(admin): add Configuration & Settings block to System tab`

**How to test (after commit):**

1. Log in as super_admin and open **System Health** tab.
2. **Check:** A “Configuration & Settings” section is visible (below or beside existing cards).
3. **Check:** Clicking a link (e.g. “Integrations”) switches the dashboard to the correct tab.
4. **Check:** No console errors; layout matches existing System tab style.

---

### Stage B2: Content Pipeline Chart (Overview Tab)

**Goal:** Overview tab shows “Content Status (This Week)” with counts by status (Drafts, In review, Published, etc.).

**Implementation steps:**

1. In `dashboardService` (or equivalent), add or use a function that returns counts by opinion status for the last 7 days.
2. In `DashboardOverviewTab`, fetch and pass data to your chart component (e.g. `PerformanceChart` or Recharts bar).
3. Add a card “Content Status (This Week)” with the chart.

**Suggested commit message:**  
`feat(admin): add Content Pipeline chart to Dashboard Overview`

**How to test (after commit):**

1. Open **Dashboard** (Overview) tab.
2. **Check:** A “Content Status (This Week)” (or similar) card with a chart is visible.
3. **Check:** Chart shows at least Drafts, Pending/In review, Published (and Rejected if you have them). Counts should be plausible (e.g. match or relate to Priority Summary).
4. **Check:** No console errors; chart is readable and styled consistently.

---

### Stage B3: User / Subscriber Growth Chart (Overview Tab)

**Goal:** Overview tab shows “Subscriber Growth” (or “User Growth”) for the last 6 months.

**Implementation steps:**

1. In `dashboardService` or analytics, add or reuse a function that returns monthly subscriber (or user) counts for the last 6 months.
2. In `DashboardOverviewTab`, fetch and render a line/area chart.
3. Add a card “Subscriber Growth (6 Months)” (or “User Growth”).

**Suggested commit message:**  
`feat(admin): add Subscriber Growth chart to Dashboard Overview`

**How to test (after commit):**

1. Open **Dashboard** (Overview) tab.
2. **Check:** A “Subscriber Growth (6 Months)” (or similar) card with a time-series chart is visible.
3. **Check:** X-axis shows months; Y-axis shows counts. If you have no data, chart can be empty or zeros.
4. **Check:** No console errors; styling consistent.

---

## Stage C: UX Polish

---

### Stage C1: Quick Actions FAB

**Goal:** Floating action button (e.g. bottom-right) with New article, Invite staff, Generate report, Notifications.

**Implementation steps:**

1. Create `QuickActionsFab.tsx`: fixed position, one main button; click opens menu (or expands). Items: New article, Invite staff, Generate report, Notifications.
2. In `AdminDashboard`, render `QuickActionsFab` when authorized; map items to `setActiveTab(...)` and any extra state (e.g. open invite form in Staff tab).
3. Add CSS for FAB and menu in `AdminDashboard.css`.

**Suggested commit message:**  
`feat(admin): add Quick Actions FAB (new article, invite staff, report, notifications)`

**How to test (after commit):**

1. Open the Super Admin dashboard (any tab).
2. **Check:** A FAB appears (e.g. bottom-right). Click it; menu opens with the four actions.
3. **Check:** “Invite staff” switches to Staff Management (and optionally opens invite form).
4. **Check:** “New article” switches to Editorial Queue or Writer Hub as intended.
5. **Check:** “Generate report” and “Notifications” navigate or open the right UI.
6. **Check:** On a small viewport, FAB doesn’t cover critical buttons; no console errors.

---

### Stage C2: Full Keyboard Shortcuts

**Goal:** Cmd/Ctrl+K (search), Cmd/Ctrl+N (new article), Cmd/Ctrl+/ (help modal), Cmd+1…5 (first five tabs). Keep 1–9 for tabs.

**Implementation steps:**

1. In `AdminDashboard.tsx`, extend the existing keydown handler: Cmd/Ctrl+K → focus search or open search UI; Cmd/Ctrl+N → set tab to editorial-queue (or writer-hub); Cmd/Ctrl+/ → set state to show shortcuts modal.
2. Add a small “Keyboard shortcuts” modal listing all shortcuts (1–9 tabs, Cmd+K, Cmd+N, Cmd+/). Render when state is true; close on overlay click or Escape.
3. Optionally: Cmd+1…5 switch to tabs 1–5. Ensure 1–9 without modifier still work.

**Suggested commit message:**  
`feat(admin): add Cmd+K, Cmd+N, Cmd+/ shortcuts and shortcuts help modal`

**How to test (after commit):**

1. Open dashboard; focus **outside** any input (e.g. click on the main area).
2. **Check:** Press **Cmd+/** (or Ctrl+/); a shortcuts help modal opens. Close it (Escape or overlay).
3. **Check:** Press **Cmd+N** (or Ctrl+N); dashboard switches to Editorial Queue (or Writer Hub).
4. **Check:** Press **Cmd+K** (or Ctrl+K); search is focused or search UI opens (as implemented).
5. **Check:** Press **1** … **9**; dashboard switches to the corresponding tab (same as before).
6. **Check:** With focus inside a text input, Cmd+N and Cmd+K do not trigger (or only trigger when intended). No console errors.

---

### Stage C3: Notifications / Alerts Area

**Goal:** Bell icon in header; click opens a list of recent alerts (system, pending review, etc.).

**Implementation steps:**

1. Add notification state (e.g. list of `{ id, type, title, message, time }`) in `AdminDashboard`; push items from system health (e.g. high latency) and pending count (e.g. “X items need review”).
2. Add bell icon + optional badge (unread count) in header; click toggles dropdown/panel with notification list.
3. Style with existing card/list styles; optional “mark as read” on view.

**Suggested commit message:**  
`feat(admin): add notifications area (bell icon) with system and review alerts`

**How to test (after commit):**

1. Open dashboard; find the **bell icon** in the header (or top bar).
2. **Check:** Clicking it opens a panel/dropdown with at least one type of notification (e.g. “X items need review” from pending count, or “High latency” if you simulated it).
3. **Check:** Notifications show title/message and time; panel closes when clicking outside or on a close control.
4. **Check:** No console errors; layout doesn’t break on small screens.

---

## Stage D: Optional / Later

- **Build/deploy status:** Show last GitHub Actions (or CI) run in System tab and in Critical System Events on failure. Test by pushing and confirming status appears after run.
- **Per-user permission overrides:** Add overrides to staff doc and “Customize permissions” UI. Test by editing one user and confirming effective permissions change.
- **DB storage/uptime:** If you add an API, show real DB stats in System tab. Test by comparing with Firebase console.

---

## Testing Checklist (After Every Push)

Use this **after you push** (or before, as pre-push check):

1. **Build:** `cd website && npm run build` — must succeed.
2. **Lint:** `npm run lint` (if available) — fix reported issues.
3. **Manual:** Log in as super_admin; open the tab(s) you changed.
4. **Console:** F12 → Console — no red errors.
5. **Feature:** Run the “How to test” steps for the stage you just implemented.
6. **Regression:** Quickly open 2–3 other tabs (e.g. Analytics, System, Published Content) and confirm they still load.

---

## Implementation Order Summary

| Order | Stage   | Deliverable                    | Commit / test after |
|-------|---------|--------------------------------|----------------------|
| 1     | A1      | Staff Overview Cards           | 1 commit → test A1  |
| 2     | A2      | Articles column                | 1 commit → test A2  |
| 3     | A3      | Permissions in profile modal   | 1 commit → test A3  |
| 4     | A4      | ⋮ actions menu                 | 1 commit → test A4  |
| 5     | B1      | Configuration block (System)   | 1 commit → test B1  |
| 6     | C2      | Keyboard shortcuts + help      | 1 commit → test C2  |
| 7     | C1      | Quick Actions FAB              | 1 commit → test C1  |
| 8     | B2      | Content pipeline chart         | 1 commit → test B2  |
| 9     | B3      | Subscriber growth chart        | 1 commit → test B3  |
| 10    | C3      | Notifications area             | 1 commit → test C3  |
| 11    | A5      | Bulk actions (optional)        | 1 commit → test A5  |

Do one stage (or one logical chunk) per commit; run the “How to test” for that stage before pushing. That way every push is testable and traceable.
