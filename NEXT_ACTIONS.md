# Next Actions Required

## ✅ Code Fixes Applied

All code fixes have been committed and pushed. The website code is now correct.

## 🔴 Critical: Verify News Data Exists

### Issue: No Document in Firestore

**Problem:** Firestore shows no document at `artifacts/morning-pulse-app/public/data/news/2025-12-05`

**Possible Causes:**
1. News aggregator function failed silently
2. Function ran but didn't create document
3. Document created but at wrong path
4. Firestore permissions issue

### Action 1: Manually Trigger News Aggregator

**Via Cloud Console (Easiest):**
1. Go to: https://console.cloud.google.com/functions?project=gen-lang-client-0999441419
2. Click `newsAggregator` function
3. Click "TESTING" tab
4. Click "TEST THE FUNCTION" button
5. Wait for execution
6. Check "LOGS" tab for output

**Expected Logs:**
```
Starting daily news aggregation...
Fetching news for category: Local (Zim)
Fetching news for category: Business (Zim)
...
✅ News stored successfully for 2025-12-05
✅ News aggregation complete. Total articles: 16
```

**If Errors:**
- Check for Gemini API errors
- Check for Firestore permission errors
- Verify environment variables are set

### Action 2: Verify Document Created

**After triggering aggregator:**
1. Go to: https://console.firebase.google.com/project/gen-lang-client-0999441419/firestore
2. Navigate: `artifacts` → `morning-pulse-app` → `public` → `data` → `news`
3. Look for document: `2025-12-05` (or today's date)
4. Click on it to verify it has:
   - `date` field
   - `categories` object with 7 categories
   - Each category has array of articles

**If Document Still Missing:**
- Check function logs for errors
- Verify APP_ID is `morning-pulse-app` in function
- Check Firestore write permissions

## 🟡 Important: Verify Firebase Config

### Check GitHub Secret

1. Go to: https://github.com/kudzimusar/morning-pulse/settings/secrets/actions
2. Find `FIREBASE_CONFIG` secret
3. Verify it exists and is valid JSON

**Correct Format:**
```json
{"apiKey":"AIza...","authDomain":"...","projectId":"gen-lang-client-0999441419","storageBucket":"...","messagingSenderId":"...","appId":"..."}
```

**Common Issues:**
- Secret doesn't exist → Add it
- Secret is double-encoded → Should be single JSON string
- Secret has wrong projectId → Should match your Firebase project

### Test Firebase Connection

After website redeploys:
1. Open: https://kudzimusar.github.io/morning-pulse/
2. Open DevTools (F12) → Console
3. Look for:
   - `✅ Firebase config found, initializing connection...`
   - OR `❌ Firebase configuration not available`

## 🟢 Wait for Deployment

### Check GitHub Actions

1. Go to: https://github.com/kudzimusar/morning-pulse/actions
2. Find latest "Deploy Website to GitHub Pages" run
3. Wait for it to complete (green checkmark ✅)
4. Check logs for:
   - "Generate Static News Data" step
   - "Build Website" step
   - Any errors

### Expected Timeline

- Code push: ✅ Done
- GitHub Actions: ~5-10 minutes
- GitHub Pages deployment: ~2-3 minutes
- **Total: ~10-15 minutes**

## 🧪 Test After Deployment

### Test Website

1. **Open:** https://kudzimusar.github.io/morning-pulse/
2. **Open DevTools:** F12 → Console tab
3. **Check for:**
   - `🔍 Attempting to load static news from: ...`
   - `📡 Static news response status: 404` (expected if no static file)
   - `🔄 Falling back to Firestore mode`
   - `📂 Looking for news at path: artifacts/morning-pulse-app/public/data/news/2025-12-05`
   - `✅ News found in Firestore: X categories` (if news exists)

### Expected Outcomes

**Scenario 1: News in Firestore + Firebase Config Set**
- ✅ Website loads news from Firestore
- ✅ Shows all 7 categories
- ✅ Real-time updates if news changes

**Scenario 2: News in Firestore + No Firebase Config**
- ⚠️ Website shows "Firebase configuration not available"
- ⚠️ But should still try static mode first
- 💡 Add FIREBASE_CONFIG to GitHub Secrets

**Scenario 3: No News in Firestore**
- ⚠️ Website shows "No news data found for today"
- 💡 Manually trigger news aggregator
- 💡 Wait for scheduler to run (2 AM UTC daily)

**Scenario 4: Static JSON Exists**
- ✅ Website loads from static JSON (fastest)
- ✅ No Firestore connection needed
- ✅ Works offline

## 📊 Verification Checklist

- [ ] News aggregator manually triggered
- [ ] Firestore document exists for today's date
- [ ] Document has 7 categories with articles
- [ ] FIREBASE_CONFIG secret exists in GitHub
- [ ] Website deployment completed
- [ ] Website loads and shows news (or helpful error)
- [ ] Browser console shows correct debug messages
- [ ] Bot tested and uses Firestore news

## 🎯 Priority Order

1. **FIRST:** Manually trigger news aggregator
2. **SECOND:** Verify document created in Firestore
3. **THIRD:** Wait for website deployment
4. **FOURTH:** Test website and check console
5. **FIFTH:** Verify Firebase config if needed

## 💡 Quick Test Commands

### Check if News Aggregator Ran
```bash
# Via gcloud (if installed)
gcloud functions logs read newsAggregator \
  --region=us-central1 \
  --limit=20
```

### Check Firestore Document
- Use Firebase Console web UI (easiest)
- Or use Firebase Admin SDK script

### Test Website Locally
```bash
cd website
npm install
npm run build
npm run preview
# Then check http://localhost:4173/morning-pulse/
```

## 🆘 If Still Not Working

### Website Still Blank
1. Check browser console for specific errors
2. Verify Firestore document exists
3. Check Firebase config is valid
4. Verify APP_ID is correct everywhere

### News Aggregator Fails
1. Check function logs for errors
2. Verify GEMINI_API_KEY is valid
3. Check Firestore write permissions
4. Verify APP_ID in function code

### Bot Still Uses Hardcoded News
1. Check bot function logs
2. Verify APP_ID matches in bot code
3. Test with actual WhatsApp message
4. Check for Firestore read errors

---

**Status:** Code fixes complete, waiting for:
1. News data to be created in Firestore
2. Website to redeploy
3. Testing and verification

