# Stage C: UX Polish — Summary & Test Guide

**Scope:** C1 Quick Actions FAB, C2 Keyboard shortcuts + help modal, C3 Notifications area.

---

## Summary of Changes

| Item | Description |
|------|--------------|
| **C1** | **Quick Actions FAB** – Floating action button (bottom-right) with main "+" button. Click opens menu: New article → Editorial Queue, Invite staff → Staff Management, Generate report → Analytics, Notifications → opens notification panel. |
| **C2** | **Keyboard shortcuts** – ⌘K (search/quick switch), ⌘N (new article → Editorial Queue), ⌘/ (shortcuts help modal). 1–9 switch to tabs. Shortcuts modal lists all shortcuts; closes on Escape or overlay click. |
| **C3** | **Notifications area** – Bell icon in header with optional badge (pending count). Click opens dropdown with notifications: "X items need review" (when pending > 0) and "All systems operational". Closes on outside click or Escape. |

---

## Before You Start

1. **Build:** `cd website && npm run build` — must succeed.
2. **Log in:** Use an account with **super_admin** or **admin** role.
3. **Tabs used:** Any tab; header and FAB visible when authorized.

---

## C1: Quick Actions FAB

| Step | Action | Expected |
|------|--------|----------|
| 1 | Open the Super Admin dashboard (any tab). | A **FAB** (circular "+" button) appears at **bottom-right**. |
| 2 | Click the FAB. | Menu opens with: **New article**, **Invite staff**, **Generate report**, **Notifications**. |
| 3 | Click **"New article"**. | Dashboard switches to **Editorial Queue**; menu closes. |
| 4 | Click FAB again; click **"Invite staff"**. | Switches to **Staff Management**; menu closes. |
| 5 | Click FAB; click **"Generate report"**. | Switches to **Analytics** tab; menu closes. |
| 6 | Click FAB; click **"Notifications"**. | Notification panel (bell dropdown) opens; FAB menu closes. |
| 7 | Resize viewport to small. | FAB remains visible; doesn’t cover critical buttons. |
| 8 | Console. | No errors. |

---

## C2: Keyboard Shortcuts

| Step | Action | Expected |
|------|--------|----------|
| 1 | Open dashboard; focus **outside** any input (click main area). | — |
| 2 | Press **⌘/**, **Ctrl+/**, or **Cmd+Shift+/** (depending on OS). | **Shortcuts help modal** opens. |
| 3 | Press **Escape** or click overlay. | Modal closes. |
| 4 | Press **⌘N** or **Ctrl+N**. | Switches to **Editorial Queue**; toast: "Switched to Editorial Queue". |
| 5 | Press **⌘K** or **Ctrl+K**. | **Search overlay** opens with tab list; input focused. |
| 6 | In search overlay, click a tab or press Escape. | Tab switches (if clicked) or overlay closes. |
| 7 | Press **1** … **9** (no modifier). | Switches to tabs 1–9. |
| 8 | Focus a text input (e.g. in Editorial Queue); press ⌘N. | Shortcut does not trigger (or behaves as intended). |
| 9 | Console. | No errors. |

---

## C3: Notifications Area

| Step | Action | Expected |
|------|--------|----------|
| 1 | Open dashboard; find the **bell icon** in the header. | Bell icon visible near Search button. |
| 2 | If you have **pending items** in Editorial Queue. | Badge with count appears on bell. |
| 3 | Click the bell. | **Dropdown** opens with notification list. |
| 4 | Check list items. | At least "System" / "All systems operational"; if pending > 0, "Pending review" / "X items need review". |
| 5 | Click **outside** the dropdown. | Dropdown closes. |
| 6 | Open bell again; press **Escape**. | Dropdown closes. |
| 7 | Small viewport. | Layout doesn’t break; dropdown readable. |
| 8 | Console. | No errors. |

---

## Regression

| Step | Action | Expected |
|------|--------|----------|
| 1 | Open **Command Center**, **Editorial Queue**, **Analytics**, **System Health**. | All load without blank screen. |
| 2 | Use FAB, shortcuts, and bell. | All work without conflicts. |
| 3 | Console. | No red errors. |

---

## Files Touched (Stage C)

- `website/src/components/AdminDashboard.tsx` – State (searchOpen, showShortcutsModal, notificationPanelOpen, notifications), keydown handler, header (Search, bell), search overlay, shortcuts modal, QuickActionsFab.
- `website/src/components/admin/QuickActionsFab.tsx` – New component.
- `website/src/components/admin/AdminDashboard.css` – FAB and menu styles.

---

## Summary

- **C1:** Quick Actions FAB (bottom-right) with New article, Invite staff, Generate report, Notifications.
- **C2:** ⌘K (search), ⌘N (new article), ⌘/ (help), 1–9 (tabs); shortcuts modal.
- **C3:** Bell icon in header; dropdown with system and pending review notifications.

If any step fails, note the step number and what you saw and fix or report as a bug.
