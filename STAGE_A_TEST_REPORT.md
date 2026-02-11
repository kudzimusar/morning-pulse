# Stage A: Staff Management — Test Report

**Commit:** (see latest commit message)  
**Scope:** A1 Overview cards, A2 Articles column, A3 Permissions in profile, A4 ⋮ menu, A5 Bulk actions.

Use this checklist after pulling the latest changes to verify Stage A.

---

## Before You Start

1. **Build:** From repo root run `cd website && npm run build` — must succeed.
2. **Log in:** Use an account with **super_admin** (or at least **admin**) role and open the Super Admin dashboard.
3. **Go to:** **Staff Management** tab.

---

## A1: Staff Overview Cards

| Step | Action | Expected |
|------|--------|----------|
| 1 | Look at the page **above** the search/filter bar. | A **“Staff Overview”** block is visible. |
| 2 | Check the first row of the overview. | You see role badges with counts: **Super Admin**, **Bureau Chief**, **Admin**, **Editor**, **Writer** and a number next to each. |
| 3 | Check the second part of the overview. | You see **Active** count, **Suspended** count, and **Online** count (with a green dot). |
| 4 | Compare with the table. | Total staff in table = Active + Suspended. Role counts match the number of people with that role in the table. |
| 5 | Resize the browser window. | Overview wraps or stays readable; no horizontal overflow. |
| 6 | Open DevTools (F12) → Console. | No red errors. |

---

## A2: Articles Column

| Step | Action | Expected |
|------|--------|----------|
| 1 | Look at the staff table header. | There is an **“Articles”** column (between Roles and Last Active). |
| 2 | Look at each row in the table. | Each row shows a **number** or **—** in the Articles column. |
| 3 | (If you have analytics data) Check a staff who has published articles. | Their row shows a positive number. Others may show 0 or —. |
| 4 | Console. | No errors. |

**Note:** Numbers come from `analytics/staff/data/{uid}`. If that doc doesn’t exist yet (e.g. Cloud Functions haven’t run), you may see **—** or **0** for everyone. That’s expected until analytics are populated.

---

## A3: Permissions & Access in Profile Modal

| Step | Action | Expected |
|------|--------|----------|
| 1 | Click **any staff row** (or use ⋮ → “View full profile”). | Staff Profile modal opens. |
| 2 | Scroll down in the modal (past KPIs, chart, Recent Footprint). | A **“Permissions & Access”** section is visible. |
| 3 | Check the list. | Each permission (e.g. “Manage staff”, “Publish content”) has **✓** or **—**. Pattern matches the staff member’s role (e.g. editor has publish, writer has fewer). |
| 4 | Click **“Customize permissions”** or **“Edit Permissions”** in the modal. | A message like “Customize permissions: coming soon…” (or similar) appears; no crash. |
| 5 | Close the modal and open another staff member’s profile. | Permissions list updates for the new person’s role(s). |
| 6 | Console. | No errors. |

---

## A4: Per-Row ⋮ Menu

| Step | Action | Expected |
|------|--------|----------|
| 1 | In the staff table, find the **⋮** button in the **Actions** column (right side). | Each row has a ⋮ button. |
| 2 | Click **⋮** on one row (do not click the row itself). | A **dropdown menu** opens with: View full profile, View activity log, View written articles, Change role, Suspend/Activate, Remove. |
| 3 | Click **“View full profile”**. | Modal opens for that staff; menu closes. |
| 4 | Close modal. Click ⋮ again; click **“View activity log”**. | Same profile modal opens (activity is in “Recent Footprint”). Menu closes. |
| 5 | Click ⋮ → **“View written articles”**. | Dashboard switches to **Published Content** tab. |
| 6 | Go back to Staff Management. Click ⋮ → **“Change role”**. | A prompt asks for new role. Enter a valid role (e.g. `editor`); after confirm, the row updates and menu closes. |
| 7 | Click ⋮ → **“Suspend”** (or **“Activate”** if already suspended). | Action runs (with any confirmation); list refreshes; menu closes. |
| 8 | Click ⋮ → **“Remove”**. | Confirmation dialog; if you confirm, staff is removed and list refreshes. (Use a test account if you don’t want to remove real staff.) |
| 9 | Click **outside** the menu (e.g. on the table background). | Menu closes. |
| 10 | Console. | No errors. |

---

## A5: Bulk Actions

| Step | Action | Expected |
|------|--------|----------|
| 1 | Look at the table header (first column). | A **checkbox** (“Select all”) is visible. |
| 2 | Look at each row (first column). | Each row has a **checkbox**. |
| 3 | Check **2 or 3** staff (not “Select all”). | Above or beside the filters, text like **“X selected”** and a **“Bulk actions…”** dropdown appear. |
| 4 | Open **“Bulk actions…”** and choose **“Export selected”**. | A CSV downloads with **only** the selected staff. |
| 5 | Select 1–2 staff again. Choose **“Change role”** from bulk actions. | You are prompted for a role; after entering a valid role, **only** the selected staff get the new role; list refreshes; selection clears. |
| 6 | (Optional) Select one **active** staff, choose **“Suspend selected”**, confirm. | That staff becomes Suspended; list refreshes; selection clears. |
| 7 | (Optional) Select one **suspended** staff, choose **“Activate selected”**, confirm. | That staff becomes Active; list refreshes. |
| 8 | Click **“Clear”** when some rows are selected. | Selection clears; “X selected” and bulk dropdown disappear. |
| 9 | Check **“Select all”** (header checkbox). | All **currently filtered** rows become selected; “X selected” matches filtered count. Uncheck “Select all”; selection clears. |
| 10 | Console. | No errors. |

---

## Role Filter (Enhancement)

| Step | Action | Expected |
|------|--------|----------|
| 1 | Open the **role filter** dropdown (in the filters bar). | Options include **All Roles**, **Super Admins**, **Bureau Chiefs**, **Admins**, **Editors**, **Writers**. |
| 2 | Select **Bureau Chiefs** (or any role). | Table shows only staff with that role. Overview counts at top do not change (they are for full list). |

---

## Regression (Quick Pass)

| Step | Action | Expected |
|------|--------|----------|
| 1 | Open **Analytics** tab. | Loads without blank screen. |
| 2 | Open **System Health** tab. | Loads without blank screen. |
| 3 | Open **Published Content** tab. | Loads without blank screen. |
| 4 | Console (all tabs). | No red errors. |

---

## Summary

- **A1:** Staff Overview block shows role counts and Active/Suspended/Online.
- **A2:** Articles column shows per-staff article count (or —).
- **A3:** Profile modal has “Permissions & Access” and “Edit/Customize permissions” placeholder.
- **A4:** ⋮ menu opens dropdown; all actions work and menu closes correctly.
- **A5:** Checkboxes and “Bulk actions” work; Export selected, Change role, Suspend/Activate selected behave as above.

If any step fails, note the step number and what you saw and fix or report as a bug.
