# Admin Dashboard - Quick Reference Card

## 🔗 URLs

### Public Access
- **Homepage**: `https://kudzimusar.github.io/morning-pulse/`
- **Opinions Feed**: `https://kudzimusar.github.io/morning-pulse/#opinion`

### Admin Access
- **Login Page**: `https://kudzimusar.github.io/morning-pulse/#admin`
- **Dashboard** (after login): `https://kudzimusar.github.io/morning-pulse/#dashboard`

---

## 👤 User Roles & Access

| Role | Dashboard Access | Can Publish | Can Manage Staff | Can Access Settings |
|------|------------------|-------------|------------------|---------------------|
| Writer | ❌ No | ❌ No | ❌ No | ❌ No |
| Editor | ✅ Yes | ✅ Yes | ❌ No | ❌ No |
| Admin | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| Super Admin | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |

---

## 📋 Dashboard Tabs

| Tab | Icon | Access | Purpose |
|-----|------|--------|---------|
| Dashboard Overview | 📊 | All Editors | Priority summary, activity feed |
| Editorial Queue | 📝 | All Editors | Review, edit, publish articles |
| Published Content | ✅ | All Editors | Manage published articles |
| Staff Management | 👥 | Admin Only | Add/remove staff, assign roles |
| Analytics | 📈 | All Editors | View statistics and metrics |
| Image Compliance | 🖼️ | All Editors | Validate and replace images |
| Settings | ⚙️ | Admin Only | Platform configuration |

---

## 🚀 Quick Actions

### Publish an Article
1. Go to **Editorial Queue** tab
2. Click article in left panel
3. Review and edit content
4. Upload image (if needed)
5. Click **"Approve & Publish"**

### Reject an Article
1. Go to **Editorial Queue** tab
2. Click article in left panel
3. Add rejection reason in Editor Notes
4. Click **"Reject"**

### Manage Staff (Admin Only)
1. Go to **Staff Management** tab
2. Click **"+ Add Staff"** or use dropdowns to update roles
3. Click **"Remove"** to delete staff member

### View Statistics
1. Go to **Analytics** tab
2. View key metrics, top categories, recent activity

### Replace Image
1. Go to **Image Compliance** tab
2. Click article card
3. Upload new image (validates automatically)
4. Image updates immediately

---

## 🔒 Security Paths

### Firestore Collections
- **Editorial Content**: `artifacts/morning-pulse-app/public/data/opinions`
- **Staff**: `/staff/{uid}` (root level)
- **Analytics**: `artifacts/morning-pulse-app/public/data/analytics/articles/{articleId}`

### Storage Paths
- **Images**: `published_images/{articleId}/{filename}`

---

## ⚡ Keyboard Shortcuts

Coming soon...

---

## 🆘 Common Issues

| Issue | Solution |
|-------|----------|
| "Access Denied" | Contact admin to add you to `/staff` collection |
| "Missing permissions" | Verify Firestore paths match security rules |
| Image upload fails | Check file size (max 5MB) and format |
| Articles not showing | Check status filter, refresh page |

---

## 📞 Support

- **Full Guide**: See `ADMIN_DASHBOARD_GUIDE.md`
- **Technical Issues**: Check browser console, verify Firebase connection
- **Feature Requests**: Document in project tracker

---

**Version**: 1.0.0 | **Last Updated**: January 2025
