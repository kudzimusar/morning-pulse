# Test News Aggregator Function

The function requires authentication, so we need to use authenticated methods.

## ✅ Method 1: Google Cloud Console (Easiest - No Installation)

### Step 1: Go to Cloud Functions
1. Open: https://console.cloud.google.com/functions?project=gen-lang-client-0999441419
2. Find the `newsAggregator` function
3. Click on it

### Step 2: Test the Function
1. Click the **"TESTING"** tab
2. Click **"TEST THE FUNCTION"** button
3. Check the **"LOGS"** tab below for output

### Step 3: Check the Response
You should see logs showing:
- Function execution
- News aggregation progress
- Success message with article counts

**Expected output in logs:**
```
✅ News aggregation complete. Total articles: 16
```

---

## ✅ Method 2: Install gcloud CLI (For Command Line)

### Step 1: Install gcloud
```bash
# macOS
brew install --cask google-cloud-sdk
```

### Step 2: Authenticate
```bash
gcloud auth login
gcloud config set project gen-lang-client-0999441419
```

### Step 3: Test Function
```bash
gcloud functions call newsAggregator \
  --region=us-central1 \
  --gen2
```

**Expected output:**
```json
{
  "result": "{\"success\":true,\"message\":\"News aggregation completed\",\"date\":\"2025-12-05\",\"totalArticles\":16,\"categories\":7}"
}
```

---

## ✅ Method 3: Check Firestore Directly (Verify News Was Created)

Even if you can't test the function directly, you can verify it worked by checking Firestore:

### Step 1: Go to Firestore
1. Open: https://console.firebase.google.com/project/gen-lang-client-0999441419/firestore
2. Navigate to: `artifacts` → `morning-pulse-app` → `public` → `data` → `news`

### Step 2: Check Today's Date
1. Look for a document with today's date (format: `YYYY-MM-DD`, e.g., `2025-12-05`)
2. Click on it

### Step 3: Verify News Data
You should see:
- `date`: Today's date
- `categories`: Object with 7 categories:
  - `Local (Zim)`
  - `Business (Zim)`
  - `African Focus`
  - `Global`
  - `Sports`
  - `Tech`
  - `General News`
- Each category contains an array of news articles with:
  - `id`
  - `headline`
  - `detail`
  - `source`
  - `url`
  - `category`

**If you see this data, the function is working! ✅**

---

## ✅ Method 4: Check Function Logs

### Via Cloud Console:
1. Go to: https://console.cloud.google.com/functions?project=gen-lang-client-0999441419
2. Click `newsAggregator`
3. Click **"LOGS"** tab
4. Look for recent executions

### Via gcloud (if installed):
```bash
gcloud functions logs read newsAggregator \
  --region=us-central1 \
  --limit=10
```

**Look for:**
- `Starting daily news aggregation...`
- `Fetching news for category: ...`
- `✅ News aggregation complete. Total articles: X`

---

## 🎯 Quick Verification Checklist

- [ ] Function exists in Cloud Functions console
- [ ] Function status is "Active" (green)
- [ ] Can see function logs
- [ ] Firestore has news data for today's date
- [ ] News data has 7 categories
- [ ] Each category has articles

---

## 🚨 Troubleshooting

### Function Not Found
- Check if deployment completed in GitHub Actions
- Verify function name is `newsAggregator`
- Check region is `us-central1`

### No News in Firestore
- Function may not have run yet
- Check function logs for errors
- Verify `GEMINI_API_KEY` is set correctly
- Check Firestore permissions

### 403 Forbidden Error
- Function requires authentication
- Use Cloud Console or gcloud (authenticated)
- Cannot test via unauthenticated curl

### Function Errors in Logs
- Check `GEMINI_API_KEY` is valid
- Verify `FIREBASE_ADMIN_CONFIG` is correct
- Check Firestore write permissions

---

## 📊 Expected Results

After successful execution:

1. **Firestore Document Created:**
   - Path: `artifacts/morning-pulse-app/public/data/news/2025-12-05`
   - Contains 7 categories
   - Each category has 3-5 articles

2. **Function Logs Show:**
   - Success message
   - Total articles count
   - Categories processed

3. **Function Response:**
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

## 🎉 Next Steps After Verification

Once you confirm news is in Firestore:

1. ✅ **Website will automatically use this data** (when deployed)
2. ✅ **Bot can read from Firestore** (if updated)
3. ✅ **Scheduler will run daily** (if configured)

---

## 💡 Recommended: Use Method 1 (Cloud Console)

**Easiest and fastest way:**
1. Go to Cloud Functions console
2. Click function → TESTING tab
3. Click TEST THE FUNCTION
4. Check logs for results
5. Verify in Firestore

**Takes 2 minutes, no installation needed!**

