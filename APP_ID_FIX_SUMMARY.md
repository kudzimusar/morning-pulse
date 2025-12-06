# APP_ID Fix Summary

## ✅ Changes Applied

All code has been updated to use `morning-pulse-app` as the default APP_ID instead of `default-app-id`.

### Files Updated:
1. ✅ `functions/newsAggregator.js` - Now defaults to `morning-pulse-app`
2. ✅ `functions/index.js` - Now defaults to `morning-pulse-app`
3. ✅ `scripts/generateStaticSite.js` - Now defaults to `morning-pulse-app`
4. ✅ `init_db.js` - Now defaults to `morning-pulse-app`
5. ✅ `app.js` - Now defaults to `morning-pulse-app`

### Already Correct:
- ✅ `website/src/components/FirebaseConnector.tsx` - Already uses `morning-pulse-app`
- ✅ `.github/workflows/gcp_deploy.yml` - Already sets `APP_ID=morning-pulse-app`

---

## 📍 Current Situation

### If Data Exists Under `default-app-id`:

**Path:** `artifacts/default-app-id/public/data/news/2025-12-06`

**Options:**

#### Option A: Use Existing Data (Quick Fix)
If you want to use the existing data immediately, temporarily update the code to read from `default-app-id`:

**Files to update:**
- `functions/index.js` - Change `getTodaysNews()` path
- `website/src/components/FirebaseConnector.tsx` - Change newsPath
- `scripts/generateStaticSite.js` - Change newsPath

#### Option B: Re-fetch News (Recommended)
1. After deployment completes, manually trigger `newsAggregator` function
2. New data will be created under: `artifacts/morning-pulse-app/public/data/news/{date}`
3. Everything will work correctly going forward

---

## 🚀 Next Steps

### Step 1: Wait for Deployment
- GitHub Actions will automatically redeploy functions
- Takes ~5-10 minutes
- Check: https://github.com/kudzimusar/morning-pulse/actions

### Step 2: Verify Data Location
**Check Firestore:**
1. Go to: https://console.firebase.google.com/project/gen-lang-client-0999441419/firestore
2. Check both paths:
   - `artifacts/default-app-id/public/data/news/` (old location)
   - `artifacts/morning-pulse-app/public/data/news/` (new location)

### Step 3: Trigger News Aggregator
**After deployment:**
1. Go to: https://console.cloud.google.com/functions?project=gen-lang-client-0999441419
2. Click `newsAggregator`
3. Go to "TESTING" tab
4. Click "TEST THE FUNCTION"
5. Check logs for success
6. Verify new document created at: `artifacts/morning-pulse-app/public/data/news/{today}`

### Step 4: Verify Everything Works
- ✅ Bot reads from correct path
- ✅ Website reads from correct path
- ✅ Static generation reads from correct path
- ✅ All components use same path

---

## 📊 Path Consistency

**All components now use:**
```
artifacts/morning-pulse-app/public/data/news/{date}
```

**Components:**
- ✅ `newsAggregator` - Creates data here
- ✅ `webhook` (bot) - Reads from here
- ✅ `website` - Reads from here
- ✅ `generateStaticSite.js` - Reads from here

---

## ⚠️ Important Notes

1. **Existing Data:** If data exists under `default-app-id`, it won't be automatically found. You'll need to either:
   - Re-run the aggregator (creates new data in correct location)
   - OR temporarily update code to read from `default-app-id` (if you want to use existing data)

2. **Deployment:** Functions will redeploy automatically. The `APP_ID` environment variable is already set in the workflow, so it will use `morning-pulse-app` even if the default wasn't updated.

3. **Going Forward:** All new news data will be created under `morning-pulse-app`, ensuring consistency.

---

## 🎯 Expected Result

After deployment and re-running aggregator:
- ✅ News stored at: `artifacts/morning-pulse-app/public/data/news/{date}`
- ✅ Bot reads from: `artifacts/morning-pulse-app/public/data/news/{date}`
- ✅ Website reads from: `artifacts/morning-pulse-app/public/data/news/{date}`
- ✅ Static generation reads from: `artifacts/morning-pulse-app/public/data/news/{date}`
- ✅ Everything consistent and working!

---

**Status:** ✅ All code updated and committed
**Next:** Wait for deployment, then trigger news aggregator

