/**
 * Script to inject Firebase config into the built website
 * This creates firebase-config.js in the dist folder for GitHub Pages
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const firebaseConfig = process.env.FIREBASE_CONFIG || process.env.VITE_FIREBASE_CONFIG;

if (!firebaseConfig) {
  console.log('⚠️  No FIREBASE_CONFIG found. Skipping firebase-config.js generation.');
  console.log('   The website will try to use static data or show an error.');
  process.exit(0);
}

try {
  const distDir = path.join(__dirname, '../dist');
  const publicDir = path.join(__dirname, '../public');
  
  // Ensure dist directory exists
  if (!fs.existsSync(distDir)) {
    console.log('⚠️  dist/ directory does not exist. Build may have failed.');
    process.exit(0);
  }
  
  // Parse the config with better error handling
  let configObj;
  try {
    if (typeof firebaseConfig === 'string') {
      // Trim whitespace and remove any quotes that might be wrapping it
      const trimmed = firebaseConfig.trim();
      // Remove surrounding quotes if present
      const cleaned = trimmed.startsWith('"') && trimmed.endsWith('"') 
        ? trimmed.slice(1, -1) 
        : trimmed;
      configObj = JSON.parse(cleaned);
    } else {
      configObj = firebaseConfig;
    }
  } catch (parseError) {
    console.error('❌ Failed to parse FIREBASE_CONFIG as JSON:');
    console.error('   Error:', parseError.message);
    console.error('   Config preview (first 100 chars):', firebaseConfig.substring(0, 100));
    console.error('   Please check that FIREBASE_CONFIG is valid JSON.');
    console.log('   Skipping firebase-config.js generation.');
    process.exit(0); // Don't fail the build, just skip this step
  }
  
  // Validate config has required fields
  if (!configObj || typeof configObj !== 'object') {
    console.error('❌ FIREBASE_CONFIG is not a valid object');
    process.exit(0);
  }
  
  const requiredFields = ['apiKey', 'authDomain', 'projectId'];
  const missingFields = requiredFields.filter(field => !configObj[field]);
  if (missingFields.length > 0) {
    console.error('❌ FIREBASE_CONFIG missing required fields:', missingFields.join(', '));
    process.exit(0);
  }
  
  // Generate the firebase-config.js file
  const configContent = `// Firebase Web Configuration
// Auto-generated during build
window.__firebase_config = ${JSON.stringify(configObj, null, 2)};
`;
  
  // Write to dist (for deployment)
  const distConfigPath = path.join(distDir, 'firebase-config.js');
  fs.writeFileSync(distConfigPath, configContent);
  console.log('✅ Generated firebase-config.js in dist/');
  console.log('   Path:', distConfigPath);
  console.log('   File exists:', fs.existsSync(distConfigPath));
  
  // Verify the file was written correctly
  const writtenContent = fs.readFileSync(distConfigPath, 'utf8');
  if (writtenContent.includes('window.__firebase_config')) {
    console.log('✅ Verified firebase-config.js content is correct');
  } else {
    console.error('❌ firebase-config.js content verification failed');
  }
  
  // Also write to public (for local dev if needed)
  if (fs.existsSync(publicDir)) {
    const publicConfigPath = path.join(publicDir, 'firebase-config.js');
    fs.writeFileSync(publicConfigPath, configContent);
    console.log('✅ Generated firebase-config.js in public/');
  }
  
} catch (error) {
  console.error('❌ Error generating firebase-config.js:', error.message);
  console.error('   Stack:', error.stack);
  // Don't fail the build - just skip this step
  console.log('   Continuing without firebase-config.js...');
  process.exit(0);
}
