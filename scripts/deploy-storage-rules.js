/**
 * Deploy Firebase Storage Rules
 * Uses Firebase Admin SDK to deploy storage.rules
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id
});

async function deployStorageRules() {
  try {
    console.log('📦 Reading storage.rules file...');
    const rulesPath = path.join(__dirname, '..', 'storage.rules');
    const rulesContent = fs.readFileSync(rulesPath, 'utf8');
    
    console.log('✅ Storage rules file read successfully');
    console.log('📤 Deploying storage rules to Firebase...');
    
    // Note: Firebase Admin SDK doesn't have a direct method to deploy storage rules
    // We need to use the Firebase Management API or Firebase CLI
    // For now, we'll output instructions
    
    console.log('\n⚠️  Firebase Admin SDK cannot directly deploy storage rules.');
    console.log('📋 Please use one of these methods:\n');
    console.log('Method 1: Firebase Console (Recommended)');
    console.log('1. Go to: https://console.firebase.google.com/project/gen-lang-client-0999441419/storage/rules');
    console.log('2. Click "Edit rules"');
    console.log('3. Copy the contents of storage.rules file');
    console.log('4. Paste and click "Publish"\n');
    
    console.log('Method 2: Firebase CLI (Requires Node.js 20+)');
    console.log('firebase deploy --only storage\n');
    
    console.log('Method 3: REST API');
    console.log('Use the Firebase Management API to update storage rules programmatically\n');
    
    console.log('📄 Storage rules content:');
    console.log('─'.repeat(50));
    console.log(rulesContent);
    console.log('─'.repeat(50));
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

deployStorageRules();