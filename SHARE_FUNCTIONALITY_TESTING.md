# Share Functionality Testing Guide

This guide helps you test the share functionality after the recent fixes.

## Overview

The share functionality includes:
1. **Share Button** in OpinionFeed.tsx that generates share URLs
2. **Share Page Generation Script** (`generate-shares.js`) that creates static HTML pages with OG tags
3. **Share Pages** at `/shares/{slug}/index.html` for social media previews
4. **Image Fallback Logic** using `getImageByTopic` for consistent images

---

## Prerequisites

1. **Firebase Admin Credentials**: You need `FIREBASE_ADMIN_CONFIG` environment variable
2. **Published Opinions**: At least one published opinion in Firestore
3. **Local Development Server**: Running the website locally

---

## Test 1: Share Button Functionality

### Step 1: Start Local Development Server

```bash
cd website
npm run dev
```

### Step 2: Navigate to Opinions Page

1. Open `http://localhost:5173/#opinion` (or your dev server URL)
2. Click on any published opinion to open the modal

### Step 3: Test Share Button

1. **Look for Share Button**: Should be visible in the top-left corner of the opinion modal (📤 Share)
2. **Click Share Button**: 
   - On mobile: Should open native share dialog
   - On desktop: Should copy link to clipboard and show alert
3. **Verify Share URL Format**: 
   - Should be: `https://kudzimusar.github.io/morning-pulse/shares/{slug}/`
   - Slug should be URL-friendly (lowercase, hyphens, no special chars)

### Step 4: Verify Share URL in Console

Open browser console and check:
- No errors when clicking share
- URL is correctly formatted
- Slug generation works for opinions with/without existing slugs

**Expected Result**: 
- ✅ Share button visible and functional
- ✅ URL copied to clipboard (desktop) or native share opens (mobile)
- ✅ URL format: `https://kudzimusar.github.io/morning-pulse/shares/{slug}/`

---

## Test 2: Share Page Generation Script

### Step 1: Set Up Environment Variables

```bash
export FIREBASE_ADMIN_CONFIG='{"type":"service_account",...}'  # Your Firebase service account JSON
export APP_ID='morning-pulse-app'
export GITHUB_PAGES_URL='https://kudzimusar.github.io'
```

Or create a `.env` file in the `website` directory:
```bash
cd website
cat > .env << EOF
FIREBASE_ADMIN_CONFIG='{"type":"service_account",...}'
APP_ID=morning-pulse-app
GITHUB_PAGES_URL=https://kudzimusar.github.io
EOF
```

### Step 2: Install Dependencies (if needed)

```bash
cd functions
npm install
```

### Step 3: Run Share Generation Script

```bash
cd website
node scripts/generate-shares.js
```

### Step 4: Verify Output

Check that the script:
1. ✅ Connects to Firebase successfully
2. ✅ Fetches published opinions
3. ✅ Creates `dist/shares/` directory
4. ✅ Generates `dist/shares/{slug}/index.html` for each opinion
5. ✅ Creates `dist/share.html` (universal share page)
6. ✅ Creates `dist/404.html` (404 handler)
7. ✅ Creates `dist/.nojekyll` (ensures GitHub Pages serves all files)

**Expected Output**:
```
🚀 Starting share page generation...
📂 APP_ID: morning-pulse-app
🌐 Base URL: https://kudzimusar.github.io/morning-pulse
✅ Firebase Admin initialized
📰 Found X published opinions
📁 Created shares directory
✅ Generated X share pages...
✅ Created universal share.html file
✅ Created 404.html handler
✅ Share page generation complete!
```

### Step 5: Inspect Generated Files

```bash
# Check share pages structure
ls -la website/dist/shares/

# Check a specific share page
cat website/dist/shares/{slug}/index.html | head -50

# Verify OG tags are present
grep -i "og:image\|og:title\|og:description" website/dist/shares/{slug}/index.html
```

**Expected Result**:
- ✅ Each opinion has its own folder: `dist/shares/{slug}/`
- ✅ Each folder contains `index.html`
- ✅ HTML includes proper OG tags (og:title, og:description, og:image)
- ✅ Image URLs are absolute (start with `https://`)
- ✅ No Unsplash URLs (should use picsum.photos or finalImageUrl)

---

## Test 3: Share Page Content Verification

### Step 1: Check Generated HTML Structure

Open a generated share page:
```bash
cat website/dist/shares/{slug}/index.html
```

### Step 2: Verify OG Tags

Look for these meta tags:
```html
<meta property="og:type" content="article">
<meta property="og:url" content="https://kudzimusar.github.io/morning-pulse/shares/{slug}/">
<meta property="og:title" content="{headline}">
<meta property="og:description" content="{subHeadline}">
<meta property="og:image" content="{absolute_image_url}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
```

### Step 3: Verify Image URLs

Check that image URLs:
1. ✅ Are absolute (start with `https://`)
2. ✅ Use `picsum.photos` if no image in database (via `getImageByTopic`)
3. ✅ Use `finalImageUrl` or `suggestedImageUrl` if available
4. ✅ No Unsplash URLs (should be filtered out)

**Test Image URL Logic**:
```bash
# Check if image URLs are absolute
grep "og:image" website/dist/shares/{slug}/index.html

# Should see URLs like:
# https://picsum.photos/seed/123/1200/800
# OR
# https://kudzimusar.github.io/morning-pulse/{image_path}
# NOT: source.unsplash.com or relative paths
```

---

## Test 4: Local Share Page Preview

### Step 1: Build the Website

```bash
cd website
npm run build
```

### Step 2: Preview Built Site

```bash
npm run preview
# Or use a simple HTTP server
cd dist
python3 -m http.server 8080
```

### Step 3: Test Share Page URLs

1. Open `http://localhost:8080/shares/{slug}/` in browser
2. Verify:
   - ✅ Page loads without 404
   - ✅ Shows opinion title and description
   - ✅ Redirects to SPA after 2-3 seconds
   - ✅ OG tags are present in page source (View Page Source)

### Step 4: Test Redirect

1. Open share page URL
2. Wait 2-3 seconds
3. Should redirect to: `https://kudzimusar.github.io/morning-pulse/#opinion/{slug}`
4. Verify redirect works correctly

---

## Test 5: Social Media Preview Testing

### Option A: Facebook Sharing Debugger

1. Go to: https://developers.facebook.com/tools/debug/
2. Enter share URL: `https://kudzimusar.github.io/morning-pulse/shares/{slug}/`
3. Click "Debug"
4. Verify:
   - ✅ Title appears correctly
   - ✅ Description appears correctly
   - ✅ Image preview appears (1200x630 or similar)
   - ✅ No errors or warnings

### Option B: Twitter Card Validator

1. Go to: https://cards-dev.twitter.com/validator
2. Enter share URL
3. Verify:
   - ✅ Card type: `summary_large_image`
   - ✅ Title, description, and image appear correctly

### Option C: LinkedIn Post Inspector

1. Go to: https://www.linkedin.com/post-inspector/
2. Enter share URL
3. Verify preview appears correctly

### Option D: WhatsApp Link Preview (Manual)

1. **On Mobile**:
   - Open WhatsApp
   - Send the share URL to yourself or a test contact
   - Verify preview card shows:
     - ✅ Title
     - ✅ Description
     - ✅ Image thumbnail
     - ✅ Domain name

2. **On Desktop**:
   - Open WhatsApp Web
   - Send share URL
   - Verify preview appears

**Note**: WhatsApp caches previews. If you update a share page, you may need to wait or use a URL parameter to force refresh.

---

## Test 6: Image Fallback Logic

### Test Case 1: Opinion with Final Image

1. Create/use an opinion with `finalImageUrl` set
2. Generate share pages
3. Verify share page uses `finalImageUrl`

### Test Case 2: Opinion with Suggested Image

1. Create/use an opinion with `suggestedImageUrl` but no `finalImageUrl`
2. Generate share pages
3. Verify share page uses `suggestedImageUrl`

### Test Case 3: Opinion with No Image

1. Create/use an opinion with no image URLs
2. Generate share pages
3. Verify share page uses `getImageByTopic` (picsum.photos URL)
4. Verify image URL is topic-appropriate (based on headline keywords)

### Test Case 4: Opinion with Unsplash URL (Deprecated)

1. Create/use an opinion with Unsplash URL in `imageUrl`
2. Generate share pages
3. Verify Unsplash URL is filtered out
4. Verify `getImageByTopic` is used instead

**Test Script**:
```bash
# Check image URLs in generated share pages
grep -r "og:image" website/dist/shares/*/index.html | head -10

# Should NOT see:
# - unsplash.com
# - source.unsplash.com
# - Relative paths (starting with / or ./)

# Should see:
# - https://picsum.photos/seed/...
# - https://kudzimusar.github.io/...
# - Other absolute https:// URLs
```

---

## Test 7: Build and Deployment Verification

### Step 1: Full Build Test

```bash
cd website
npm run build
```

### Step 2: Verify Build Output

```bash
# Check dist directory structure
ls -la website/dist/

# Verify share pages are included
ls -la website/dist/shares/ || echo "⚠️  Shares directory missing"

# Check .nojekyll exists
test -f website/dist/.nojekyll && echo "✅ .nojekyll exists" || echo "❌ .nojekyll missing"
```

### Step 3: Test in CI/CD

1. Push changes to GitHub
2. Monitor GitHub Actions workflow
3. Verify "Generate Share Pages" step succeeds
4. Check deployment logs for share page generation

---

## Common Issues and Solutions

### Issue 1: Share Pages Not Generated

**Symptoms**: No `dist/shares/` directory after running script

**Solutions**:
- Check Firebase Admin credentials are correct
- Verify `APP_ID` matches your Firestore structure
- Check that opinions have `status: 'published'`
- Review script error messages

### Issue 2: Image URLs Are Relative

**Symptoms**: OG image tags show relative paths like `/images/...`

**Solutions**:
- Verify `BASE_URL` and `GITHUB_PAGES_URL` are set correctly
- Check `generate-shares.js` image URL conversion logic
- Ensure `getImageByTopic` returns absolute URLs

### Issue 3: WhatsApp Preview Not Working

**Symptoms**: WhatsApp shows generic preview or no preview

**Solutions**:
- Verify image URLs are absolute (`https://`)
- Check image dimensions (should be at least 300x200, recommended 1200x630)
- Ensure OG tags are in HTML (not added by JavaScript)
- Clear WhatsApp cache (add `?v=2` to URL)
- Wait a few minutes for WhatsApp to re-crawl

### Issue 4: 404 Errors on Share URLs

**Symptoms**: `/shares/{slug}/` returns 404

**Solutions**:
- Verify `.nojekyll` file exists in `dist/`
- Check folder structure: `dist/shares/{slug}/index.html`
- Ensure GitHub Pages is configured correctly
- Check 404.html handler is present

---

## Quick Test Checklist

- [ ] Share button appears in opinion modal
- [ ] Share button copies correct URL to clipboard
- [ ] Share URL format: `https://kudzimusar.github.io/morning-pulse/shares/{slug}/`
- [ ] Share generation script runs without errors
- [ ] Share pages generated in `dist/shares/{slug}/index.html`
- [ ] OG tags present in share page HTML
- [ ] Image URLs are absolute (start with `https://`)
- [ ] No Unsplash URLs in generated pages
- [ ] Share pages redirect to SPA correctly
- [ ] Facebook Sharing Debugger shows correct preview
- [ ] WhatsApp shows preview card
- [ ] Build completes successfully
- [ ] `.nojekyll` file exists in dist

---

## Next Steps After Testing

1. **If all tests pass**: Deploy to production
2. **If issues found**: 
   - Document the issue
   - Check error messages
   - Review recent changes
   - Fix and re-test

3. **Monitor in Production**:
   - Check share page URLs after deployment
   - Test social media previews with live URLs
   - Monitor for 404 errors in analytics

---

## Additional Resources

- **Facebook Sharing Debugger**: https://developers.facebook.com/tools/debug/
- **Twitter Card Validator**: https://cards-dev.twitter.com/validator
- **LinkedIn Post Inspector**: https://www.linkedin.com/post-inspector/
- **Open Graph Protocol**: https://ogp.me/
- **GitHub Pages Documentation**: https://docs.github.com/en/pages

---

## Support

If you encounter issues during testing:
1. Check browser console for errors
2. Review script output for error messages
3. Verify environment variables are set correctly
4. Check Firestore for published opinions
5. Review recent commits for changes
