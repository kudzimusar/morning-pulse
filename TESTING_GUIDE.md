# Testing Guide - News Aggregation Fixes

## ✅ Step 1: Verify Workflows Completed Successfully

### Check GitHub Actions
1. Go to: https://github.com/kudzimusar/morning-pulse/actions
2. Look for the latest workflow runs:
   - **"Deploy WhatsApp Bot to Google Cloud Functions"** - Should show ✅ green checkmark
   - **"Deploy Website to GitHub Pages"** - Should show ✅ green checkmark
3. Click on each workflow to verify:
   - No errors in the logs
   - "Setup Cloud Scheduler for News Aggregator" step completed
   - Function deployment succeeded

---

## ✅ Step 2: Test News Aggregator Function Manually

### Method 1: Google Cloud Console (Easiest)
1. Go to: https://console.cloud.google.com/functions?project=gen-lang-client-0999441419
2. Click on **`newsAggregator`** function
3. Go to **"TESTING"** tab
4. Click **"TEST THE FUNCTION"** button
5. Wait for execution (should take 30-60 seconds)
6. Check the **"LOGS"** tab for:
   - ✅ "Starting daily news aggregation..."
   - ✅ "Fetching news for category: [Category Name]"
   - ✅ "News stored successfully for [DATE]"
   - ✅ "News aggregation complete. Total articles: [number]"
   - ❌ If errors appear, check the enhanced error logs for details

### Method 2: Direct HTTP Call
```bash
curl -X GET "https://us-central1-gen-lang-client-0999441419.cloudfunctions.net/newsAggregator"
```

**Expected Response:**
```json
{
  "success": true,
  "date": "2026-02-04",
  "categories": ["Local (Zim)", "Business (Zim)", "African Focus", "Global", "Sports", "Tech", "General News"],
  "totalArticles": 32,
  "message": "News aggregated successfully"
}
```

**If you see `"totalArticles": 0`**, check the logs for error details.

---

## ✅ Step 3: Verify Cloud Scheduler is Updated

1. Go to: https://console.cloud.google.com/cloudscheduler?project=gen-lang-client-0999441419
2. Find **`daily-news-aggregation`** job
3. Click on it to view details
4. Verify:
   - **Frequency:** Should show `0 2,14 * * *` (twice daily at 2 AM and 2 PM UTC)
   - **State:** Should be "Enabled"
   - **Last run:** Should show recent execution time
   - **Status of last execution:** Should show "Success" ✅

### Manually Trigger Scheduler (Optional)
1. In the scheduler job page, click **"RUN NOW"** button
2. Wait 1-2 minutes
3. Check the execution history to see if it succeeded

---

## ✅ Step 4: Verify News Data in Firestore

1. Go to: https://console.firebase.google.com/project/gen-lang-client-0999441419/firestore
2. Navigate to: `artifacts` → `morning-pulse-app` → `public` → `data` → `news`
3. Look for today's date document (e.g., `2026-02-04`)
4. Click on the document to verify:
   - **`date`** field: Should match today's date
   - **`categories`** field: Should be expanded and show:
     - Local (Zim)
     - Business (Zim)
     - African Focus
     - Global
     - Sports
     - Tech
     - General News
   - **`lastUpdated`** field: Should show recent timestamp
   - **`timestamp`** field: Should have a recent value

### Check for Empty Categories
If the document exists but `categories` is empty or has 0 items:
- Check function logs for errors
- Verify Gemini API key is set correctly
- Check enhanced error logs for specific category failures

---

## ✅ Step 5: Test Website Deployment

1. Go to: https://kudzimusar.github.io/morning-pulse/
2. Open browser Developer Tools (F12)
3. Go to **Console** tab
4. Look for:
   - ✅ "✅ News found for [Country] on [DATE]"
   - ✅ "✅ News updated in real-time"
   - ❌ Should NOT see: "Morning Pulse is currently gathering news"
5. Verify news articles are displayed on the page
6. Check that articles are from today or recent dates (not from Jan 28)

### Check Static News Files
1. Try accessing: https://kudzimusar.github.io/morning-pulse/data/news-latest.json
2. Should return JSON with news data
3. Verify `categories` object has content (not empty)

---

## ✅ Step 6: Verify Generate Share Pages Fix

### Check Website Deployment Logs
1. Go to: https://github.com/kudzimusar/morning-pulse/actions
2. Click on latest **"Deploy Website to GitHub Pages"** workflow
3. Expand **"Generate Share Pages"** step
4. Verify:
   - ✅ "✅ Firebase Admin initialized"
   - ✅ "✅ Created universal share.html file"
   - ✅ "✅ Created 404.html handler"
   - ❌ Should NOT see: "Failed to initialize Firebase Admin"

### Test Share Pages
1. Go to: https://kudzimusar.github.io/morning-pulse/shares/
2. Should load without errors
3. Check browser console for any JavaScript errors

---

## ✅ Step 7: Monitor Scheduler Execution

### Check Scheduler Execution History
1. Go to: https://console.cloud.google.com/cloudscheduler?project=gen-lang-client-0999441419
2. Click on **`daily-news-aggregation`**
3. Go to **"EXECUTION HISTORY"** tab
4. Verify:
   - Recent executions show "Success" ✅
   - Execution times match the schedule (2 AM and 2 PM UTC)
   - No failed executions

### Check Function Logs After Scheduled Run
1. Go to: https://console.cloud.google.com/functions?project=gen-lang-client-0999441419
2. Click **`newsAggregator`**
3. Go to **"LOGS"** tab
4. Filter by time: "Last 24 hours"
5. Look for scheduled executions:
   - Should see logs at 2 AM UTC and 2 PM UTC
   - Should show successful news aggregation

---

## 🐛 Troubleshooting

### If News Aggregator Returns 0 Articles

1. **Check Enhanced Error Logs:**
   - Go to function logs
   - Look for "Full error details" entries
   - Check for Gemini API errors

2. **Verify Environment Variables:**
   - Go to function configuration
   - Verify `GEMINI_API_KEY` is set
   - Verify `FIREBASE_ADMIN_CONFIG` is set
   - Verify `APP_ID=morning-pulse-app`

3. **Test Gemini API Directly:**
   - Check if API key is valid
   - Verify API quota hasn't been exceeded

### If Scheduler Shows Errors

1. **Check Function URL:**
   - Verify function is deployed and accessible
   - Test function manually first

2. **Check IAM Permissions:**
   - Scheduler service account needs permission to invoke function
   - Verify Cloud Functions Invoker role is granted

### If Website Shows Old News

1. **Clear Browser Cache:**
   - Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
   - Or clear browser cache completely

2. **Check Firestore Data:**
   - Verify today's date document exists
   - Verify categories are populated

3. **Check Static Files:**
   - Verify `news-latest.json` was generated
   - Check file timestamp matches today

---

## 📊 Success Criteria Checklist

- [ ] Workflows completed successfully in GitHub Actions
- [ ] News aggregator function can be manually triggered
- [ ] Function returns articles (totalArticles > 0)
- [ ] Cloud Scheduler shows frequency: `0 2,14 * * *`
- [ ] Scheduler is enabled and shows recent successful runs
- [ ] Firestore has today's date document with populated categories
- [ ] Website displays fresh news (not from Jan 28)
- [ ] Generate Share Pages step completes without errors
- [ ] No errors in browser console when viewing website

---

## 🎯 Quick Test Commands

```bash
# Test function via curl
curl -X GET "https://us-central1-gen-lang-client-0999441419.cloudfunctions.net/newsAggregator"

# Check scheduler status (if gcloud is installed)
gcloud scheduler jobs describe daily-news-aggregation \
  --location=us-central1 \
  --project=gen-lang-client-0999441419

# Manually trigger scheduler (if gcloud is installed)
gcloud scheduler jobs run daily-news-aggregation \
  --location=us-central1 \
  --project=gen-lang-client-0999441419
```

---

## 📝 Next Steps After Successful Testing

1. **Monitor for 24-48 hours:**
   - Verify scheduler runs at both 2 AM and 2 PM UTC
   - Check that news updates twice daily
   - Monitor function logs for any errors

2. **Verify News Quality:**
   - Check that articles are fresh (from today)
   - Verify all 7 categories have content
   - Check article headlines and sources

3. **Document Any Issues:**
   - If errors persist, check enhanced error logs
   - Note which categories are failing (if any)
   - Share error details for further debugging
