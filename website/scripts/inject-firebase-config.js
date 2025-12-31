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
    fs.mkdirSync(distDir, { recursive: true });
  }
  
  // Parse the config
  let configObj;
  if (typeof firebaseConfig === 'string') {
    configObj = JSON.parse(firebaseConfig);
  } else {
    configObj = firebaseConfig;
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
  
  // Also write to public (for local dev if needed)
  if (fs.existsSync(publicDir)) {
    const publicConfigPath = path.join(publicDir, 'firebase-config.js');
    fs.writeFileSync(publicConfigPath, configContent);
    console.log('✅ Generated firebase-config.js in public/');
  }
  
} catch (error) {
  console.error('❌ Error generating firebase-config.js:', error.message);
  process.exit(1);
}
