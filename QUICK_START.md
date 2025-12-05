# 🚀 Quick Start Guide

## ✅ What's Ready
- All code is complete and ready
- Workflow file updated with Firebase support
- Bot updated to use Firestore news (with fallback)

## 📋 3 Simple Steps to Deploy

### 1. Add Workflow File (5 min)
**File to copy:** `WORKFLOW_FILE_CONTENT.txt`

1. Go to: https://github.com/kudzimusar/morning-pulse
2. Click "Add file" → "Create new file"
3. Path: `.github/workflows/deploy_website.yml`
4. Paste content from `WORKFLOW_FILE_CONTENT.txt`
5. Commit

### 2. Deploy Functions (automatic)
Just push to trigger:
```bash
git add -A
git commit -m "Ready for deployment"
git push origin main
```

Or manually trigger: GitHub → Actions → "Deploy WhatsApp Bot" → Run workflow

### 3. Add Firebase Config (optional, for real-time mode)
1. Get config from Firebase Console → Project Settings → Your apps
2. Add to GitHub Secrets: `FIREBASE_CONFIG` (as JSON string)
3. Website will use real-time mode automatically

## 🎯 That's It!

After Step 2:
- Functions deploy automatically
- Cloud Scheduler sets up automatically  
- Website deploys automatically (after Step 1)

## 📍 Check Status
- Functions: GitHub Actions tab
- News: Firebase Console → Firestore
- Website: https://kudzimusar.github.io/morning-pulse/

