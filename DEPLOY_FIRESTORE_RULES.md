# Deploy Firestore Security Rules

## Quick Fix for "Missing or insufficient permissions" Errors

The Firestore security rules have been created but need to be deployed to Firebase.

### Option 1: Using Firebase CLI (Recommended)

1. **Install Firebase CLI** (if not already installed):
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**:
   ```bash
   firebase login
   ```

3. **Initialize Firebase** (if not already done):
   ```bash
   firebase init firestore
   ```
   - Select your project: `gen-lang-client-0999441419`
   - Use existing rules file: `firestore.rules`
   - Don't overwrite existing rules (if prompted)

4. **Deploy the rules**:
   ```bash
   firebase deploy --only firestore:rules
   ```

### Option 2: Using Firebase Console (Manual)

1. Go to [Firebase Console](https://console.firebase.google.com/project/gen-lang-client-0999441419/firestore/rules)

2. Click "Edit rules"

3. Copy the contents of `firestore.rules` from the project root

4. Paste into the editor

5. Click "Publish"

### Verify Deployment

After deploying, you should see:
- ✅ No more "Missing or insufficient permissions" errors
- ✅ Invitations can be created
- ✅ Invitations can be read (for token validation)
- ✅ Audit logs can be created

### Troubleshooting

**If you still see permission errors after deployment:**

1. **Check your admin role:**
   - Verify your user has `roles: ['admin']` or `roles: ['super_admin']` in `/staff/{your-uid}`
   - The rules require admin role for write operations

2. **Check Firestore rules syntax:**
   - Rules file should be at project root: `firestore.rules`
   - `firebase.json` should reference it correctly

3. **Clear browser cache:**
   - Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
   - Rules are cached by Firebase SDK

4. **Check Firebase Console:**
   - Go to Firestore > Rules
   - Verify the rules match `firestore.rules` file
   - Check for syntax errors (red indicators)

### Current Rules Summary

- **/staff**: Admin-write only (users can update own lastActive)
- **/invites**: Admin-write, public-read (for token validation)
- **/audit_logs**: Admin-read, authenticated-create, immutable
- **/opinions**: Public-read published, editor-write
- **/writers**: Self-read/update, admin-manage

---

**Note:** The auto-publisher error (`where is not defined`) has been fixed in the code. You just need to rebuild/reload the app.
