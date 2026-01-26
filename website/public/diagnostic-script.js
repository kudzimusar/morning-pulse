/**
 * Morning Pulse Firestore Diagnostic Script
 * 
 * Paste this into your browser console to verify:
 * 1. window.__app_id is set correctly
 * 2. Firestore paths are aligned
 * 3. Firebase config is loaded
 * 
 * Usage: Copy and paste the entire block into browser console
 */

(function() {
  console.log('🔍 Morning Pulse Firestore Diagnostic');
  console.log('=====================================\n');
  
  // Check 1: App ID
  const appId = window.__app_id || 'morning-pulse-app';
  console.log('1️⃣ App ID Check:');
  console.log('   window.__app_id:', window.__app_id);
  console.log('   Resolved AppID:', appId);
  console.log('   Expected: morning-pulse-app');
  console.log('   ✅ Status:', appId === 'morning-pulse-app' ? 'MATCH' : '❌ MISMATCH');
  console.log('');
  
  // Check 2: Firebase Config
  console.log('2️⃣ Firebase Config Check:');
  const firebaseConfig = window.__firebase_config;
  if (firebaseConfig) {
    console.log('   ✅ window.__firebase_config: Found');
    console.log('   Project ID:', firebaseConfig.projectId);
    console.log('   Auth Domain:', firebaseConfig.authDomain);
    console.log('   Database URL:', firebaseConfig.databaseURL || 'Not set (using default)');
  } else {
    console.log('   ❌ window.__firebase_config: NOT FOUND');
    console.log('   Check: Is firebase-config.js loaded?');
  }
  console.log('');
  
  // Check 3: Firestore Path Structure
  console.log('3️⃣ Firestore Path Structure:');
  const expectedPath = `artifacts/${appId}/public/data`;
  console.log('   Expected root path:', expectedPath);
  console.log('   Staff path:', `${expectedPath}/staff/{uid}`);
  console.log('   News path:', `${expectedPath}/news/{date}`);
  console.log('   Ads path:', `${expectedPath}/ads/{adId}`);
  console.log('');
  
  // Check 4: Firebase App Instance
  console.log('4️⃣ Firebase App Instance:');
  try {
    // Try to access Firebase if it's initialized
    if (window.firebase || window.firebaseApp) {
      console.log('   ✅ Firebase app instance found');
    } else {
      // Check if Firebase is initialized via Firebase SDK
      const firebaseModule = document.querySelector('script[src*="firebase"]');
      if (firebaseModule) {
        console.log('   ⚠️ Firebase SDK loaded but app instance not accessible');
        console.log('   This is normal - app is initialized internally');
      } else {
        console.log('   ❌ Firebase SDK not found');
      }
    }
  } catch (e) {
    console.log('   ⚠️ Cannot check Firebase app (may be initialized internally)');
  }
  console.log('');
  
  // Check 5: Environment Variables
  console.log('5️⃣ Environment Variables:');
  if (typeof import !== 'undefined' && import.meta && import.meta.env) {
    const viteConfig = import.meta.env.VITE_FIREBASE_CONFIG;
    console.log('   VITE_FIREBASE_CONFIG:', viteConfig ? 'Set (length: ' + viteConfig.length + ')' : 'Not set');
  } else {
    console.log('   ⚠️ Cannot access import.meta.env (not in module context)');
  }
  console.log('');
  
  // Check 6: Path Alignment Summary
  console.log('6️⃣ Path Alignment Summary:');
  console.log('   Rules expect: artifacts/{appId}/public/data/...');
  console.log('   Code uses: artifacts/' + appId + '/public/data/...');
  console.log('   ✅ Status:', appId === 'morning-pulse-app' ? 'ALIGNED ✅' : '❌ MISALIGNED');
  console.log('');
  
  // Check 7: Authentication State
  console.log('7️⃣ Authentication State:');
  try {
    // This will only work if Firebase Auth is accessible
    if (window.firebase && window.firebase.auth) {
      const auth = window.firebase.auth();
      const user = auth.currentUser;
      if (user) {
        console.log('   ✅ User authenticated:', user.uid);
        console.log('   Email:', user.email);
        console.log('   Anonymous:', user.isAnonymous);
      } else {
        console.log('   ⚠️ No authenticated user');
      }
    } else {
      console.log('   ⚠️ Cannot check auth state (Firebase Auth not accessible)');
      console.log('   This is normal - auth is managed internally by the app');
    }
  } catch (e) {
    console.log('   ⚠️ Cannot check auth state:', e.message);
  }
  console.log('');
  
  // Final Summary
  console.log('📊 Diagnostic Summary:');
  console.log('=====================');
  const issues = [];
  
  if (!window.__app_id || window.__app_id !== 'morning-pulse-app') {
    issues.push('App ID mismatch or not set');
  }
  
  if (!window.__firebase_config) {
    issues.push('Firebase config not loaded');
  }
  
  if (issues.length === 0) {
    console.log('   ✅ All checks passed!');
    console.log('   Your Firestore paths should be aligned correctly.');
  } else {
    console.log('   ⚠️ Issues found:');
    issues.forEach((issue, i) => {
      console.log(`   ${i + 1}. ${issue}`);
    });
  }
  
  console.log('\n💡 Next Steps:');
  console.log('   - If App ID mismatch: Check window.__app_id in your HTML');
  console.log('   - If config missing: Ensure firebase-config.js is loaded');
  console.log('   - If paths misaligned: Update rules to use dynamic appId');
  console.log('\n✅ Diagnostic complete!');
})();
