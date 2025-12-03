# Morning Pulse Website Setup Guide

## Overview

This guide explains how to set up and deploy the Morning Pulse website that displays news aggregated daily by Gemini AI.

## Architecture

### Components

1. **News Aggregator Function** (`functions/newsAggregator.js`)
   - Cloud Function that runs daily
   - Uses Gemini AI with googleSearch to fetch real news
   - Stores news in Firestore at `artifacts/{APP_ID}/public/data/news/{date}`

2. **Website** (`website/`)
   - React + TypeScript frontend
   - Dual mode: Static (Mode B) and Real-time (Mode A)
   - Deploys to GitHub Pages

3. **Static Generator** (`scripts/generateStaticSite.js`)
   - Reads from Firestore and generates JSON files
   - Runs during GitHub Actions build

## Setup Steps

### 1. Deploy News Aggregator Function

The function is automatically deployed via GitHub Actions when you push to `main`. It will deploy both:
- `webhook` (WhatsApp bot)
- `newsAggregator` (Daily news service)

### 2. Set Up Cloud Scheduler

After the function is deployed, set up daily scheduling:

```bash
# Set environment variables
export GCP_PROJECT_ID="your-project-id"
export REGION="us-central1"

# Run the setup script
./scripts/setup_scheduler.sh
```

Or manually:

```bash
gcloud scheduler jobs create http daily-news-aggregation \
  --location=us-central1 \
  --schedule="0 2 * * *" \
  --time-zone="UTC" \
  --uri="https://us-central1-YOUR-PROJECT.cloudfunctions.net/newsAggregator" \
  --http-method=GET \
  --description="Daily news aggregation for Morning Pulse"
```

### 3. Configure GitHub Pages

1. Go to repository Settings → Pages
2. Source: GitHub Actions
3. The workflow will automatically deploy on push to `main`

### 4. (Optional) Configure Firebase for Real-time Mode

If you want the website to read from Firestore in real-time:

1. Get your Firebase config from Firebase Console
2. Add to GitHub Secrets as `FIREBASE_CONFIG` (JSON string)
3. Update `.github/workflows/deploy_website.yml` to inject config at build time

Or inject at runtime by modifying `index.html` to include:
```html
<script>
  window.__firebase_config = '{"apiKey":"...","authDomain":"...",...}';
  window.__app_id = 'morning-pulse-app';
</script>
```

## Testing

### Test News Aggregator Locally

```bash
# Set environment variables
export GEMINI_API_KEY="your-key"
export FIREBASE_ADMIN_CONFIG='{"type":"service_account",...}'
export APP_ID="morning-pulse-app"

# Run the function locally (using Functions Framework)
cd functions
npm install
npx @google-cloud/functions-framework --target=newsAggregator --port=8080
```

Then trigger:
```bash
curl http://localhost:8080
```

### Test Website Locally

```bash
cd website
npm install
npm run dev
```

Visit `http://localhost:5173`

### Test Static Generation

```bash
# Set environment variables
export FIREBASE_ADMIN_CONFIG='{"type":"service_account",...}'
export APP_ID="morning-pulse-app"

# Run script
node scripts/generateStaticSite.js
```

Check `website/dist/data/` for generated JSON files.

## Manual News Aggregation

To manually trigger news aggregation:

```bash
# Get function URL
FUNCTION_URL=$(gcloud functions describe newsAggregator \
  --region=us-central1 \
  --format="value(httpsTrigger.url)")

# Trigger
curl "$FUNCTION_URL"
```

Or use Cloud Scheduler:

```bash
gcloud scheduler jobs run daily-news-aggregation \
  --location=us-central1
```

## Troubleshooting

### News not appearing on website

1. Check if news aggregator ran successfully:
   - Check Cloud Functions logs
   - Verify Firestore has data for today's date

2. Check website build:
   - Check GitHub Actions logs
   - Verify static JSON files in `dist/data/`

3. Check Firebase config (for real-time mode):
   - Verify config is correctly injected
   - Check browser console for errors

### Function deployment fails

1. Check environment variables in GitHub Secrets
2. Verify GCP project permissions
3. Check Cloud Functions API is enabled

### Static generation fails

1. Verify `FIREBASE_ADMIN_CONFIG` is set correctly
2. Check Firestore has data
3. Verify `APP_ID` matches your configuration

## Data Structure

News is stored in Firestore as:

```
artifacts/{APP_ID}/public/data/news/{YYYY-MM-DD}
  - date: string
  - timestamp: number
  - categories: {
      "Local (Zim)": [NewsStory[]],
      "Business (Zim)": [NewsStory[]],
      ...
    }
  - lastUpdated: timestamp
```

Each `NewsStory` has:
- `id`: string
- `headline`: string
- `detail`: string
- `source`: string
- `category`: string
- `url`: string (optional)
- `date`: string
- `timestamp`: number

## Next Steps

1. Customize news categories in `functions/newsAggregator.js`
2. Adjust scheduling time in `setup_scheduler.sh`
3. Customize website styling in `website/src/styles/newspaper.css`
4. Add analytics or other features as needed

