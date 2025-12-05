# Cloud Scheduler & News Aggregator Test Guide

## Current Status
- ✅ Firebase Config added to GitHub Secrets
- ✅ Cloud Scheduler API enabled
- ⚠️ Function may not be deployed yet (403 error indicates function doesn't exist or needs auth)

## Option 1: Use Google Cloud Console (Web UI) - Easiest

### Create Scheduler Job via Console:

1. **Go to Cloud Scheduler:**
   - https://console.cloud.google.com/cloudscheduler?project=gen-lang-client-0999441419

2. **Click "CREATE JOB"**

3. **Fill in the form:**
   - **Name:** `news-aggregator-daily`
   - **Region:** `us-central1`
   - **Frequency:** `0 2 * * *` (cron format)
   - **Timezone:** `UTC`
   - **Target type:** `HTTP`
   - **URL:** `https://us-central1-gen-lang-client-0999441419.cloudfunctions.net/newsAggregator`
   - **HTTP method:** `GET`
   - **Description:** `Daily news aggregation at 2 AM UTC`

4. **Click "CREATE"**

✅ **Done!** Scheduler is created.

### Test Function via Console:

1. **Go to Cloud Functions:**
   - https://console.cloud.google.com/functions?project=gen-lang-client-0999441419

2. **Find `newsAggregator` function**

3. **Click on it** → **TESTING** tab

4. **Click "TEST THE FUNCTION"**

5. **Check the logs** for results

---

## Option 2: Install gcloud CLI (For Command Line)

### Install gcloud:

```bash
# macOS
brew install --cask google-cloud-sdk

# Or download from:
# https://cloud.google.com/sdk/docs/install
```

### Authenticate:

```bash
gcloud auth login
gcloud config set project gen-lang-client-0999441419
```

### Create Scheduler:

```bash
./scripts/create_scheduler.sh
```

### Test Function:

```bash
./scripts/test_news_aggregator.sh
```

Or directly:
```bash
gcloud functions call newsAggregator \
  --region=us-central1 \
  --gen2 \
  --project=gen-lang-client-0999441419
```

---

## Option 3: Wait for GitHub Actions Deployment

If functions aren't deployed yet:

1. **Check GitHub Actions:**
   - https://github.com/kudzimusar/morning-pulse/actions
   - Look for "Deploy WhatsApp Bot to Google Cloud Functions"
   - Wait for it to complete (green checkmark ✅)

2. **After deployment completes:**
   - Functions will be deployed automatically
   - Then use Option 1 or 2 above to create scheduler

---

## Option 4: Use REST API (Advanced)

### Create Scheduler via API:

```bash
# First, get an access token
ACCESS_TOKEN=$(gcloud auth print-access-token)

# Create scheduler job
curl -X POST \
  "https://cloudscheduler.googleapis.com/v1/projects/gen-lang-client-0999441419/locations/us-central1/jobs" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "projects/gen-lang-client-0999441419/locations/us-central1/jobs/news-aggregator-daily",
    "schedule": "0 2 * * *",
    "timeZone": "UTC",
    "httpTarget": {
      "uri": "https://us-central1-gen-lang-client-0999441419.cloudfunctions.net/newsAggregator",
      "httpMethod": "GET"
    },
    "description": "Daily news aggregation at 2 AM UTC"
  }'
```

---

## Verify Function is Deployed

### Check Function Status:

1. **Cloud Console:**
   - https://console.cloud.google.com/functions?project=gen-lang-client-0999441419
   - Look for `newsAggregator` function
   - Status should be "Active" (green)

2. **Or via gcloud:**
   ```bash
   gcloud functions describe newsAggregator \
     --region=us-central1 \
     --gen2 \
     --project=gen-lang-client-0999441419
   ```

### If Function Doesn't Exist:

The function needs to be deployed first. This happens via:
- GitHub Actions workflow (automatic on push)
- Or manual deployment via gcloud

---

## Test News Aggregator

### Once Function is Deployed:

**Method 1: Cloud Console**
- Go to function → TESTING tab → Test the function

**Method 2: gcloud**
```bash
gcloud functions call newsAggregator \
  --region=us-central1 \
  --gen2
```

**Method 3: curl (if function allows unauthenticated)**
```bash
curl -X GET \
  "https://us-central1-gen-lang-client-0999441419.cloudfunctions.net/newsAggregator"
```

**Expected Response:**
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

## Verify News in Firestore

After successful test:

1. **Go to Firebase Console:**
   - https://console.firebase.google.com/project/gen-lang-client-0999441419/firestore

2. **Navigate to:**
   - `artifacts` → `morning-pulse-app` → `public` → `data` → `news` → `2025-12-05` (today's date)

3. **You should see:**
   - Document with all 7 categories
   - Each category with news articles

---

## Troubleshooting

### 403 Forbidden Error:
- Function not deployed yet → Wait for GitHub Actions
- Function requires authentication → Add authentication headers
- Function doesn't exist → Deploy it first

### Function Not Found:
- Check if deployment completed in GitHub Actions
- Verify function name is `newsAggregator`
- Check region is `us-central1`

### Scheduler Creation Fails:
- Ensure Cloud Scheduler API is enabled
- Check you have proper IAM permissions
- Verify project ID is correct

---

## Recommended Next Steps

1. **Check if functions are deployed:**
   - Go to Cloud Console → Cloud Functions
   - If `newsAggregator` exists and is Active → Proceed
   - If not → Wait for GitHub Actions or deploy manually

2. **Create scheduler (Option 1 is easiest):**
   - Use Google Cloud Console web UI
   - Takes 2 minutes

3. **Test function:**
   - Use Cloud Console Testing tab
   - Or use gcloud if installed

4. **Verify in Firestore:**
   - Check that news data was created

---

## Quick Commands Reference

```bash
# Install gcloud (macOS)
brew install --cask google-cloud-sdk

# Authenticate
gcloud auth login
gcloud config set project gen-lang-client-0999441419

# Create scheduler
gcloud scheduler jobs create http news-aggregator-daily \
  --location=us-central1 \
  --schedule="0 2 * * *" \
  --uri="https://us-central1-gen-lang-client-0999441419.cloudfunctions.net/newsAggregator" \
  --http-method=GET \
  --time-zone="UTC" \
  --description="Daily news aggregation at 2 AM UTC" \
  --project=gen-lang-client-0999441419

# Test function
gcloud functions call newsAggregator \
  --region=us-central1 \
  --gen2

# Check scheduler
gcloud scheduler jobs list --location=us-central1

# Run scheduler manually
gcloud scheduler jobs run news-aggregator-daily \
  --location=us-central1
```

