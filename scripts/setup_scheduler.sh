#!/bin/bash

# Cloud Scheduler Setup Script for News Aggregator
# This script sets up a daily scheduled job to trigger the newsAggregator function

set -e

PROJECT_ID=${GCP_PROJECT_ID:-"your-project-id"}
REGION=${REGION:-"us-central1"}
FUNCTION_NAME="newsAggregator"
SCHEDULER_NAME="daily-news-aggregation"
SCHEDULE="0 2 * * *"  # Daily at 2 AM UTC (adjust as needed)
TIMEZONE="UTC"

# Get the function URL
echo "Getting function URL..."
FUNCTION_URL=$(gcloud functions describe $FUNCTION_NAME \
  --region=$REGION \
  --project=$PROJECT_ID \
  --format="value(httpsTrigger.url)" 2>/dev/null || echo "")

if [ -z "$FUNCTION_URL" ]; then
  echo "❌ Error: Could not find function URL. Make sure the function is deployed."
  exit 1
fi

echo "Function URL: $FUNCTION_URL"

# Check if scheduler already exists
EXISTING_JOB=$(gcloud scheduler jobs describe $SCHEDULER_NAME \
  --location=$REGION \
  --project=$PROJECT_ID \
  --format="value(name)" 2>/dev/null || echo "")

if [ -n "$EXISTING_JOB" ]; then
  echo "⚠️  Scheduler job already exists. Updating..."
  gcloud scheduler jobs update http $SCHEDULER_NAME \
    --location=$REGION \
    --project=$PROJECT_ID \
    --schedule="$SCHEDULE" \
    --time-zone="$TIMEZONE" \
    --uri="$FUNCTION_URL" \
    --http-method=GET \
    --description="Daily news aggregation for Morning Pulse"
else
  echo "Creating new scheduler job..."
  gcloud scheduler jobs create http $SCHEDULER_NAME \
    --location=$REGION \
    --project=$PROJECT_ID \
    --schedule="$SCHEDULE" \
    --time-zone="$TIMEZONE" \
    --uri="$FUNCTION_URL" \
    --http-method=GET \
    --description="Daily news aggregation for Morning Pulse"
fi

echo "✅ Scheduler job configured successfully!"
echo ""
echo "Job details:"
gcloud scheduler jobs describe $SCHEDULER_NAME \
  --location=$REGION \
  --project=$PROJECT_ID \
  --format="yaml(name,schedule,timeZone,httpTarget.uri)"

echo ""
echo "To test the scheduler manually, run:"
echo "  gcloud scheduler jobs run $SCHEDULER_NAME --location=$REGION --project=$PROJECT_ID"

