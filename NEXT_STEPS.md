# 🚀 Next Steps - Implementation Guide

## ✅ What I've Fixed Automatically

1. ✅ Updated `.github/workflows/deploy_website.yml` to inject Firebase config during build
2. ✅ Updated `website/vite.config.ts` to properly handle Firebase config environment variable
3. ✅ All code is ready - just needs deployment

---

## 📋 IMMEDIATE ACTION REQUIRED (Do These Now)

### STEP 1: Add Workflow File to GitHub (5 minutes) ⚠️ CRITICAL

**The workflow file exists locally but needs to be added via GitHub UI due to token permissions.**

#### Action:
1. **Copy the workflow file content:**
   ```bash
   cat .github/workflows/deploy_website.yml
   ```
   Copy the entire output.

2. **Go to GitHub:**
   - Navigate to: `https://github.com/kudzimusar/morning-pulse`
   - Click **"Add file"** → **"Create new file"**
   - In the filename field, type: `.github/workflows/deploy_website.yml`
   - **Important:** Make sure the path starts with `.github/workflows/`

3. **Paste the content** you copied

4. **Commit:**
   - Commit message: `Add website deployment workflow`
   - Click **"Commit new file"**

✅ **This unblocks everything else!**

---

### STEP 2: Deploy Cloud Functions (10 minutes)

#### Option A: Push to trigger (Recommended)
```bash
git add -A
git commit -m "Trigger function deployment"
git push origin main
```

#### Option B: Manual trigger via GitHub UI
1. Go to: `https://github.com/kudzimusar/morning-pulse/actions`
2. Click **"Deploy WhatsApp Bot to Google Cloud Functions"**
3. Click **"Run workflow"** → **"Run workflow"**

#### What Happens:
- ✅ Deploys `webhook` function (WhatsApp bot)
- ✅ Deploys `newsAggregator` function (daily news service)
- ✅ Automatically sets up Cloud Scheduler

#### Monitor:
- Watch the Actions tab for green checkmark ✅
- Should complete in ~5-10 minutes

---

### STEP 3: Test News Aggregator (2 minutes)

After deployment completes, test it manually:

```bash
# Get the function URL first
gcloud functions describe newsAggregator \
  --region=us-central1 \
  --gen2 \
  --format="value(serviceConfig.uri)"

# Then call it
curl -X GET "YOUR_FUNCTION_URL"
```

**Or use gcloud:**
```bash
gcloud functions call newsAggregator \
  --region=us-central1 \
  --gen2
```

**Expected output:**
```json
{
  "success": true,
  "date": "2025-12-05",
  "categories": ["Local (Zim)", "Business (Zim)", ...],
  "totalArticles": 16,
  "message": "News aggregated successfully"
}
```

---

### STEP 4: Verify News in Firestore (2 minutes)

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Click **Firestore Database**
4. Navigate to: `artifacts` → `morning-pulse-app` → `public` → `data` → `news` → `2025-12-05` (today's date)
5. **You should see:** A document with all 7 news categories filled with real news!

**If you see news data here, the aggregator is working! ✅**

---

### STEP 5: Enable Cloud Scheduler (If Needed)

The deployment should auto-create the scheduler, but if you see errors:

#### Quick Enable:
```bash
gcloud services enable cloudscheduler.googleapis.com \
  --project=gen-lang-client-0999441419
```

#### Verify Scheduler Exists:
```bash
gcloud scheduler jobs list --location=us-central1
```

You should see: `daily-news-aggregation`

---

### STEP 6: Configure Firebase for Website Real-Time Mode (5 minutes)

#### Get Firebase Config:

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Click **⚙️ Settings** (gear icon) → **Project settings**
4. Scroll to **"Your apps"** section
5. If no web app exists, click **"Add app"** → **Web** (</> icon)
6. Copy the `firebaseConfig` object:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "...",
  projectId: "gen-lang-client-0999441419",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};
```

#### Add to GitHub Secrets:

1. Go to: `https://github.com/kudzimusar/morning-pulse/settings/secrets/actions`
2. Click **"New repository secret"**
3. **Name:** `FIREBASE_CONFIG`
4. **Value:** Paste the JSON as a **single line** (remove line breaks):
   ```json
   {"apiKey":"AIza...","authDomain":"...","projectId":"gen-lang-client-0999441419","storageBucket":"...","messagingSenderId":"...","appId":"..."}
   ```
5. Click **"Add secret"**

✅ **This enables real-time mode on the website!**

---

### STEP 7: Deploy Website (10 minutes)

Once the workflow is added (Step 1), the website will deploy automatically on push, OR:

#### Manual Trigger:
1. Go to: `https://github.com/kudzimusar/morning-pulse/actions`
2. Click **"Deploy Website to GitHub Pages"**
3. Click **"Run workflow"** → **"Run workflow"**
4. Wait ~5 minutes for completion

#### Access Your Website:
After deployment:
- **URL:** `https://kudzimusar.github.io/morning-pulse/`
- Should show today's news in a beautiful newspaper layout! 📰

---

## 📊 Progress Checklist

- [ ] **Step 1:** Added workflow file via GitHub UI
- [ ] **Step 2:** Functions deployed (check GitHub Actions)
- [ ] **Step 3:** News aggregator tested successfully
- [ ] **Step 4:** News visible in Firestore
- [ ] **Step 5:** Cloud Scheduler enabled/verified
- [ ] **Step 6:** Firebase config added to GitHub Secrets
- [ ] **Step 7:** Website deployed and accessible

---

## 🆘 Troubleshooting

### Functions Won't Deploy
- Check GitHub Actions logs for errors
- Verify all secrets are set: `GCP_PROJECT_ID`, `GCP_SA_KEY`, `GEMINI_API_KEY`
- Ensure Cloud Functions API is enabled

### News Aggregator Returns Error
- Check function logs: `gcloud functions logs read newsAggregator --region=us-central1`
- Verify `GEMINI_API_KEY` is valid
- Check Firestore permissions

### Website Shows "No News"
- Verify news exists in Firestore (Step 4)
- Check browser console for errors
- Verify static generation ran (check GitHub Actions logs)

### Firebase Real-Time Mode Not Working
- Verify `FIREBASE_CONFIG` secret is set correctly
- Check browser console for Firebase errors
- Ensure Firestore rules allow read access

---

## 🎯 What to Report Back

After completing each step, let me know:

**After Step 2:**
- "Functions deployed successfully" or share any errors

**After Step 3:**
- "News aggregator test returned: [paste output]"

**After Step 4:**
- "I can see news in Firestore" (screenshot if possible)

**After Step 7:**
- "Website deployed to: [URL]"
- "I can see today's news" or share any errors

---

## 🚀 Start Now!

**Begin with Step 1** - Add the workflow file via GitHub UI. That's the only manual step needed, and it unblocks everything else!

Once you've added it, the rest will flow automatically. Let me know when Step 1 is complete! 🎉

