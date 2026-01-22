# Share Pages Setup Guide

## Default OG Image

The share page generator requires a default fallback image for stories that don't have images.

### Image Requirements
- **Format**: JPG or PNG
- **Dimensions**: 1200x630 pixels (recommended for OG tags)
- **File Size**: < 1MB (optimized for fast loading)
- **Location**: `website/public/default-og-image.jpg`

### Setup Steps

1. **Create or obtain a default image**:
   - Use your logo, brand image, or a generic news image
   - Recommended: 1200x630px with your branding
   - Optimize the image (use tools like TinyPNG or ImageOptim)

2. **Place the image**:
   ```bash
   # Copy your image to the public directory
   cp your-default-image.jpg website/public/default-og-image.jpg
   ```

3. **Verify it's included in build**:
   - The image will be copied to `dist/default-og-image.jpg` during build
   - Accessible at: `https://kudzimusar.github.io/morning-pulse/default-og-image.jpg`

### Image Path Resolution

The generator script resolves images in this priority:
1. `finalImageUrl` (Firebase Storage - absolute URL)
2. `suggestedImageUrl` (Firebase Storage - absolute URL)
3. `imageUrl` (Firebase Storage - absolute URL)
4. Default fallback: `https://kudzimusar.github.io/morning-pulse/default-og-image.jpg`

## Testing

After adding the default image, test locally:

```bash
cd website
npm run build
ls -lh dist/default-og-image.jpg  # Should exist
```

## Notes

- If the default image is missing, OG tags will still work but show a broken image
- The generator script will continue even if the default image is missing (won't crash build)
- Consider using a CDN or Firebase Storage URL for the default image for better performance
