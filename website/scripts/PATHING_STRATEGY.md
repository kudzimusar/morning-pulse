# OG Tag Image Pathing Strategy

## Overview

This document explains how relative and absolute pathing is handled for OG tags in the share page generator.

## Key Principle

**OG tags require absolute URLs** - Social media crawlers (Facebook, Twitter, LinkedIn) cannot resolve relative paths. They need full `https://` URLs.

## Path Resolution Strategy

### 1. Image URLs (OG Tags)

**Priority Order:**
1. `finalImageUrl` (Firebase Storage - already absolute)
2. `suggestedImageUrl` (Firebase Storage - already absolute)
3. `imageUrl` (Firebase Storage - already absolute)
4. Default fallback: `https://kudzimusar.github.io/morning-pulse/default-og-image.jpg`

**Implementation:**
```javascript
function getOgImageUrl(opinion, baseUrl, basePath) {
  // Try Firebase Storage URLs first (already absolute)
  const imageUrl = opinion.finalImageUrl || 
                   opinion.suggestedImageUrl || 
                   opinion.imageUrl;
  
  if (imageUrl && imageUrl.startsWith('http')) {
    return imageUrl; // Use directly - already absolute
  }
  
  // Fallback: construct absolute URL
  return `${baseUrl}${basePath}/default-og-image.jpg`;
}
```

**Why This Works:**
- Firebase Storage URLs are already absolute (e.g., `https://firebasestorage.googleapis.com/...`)
- Default fallback uses absolute URL constructed from base URL + base path
- Social crawlers can fetch images from any absolute URL

### 2. Redirect URLs (Meta Refresh)

**Format:** Relative path `../../index.html?story=slug`

**Why Relative:**
- Browsers can resolve relative paths
- Works regardless of domain (localhost, staging, production)
- Simpler and more maintainable

**Path Calculation:**
- Generated file: `/morning-pulse/shares/[slug]/index.html`
- Target: `/morning-pulse/index.html`
- Relative path: `../../index.html` (go up 2 levels: `shares/` → `morning-pulse/`)

**Implementation:**
```javascript
const redirectUrl = `../../index.html?story=${slug}`;
```

### 3. Canonical URLs (OG Tags)

**Format:** Absolute URL `https://kudzimusar.github.io/morning-pulse/shares/[slug]/`

**Why Absolute:**
- Required by OG tag specification
- Helps search engines understand canonical URL
- Prevents duplicate content issues

**Implementation:**
```javascript
const canonicalUrl = `${baseUrl}${basePath}/shares/${slug}/`;
```

## File Structure

```
dist/
├── index.html                    (main SPA)
├── default-og-image.jpg          (fallback image)
├── assets/                       (JS/CSS bundles)
└── shares/
    ├── story-slug-1/
    │   └── index.html           (OG tags + redirect)
    └── story-slug-2/
        └── index.html
```

## URL Examples

### Generated Share Page
**URL:** `https://kudzimusar.github.io/morning-pulse/shares/zimbabwe-economic-crisis/`

**OG Image Tag:**
```html
<meta property="og:image" content="https://firebasestorage.googleapis.com/v0/b/.../image.jpg">
<!-- OR if no image: -->
<meta property="og:image" content="https://kudzimusar.github.io/morning-pulse/default-og-image.jpg">
```

**Redirect Tag:**
```html
<meta http-equiv="refresh" content="0; url=../../index.html?story=zimbabwe-economic-crisis">
```

**Canonical Tag:**
```html
<link rel="canonical" href="https://kudzimusar.github.io/morning-pulse/shares/zimbabwe-economic-crisis/">
```

### Redirect Target
**URL:** `https://kudzimusar.github.io/morning-pulse/index.html?story=zimbabwe-economic-crisis`

**App Behavior:**
- Detects `?story=slug` parameter
- Navigates to `#opinion/zimbabwe-economic-crisis`
- Clears query parameter

## Base URL Configuration

The generator uses environment variables to construct absolute URLs:

```javascript
const githubPagesUrl = process.env.GITHUB_PAGES_URL || 
                      process.env.GITHUB_REPOSITORY ? 
                      `https://${process.env.GITHUB_REPOSITORY.split('/')[0]}.github.io` :
                      'https://kudzimusar.github.io';

const basePath = '/morning-pulse';
const baseUrl = githubPagesUrl;
```

**In GitHub Actions:**
- `GITHUB_PAGES_URL`: Set to `https://kudzimusar.github.io`
- `GITHUB_REPOSITORY`: Automatically set by GitHub Actions

## Testing Path Resolution

### Local Testing
```bash
# Base URL: http://localhost:4173
# Base Path: /morning-pulse
# Share URL: http://localhost:4173/morning-pulse/shares/[slug]/
# Image URL: http://localhost:4173/morning-pulse/default-og-image.jpg
```

### Production Testing
```bash
# Base URL: https://kudzimusar.github.io
# Base Path: /morning-pulse
# Share URL: https://kudzimusar.github.io/morning-pulse/shares/[slug]/
# Image URL: https://kudzimusar.github.io/morning-pulse/default-og-image.jpg
```

## Common Issues & Solutions

### Issue: OG Image Not Displaying

**Cause:** Relative path used instead of absolute
**Solution:** Ensure all OG image URLs start with `https://`

### Issue: Redirect Not Working

**Cause:** Incorrect relative path calculation
**Solution:** Verify path depth: `shares/[slug]/` = 2 levels up = `../../`

### Issue: Default Image Not Found

**Cause:** Image not in `public/` directory or not copied to `dist/`
**Solution:** 
1. Place image at `website/public/default-og-image.jpg`
2. Verify `copyPublicDir: true` in `vite.config.ts`
3. Check image exists in `dist/` after build

## Best Practices

1. **Always use absolute URLs for OG tags** - Required by social media platforms
2. **Use relative paths for redirects** - More portable and maintainable
3. **Test with social media debuggers** - Verify OG tags work in real scenarios
4. **Optimize default image** - Keep file size < 1MB, dimensions 1200x630px
5. **Monitor build logs** - Check for path resolution errors during generation

## Summary

- **OG Image URLs:** Absolute (Firebase Storage or constructed fallback)
- **Redirect URLs:** Relative (`../../index.html?story=slug`)
- **Canonical URLs:** Absolute (constructed from base URL + path)
- **Base Path:** `/morning-pulse` (from vite.config.ts)
- **Base URL:** `https://kudzimusar.github.io` (from environment)

This strategy ensures:
✅ Social crawlers can fetch images (absolute URLs)
✅ Redirects work in all environments (relative paths)
✅ SEO-friendly canonical URLs (absolute URLs)
✅ Maintainable code (environment-based configuration)
