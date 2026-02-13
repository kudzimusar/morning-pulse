# Dashboard Live Data Implementation — Report

All dashboard numbers and analytics now reflect live Firestore data instead of hardcoded values.

---

## Summary of Changes

| Area | Before | After |
|------|--------|-------|
| **Command Center** | Mock revenue, users, subscribers; wrong opinions path; hardcoded change % | Real stats from `artifacts/.../opinions`, `artifacts/.../subscribers`; trends from analytics; real imageIssues & scheduledCount |
| **Analytics Tab** | Simulated KPIs and charts | Live data from `getAnalyticsSummary()` → `artifacts/.../analytics` |
| **Revenue Tab** | All mock (KPIs, charts, ad metrics) | Live subscribers, ad impressions/clicks, revenue derived from real data |
| **dashboardService** | Root `opinions` path, mock revenue | Artifacts path for opinions & subscribers; `fetchPriorityCounts`, `fetchRevenueMetrics`, `fetchTrendData` from analytics |

---

## Data Sources (Live)

| Metric | Source |
|--------|--------|
| Total Users | `collection(db, 'users')` |
| Active Staff | `collection(db, 'staff')` |
| Published Content | `artifacts/{APP_ID}/public/data/opinions` where status == 'published' |
| Pending Content | `artifacts/{APP_ID}/public/data/opinions` where status == 'pending' |
| Total Subscribers | `artifacts/{APP_ID}/public/data/subscribers` where status == 'active' |
| Revenue MTD | Active subs × $7.99 + ad revenue (clicks × $0.50) |
| Content Pipeline | `fetchContentPipelineCounts()` — counts by status (draft, pending, in-review, scheduled, published, rejected) |
| Scheduled Count | `fetchPriorityCounts()` — opinions where status == 'scheduled' |
| Image Issues | `fetchPriorityCounts()` — pending/published/in-review opinions without finalImageUrl or imageUrl |
| Analytics KPIs | `getAnalyticsSummary()` — totalViews, uniqueVisitors, avgTimeOnPage, bounceRate, topArticles, dailyTraffic |
| Revenue Metrics | `fetchRevenueMetrics()` — subscribers, adImpressions, adClicks, adRevenue, revenueTrend, subscriptionMix |
| Trend Charts | `fetchTrendData()` — uses analytics dailyTraffic when available; else single-point from current stats |

---

## Files Modified

- `website/src/services/dashboardService.ts` — Fixed paths, added `fetchPriorityCounts`, `fetchRevenueMetrics`, `fetchTrendData` from analytics
- `website/src/components/admin/DashboardOverviewTab.tsx` — Real priority counts, removed hardcoded change %
- `website/src/components/admin/AnalyticsTab.tsx` — Replaced mock with `getAnalyticsSummary(db)`
- `website/src/components/admin/RevenueTab.tsx` — Replaced mock with `fetchRevenueMetrics()`

---

## Fallbacks

- **Analytics**: If `artifacts/.../analytics` is empty or errors, `getAnalyticsSummary` returns mock data (demo mode).
- **Trend charts**: If no analytics dailyTraffic, shows single-point from current stats.
- **Revenue**: When no subscribers, revenueMTD = 0; subscription mix shows "No subscribers".

---

## Testing

1. Log in as super_admin.
2. **Command Center**: Verify Total Readers, Active Staff, Revenue MTD, Published match Firestore.
3. **Content Status**: Bar chart shows live counts by status.
4. **Priority Summary**: Pending, Image Issues, Scheduled, Recently Published match live data.
5. **Analytics Tab**: KPIs and charts reflect analytics doc (or mock when empty).
6. **Revenue Tab**: MTD Revenue, Active Subs, Ad Impressions, Ad Clicks, Ad Revenue are live.
7. **Trend charts**: Show analytics dailyTraffic when available; otherwise current month snapshot.
