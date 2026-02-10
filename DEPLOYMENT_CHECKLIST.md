# Deployment Checklist - Firebase Rules Update

## ✅ Changes Made

### 1. **Firestore Security Rules** (`firestore.rules`)
- ✅ Added **Boss Mode** for admin UIDs (`2jnMK761RcMvag3Agj5Wx3HjwpJ2`, `VaGwarisa`)
- ✅ Added **Advertiser Collection** rules for advertiser self-management
- ✅ Added **Ad Impressions & Clicks** rules for anonymous tracking
- ✅ Safe claim checking with `request.auth.token.get(claim, false)`

### 2. **Centralized Firebase Authentication**
- ✅ Created `website/src/services/firebase.ts` as single source of truth
- ✅ Updated all services to use centralized `auth` and `db` instances
- ✅ Updated login components:
  - `AdvertiserLogin.tsx` ✅
  - `WriterLogin.tsx` ✅
  - `SubscriberLogin.tsx` ✅

---

## 🚀 REQUIRED: Deploy Updated Firestore Rules

**The updated Firestore rules MUST be deployed to production for advertisers and other users to login.**

### Option 1: Firebase Console (Recommended - Fastest)
1. Go to: https://console.firebase.google.com/project/gen-lang-client-0999441419/firestore/rules
2. Copy the entire content from `firestore.rules` (lines 1-165)
3. Paste into the Firebase Console editor
4. Click **"Publish"**

### Option 2: Firebase CLI (After Node.js Upgrade)
```bash
# Upgrade Node.js first
brew install node@20
brew link node@20 --force --overwrite

# Verify version
node --version  # Should be >= 20.0.0

# Deploy rules
firebase deploy --only firestore:rules
```

---

## 📋 What These Changes Fix

### For Admin Users
- ✅ **Boss Mode** grants immediate, unrestricted access to all collections
- ✅ No more "Missing or insufficient permissions" errors
- ✅ Can manage staff, writers, advertisers, and all content

### For Advertisers
- ✅ Can register and create accounts
- ✅ Can login and access their advertiser dashboard
- ✅ Can read/update their own advertiser profile
- ✅ Can create and manage their ads
- ✅ Admins can approve/reject advertiser accounts

### For Writers
- ✅ Can login and access their writer dashboard
- ✅ Can submit pitches and articles
- ✅ Can view their payment statements

### For Subscribers
- ✅ Can login and access premium content
- ✅ Can manage their subscription

### For Anonymous Users
- ✅ Can track ad impressions and clicks for analytics
- ✅ Can read public content (opinions, ads, etc.)

---

## 🔍 Testing After Deployment

1. **Test Admin Login**
   - Login as `2jnMK761RcMvag3Agj5Wx3HjwpJ2`
   - Verify no permission errors in console
   - Check that all dashboard tabs load correctly

2. **Test Advertiser Login**
   - Login as advertiser (`7hU1Y2IDSHdkWfE5nskjiT9To2L2`)
   - Verify access to advertiser dashboard
   - Check that ad management works

3. **Test Writer Login**
   - Login as a writer
   - Verify access to writer dashboard
   - Check pitch submission

4. **Test Anonymous Ad Tracking**
   - Visit homepage as anonymous user
   - Verify ad impressions are tracked (check console for success logs)

---

## ⚠️ Important Notes

- **Node.js Version**: Firebase CLI requires Node.js >= 20.0.0
- **Current Version**: v18.20.0 (needs upgrade for CLI deployment)
- **Workaround**: Use Firebase Console for immediate deployment
- **No Code Changes Needed**: All code changes are already committed

---

## 📊 Collections Affected by New Rules

| Collection | Read Access | Write Access |
|------------|-------------|--------------|
| `/staff` | Boss, Admin, Self | Boss, Admin |
| `/writers` | Boss, Editor, Admin, Self | Boss, Editor, Admin, Self |
| `/advertisers` | Boss, Admin, Self | Boss, Admin (create: any authenticated) |
| `/adImpressions` | Boss, Admin | Anyone (for tracking) |
| `/adClicks` | Boss, Admin | Anyone (for tracking) |
| `/artifacts/.../ads` | Everyone | Boss, Admin, Owner |
| `/artifacts/.../opinions` | Everyone | Boss, Editor (create: any authenticated) |

---

## ✅ Deployment Complete When:
- [ ] Firestore rules deployed to production
- [ ] Admin can access dashboard without errors
- [ ] Advertisers can login successfully
- [ ] Writers can login successfully
- [ ] Ad impressions are being tracked
