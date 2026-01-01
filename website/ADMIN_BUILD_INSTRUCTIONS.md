# Admin Build Instructions

## Overview
The Morning Pulse website has an admin-only "Copy Daily Summary" button that is **hidden from public builds** by default. This document explains how to build and use the admin version.

## 🔒 Public Build (Default)
The public build **does NOT** show the admin button. This is the default behavior.

### Building Public Version
```bash
npm run build
# or explicitly:
npm run build:public
```

The admin button will **NOT** appear in the public build.

## 🔑 Admin Build
The admin build **DOES** show the admin button for copying WhatsApp summaries.

### Option 1: Development Mode (Admin)
For local development with admin features:

1. Create `.env.local` file:
```bash
cd website
cp .env.local.example .env.local
```

2. Edit `.env.local` and set:
```
VITE_ENABLE_ADMIN=true
```

3. Run development server:
```bash
npm run dev:admin
```

The admin button will appear in the bottom-right corner when news data is loaded.

### Option 2: Production Build (Admin)
For production admin build:

```bash
npm run build:admin
```

This creates a production build with admin features enabled.

## 📋 Admin Button Features

When admin mode is enabled, you'll see a green button in the bottom-right corner:
- **Location**: Fixed position, 80px from bottom, 20px from right
- **Text**: "📋 Copy Daily Summary for WhatsApp"
- **Function**: Copies a formatted WhatsApp summary to clipboard
- **Visibility**: Only appears when:
  1. You're on the News page
  2. News data has loaded from Firestore
  3. Admin mode is enabled (VITE_ENABLE_ADMIN=true)

## 🛡️ Security Notes

- The admin button is **completely hidden** in public builds
- No admin code is included in public builds (tree-shaken by Vite)
- Environment variables are replaced at build time
- Public users cannot access admin features even by inspecting code

## 🔍 Verifying Build Type

To check if admin mode is enabled, open browser console and check:
```javascript
console.log(import.meta.env.VITE_ENABLE_ADMIN)
// Public build: undefined or "false"
// Admin build: "true"
```

## 📝 Environment Variables

| Variable | Public Build | Admin Build |
|----------|-------------|-------------|
| `VITE_ENABLE_ADMIN` | `false` (or unset) | `true` |

## 🚀 Deployment

### Public Deployment
```bash
npm run build:public
# Deploy the dist/ folder
```

### Admin Deployment
```bash
npm run build:admin
# Deploy the dist/ folder (admin features enabled)
```

**Important**: Always use `build:public` for public-facing deployments to ensure admin features are hidden.
