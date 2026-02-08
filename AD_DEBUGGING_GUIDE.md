# Ad Debugging Guide

This guide helps troubleshoot issues where ads are not displaying on the Morning Pulse website.

## 🚨 Common Symptoms

1.  **"No ads found" in console**
2.  **Ad slots are blank or collapsed**
3.  **Fallback "Partner with us" messages showing instead of paid ads**

## 🔍 How to Diagnose

1.  **Check Browser Console**
    *   Look for logs starting with `[AdSlot]`, `[getAdSlot]`, or `[Waterfall]`.
    *   Key success message: `✅ [getAdsForSlot] Found X ads for Slot [slot_id]`
    *   Key failure message: `❌ [getAdsForSlot] No ads found for Slot [slot_id] after all waterfall steps.`

2.  **Verify Ad Data (Firestore)**
    *   Collection: `artifacts/morning-pulse-app/public/data/ads`
    *   For an ad to appear, it **MUST** satisfy ALL of these conditions:
        *   `status`: **'active'** (Not 'approved', 'pending', or 'expired')
        *   `paymentStatus`: **'paid'** (or `isHouseAd: true`)
        *   `startDate`: **Before or equal to today**
        *   `endDate`: **After or equal to today**

## 🛠️ How to Fix "No Ads"

### Method 1: update via Admin Dashboard (Recommended)
1.  Log in as **Super Admin**.
2.  Go to **Ad Management** tab.
3.  Check the **Active Ads** list.
4.  If an ad is "Approved" but not "Active", click **Activate**.
    *   *Note: You may need to manually mark it as "Paid" first if payment integration is mocked.*

### Method 2: Create a Permanent "House Ad"
If you want a permanent backup ad that always shows when no paid ads are available:
1.  Create a new Ad.
2.  Set `isHouseAd: true`.
3.  Set `paymentStatus: 'paid'` (House ads don't need real payment).
4.  Set `startDate` to today and `endDate` to far future (e.g., 2030).
5.  Set `status: 'active'`.

### Method 3: Run Seed Script (Developer)
If you are a developer, you can use the `seed_ads.js` script (if available) or manually insert documents into Firestore matching the criteria above.

## 📉 The "Waterfall" Logic
The system tries to find ads in this order:
1.  **Paid Slot-Specific Ads**: Ads bought specifically for `header_banner` (Premium).
2.  **Paid Placement Ads**: Ads bought for general `header` placement (Standard).
3.  **House Ads**: Internal promotions (Fallback).
4.  **AdSlot Fallback**: The "Partner with us" UI component (Last resort).

If you see the fallback UI, it means steps 1-3 all failed to find a valid ad.
