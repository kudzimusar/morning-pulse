# Firestore Diagnostic Script

## Quick Diagnostic (Browser Console)

Copy and paste this entire block into your browser console:

```javascript
(function() {
  console.log('🔍 Morning Pulse Firestore Diagnostic');
  console.log('=====================================\n');
  
  const appId = window.__app_id || 'morning-pulse-app';
  console.log('1️⃣ App ID:', appId, appId === 'morning-pulse-app' ? '✅' : '❌');
  console.log('2️⃣ Firebase Config:', window.__firebase_config ? '✅ Found' : '❌ Missing');
  console.log('3️⃣ Expected Path: artifacts/' + appId + '/public/data');
  console.log('4️⃣ Alignment:', appId === 'morning-pulse-app' ? '✅ ALIGNED' : '❌ MISALIGNED');
  
  if (window.__firebase_config) {
    console.log('   Project ID:', window.__firebase_config.projectId);
  }
  
  console.log('\n✅ Diagnostic complete!');
})();
```

## What to Look For

1. **App ID Check**: Should show `morning-pulse-app` ✅
2. **Firebase Config**: Should show "Found" ✅
3. **Path Alignment**: Should show "ALIGNED" ✅
4. **Project ID**: Should match your Firebase project

## If Issues Found

- **App ID mismatch**: Check `window.__app_id` in your HTML/scripts
- **Config missing**: Ensure `firebase-config.js` is loaded before app initialization
- **Path misaligned**: Update Firestore rules to use dynamic `{appId}` wildcard

## Full Diagnostic Script

For a comprehensive check, load the full diagnostic script:

```html
<script src="/diagnostic-script.js"></script>
```

Or access it at: `https://your-domain.com/diagnostic-script.js`
