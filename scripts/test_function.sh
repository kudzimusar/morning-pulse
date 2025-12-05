#!/bin/bash

# Test News Aggregator Function
# Multiple methods to test the function

set -e

PROJECT_ID="gen-lang-client-0999441419"
REGION="us-central1"
FUNCTION_NAME="newsAggregator"
FUNCTION_URI="https://us-central1-${PROJECT_ID}.cloudfunctions.net/${FUNCTION_NAME}"

echo "🔍 Testing News Aggregator Function"
echo "=================================="
echo ""

# Method 1: Try gcloud (if available)
if command -v gcloud &> /dev/null; then
  echo "✅ Using gcloud to call function..."
  echo ""
  gcloud functions call ${FUNCTION_NAME} \
    --region=${REGION} \
    --gen2 \
    --project=${PROJECT_ID}
  echo ""
  echo "✅ Function call completed!"
  exit 0
fi

# Method 2: Use curl (direct HTTP call)
echo "📡 Using curl to call function..."
echo "Function URI: ${FUNCTION_URI}"
echo ""

response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X GET "${FUNCTION_URI}" -H "Content-Type: application/json")

http_status=$(echo "$response" | grep "HTTP_STATUS" | cut -d: -f2 | tr -d ' ')
body=$(echo "$response" | sed '/HTTP_STATUS/d')

echo "HTTP Status: ${http_status}"
echo ""

if [ "$http_status" = "200" ]; then
  echo "✅ Function call successful!"
  echo ""
  echo "Response:"
  # Try to format as JSON if jq is available
  if command -v jq &> /dev/null; then
    echo "$body" | jq .
  else
    echo "$body"
  fi
  
  # Check if it's the expected format
  if echo "$body" | grep -q "success"; then
    echo ""
    echo "🎉 News aggregation completed successfully!"
    echo ""
    echo "Next step: Check Firestore to see the news data:"
    echo "https://console.firebase.google.com/project/${PROJECT_ID}/firestore/data/~2Fartifacts~2Fmorning-pulse-app~2Fpublic~2Fdata~2Fnews"
  fi
else
  echo "❌ Function call failed with status ${http_status}"
  echo ""
  echo "Response body:"
  echo "$body"
  echo ""
  echo "Possible reasons:"
  echo "1. Function requires authentication"
  echo "2. Function is not publicly accessible"
  echo "3. Use gcloud or Cloud Console to test instead"
  exit 1
fi

