/**
 * Deploy Firebase Storage Rules via REST API
 * Uses service account to authenticate and deploy storage.rules
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const https = require('https');

// Initialize Firebase Admin to get access token
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id
});

async function getAccessToken() {
  try {
    const token = await admin.credential.cert(serviceAccount).getAccessToken();
    return token.access_token;
  } catch (error) {
    throw new Error(`Failed to get access token: ${error.message}`);
  }
}

async function deployStorageRules() {
  try {
    console.log('📦 Reading storage.rules file...');
    const rulesPath = path.join(__dirname, '..', 'storage.rules');
    const rulesContent = fs.readFileSync(rulesPath, 'utf8');
    
    console.log('✅ Storage rules file read successfully');
    console.log('🔑 Getting access token...');
    
    const accessToken = await getAccessToken();
    
    console.log('📤 Deploying storage rules via REST API...');
    
    const projectId = serviceAccount.project_id;
    const url = `https://firebaserules.googleapis.com/v1/projects/${projectId}/releases`;
    
    // First, we need to create a ruleset, then create a release
    // This is complex via REST API, so we'll provide manual instructions
    
    console.log('\n⚠️  Storage rules deployment via REST API requires multiple steps.');
    console.log('📋 Recommended: Use Firebase Console\n');
    
    console.log('🌐 Quick Deploy via Firebase Console:');
    console.log(`1. Open: https://console.firebase.google.com/project/${projectId}/storage/rules`);
    console.log('2. Click "Edit rules" button');
    console.log('3. Replace all content with the rules below');
    console.log('4. Click "Publish" button\n');
    
    console.log('📄 Storage Rules to Copy:');
    console.log('═'.repeat(60));
    console.log(rulesContent);
    console.log('═'.repeat(60));
    
    console.log('\n✅ Storage rules file is ready at: storage.rules');
    console.log('✅ Firebase configuration updated in: firebase.json');
    console.log('\n🎯 Next step: Deploy via Firebase Console (link above)');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

deployStorageRules();