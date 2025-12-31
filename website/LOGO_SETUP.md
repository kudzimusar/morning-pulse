# How to Add Your Official Logos to Morning Pulse

## Step 1: Prepare Your Logo Files

Place your logo files in the `website/public/` directory. Recommended formats:
- **Logo (PNG/SVG)**: `logo.svg` or `logo.png` (for the header)
- **Favicon**: `favicon.ico` or `favicon.svg` (for browser tab)
- **Icon versions**: `logo-icon.svg` (if you have a compact version)

## Step 2: File Structure

Your logos should be in:
```
website/
  public/
    logo.svg (or logo.png)
    favicon.ico (or favicon.svg)
    logo-icon.svg (optional, for compact display)
```

## Step 3: Update index.html

The favicon link is already set up in `index.html`. Just make sure your favicon file is named correctly:
- `favicon.ico` or `favicon.svg` in the `public/` folder
- It will automatically be served at `/favicon.ico` or `/favicon.svg`

## Step 4: Update Header Component

If you have a logo image, update `website/src/components/Header.tsx`:

1. **Option A: Use an `<img>` tag** (for PNG/JPG):
```tsx
<img 
  src="/morning-pulse/logo.png" 
  alt="Morning Pulse" 
  className="header-logo"
  onClick={() => handleCategoryClick(null)}
/>
```

2. **Option B: Use inline SVG** (recommended for SVG):
- Copy your SVG code directly into the component
- Or import it if using a build tool that supports it

## Step 5: After Adding Logos

1. The logos in `public/` will be automatically copied to `dist/` during build
2. They'll be accessible at `/morning-pulse/logo.svg` (or your filename)
3. The header component will display your logo instead of text

## Current Implementation

Currently, the header uses a text-based logo with the font "Playfair Display". Once you add your logo files to `public/`, you can update the Header component to use them.

## Notes

- SVG format is recommended for scalability
- Keep file sizes small for fast loading
- For favicon, you can use a favicon generator to create multiple sizes (16x16, 32x32, etc.)
