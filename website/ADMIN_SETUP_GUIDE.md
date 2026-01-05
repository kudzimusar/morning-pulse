# Admin Portal Setup Guide

## ✅ Implementation Complete

All code changes have been implemented. This guide explains how to set up and use the new role-based editorial admin system.

## 📋 What Was Implemented

### 1. **Authentication Service** (`services/authService.ts`)
- Email/password authentication for editors
- Role checking (`editor` or `super_admin`)
- Staff collection lookup
- Auth state management

### 2. **Status Utility** (`utils/opinionStatus.ts`)
- UI-friendly status labels
- Database status mapping (no data migration needed)

### 3. **Admin Login Component** (`components/AdminLogin.tsx`)
- Professional login UI
- Error handling
- Success callbacks

### 4. **Enhanced Admin Review** (`components/AdminOpinionReview.tsx`)
- Role-based access control
- Editor authentication checks
- Logout functionality
- Editor notes support (ready for UI)

### 5. **App Integration** (`App.tsx`)
- Admin route handling (`#admin` or `/admin`)
- Role-based rendering
- Login page display

## 🔧 Firebase Console Setup (REQUIRED)

### Step 1: Enable Email/Password Authentication

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: `gen-lang-client-0999441419`
3. Navigate to **Authentication** → **Sign-in method**
4. Click **Email/Password**
5. Enable **Email/Password** (toggle ON)
6. Click **Save**

### Step 2: Create Staff Collection

1. Go to **Firestore Database**
2. Navigate to: `artifacts` → `morning-pulse-app` → `staff`
3. Create a new document with your **Firebase Auth UID** as the document ID
4. Add these fields:
   ```json
   {
     "role": "super_admin",
     "email": "your@email.com",
     "createdAt": [timestamp]
   }
   ```

**How to get your UID:**
- After logging in via AdminLogin, check browser console
- Or use Firebase Console → Authentication → Users → Copy UID

### Step 3: Create Editor Account

1. Go to **Authentication** → **Users**
2. Click **Add user**
3. Enter email and password
4. Copy the **UID** of the new user
5. Create staff document with that UID and `role: "editor"`

## 🚀 Usage

### For Editors

1. **Access Admin Portal:**
   - Navigate to: `https://your-site.com#admin`
   - Or: `https://your-site.com/admin`

2. **Login:**
   - Enter email and password
   - Click "Sign In"

3. **Review Opinions:**
   - Admin panel appears on news/opinion pages
   - Review pending submissions
   - Approve or reject opinions
   - Replace images if needed

4. **Logout:**
   - Click "LOGOUT" button in admin panel header

### For Super Admins

- Same as editors, plus:
- Can manage staff (future feature)
- Full system access

## 🔒 Security Notes

### Current Protection

- ✅ Role-based UI rendering
- ✅ Staff collection lookup
- ✅ Editor authentication required
- ✅ Access denied for unauthorized users

### Recommended Next Steps

1. **Firestore Security Rules:**
   ```javascript
   match /artifacts/morning-pulse-app/staff/{uid} {
     allow read: if request.auth != null;
     allow write: if request.auth != null && 
       get(/databases/$(database)/documents/artifacts/morning-pulse-app/staff/$(request.auth.uid)).data.role == 'super_admin';
   }
   ```

2. **Storage Rules:**
   ```javascript
   match /published_images/{allPaths=**} {
     allow write: if request.auth != null && 
       exists(/databases/$(database)/documents/artifacts/morning-pulse-app/staff/$(request.auth.uid));
   }
   ```

## 📝 Status Values

### Database (Unchanged)
- `'pending'` - Opinion submitted, awaiting review
- `'published'` - Opinion approved and live
- `'rejected'` - Opinion rejected

### UI Labels (New)
- `'Submitted'` - Shows for `'pending'` status
- `'Published'` - Shows for `'published'` status
- `'Rejected'` - Shows for `'rejected'` status

**No data migration needed** - existing opinions work correctly.

## 🧪 Testing Checklist

- [ ] Email/password auth enabled in Firebase Console
- [ ] Staff collection created with your UID
- [ ] Staff document has `role: 'super_admin'`
- [ ] Can access `/admin` or `#admin` route
- [ ] Login form appears
- [ ] Can login with email/password
- [ ] Admin panel appears after login
- [ ] Can see pending opinions
- [ ] Can approve opinions
- [ ] Can reject opinions
- [ ] Logout works
- [ ] Access denied shows for non-editors

## 🐛 Troubleshooting

### "Access Denied" after login
- **Check:** Staff document exists with correct UID
- **Check:** Role field is exactly `'super_admin'` or `'editor'`
- **Check:** Firestore path: `artifacts/morning-pulse-app/staff/{your-uid}`

### Login fails
- **Check:** Email/Password auth enabled in Firebase Console
- **Check:** User exists in Authentication → Users
- **Check:** Browser console for error messages

### Admin panel doesn't appear
- **Check:** `VITE_ENABLE_ADMIN=true` in environment
- **Check:** You're on `news` or `opinion` page
- **Check:** Role check passed (check console logs)

### Can't see pending opinions
- **Check:** Opinions exist with `status: 'pending'`
- **Check:** Firestore path: `artifacts/morning-pulse-app/public/data/opinions`
- **Check:** Browser console for subscription errors

## 📚 File Structure

```
website/src/
├── services/
│   ├── authService.ts          ← NEW: Editor authentication
│   └── opinionsService.ts      ← ENHANCED: Added editorNotes param
├── utils/
│   └── opinionStatus.ts        ← NEW: Status mapping utility
├── components/
│   ├── AdminLogin.tsx          ← NEW: Login component
│   └── AdminOpinionReview.tsx  ← ENHANCED: Role checks added
├── App.tsx                     ← ENHANCED: Admin route handling
└── types.ts                    ← ENHANCED: Added editorNotes field
```

## ✅ Backward Compatibility

All changes are **100% backward compatible**:

- ✅ Public submission flow unchanged
- ✅ Anonymous authentication still works
- ✅ Existing opinion data works
- ✅ Status values unchanged in database
- ✅ No breaking changes to existing functions

## 🎯 Next Steps (Optional Enhancements)

1. **Super Admin Panel:**
   - Staff management UI
   - Role assignment
   - User management

2. **Editor Notes UI:**
   - Textarea in admin panel
   - Save notes on approval
   - View notes in review

3. **Audit Log:**
   - Track who approved/rejected
   - Timestamp logging
   - Action history

4. **Revision Workflow:**
   - Request changes
   - Send back to author
   - Revision tracking

## 📞 Support

If you encounter issues:
1. Check browser console for errors
2. Verify Firebase Console settings
3. Check Firestore data structure
4. Review this guide's troubleshooting section

---

**Implementation Date:** $(date)
**Status:** ✅ Complete and Ready for Testing
