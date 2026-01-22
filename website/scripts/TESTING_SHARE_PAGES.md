# Testing Share Pages - Step-by-Step Guide

This guide walks you through testing the automated meta-tag pre-rendering system for social media sharing.

## Prerequisites

1. ✅ Default OG image placed at `website/public/default-og-image.jpg`
2. ✅ At least one published opinion in Firestore with `status: 'published'`
3. ✅ Firebase Admin credentials configured in GitHub Secrets
4. ✅ Node.js 20+ installed locally

---

## Phase 1: Local Testing (Before Deployment)

### Step 1: Test the Generator Script Locally

```bash
# Navigate to website directory
cd website

# Install dependencies (if not already done)
npm install

# Install Firebase Admin SDK in functions directory
cd ../functions
npm install

# Go back to website
cd ../website

# Set up environment variables
export FIREBASE_ADMIN_CONFIG='<your-service-account-json>'
export APP_ID='morning-pulse-app'
export GITHUB_PAGES_URL='https://kudzimusar.github.io'

# Build the website first (generator needs dist/ directory)
npm run build

# Run the generator script
node scripts/generate-shares.js
```

**Expected Output:**
```
🚀 Starting share page generation...
📡 Base URL: https://kudzimusar.github.io
📁 Base Path: /morning-pulse
📡 Fetching published opinions from Firestore...
✅ Found X published opinions
📁 Created shares directory: /path/to/website/dist/shares
✅ Generated: /shares/story-slug-1/index.html
✅ Generated: /shares/story-slug-2/index.html
...
=== SHARE PAGE GENERATION COMPLETE ===
✅ Success: X pages generated
📁 Output directory: /path/to/website/dist/shares
```

### Step 2: Verify Generated Files

```bash
# Check that shares directory was created
ls -la dist/shares/

# Check a specific story's HTML
cat dist/shares/[story-slug]/index.html

# Verify OG tags are present
grep -i "og:image" dist/shares/[story-slug]/index.html
grep -i "og:title" dist/shares/[story-slug]/index.html
```

**What to Check:**
- ✅ HTML files exist in `dist/shares/[slug]/index.html`
- ✅ OG tags contain absolute URLs (starting with `https://`)
- ✅ Redirect URL is relative (`../../index.html?story=slug`)
- ✅ Image URLs are absolute (Firebase Storage URLs or default fallback)

### Step 3: Test Local Preview

```bash
# Start local preview server
npm run preview

# Open browser to test a share page
# Navigate to: http://localhost:4173/morning-pulse/shares/[story-slug]/
```

**What to Test:**
1. **Page loads** - Should see redirect message or immediate redirect
2. **Redirect works** - Should redirect to main app with `?story=slug` parameter
3. **URL parameter handling** - App should navigate to the correct opinion

### Step 4: Test URL Parameter Handling

```bash
# In browser, manually test:
http://localhost:4173/morning-pulse/index.html?story=[story-slug]
```

**Expected Behavior:**
- App detects `?story=slug` parameter
- Automatically navigates to `#opinion/[slug]`
- Opinion opens in the feed
- URL parameter is cleared (replaced with hash)

---

## Phase 2: Test OG Tags (Social Media Preview)

### Step 5: Use Social Media Debuggers

**Facebook/Meta Debugger:**
1. Go to: https://developers.facebook.com/tools/debug/
2. Enter URL: `https://kudzimusar.github.io/morning-pulse/shares/[story-slug]/`
3. Click "Scrape Again"
4. Verify:
   - ✅ OG image displays correctly
   - ✅ Title matches story headline
   - ✅ Description matches story subheadline

**Twitter Card Validator:**
1. Go to: https://cards-dev.twitter.com/validator
2. Enter URL: `https://kudzimusar.github.io/morning-pulse/shares/[story-slug]/`
3. Verify:
   - ✅ Card type: `summary_large_image`
   - ✅ Image displays
   - ✅ Title and description correct

**LinkedIn Post Inspector:**
1. Go to: https://www.linkedin.com/post-inspector/
2. Enter URL: `https://kudzimusar.github.io/morning-pulse/shares/[story-slug]/`
3. Verify:
   - ✅ Image preview displays
   - ✅ Title and description correct

### Step 6: Test with Real Social Media Post

1. **Create a test post** on Twitter/X, Facebook, or LinkedIn
2. **Paste the share URL**: `https://kudzimusar.github.io/morning-pulse/shares/[story-slug]/`
3. **Wait for preview** to generate
4. **Verify**:
   - ✅ Image appears in preview
   - ✅ Title is correct
   - ✅ Description is correct
   - ✅ Clicking link opens the story

---

## Phase 3: GitHub Actions Testing

### Step 7: Trigger Deployment

```bash
# Commit and push changes
git add .
git commit -m "feat: Add share pages generator for OG tags"
git push origin main
```

### Step 8: Monitor GitHub Actions

1. Go to: https://github.com/[your-username]/morning-pulse/actions
2. Click on the latest workflow run
3. Check the "Generate Share Pages" step logs

**Expected Logs:**
```
🚀 Generating share pages with OG tags...
🚀 Starting share page generation...
📡 Base URL: https://kudzimusar.github.io
✅ Found X published opinions
✅ Generated: /shares/story-slug-1/index.html
...
✅ Success: X pages generated
```

### Step 9: Verify Deployment

After deployment completes (usually 2-5 minutes):

```bash
# Test a share URL
curl -I https://kudzimusar.github.io/morning-pulse/shares/[story-slug]/

# Should return 200 OK
```

**Verify in Browser:**
1. Visit: `https://kudzimusar.github.io/morning-pulse/shares/[story-slug]/`
2. Check page source (View → Developer → View Source)
3. Verify OG tags are present
4. Verify redirect works

---

## Phase 4: Edge Cases & Error Handling

### Step 10: Test Missing Image Handling

1. **Create a story without an image** (or with invalid image URL)
2. **Regenerate share pages**
3. **Verify** default fallback image is used in OG tags

### Step 11: Test Invalid Slug Handling

1. **Check generator logs** for stories with invalid slugs
2. **Verify** script continues (doesn't crash) when encountering errors
3. **Verify** other stories still generate successfully

### Step 12: Test Performance

```bash
# Test with 100+ stories (if available)
# Monitor generation time
time node scripts/generate-shares.js

# Should complete in < 30 seconds for 100 stories
```

---

## Troubleshooting

### Issue: "No published opinions found"

**Solution:**
- Check Firestore: `artifacts/morning-pulse-app/public/data/opinions`
- Ensure at least one opinion has `status: 'published'`
- Verify Firebase Admin credentials are correct

### Issue: "FIREBASE_ADMIN_CONFIG environment variable is required"

**Solution:**
- Set the environment variable before running script
- For GitHub Actions: Verify `GCP_SA_KEY` secret is set
- For local: Export the variable or use `.env` file

### Issue: "OG image not displaying"

**Solution:**
1. Check image URL is absolute (starts with `https://`)
2. Verify image exists at the URL
3. Test image URL directly in browser
4. Check image dimensions (should be 1200x630 for best results)
5. Verify default fallback image exists

### Issue: "Redirect not working"

**Solution:**
1. Check redirect URL is relative: `../../index.html?story=slug`
2. Verify base path is correct: `/morning-pulse`
3. Test redirect manually in browser
4. Check browser console for JavaScript errors

### Issue: "URL parameter not detected"

**Solution:**
1. Check App.tsx useEffect for URL parameter handling
2. Verify parameter format: `?story=slug` (not `?story=slug&other=param`)
3. Check browser console for errors
4. Verify hash routing doesn't interfere

---

## Success Criteria

✅ **Generator Script:**
- Runs without errors
- Generates HTML files for all published opinions
- Creates proper directory structure
- Handles missing images gracefully

✅ **OG Tags:**
- All required meta tags present
- Absolute URLs for images
- Correct title and description
- Valid HTML structure

✅ **Redirect:**
- Meta refresh works
- JavaScript fallback works
- Redirects to correct story
- URL parameter is handled

✅ **Social Media:**
- Preview displays correctly on Facebook
- Preview displays correctly on Twitter
- Preview displays correctly on LinkedIn
- Clicking link opens correct story

---

## Next Steps

After successful testing:

1. **Monitor** GitHub Actions for any errors
2. **Test** with real social media posts
3. **Optimize** default OG image if needed
4. **Consider** adding analytics tracking for share clicks
5. **Document** any customizations for your team

---

## Quick Reference

**Generator Script:** `website/scripts/generate-shares.js`
**Workflow File:** `.github/workflows/deploy_website.yml`
**App Logic:** `website/src/App.tsx` (URL parameter handling)
**Default Image:** `website/public/default-og-image.jpg`
**Output Directory:** `website/dist/shares/[slug]/index.html`

**Share URL Format:** `https://kudzimusar.github.io/morning-pulse/shares/[story-slug]/`
**Redirect Target:** `https://kudzimusar.github.io/morning-pulse/index.html?story=[story-slug]`
