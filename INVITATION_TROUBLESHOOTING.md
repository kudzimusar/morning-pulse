# Invitation Link Troubleshooting Guide

## 🔍 Issue: 404 or Link Not Working

If your invitation link like `https://kudzimusar.github.io/#join?token=...` is returning 404 or failing to load, follow this checklist.

---

## ✅ Verification Checklist

### **1. Path Verification**

**Invites Collection:**
- ✅ Path: `artifacts/morning-pulse-app/public/data/invites/{token}`
- ✅ Verified in: `inviteService.ts` (lines 107, 129, 235, 295)
- ✅ Firestore Rules: Allows public read (line 74 in firestore.rules)

**Staff Collection:**
- ✅ Path: `artifacts/morning-pulse-app/public/data/staff/{uid}`
- ✅ Verified in: 
  - `inviteService.ts` (line 211) - Creates staff
  - `staffService.ts` (line 55) - Reads staff
  - `authService.ts` (line 136, 208) - Checks staff
  - `AdminDashboard.tsx` (line 127, 150) - Checks staff
- ✅ Firestore Rules: Admin-write, authenticated-read (line 42 in firestore.rules)

### **2. Routing Verification**

**Hash Routing:**
- ✅ URL Format: `https://kudzimusar.github.io/#join?token=XYZ`
- ✅ Hash Extraction: `window.location.hash.replace('#', '')` → `join?token=XYZ`
- ✅ Route Match: `hash.startsWith('join?')` → ✅ Matches
- ✅ Component: `currentPage === 'join'` → Renders `<JoinPage />`
- ✅ Verified in: `App.tsx` (line 276, 748)

**Token Parsing:**
- ✅ Hash: `#join?token=XYZ`
- ✅ Split: `hash.split('?')` → `['#join', 'token=XYZ']`
- ✅ Params: `new URLSearchParams('token=XYZ')`
- ✅ Token: `params.get('token')` → `XYZ`
- ✅ Verified in: `JoinPage.tsx` (line 24-36)

### **3. Firestore Rules Deployment**

**Critical:** Rules must be deployed for invites to work!

```bash
# Deploy rules
firebase deploy --only firestore:rules
```

**Check Rules:**
- Go to: https://console.firebase.google.com/project/gen-lang-client-0999441419/firestore/rules
- Verify rules match `firestore.rules` file
- Look for: `/artifacts/{appId}/public/data/invites/{token}` with `allow read: if true;`

---

## 🐛 Common Issues & Fixes

### **Issue 1: "404 Not Found"**

**Possible Causes:**
1. ❌ App not deployed to GitHub Pages
2. ❌ Wrong base URL (missing `/morning-pulse` path)
3. ❌ Hash routing not working

**Solutions:**
1. **Check deployment:**
   ```bash
   # Verify site is live
   curl https://kudzimusar.github.io/morning-pulse/
   ```

2. **Check URL format:**
   - ✅ Correct: `https://kudzimusar.github.io/morning-pulse/#join?token=...`
   - ❌ Wrong: `https://kudzimusar.github.io/#join?token=...` (missing path)

3. **Check browser console:**
   - Open DevTools (F12)
   - Look for: `🔗 [ROUTING] Join page detected`
   - Look for: `🔍 [JOIN] Parsing hash:`

### **Issue 2: "Invalid Invitation" Error**

**Possible Causes:**
1. ❌ Token not found in Firestore
2. ❌ Invitation expired (7 days)
3. ❌ Invitation already used
4. ❌ Firestore rules blocking read

**Solutions:**
1. **Check Firestore Console:**
   - Go to: https://console.firebase.google.com/project/gen-lang-client-0999441419/firestore/data
   - Navigate: `artifacts` → `morning-pulse-app` → `public` → `data` → `invites`
   - Find token: `1a3a8e50-34a6-4fe8-9efe-91c91ffef3ab`
   - Check status: Should be `pending`

2. **Check expiration:**
   - Look at `expiresAt` field
   - Should be 7 days from `createdAt`
   - If expired, create new invitation

3. **Check Firestore rules:**
   - Rule should allow: `allow read: if true;`
   - Deploy rules if not deployed

### **Issue 3: "Missing or insufficient permissions"**

**Possible Causes:**
1. ❌ Firestore rules not deployed
2. ❌ Rules blocking read access
3. ❌ User not authenticated (shouldn't matter for invites)

**Solutions:**
1. **Deploy rules:**
   ```bash
   firebase deploy --only firestore:rules
   ```

2. **Verify rules:**
   ```javascript
   // Should have this in firestore.rules:
   match /artifacts/{appId}/public/data/invites/{token} {
     allow read: if true;  // ✅ Public read allowed
   }
   ```

3. **Check browser console:**
   - Look for Firebase permission errors
   - Check network tab for Firestore requests

### **Issue 4: Staff Not Created After Signup**

**Possible Causes:**
1. ❌ Wrong staff path
2. ❌ Firestore rules blocking create
3. ❌ Error during account creation

**Solutions:**
1. **Check staff path:**
   - Should be: `artifacts/morning-pulse-app/public/data/staff/{uid}`
   - Verified in: `inviteService.ts` line 211

2. **Check Firestore rules:**
   ```javascript
   // Should allow admin create:
   match /artifacts/{appId}/public/data/staff/{uid} {
     allow create: if isAdmin();
   }
   ```
   - But during signup, user isn't admin yet!
   - **FIX NEEDED:** Allow create during signup

3. **Check browser console:**
   - Look for: `✅ [INVITE] Staff document created at...`
   - Look for errors during `createStaffFromInvite`

---

## 🔧 Critical Fix: Staff Creation Permission

**Problem:** During signup, the new user isn't an admin, so they can't create their own staff document!

**Solution:** Update Firestore rules to allow staff creation during signup:

```javascript
match /artifacts/{appId}/public/data/staff/{uid} {
  // Allow read for authenticated users
  allow read: if isAuthenticated();
  
  // Allow create if:
  // 1. Admin is creating it, OR
  // 2. User is creating their own (during signup from invite)
  allow create: if isAdmin() || 
                  (request.auth.uid == uid && 
                   request.resource.data.keys().hasAll(['uid', 'email', 'name', 'roles', 'isActive']));
  
  // Only admins can update
  allow update: if isAdmin() || 
                  (request.auth.uid == uid && 
                   request.resource.data.diff(resource.data).affectedKeys().hasOnly(['lastActive', 'updatedAt']));
  
  // Only admins can delete
  allow delete: if isAdmin();
}
```

---

## 🧪 Testing Steps

### **Test 1: Verify Routing**
```bash
1. Open: https://kudzimusar.github.io/morning-pulse/#join?token=test
2. Check console: Should see "🔗 [ROUTING] Join page detected"
3. Check console: Should see "🔍 [JOIN] Parsing hash:"
4. Should see JoinPage component render
```

### **Test 2: Verify Token Validation**
```bash
1. Create real invitation in admin panel
2. Copy join link
3. Open in browser
4. Check console: Should see "🔍 [JOIN] Validating token:"
5. Check console: Should see "✅ [JOIN] Token validated successfully"
6. Should see invitation details displayed
```

### **Test 3: Verify Staff Creation**
```bash
1. Complete signup with valid invitation
2. Check console: Should see "✅ [INVITE] Auth user created"
3. Check console: Should see "✅ [INVITE] Staff document created at..."
4. Check Firestore: Verify document exists at correct path
5. Try logging in: Should work
```

---

## 📋 Debug Checklist

When invitation link fails:

- [ ] Check browser console for errors
- [ ] Verify URL format (includes `/morning-pulse` path?)
- [ ] Check Firestore rules are deployed
- [ ] Verify invitation exists in Firestore
- [ ] Check invitation status (should be `pending`)
- [ ] Check invitation expiration date
- [ ] Verify staff path in code matches rules
- [ ] Check network tab for Firestore requests
- [ ] Verify routing logic in App.tsx
- [ ] Check token parsing in JoinPage.tsx

---

## 🔗 Quick Links

- **Firestore Console:** https://console.firebase.google.com/project/gen-lang-client-0999441419/firestore/data
- **Firestore Rules:** https://console.firebase.google.com/project/gen-lang-client-0999441419/firestore/rules
- **Deploy Rules:** `firebase deploy --only firestore:rules`

---

## 📝 Code References

**Invite Path:**
- `inviteService.ts` line 107: `doc(db, 'artifacts', APP_ID, 'public', 'data', 'invites', token)`

**Staff Path:**
- `inviteService.ts` line 211: `doc(db, 'artifacts', APP_ID, 'public', 'data', 'staff', user.uid)`
- `staffService.ts` line 55: `collection(db, 'artifacts', APP_ID, 'public', 'data', 'staff')`
- `authService.ts` line 136: `doc(dbInstance, 'artifacts', appId, 'public', 'data', 'staff', user.uid)`

**Routing:**
- `App.tsx` line 276: `hash.startsWith('join?')`
- `App.tsx` line 748: `currentPage === 'join'`
- `JoinPage.tsx` line 24: Token parsing from hash

---

**Last Updated:** January 2026
