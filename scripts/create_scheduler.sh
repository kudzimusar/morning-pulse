#!/bin/bash

# Create Cloud Scheduler Job for News Aggregator
# Run this script after gcloud is authenticated

set -e

PROJECT_ID="gen-lang-client-0999441419"
REGION="us-central1"
FUNCTION_NAME="newsAggregator"
SCHEDULER_NAME="news-aggregator-daily"
FUNCTION_URI="https://us-central1-${PROJECT_ID}.cloudfunctions.net/${FUNCTION_NAME}"

echo "Creating Cloud Scheduler job..."
echo "Project: ${PROJECT_ID}"
echo "Region: ${REGION}"
echo "Function URI: ${FUNCTION_URI}"
echo ""

# Check if job already exists
if gcloud scheduler jobs describe ${SCHEDULER_NAME} --location=${REGION} --project=${PROJECT_ID} &>/dev/null; then
  echo "⚠️  Scheduler job already exists. Updating..."
  gcloud scheduler jobs update http ${SCHEDULER_NAME} \
    --location=${REGION} \
    --project=${PROJECT_ID} \
    --schedule="0 2 * * *" \
    --time-zone="UTC" \
    --uri="${FUNCTION_URI}" \
    --http-method=GET \
    --description="Daily news aggregation at 2 AM UTC"
  echo "✅ Scheduler job updated successfully!"
else
  echo "Creating new scheduler job..."
  gcloud scheduler jobs create http ${SCHEDULER_NAME} \
    --location=${REGION} \
    --project=${PROJECT_ID} \
    --schedule="0 2 * * *" \
    --time-zone="UTC" \
    --uri="${FUNCTION_URI}" \
    --http-method=GET \
    --description="Daily news aggregation at 2 AM UTC"
  echo "✅ Scheduler job created successfully!"
fi

echo ""
echo "Job details:"
gcloud scheduler jobs describe ${SCHEDULER_NAME} \
  --location=${REGION} \
  --project=${PROJECT_ID} \
  --format="yaml(name,schedule,timeZone,httpTarget.uri)"

echo ""
echo "To test the scheduler manually, run:"
echo "  gcloud scheduler jobs run ${SCHEDULER_NAME} --location=${REGION} --project=${PROJECT_ID}"

