# Quick Start: Admin Features

## ✅ Changes Applied

The admin button is now **completely hidden** from public builds and only appears when explicitly enabled.

## 🚀 Quick Commands

### Public Build (Default - No Admin Button)
```bash
npm run build
```
**Result**: Admin button is hidden ✅

### Admin Development (Local Testing)
```bash
# 1. Create .env.local file
echo "VITE_ENABLE_ADMIN=true" > .env.local

# 2. Run dev server
npm run dev:admin
```
**Result**: Admin button appears when news loads ✅

### Admin Production Build
```bash
npm run build:admin
```
**Result**: Admin button appears in production build ✅

## 📍 Where is the Admin Button?

When admin mode is enabled:
- **Location**: Bottom-right corner of the page
- **When visible**: Only on News page + when news data is loaded
- **What it does**: Copies formatted WhatsApp summary to clipboard

## 🔒 Security

- Public builds: Admin code is **completely removed** (tree-shaken)
- No way for public users to access admin features
- Environment variable checked at build time

## ⚠️ Important

**Always use `npm run build` (or `build:public`) for public deployments!**

The default `build` command respects `.env` file which has `VITE_ENABLE_ADMIN=false`.
