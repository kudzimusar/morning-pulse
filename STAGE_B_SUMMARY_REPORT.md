# Stage B: System Config, Content Pipeline & Subscriber Growth — Summary & Test Guide

**Scope:** B1 System tab Configuration block, B2 Content pipeline chart, B3 Subscriber growth chart.

Use this checklist after pulling the latest changes to verify Stage B.

---

## Summary of Changes

| Item | Description |
|------|--------------|
| **B1** | **System tab – Configuration & Settings** – New card on System Health tab with rows: Security settings, Email templates, Site appearance, Integrations, Analytics tracking, Advanced settings. Each row has a **Configure** button that navigates to the corresponding tab (Settings, Integrations, or Analytics). `AdminDashboard` passes `onNavigateToTab={…}` to `SystemTab`. |
| **B2** | **Content pipeline chart** – Dashboard Overview (Command Center) now has a **“Content Status (This Week)”** bar chart. Data is loaded from `artifacts/{APP_ID}/public/data/opinions` via `fetchContentPipelineCounts()` in `dashboardService`. Counts by status: Draft, Pending, In Review, Scheduled, Published, Rejected. |
| **B3** | **Subscriber growth chart** – Dashboard Overview has a **“Subscriber Growth (6 Months)”** area chart. Data comes from `fetchTrendData('subscribers')` in `dashboardService` (same shape as User Growth; mock monthly series for now). Existing Revenue and User Growth charts unchanged. |

---

## Before You Start

1. **Build:** From repo root run `cd website && npm run build` — must succeed.
2. **Log in:** Use an account with **super_admin** role and open the Super Admin dashboard.
3. **Tabs used:** Command Center (dashboard), System Health, Settings, Integrations, Analytics.

---

## B1: System Tab – Configuration & Settings Block

| Step | Action | Expected |
|------|--------|----------|
| 1 | Go to **System Health** tab. | System Health & Infrastructure page loads. |
| 2 | Scroll down past the metric cards, infrastructure pulse, and the two-column block (System Infrastructure Status + Critical System Events). | A **“Configuration & Settings”** card is visible. |
| 3 | Check the card content. | Rows visible: **Security settings**, **Email templates**, **Site appearance**, **Integrations**, **Analytics tracking**, **Advanced settings**. Each row has a **Configure** button on the right. |
| 4 | Click **Configure** on **Integrations**. | Dashboard switches to **Integrations** tab. |
| 5 | Go back to **System Health**. Click **Configure** on **Analytics tracking**. | Dashboard switches to **Analytics** tab. |
| 6 | Go back to **System Health**. Click **Configure** on **Security settings** (or Email templates / Site appearance / Advanced settings). | Dashboard switches to **Settings** tab. |
| 7 | Open DevTools → Console. | No red errors. |

---

## B2: Content Pipeline Chart (Dashboard Overview)

| Step | Action | Expected |
|------|--------|----------|
| 1 | Go to **Command Center** (first tab). | Overview loads with KPIs, Revenue chart, etc. |
| 2 | Find the **“Content Status (This Week)”** block. | It is in the left column, below **Revenue Performance (6 Months)** and above **Priority Summary**. |
| 3 | Check the chart. | A **bar chart** with labels: Draft, Pending, In Review, Scheduled, Published, Rejected. Each bar shows a count (number or 0). |
| 4 | (If you have opinions in Firestore at `artifacts/{APP_ID}/public/data/opinions`) | Bar heights reflect counts per status. |
| 5 | (If collection is empty or missing) | All bars may be 0; no crash. |
| 6 | Console. | No errors. |

**Note:** Data is from the same opinions path as Editorial Queue and Published Content. If you see all zeros, ensure the app uses the correct `APP_ID` and that opinions exist in that path.

---

## B3: Subscriber Growth Chart (Dashboard Overview)

| Step | Action | Expected |
|------|--------|----------|
| 1 | Stay on **Command Center**. | Overview loaded. |
| 2 | Scroll to the **Engagement** section (two charts side by side). | You see **User Growth** and a second chart. |
| 3 | Check the second chart title. | **“Subscriber Growth (6 Months)”** is visible. |
| 4 | Check the chart. | Area or line chart with monthly points (e.g. Jan–Jul) and positive values. Same style as User Growth. |
| 5 | Console. | No errors. |

**Note:** Subscriber trend currently uses mock data from `fetchTrendData('subscribers')`. Real subscriber time-series can be wired later from `artifacts/…/subscribers` or equivalent.

---

## Regression (Quick Pass)

| Step | Action | Expected |
|------|--------|----------|
| 1 | Open **System Health** tab. | Loads; Configuration & Settings card visible. |
| 2 | Open **Command Center**. | Revenue, Content Status, Priority Summary, User Growth, Subscriber Growth all visible. |
| 3 | Open **Settings**, **Integrations**, **Analytics** from sidebar. | Each loads without blank screen. |
| 4 | Console (all tabs). | No red errors. |

---

## Files Touched (Stage B)

- `website/src/components/admin/SystemTab.tsx` – `onNavigateToTab` prop, CONFIG_ROWS, Configuration & Settings card.
- `website/src/components/AdminDashboard.tsx` – Pass `onNavigateToTab` to `SystemTab`.
- `website/src/services/dashboardService.ts` – `APP_ID`, `fetchContentPipelineCounts()`, `fetchTrendData('subscribers')`, `ContentPipelineCount` type.
- `website/src/components/admin/DashboardOverviewTab.tsx` – `contentPipelineData`, `subscriberData` state; `fetchContentPipelineCounts()` and `fetchTrendData('subscribers')` in `loadData`; Content Status bar chart; Subscriber Growth chart.

---

## Summary

- **B1:** System Health has a Configuration & Settings card; Configure buttons navigate to Settings, Integrations, or Analytics.
- **B2:** Command Center shows Content Status (This Week) bar chart from artifacts opinions counts.
- **B3:** Command Center shows Subscriber Growth (6 Months) chart from trend data.

If any step fails, note the step number and what you saw and fix or report as a bug.
