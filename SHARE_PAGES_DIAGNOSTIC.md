# Share Pages 404 Diagnostic Report

## Analysis of Current Implementation

### 1. Build Output Verification ✅

**Script Location:** `website/scripts/generate-shares.js`
**Output Directory:** Line 282: `path.join(__dirname, '..', 'dist')`

**Path Resolution:**
- Script runs from: `cd website && node scripts/generate-shares.js`
- `__dirname` = `website/scripts` (absolute path)
- `path.join(__dirname, '..', 'dist')` = `website/dist` ✅

**Files Created:**
- `website/dist/.nojekyll` ✅
- `website/dist/share.html` ✅
- `website/dist/shares/[slug]/index.html` ✅

**VERDICT:** Path resolution is CORRECT. Files should be written to `website/dist/`.

---

### 2. GitHub Actions Workflow ✅

**Workflow Order:**
1. Build Website (line 98-108) - Creates `dist/`
2. Verify Build Output (line 111-128)
3. **Generate Share Pages (line 131-161)** - Runs AFTER build ✅
4. Upload artifact (line 168-171) - Uploads `./website/dist` ✅
5. Deploy (line 174)

**VERDICT:** Script execution order is CORRECT. It runs after build, before deployment.

---

### 3. .nojekyll File ✅

**Creation:** Line 289-291 in generate-shares.js
```javascript
const nojekyllPath = path.join(distPath, '.nojekyll');
fs.writeFileSync(nojekyllPath, '', 'utf8');
```

**Location:** `website/dist/.nojekyll` ✅

**VERDICT:** .nojekyll is being created in the correct location.

---

### 4. Routing Logic Analysis ⚠️

**Current SPA Routing:**
- Uses hash-based routing: `#opinion/slug`
- No pathname-based routing found
- App.tsx doesn't intercept `/shares/` paths

**Potential Issue:**
- GitHub Pages might be serving `index.html` for ALL paths (SPA fallback)
- This could cause `/shares/[slug]/index.html` to be ignored

**VERDICT:** No explicit routing conflict, but GitHub Pages SPA fallback might be the issue.

---

### 5. Image Path Absolute Check ✅

**Code:** Lines 131-151 in generate-shares.js

```javascript
let imageUrl = story.finalImageUrl || story.suggestedImageUrl || story.imageUrl;
if (!imageUrl) {
  imageUrl = `${BASE_URL}/og-default.jpg`; // Absolute
}
// Convert relative to absolute
if (imageUrl && !imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
  if (imageUrl.startsWith('/')) {
    imageUrl = `${GITHUB_PAGES_URL}${imageUrl}`; // Absolute
  } else {
    imageUrl = `${BASE_URL}/${imageUrl}`; // Absolute
  }
}
```

**VERDICT:** Image URLs are guaranteed to be absolute. ✅

---

### 6. Share Button Conditional Logic ✅

**Code:** Lines 489-507 in OpinionFeed.tsx

```tsx
<button 
  onClick={() => handleShare(selectedOpinion)}
  // No conditions - always renders when selectedOpinion exists
/>
```

**Condition:** Only inside `{selectedOpinion && (` block (line 470)
- This means button shows for ANY selected opinion
- No date checks, no `isLatest` flags

**VERDICT:** Share button is UNIVERSAL. ✅

---

## ROOT CAUSE IDENTIFIED 🔍

### The Critical Issue: GitHub Pages SPA Fallback

**Problem:**
GitHub Pages is likely configured to serve `index.html` for ALL routes (SPA fallback). This means:
- Request: `/morning-pulse/shares/slug/`
- GitHub Pages: "I don't see that file, serve index.html instead"
- Result: SPA loads, but `/shares/` folder is never accessed

**Why This Happens:**
1. Vite builds to `dist/index.html` (SPA entry point)
2. GitHub Pages sees `index.html` and treats it as the fallback
3. All 404s redirect to `index.html` (SPA behavior)
4. `/shares/[slug]/index.html` files exist but are never served

---

## SOLUTION: GitHub Pages 404.html Configuration

We need to tell GitHub Pages to serve actual files before falling back to SPA.

### Option 1: Add 404.html with proper routing (Recommended)

Create a `404.html` that:
1. Checks if the path is `/shares/[slug]/`
2. If yes, redirects to the actual file
3. If no, redirects to SPA

### Option 2: Use _redirects file (Netlify-style, but GitHub Pages doesn't support)

### Option 3: Fix the deployment artifact structure

Ensure the artifact includes the shares folder explicitly.

---

## IMMEDIATE FIXES NEEDED

1. **Verify artifact includes shares folder**
   - Add explicit verification step
   - List all files in artifact before upload

2. **Add 404.html handler**
   - Check for `/shares/` paths
   - Serve actual files if they exist

3. **Verify .nojekyll is in artifact**
   - Ensure it's not being filtered out

4. **Add explicit path verification**
   - Log exact paths being written
   - Verify files exist before upload

---

## Recommended Next Steps

1. Check GitHub Actions logs for the "Generate Share Pages" step
2. Verify the artifact actually contains `shares/` folder
3. Add 404.html handler for share pages
4. Test with a direct file URL to confirm files exist
