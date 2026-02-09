# 💰 How to Add a Paid Client Advert

This guide walks you through the complete process of adding a paid advertisement for a client/partner to Morning Pulse.

## 📋 Prerequisites

*   **Client Details**: Company Name, Email.
*   **Ad Creative**: An image file (JPG/PNG). Recommended size: **600x400px** (Header) or **300x250px** (Sidebar).
*   **Target URL**: Where the ad should link to (e.g., client's website).
*   **Dates**: Start and End dates for the campaign.

---

## 🚀 Phase 1: Create the Advertiser Account
*If the client already has an account, skip to Phase 2.*

1.  **Go to Registration Page**:
    *   Navigate to: `https://kudzimusar.github.io/morning-pulse/#advertiser/register`
2.  **Fill in Client Details**:
    *   **Company Name**: The client's business name.
    *   **Email**: Use the client's email (or a managed email like `client@morningpulse.com`).
    *   **Password**: Set a secure password.
    *   **Phone/Website**: Optional but recommended.
3.  **Submit**: Click **"Register as Advertiser"**.
    *   *You will be redirected to the login page.*

---

## 🚦 Phase 2: Approve the Advertiser (Admin)
*New accounts must be approved by a Super Admin before they can submit ads.*

1.  **Log in as Super Admin**:
    *   Go to: `https://kudzimusar.github.io/morning-pulse/#admin`
2.  **Go to Ad Management**:
    *   Click the **"Ad Management"** tab in the dashboard.
3.  **Approve Account**:
    *   Look under the **"Advertisers"** tab > **"Pending Approval"**.
    *   Find the new client account.
    *   Click the green **"Approve"** button.
    *   *The client can now access their dashboard.*

---

## 📤 Phase 3: Submit the Ad (As Advertiser)

1.  **Log in as the Client**:
    *   Go to: `https://kudzimusar.github.io/morning-pulse/#advertiser/login`
2.  **Go to Submit Ad**:
    *   Click **"Submit New Ad"** in the sidebar or top menu.
3.  **Fill Ad Details**:
    *   **Campaign Title**: Internal name (e.g., "Coca-Cola Summer Promo").
    *   **Placement**: Choose **"Header Banner"** (Premium) or **"Sidebar"** (Standard).
    *   **Destination URL**: `https://client-website.com`
    *   **Dates**: Select the Start and End dates.
4.  **Upload Creative**:
    *   Click "Upload Image" and select the client's ad banner.
5.  **Submit**:
    *   Click **"Submit Campaign"**.
    *   *The ad is now in "Pending" status waiting for admin review.*

---

## 💸 Phase 4: Approve & Activate (Admin)
*This is where you confirm payment and make the ad live.*

1.  **Log back in as Super Admin**:
    *   Go to: `https://kudzimusar.github.io/morning-pulse/#admin`
    *   Navigate to **"Ad Management"**.
2.  **Review the Ad**:
    *   Click the **"Creatives"** tab.
    *   Look under **"Pending Approval"**.
    *   You will see the ad preview. Check the image and links.
3.  **Approve**:
    *   Click **"Approve"**.
    *   *The ad moves to the "Active Inventory" list but is NOT live yet.*
4.  **Mark as Paid & Activate**:
    *   Scroll down to **"Active Inventory & Performance"**.
    *   Find the ad (it will likely show a red "PENDING" payment badge).
    *   **Option A: Real Payment (Manual)**
        *   If the client paid via bank transfer/EcoCash:
        *   (If available) update payment status database directly OR use the "Mark House" button if you are managing it internally as a prepaid deal.
        *   *For now, use the "Mark House" button if you want to bypass payment integration, or manually update Firestore field `paymentStatus: 'paid'`.*
    *   **Option B: House Ad (Internal/Free)**
        *   Click **"Mark House"** to make it free/internal.
    *   **Activate**:
        *   Once status is PAID (or House), the **"Activate"** button becomes clickable.
        *   Click **"Activate"**.

---

## ✅ Phase 5: Verification

1.  **Go to the Homepage**: `https://kudzimusar.github.io/morning-pulse/`
2.  **Check the Slot**:
    *   Refresh the page.
    *   Your new ad should appear in the selected slot (Header or Sidebar).
    *   *Note: If multiple ads are active for the same slot, they will rotate randomly.*

---

## ❓ Troubleshooting

*   **Ad not showing?**
    *   Is the date range valid? (Start Date <= Today <= End Date)
    *   Is the status **'active'**?
    *   Is the payment status **'paid'** (or House Ad)?
*   **"No Ads Found" in console?**
    *   Double-check the slot ID (e.g., `header_banner`).
    *   Refer to `AD_DEBUGGING_GUIDE.md` for deep technical checks.
