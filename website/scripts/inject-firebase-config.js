/**
 * Post-build script to ensure firebase-config.js is in the dist folder
 * This script copies the public/firebase-config.js to dist/ if not already present
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicConfigPath = path.join(__dirname, '..', 'public', 'firebase-config.js');
const distConfigPath = path.join(__dirname, '..', 'dist', 'firebase-config.js');

// Check if the public firebase-config.js exists
if (fs.existsSync(publicConfigPath)) {
  // Copy to dist if dist exists
  const distDir = path.join(__dirname, '..', 'dist');
  if (fs.existsSync(distDir)) {
    fs.copyFileSync(publicConfigPath, distConfigPath);
    console.log('✅ firebase-config.js copied to dist/');
  } else {
    console.log('⚠️ dist/ directory does not exist, skipping copy');
  }
} else {
  console.log('⚠️ public/firebase-config.js not found, skipping copy');
}

console.log('✅ inject-firebase-config.js completed');
