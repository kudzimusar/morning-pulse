#!/bin/bash

# Quick Test Script for Share Functionality
# This script helps you quickly test the share functionality

set -e

echo "🧪 Share Functionality Quick Test"
echo "================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: Must run from website directory${NC}"
    echo "Usage: cd website && bash scripts/test-share-functionality.sh"
    exit 1
fi

# Test 1: Check if build works
echo -e "${YELLOW}Test 1: Building website...${NC}"
if npm run build > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Build successful${NC}"
else
    echo -e "${RED}❌ Build failed${NC}"
    echo "Run 'npm run build' to see errors"
    exit 1
fi

# Test 2: Check if dist directory exists
echo -e "${YELLOW}Test 2: Checking build output...${NC}"
if [ -d "dist" ]; then
    echo -e "${GREEN}✅ dist directory exists${NC}"
else
    echo -e "${RED}❌ dist directory missing${NC}"
    exit 1
fi

# Test 3: Check if share generation script exists
echo -e "${YELLOW}Test 3: Checking share generation script...${NC}"
if [ -f "scripts/generate-shares.js" ]; then
    echo -e "${GREEN}✅ generate-shares.js exists${NC}"
else
    echo -e "${RED}❌ generate-shares.js missing${NC}"
    exit 1
fi

# Test 4: Check environment variables
echo -e "${YELLOW}Test 4: Checking environment variables...${NC}"
if [ -z "$FIREBASE_ADMIN_CONFIG" ]; then
    echo -e "${YELLOW}⚠️  FIREBASE_ADMIN_CONFIG not set${NC}"
    echo "   Set it to run share page generation:"
    echo "   export FIREBASE_ADMIN_CONFIG='{...}'"
else
    echo -e "${GREEN}✅ FIREBASE_ADMIN_CONFIG is set${NC}"
fi

if [ -z "$APP_ID" ]; then
    echo -e "${YELLOW}⚠️  APP_ID not set (using default: morning-pulse-app)${NC}"
    export APP_ID="morning-pulse-app"
else
    echo -e "${GREEN}✅ APP_ID is set: $APP_ID${NC}"
fi

if [ -z "$GITHUB_PAGES_URL" ]; then
    echo -e "${YELLOW}⚠️  GITHUB_PAGES_URL not set (using default)${NC}"
    export GITHUB_PAGES_URL="https://kudzimusar.github.io"
else
    echo -e "${GREEN}✅ GITHUB_PAGES_URL is set: $GITHUB_PAGES_URL${NC}"
fi

# Test 5: Try to run share generation (if credentials are available)
if [ ! -z "$FIREBASE_ADMIN_CONFIG" ]; then
    echo ""
    echo -e "${YELLOW}Test 5: Testing share page generation...${NC}"
    echo "This may take a moment..."
    
    if node scripts/generate-shares.js 2>&1 | tee /tmp/share-gen-output.log; then
        echo -e "${GREEN}✅ Share pages generated successfully${NC}"
        
        # Check output
        if [ -d "dist/shares" ]; then
            share_count=$(find dist/shares -type d -mindepth 1 | wc -l | tr -d ' ')
            echo -e "${GREEN}   Found $share_count share page folders${NC}"
            
            # Show sample
            if [ $share_count -gt 0 ]; then
                sample=$(find dist/shares -type d -mindepth 1 | head -1 | xargs basename)
                echo -e "${GREEN}   Sample: dist/shares/$sample/index.html${NC}"
            fi
        else
            echo -e "${YELLOW}⚠️  dist/shares directory not created${NC}"
        fi
        
        # Check for .nojekyll
        if [ -f "dist/.nojekyll" ]; then
            echo -e "${GREEN}✅ .nojekyll file exists${NC}"
        else
            echo -e "${YELLOW}⚠️  .nojekyll file missing${NC}"
        fi
        
        # Check for share.html
        if [ -f "dist/share.html" ]; then
            echo -e "${GREEN}✅ share.html exists${NC}"
        else
            echo -e "${YELLOW}⚠️  share.html missing${NC}"
        fi
        
        # Check for 404.html
        if [ -f "dist/404.html" ]; then
            echo -e "${GREEN}✅ 404.html exists${NC}"
        else
            echo -e "${YELLOW}⚠️  404.html missing${NC}"
        fi
        
    else
        echo -e "${RED}❌ Share page generation failed${NC}"
        echo "Check /tmp/share-gen-output.log for details"
        exit 1
    fi
else
    echo ""
    echo -e "${YELLOW}Skipping share page generation (FIREBASE_ADMIN_CONFIG not set)${NC}"
    echo "To test share page generation:"
    echo "  export FIREBASE_ADMIN_CONFIG='{...}'"
    echo "  export APP_ID='morning-pulse-app'"
    echo "  export GITHUB_PAGES_URL='https://kudzimusar.github.io'"
    echo "  node scripts/generate-shares.js"
fi

# Test 6: Check OpinionFeed.tsx for handleShare
echo ""
echo -e "${YELLOW}Test 6: Checking OpinionFeed.tsx...${NC}"
handleShare_count=$(grep -c "const handleShare" src/components/OpinionFeed.tsx || echo "0")
if [ "$handleShare_count" -eq "1" ]; then
    echo -e "${GREEN}✅ Only one handleShare declaration found${NC}"
elif [ "$handleShare_count" -gt "1" ]; then
    echo -e "${RED}❌ Multiple handleShare declarations found ($handleShare_count)${NC}"
    echo "   This will cause build errors!"
    exit 1
else
    echo -e "${YELLOW}⚠️  No handleShare found${NC}"
fi

# Test 7: Check for share button in OpinionFeed
echo -e "${YELLOW}Test 7: Checking for share button...${NC}"
if grep -q "handleShare" src/components/OpinionFeed.tsx && grep -q "Share" src/components/OpinionFeed.tsx; then
    echo -e "${GREEN}✅ Share button code found${NC}"
else
    echo -e "${YELLOW}⚠️  Share button code not found${NC}"
fi

# Summary
echo ""
echo "================================"
echo -e "${GREEN}✅ Quick tests completed!${NC}"
echo ""
echo "Next steps:"
echo "1. Start dev server: npm run dev"
echo "2. Navigate to: http://localhost:5173/#opinion"
echo "3. Click an opinion and test the share button"
echo "4. For full testing guide, see: SHARE_FUNCTIONALITY_TESTING.md"
echo ""
