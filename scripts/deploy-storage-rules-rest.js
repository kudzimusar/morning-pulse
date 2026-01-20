/**
 * Deploy Firebase Storage Rules via REST API
 * Uses service account credentials to deploy storage.rules
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const https = require('https');

// Initialize Firebase Admin
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id
});

async function getAccessToken() {
  try {
    const credential = admin.credential.cert(serviceAccount);
    const token = await credential.getAccessToken();
    return token.access_token;
  } catch (error) {
    throw new Error(`Failed to get access token: ${error.message}`);
  }
}

function makeRequest(options, data) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(body));
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${body}`));
        }
      });
    });
    
    req.on('error', reject);
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function deployStorageRules() {
  try {
    console.log('📦 Reading storage.rules file...');
    const rulesPath = path.join(__dirname, '..', 'storage.rules');
    const rulesContent = fs.readFileSync(rulesPath, 'utf8');
    
    console.log('✅ Storage rules file read successfully');
    console.log('🔑 Getting access token...');
    
    const accessToken = await getAccessToken();
    const projectId = serviceAccount.project_id;
    
    console.log('📤 Creating ruleset...');
    
    // Step 1: Create a ruleset
    const createRulesetOptions = {
      hostname: 'firebaserules.googleapis.com',
      path: `/v1/projects/${projectId}/rulesets`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    };
    
    const rulesetData = {
      source: {
        files: [{
          name: 'storage.rules',
          content: rulesContent
        }]
      }
    };
    
    const ruleset = await makeRequest(createRulesetOptions, rulesetData);
    console.log('✅ Ruleset created:', ruleset.name);
    
    // Step 2: Create a release
    console.log('📤 Creating release...');
    const releaseOptions = {
      hostname: 'firebaserules.googleapis.com',
      path: `/v1/projects/${projectId}/releases`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    };
    
    const releaseData = {
      name: `projects/${projectId}/releases/FIREBASE_STORAGE`,
      rulesetName: ruleset.name
    };
    
    const release = await makeRequest(releaseOptions, releaseData);
    console.log('✅ Release created:', release.name);
    
    console.log('\n🎉 Storage rules deployed successfully!');
    console.log('✅ Ruleset:', ruleset.name);
    console.log('✅ Release:', release.name);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error deploying storage rules:', error.message);
    console.error('\n📋 Alternative: Deploy via Firebase Console');
    console.log(`🌐 Go to: https://console.firebase.google.com/project/${serviceAccount.project_id}/storage/rules`);
    console.log('1. Click "Edit rules"');
    console.log('2. Copy contents of storage.rules');
    console.log('3. Paste and click "Publish"');
    process.exit(1);
  }
}

deployStorageRules();