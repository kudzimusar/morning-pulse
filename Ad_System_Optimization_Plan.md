# 🎯 Ad System Optimization Plan: "The Revenue-First Waterfall"

This plan outlines the steps to resolve the ad visibility issues while strictly enforcing the requirement that only **'paid'** ads are displayed on the live site.

---

## 🏗️ Phase 1: Precision Querying & Waterfall Logic
**Goal**: Ensure the frontend asks for the right data and has a fallback if no paid ads exist.

1.  **Direct Slot ID Mapping**:
    - Modify `advertiserService.ts` to query Firestore using the specific `slotId` (e.g., `header_banner`) instead of a general "placement" category.
    - This eliminates the "Placement Map" and ensures 1:1 mapping between the UI and the database.

2.  **Implementation of the "Waterfall"**:
    - **Step A**: Query for `status: 'active'` AND `paymentStatus: 'paid'` for the specific `slotId`.
    - **Step B (Fallback)**: If Step A returns 0 results, query for "House Ads" (ads belonging to the 'Morning Pulse' internal account) that are marked as `paid`.
    - **Result**: The site is never empty, and every impression is a 'paid' impression for analytics purposes.

---

## 🔐 Phase 2: Ad Lifecycle Enforcement
**Goal**: Automate the business rules to prevent human error in ad status.

1.  **Payment-to-Active Trigger**:
    - Update the `approveAd` and `activateAd` functions.
    - Logic: An ad cannot have `status: 'active'` unless `paymentStatus === 'paid'`.
    - If an admin tries to activate an unpaid ad, the system will flag it or automatically set it to `pending_payment`.

2.  **Automated Expiry**:
    - Implement a client-side check that automatically ignores ads where `endDate < now`, even if they are marked as 'active'.

---

## 📊 Phase 3: Analytics & Writer Transparency
**Goal**: Ensure writers and clients see accurate, revenue-linked data.

1.  **Revenue-Linked Tracking**:
    - Ensure `trackAdImpression` only fires for ads that have passed the 'paid' validation.
    - This ensures that the "Revenue" column in your Ad Management table is always grounded in actual paid transactions.

2.  **Writer Dashboard Integration**:
    - Prepare the data layer so that writers can see how many 'paid' impressions occurred on their specific articles, facilitating future revenue-share models.

---

## 🛠️ Phase 4: Admin Dashboard "Sanity Checks"
**Goal**: Give the business team a clear view of the ad inventory health.

1.  **Inventory Health View**:
    - Add a small "Inventory Status" widget to the Ad Management tab.
    - Show: "Paid Slots", "Empty Slots (Showing House Ads)", and "Pending Payments".

2.  **Validation Alerts**:
    - Highlight any ads in the table that are `active` but have an `endDate` in the past, or are `active` but `unpaid`.

---

## 🚀 Execution Strategy
- **Step 1**: Refactor the `getAdsForSlot` function in `advertiserService.ts`.
- **Step 2**: Update `AdSlot.tsx` to handle the waterfall fallback.
- **Step 3**: Update the Admin UI to show "House Ads" as a separate category for easier management.

**Ready to proceed with Phase 1?**

---

## 🏠 How "House Ads" are Marked as 'Paid' Internally

To maintain the integrity of your `paymentStatus: 'paid'` requirement without skewing actual client revenue, we implement the following logic for House Ads:

1.  **The "Internal" Flag**: 
    - Every House Ad is assigned a specific `advertiserId` (e.g., `morning-pulse-internal`).
    - In the Firestore document, we add a boolean field `isHouseAd: true`.

2.  **Automated 'Paid' Status**:
    - When a House Ad is created, the system automatically sets `paymentStatus: 'paid'`.
    - **Why?** Because the "cost" is covered by the company's own marketing budget. Internally, it is a $0.00 transaction that is "pre-approved."

3.  **Analytics Separation**:
    - **For the Company**: Impressions for House Ads are tracked so you can see the "value" of your own inventory (e.g., "We delivered $500 worth of internal impressions this week").
    - **For Revenue Reports**: The reporting logic filters out any ad where `isHouseAd: true` when calculating "Total Client Revenue." This ensures your financial statements only show actual cash-in from external clients.

4.  **The "Waterfall" Benefit**:
    - The frontend doesn't need to know the difference. It just asks: *"Is it Paid?"* 
    - Both Client Ads and House Ads say *"Yes"*, so the site remains functional and the tracking code remains simple and secure.
