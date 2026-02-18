#!/bin/bash

# Deployment Helper Script
# Usage: ./deploy.sh [function_name]

# Use local firebase-tools binary to avoid npx cache issues
FIREBASE_CLI="./functions/node_modules/.bin/firebase"

if [ -z "$1" ]; then
  echo "Deploying all functions..."
  $FIREBASE_CLI deploy --only functions --project gen-lang-client-0999441419
else
  echo "Deploying function: $1..."
  $FIREBASE_CLI deploy --only functions:$1 --project gen-lang-client-0999441419
fi
