# Morning Pulse - Admin Dashboard User Guide

## 🎯 Overview

The Admin Dashboard is a comprehensive editorial control center for managing content, staff, analytics, and platform settings. This guide covers all features and how to use them.

---

## 🔐 Access & Authentication

### Login URL
```
https://kudzimusar.github.io/morning-pulse/#admin
```

Or navigate to:
```
https://kudzimusar.github.io/morning-pulse/
```
Then click "Go to Dashboard" (visible to editors) or manually go to `#admin`

### User Roles

- **Writer**: Can submit articles (no dashboard access)
- **Editor**: Full editorial access (approve, reject, edit, publish)
- **Admin**: All editor permissions + staff management + settings
- **Super Admin**: Full system access

### First-Time Login

1. Navigate to the admin login page
2. Enter your email and password
3. System verifies your role from `/staff/{uid}` collection
4. If authorized, you'll see the dashboard immediately

---

## 📊 Dashboard Overview Tab

**URL**: Automatically shown after login

### Priority Summary Panel

The first thing you see - shows what needs immediate attention:

- **🔴 Pending Approval**: Articles waiting for review (click to go to Editorial Queue)
- **🟠 Image Issues**: Articles missing images (click to go to Image Compliance)
- **🟡 Scheduled Today**: Articles ready to publish (coming soon)
- **🟢 Recently Published**: Articles published in last 24 hours (click to go to Published Content)

### Today's Activity

Shows recent editorial actions and system updates.

---

## 📝 Editorial Queue Tab

**Purpose**: Review, edit, and publish pending articles

### Left Panel - Pending Queue

- Lists all articles with status: `Submitted` or `Under Review`
- Shows: Title, Author, Submission Date, Status Badge
- Click any article to load it into the editor

### Right Panel - Editor Suite

#### Editable Fields

1. **Status Dropdown**
   - Submitted → Under Review → Published/Rejected
   - Changing status updates the article in real-time

2. **Title** (Monospace font)
   - Edit the headline

3. **Sub-headline** (Monospace font)
   - Edit the sub-headline

4. **Author Name** (Monospace font)
   - Edit author attribution

5. **Image Management**
   - View suggested/generated image
   - Upload replacement image (max 5MB)
   - Recommended: 2000px width, 16:9 aspect ratio
   - Click "Replace Image" to upload

6. **Body (HTML)** (Monospace font)
   - Edit the full article content
   - Supports HTML formatting

7. **Editor Notes (Private)**
   - Internal notes (not published)
   - Use for feedback, reminders, or editorial comments

### Action Buttons

- **Reject** (Red): Rejects the article, sets status to `rejected`
- **Save Draft**: Saves changes without publishing
- **Approve & Publish** (Green): 
  - Requires image (final or suggested)
  - Sets status to `published`
  - Makes article visible to public
  - Removes from pending queue

### Workflow Example

1. Click article in left panel
2. Review content in right panel
3. Edit title, body, or other fields as needed
4. Upload replacement image if needed
5. Add editor notes (optional)
6. Click "Approve & Publish" or "Reject"

---

## ✅ Published Content Tab

**Purpose**: Manage published articles

### Features

- **Search**: Search by title or author name
- **Filter by Category**: Dropdown filter
- **Filter by Author**: Dropdown filter
- **Sort**: Automatically sorted by publish date (newest first)

### Actions

- **Unpublish**: Removes article from public view, sets status back to `pending`
- **View Details**: Click article card to see full details

### Use Cases

- Find and edit published articles
- Unpublish articles that need corrections
- Review what's currently live

---

## 👥 Staff Management Tab

**Access**: Admin and Super Admin only

**Purpose**: Manage editorial team members

### Features

#### View All Staff

- Lists all staff members from `/staff/{uid}` collection
- Shows: Name, Email, Roles, Last Active timestamp

#### Add New Staff

1. Click "+ Add Staff" button
2. Enter Email and Name
3. Select roles (Writer, Editor, Admin)
4. Click "Add Staff"
   - **Note**: Currently requires manual addition via Firebase Console
   - Full invitation system coming soon

#### Update Roles

- Use dropdown on each staff card
- Select new role combination
- Changes apply immediately

#### Remove Staff

- Click "Remove" button on staff card
- Confirmation required
- Removes from `/staff` collection

### Role Combinations

- **Writer**: Can submit articles
- **Editor**: Can approve/reject/publish
- **Admin**: All editor permissions + staff management
- **Writer + Editor**: Can submit and approve
- **Editor + Admin**: Full access

---

## 📈 Analytics Tab

**Purpose**: View platform statistics and metrics

### Key Metrics

- **Total Published**: Count of published articles
- **Total Submissions**: All articles (pending + published + rejected)
- **Rejected**: Count of rejected articles
- **Views Today**: Article views (tracking coming soon)

### Top Categories

- Shows top 5 categories by article count
- Sorted by popularity

### Recent Activity

- Last 10 published articles
- Shows publish timestamp
- Links to article details

### Data Refresh

- Auto-refreshes every 30 seconds
- Manual refresh by navigating away and back

---

## 🖼️ Image Compliance Tab

**Purpose**: Validate and manage article images

### Image Requirements

- **Maximum Width**: 2000px
- **Aspect Ratio**: 16:9 (recommended)
- **Maximum File Size**: 5MB
- **Formats**: JPG, PNG, WebP

### Features

#### View All Articles with Images

- Grid view of all articles (pending + published)
- Shows thumbnail, title, author, status
- Click any article to manage its image

#### Replace Image

1. Click article card
2. Modal opens showing current image
3. Click "Upload Replacement Image"
4. Select file
5. System validates:
   - File size
   - Image dimensions
   - Aspect ratio
6. If valid, uploads to Firebase Storage
7. Updates article with new `finalImageUrl`

#### Validation Feedback

- Shows specific error if image doesn't meet requirements
- Success message when upload completes

---

## ⚙️ Settings Tab

**Access**: Admin and Super Admin only

**Purpose**: Platform configuration

### Publishing Settings

- **Require Image Before Publishing**: Toggle to enforce image requirement
- **Auto-Publish Approved Articles**: Coming soon

### System Settings

- **Maintenance Mode**: Coming soon
  - When enabled, public site shows maintenance message

### Platform Information

- **App ID**: morning-pulse-app
- **Firestore Path**: artifacts/morning-pulse-app/public/data/opinions
- **Storage Path**: published_images/
- **Staff Collection**: /staff/{uid}

### Saving Settings

- Click "Save Settings" button
- Settings stored in Firestore (coming soon)

---

## 🔒 Security & Permissions

### Role-Based Access

- **Editor Role Required**: All write operations (publish, reject, edit)
- **Admin Role Required**: Staff Management, Settings
- **Automatic Checks**: System verifies role before every action

### Firestore Security

- All editorial content: `artifacts/morning-pulse-app/public/data/opinions`
- Staff collection: `/staff/{uid}` (root level)
- Storage: `published_images/{articleId}/`

### Security Guards

- Every Firestore write checks user role
- Unauthorized actions show error toast
- No silent failures

---

## 🚀 Quick Start Guide

### For Editors

1. **Login**: Go to `#admin` and sign in
2. **Check Priority**: Review Priority Summary on Dashboard Overview
3. **Review Articles**: Go to Editorial Queue tab
4. **Select Article**: Click article in left panel
5. **Edit & Publish**: Make changes, upload image if needed, click "Approve & Publish"

### For Admins

1. **All Editor Functions**: Same as above
2. **Manage Staff**: Go to Staff Management tab
3. **View Analytics**: Go to Analytics tab
4. **Configure Settings**: Go to Settings tab

---

## 📱 Navigation

### Tab Navigation (Left Sidebar)

- **📊 Dashboard Overview**: Priority summary and activity
- **📝 Editorial Queue**: Review and publish articles
- **✅ Published Content**: Manage published articles
- **👥 Staff Management**: Manage team (admin only)
- **📈 Analytics**: View statistics
- **🖼️ Image Compliance**: Validate and replace images
- **⚙️ Settings**: Platform configuration (admin only)

### Keyboard Shortcuts

- Coming soon

---

## 🐛 Troubleshooting

### "Access Denied" Error

- **Cause**: User doesn't have editor role in `/staff/{uid}`
- **Solution**: Contact admin to add your email to staff collection with `roles: ["editor"]`

### "Missing or insufficient permissions" Error

- **Cause**: Firestore security rules blocking access
- **Solution**: Verify you're using correct paths:
  - Editorial content: `artifacts/morning-pulse-app/public/data/opinions`
  - Staff: `/staff/{uid}`

### Image Upload Fails

- **Check**: File size (max 5MB)
- **Check**: Image format (JPG, PNG, WebP)
- **Check**: Network connection
- **Solution**: Try smaller image or different format

### Articles Not Appearing

- **Check**: Status filter (only `pending` shows in Editorial Queue)
- **Check**: Real-time subscription (refresh page)
- **Check**: Firestore connection

---

## 🔗 URLs Reference

### Public Site
- **Home**: `https://kudzimusar.github.io/morning-pulse/`
- **Opinions**: `https://kudzimusar.github.io/morning-pulse/#opinion`

### Admin Dashboard
- **Login**: `https://kudzimusar.github.io/morning-pulse/#admin`
- **Dashboard**: `https://kudzimusar.github.io/morning-pulse/#dashboard` (auto-redirects after login)

### Direct Tab Access (After Login)
- Dashboard Overview: Default view
- Editorial Queue: Click "Editorial Queue" in sidebar
- Published Content: Click "Published Content" in sidebar
- Staff Management: Click "Staff Management" in sidebar (admin only)
- Analytics: Click "Analytics" in sidebar
- Image Compliance: Click "Image Compliance" in sidebar
- Settings: Click "Settings" in sidebar (admin only)

---

## 📞 Support

### For Technical Issues

1. Check browser console for errors
2. Verify Firebase connection
3. Check Firestore security rules
4. Contact system administrator

### For Feature Requests

- Document in project issue tracker
- Contact development team

---

## 🎓 Best Practices

### Editorial Workflow

1. **Start with Priority Summary**: Address urgent items first
2. **Review Before Editing**: Read full article before making changes
3. **Use Editor Notes**: Document why changes were made
4. **Validate Images**: Use Image Compliance tab for bulk image management
5. **Check Analytics**: Monitor what's performing well

### Image Management

- Always validate images before publishing
- Use 16:9 aspect ratio for consistency
- Keep file sizes under 5MB
- Use descriptive filenames

### Staff Management

- Regularly update last active timestamps
- Review roles quarterly
- Remove inactive staff members
- Document role changes

---

## 📝 Notes

- All timestamps use server time (Firestore `serverTimestamp()`)
- Real-time updates via Firestore `onSnapshot`
- Changes are immediate (no page refresh needed)
- Toast notifications confirm all actions
- All data paths respect Firestore security rules

---

**Last Updated**: January 2025
**Version**: 1.0.0
