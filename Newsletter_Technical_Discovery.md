# Newsletter System Technical Discovery

This document provides a comprehensive technical audit of the existing Morning Pulse newsletter system. The information below is intended to guide the safe and correct implementation of future enhancements.

---

## 1. Newsletter Generator — Entry Points

### 1.1. Primary UI Implementation

- **File Path:** `/home/ubuntu/morning-pulse/website/src/components/admin/NewsletterTab.tsx`
- **React Component:** `NewsletterTab`

### 1.2. Routes and Exposure

The Newsletter Generator is exposed as a tab within the main `AdminDashboard` component. Access is controlled by the following:

- **Route:** The `AdminDashboard` is the primary authenticated route for editorial staff.
- **Tab ID:** `newsletter`
- **Permissions:** The `NewsletterTab` is explicitly available to users with the `super_admin` role, as defined in the `AdminDashboard.tsx` component.

### 1.3. Coupling with Article Publishing

The Newsletter Generator is **loosely coupled** to the article publishing system. It operates as follows:

- It automatically fetches published articles from the `opinions` collection in Firestore using the `getPublishedOpinions` function located in `/home/ubuntu/morning-pulse/website/src/services/opinionsService.ts`.
- The generator is a standalone tool that can create newsletters from any content that has been published within a specified date range (`today`, `week`, `month`).

---


## 2. Newsletter Data Model (Firestore)

### 2.1. Firestore Collections

The newsletter system uses the following Firestore paths:

- **Subscribers:** `artifacts/morning-pulse-app/public/data/subscribers`
  - Each document ID is the lowercase email address of the subscriber.
- **Send Logs:** `artifacts/morning-pulse-app/analytics/newsletters/sends`
  - Stores records of every newsletter broadcast.

### 2.2. Document Schemas

#### Subscriber Document Schema
| Field | Type | Description |
| :--- | :--- | :--- |
| `email` | `string` | Lowercase email address |
| `name` | `string \| null` | Subscriber's name |
| `interests` | `array (string)` | List of topics (e.g., "politics", "tech") |
| `status` | `string` | "active" or "inactive" |
| `emailNewsletter` | `boolean` | Flag for email subscription status |
| `subscribedAt` | `timestamp` | When the user joined |
| `unsubscribedAt` | `timestamp` | When the user left (if applicable) |
| `updatedAt` | `timestamp` | Last profile update |

#### Send Log Document Schema
| Field | Type | Description |
| :--- | :--- | :--- |
| `subject` | `string` | Email subject line |
| `sentAt` | `timestamp` | When the broadcast started |
| `totalSubscribers` | `number` | Total active subscribers at time of send |
| `targetedSubscribers`| `number` | Subscribers matching interest filters |
| `successfulSends` | `number` | Count of successful deliveries via ESP |
| `failedSends` | `number` | Count of failed deliveries |
| `interests` | `array \| null` | Interests used for segmentation |

### 2.3. Status Tracking

- **Newsletter Status:** Status is tracked primarily via the send logs in the `analytics` collection. There is no separate "drafts" collection; newsletters are generated on-the-fly in the UI or Cloud Functions.
- **Subscriber Status:** Tracked via the `status` ("active"/"inactive") and `emailNewsletter` (boolean) fields in the subscriber document.

---

## 3. Email Delivery Layer (CRITICAL)

### 3.1. Email Provider

- **Provider:** **SendGrid**
- **Sender Domain:** `morningpulse.net` (as per `NEWSLETTER_FROM_EMAIL` config)
- **Sender Email:** `news@morningpulse.net`

### 3.2. Implementation Details

- **Send Logic:** Implemented as **Firebase Cloud Functions** (server-side).
- **Primary Function:** `sendNewsletter` (HTTP POST)
- **Scheduled Function:** `sendScheduledNewsletter` (HTTP POST, intended for Cloud Scheduler)
- **Internal Helper:** `sendNewsletterEmail` (handles batching and SendGrid API calls)
- **File Path:** `/home/ubuntu/morning-pulse/functions/index.js`

### 3.3. Secrets Management

- **API Keys:** Managed via **Environment Variables** in the Google Cloud/Firebase environment.
- **Key Variables:** `SENDGRID_API_KEY`, `NEWSLETTER_FROM_EMAIL`, `APP_ID`.

---

## 4. HTML Email Templates

### 4.1. Template Definition

- **Format:** Templates are defined as **Template Strings** (Inline JSX-like HTML) within both the client-side service and the Cloud Functions.
- **File Paths:**
  - Client-side: `/home/ubuntu/morning-pulse/website/src/services/newsletterService.ts` (Function: `generateNewsletterHTML`)
  - Cloud Functions: `/home/ubuntu/morning-pulse/functions/index.js` (Function: `generateNewsletterHTML`)

### 4.2. Template Variations

Currently, there is a **single primary layout** used for all newsletters, but it is dynamically populated based on the `newsletterType` (Daily vs. Weekly).

### 4.3. Branding and Preview

- **Branding:** The "MORNING PULSE" logo, black header, and specific typography (Georgia serif) are hardcoded into the template strings.
- **Preview Mode:** The UI in `NewsletterTab.tsx` includes a "Preview in Browser" feature which opens a new window and writes the generated HTML directly to it (`previewWindow.document.write(html)`).

---

## 5. Subscribers & Preferences

### 5.1. Storage and Schema

- **Firestore Path:** `artifacts/morning-pulse-app/public/data/subscribers/{email}`
- **Schema:** (See Section 2.2 for detailed field list)

### 5.2. Unsubscribe Handling

- **Mechanism:** Link-based. The SendGrid tracking settings are configured to include an unsubscribe URL: `<%unsubscribe_url%>`.
- **Backend Sync:** The `manageSubscription` Cloud Function handles the `unsubscribe` action, which updates the Firestore document status to `inactive` and `emailNewsletter` to `false`.

### 5.3. Preference Center

- **Implementation:** There is a **Subscriber Management UI** in the Admin Dashboard (`SubscriberTab.tsx`).
- **Segmentation:** Supported via the `interests` array. Users can be segmented by categories such as politics, business, tech, etc.
- **Frontend Preferences:** The `updateNewsletterPreferences` service function allows updating name and interests.

---

## 6. Analytics & Tracking

### 6.1. Tracking Mechanism

- **Opens & Clicks:** Tracked via **SendGrid's built-in tracking**. The `sendNewsletterEmail` function explicitly enables `open_tracking` and `click_tracking`.
- **Custom Tracking:** Currently, there is no custom redirect-based tracking implemented in the code; it relies on the ESP (Email Service Provider).

### 6.2. Analytics Storage

- **ESP Dashboard:** Detailed per-link click data and open rates are stored within the SendGrid dashboard.
- **Firestore:** High-level aggregate stats (success/fail counts) are stored in `artifacts/morning-pulse-app/analytics/newsletters/sends` after each send.

### 6.3. Existing UI

- **Admin Analytics:** The aggregate send stats are not yet fully exposed in a dedicated Newsletter Analytics UI, although the data exists in Firestore.

---

## 7. Scheduling

### 7.1. Current Support

- **Manual Trigger:** Scheduling is currently **manual** via the UI, which calls the `sendScheduledNewsletter` function.
- **Backend Readiness:** The `sendScheduledNewsletter` Cloud Function is designed to be triggered by an external cron/scheduler (like Google Cloud Scheduler) but the automated trigger is not explicitly defined in the repository's source code.
- **Logic:** It uses `setTimeout` or similar for immediate UI feedback but relies on Firestore queries (`where('publishedAt', '>=', cutoffDate)`) to determine what to send.

### 7.2. Time Zone Handling

- **Handling:** Dates are handled using standard JavaScript `Date` objects and Firestore `Timestamp`. There is no explicit per-user timezone logic; it currently operates on the server's system time (UTC).

---

## 8. Compliance & Article Integration

### 8.1. Compliance (CAN-SPAM)

- **Unsubscribe:** Included via SendGrid's `<%unsubscribe_url%>`.
- **Physical Address:** Currently **not explicitly visible** in the footer template strings in `index.js` or `newsletterService.ts`. This is a recommended addition for full compliance.
- **Sender Identity:** Clearly identified as "Morning Pulse News".

### 8.2. Article → Newsletter Integration

- **"Send to Newsletter" Flag:** There is **no explicit flag** on individual articles. Instead, the system pulls all articles with `status: 'published'` within the requested timeframe.
- **Auto-generation:** Supported via the `generateNewsletter` function which filters by date and status.

---

## 9. Ads & Monetization

### 9.1. Sponsored Blocks

- **Current Support:** The newsletter system **does not** currently support sponsored blocks or ad units.
- **Injection Points:** Ad rendering logic would need to be injected into the `generateNewsletterHTML` functions in both the frontend service and the Cloud Functions.
- **Integration Strategy:** The existing `adManagementService` and `ads` collection could be queried to find "Active" ads with a specific placement (e.g., `newsletter_inline`) to be injected into the HTML template during generation.

---

## 10. Security & Permissions

### 10.1. Roles and Enforcement

- **Access Control:**
  - **Create/Send:** Restricted to `super_admin` in the UI (`AdminDashboard.tsx`).
  - **View Analytics:** Restricted to `admin` or `super_admin`.
- **Enforcement Points:**
  - **UI:** Tab visibility is filtered in `AdminDashboard.tsx`.
  - **Firestore:** `firestore.rules` enforces that only editors/admins can read/write to the `opinions` and `staff` collections. However, specific rules for the `subscribers` collection are currently set to a default deny or restricted to admins in the general `match /{document=**}` block.

---

## 11. Known Limitations & Tech Debt

### 11.1. Brittle Areas

- **Duplicate Templates:** The HTML template logic is duplicated between the frontend (`newsletterService.ts`) and the backend (`index.js`). Changes to the design must be applied in two places.
- **Mock Data:** The `SubscriberTab.tsx` currently uses mock data for the initial display, which may lead to confusion if not replaced with a real Firestore subscription.
- **Hardcoded IDs:** The `APP_ID` and Firestore paths are often hardcoded or rely on a global `window` variable, which can be fragile across different environments.

### 11.2. Deliverability & Compliance

- **Missing Physical Address:** The lack of a physical address in the footer is a minor compliance gap.
- **Manual Batching:** While `sendNewsletterEmail` handles batching of 1000, it does not have sophisticated retry logic for individual failed emails within a batch.

---

## 12. Conclusion & Next Steps

The Morning Pulse newsletter system is a robust foundation that is well-integrated with the editorial workflow. To extend it safely for the requested enhancements, we should focus on:

1. **Centralizing Templates:** Moving the HTML generation to a single source of truth.
2. **Implementing Ad Injection:** Leveraging the existing Ad Management system to populate sponsored blocks.
3. **Enhancing Analytics:** Exposing the existing send log data in a dedicated Admin UI.
4. **Compliance Updates:** Adding the necessary footer information to meet all legal requirements.

This audit confirms that the system is ready for expansion without requiring a full rebuild.
