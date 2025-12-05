#!/bin/bash

# Test News Aggregator Function
# This script tests the newsAggregator Cloud Function

set -e

PROJECT_ID="gen-lang-client-0999441419"
REGION="us-central1"
FUNCTION_NAME="newsAggregator"
FUNCTION_URI="https://us-central1-${PROJECT_ID}.cloudfunctions.net/${FUNCTION_NAME}"

echo "Testing News Aggregator Function..."
echo "Function URI: ${FUNCTION_URI}"
echo ""

# Method 1: Using gcloud (if available)
if command -v gcloud &> /dev/null; then
  echo "Using gcloud to call function..."
  gcloud functions call ${FUNCTION_NAME} \
    --region=${REGION} \
    --gen2 \
    --project=${PROJECT_ID}
else
  echo "gcloud not found. Using curl to test function..."
  echo ""
  
  # Method 2: Using curl (direct HTTP call)
  echo "Calling function via HTTP GET..."
  response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X GET "${FUNCTION_URI}")
  
  http_status=$(echo "$response" | grep "HTTP_STATUS" | cut -d: -f2)
  body=$(echo "$response" | sed '/HTTP_STATUS/d')
  
  echo ""
  echo "HTTP Status: ${http_status}"
  echo ""
  echo "Response:"
  echo "$body" | jq . 2>/dev/null || echo "$body"
  
  if [ "$http_status" = "200" ]; then
    echo ""
    echo "✅ Function call successful!"
  else
    echo ""
    echo "❌ Function call failed with status ${http_status}"
    exit 1
  fi
fi

