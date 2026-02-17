/**
 * Static Site Generation Script
 * Reads news from Firestore and generates static JSON files for GitHub Pages
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

let configStr = process.env.FIREBASE_ADMIN_CONFIG;

if (configStr && configStr.match(/^[A-Za-z0-9+/]+=*$/)) {
  console.log("✅ Detected Base64-encoded config, decoding...");
  configStr = Buffer.from(configStr, 'base64').toString('utf-8');
  process.env.FIREBASE_ADMIN_CONFIG = configStr;
}

// Initialize Firebase Admin
// Handle base64-encoded config or plain JSON
let serviceAccount = {};
try {
  const configStr = process.env.FIREBASE_ADMIN_CONFIG || '{}';
  // Try to decode as base64 first, then parse as JSON
  let decoded = configStr;
  try {
    // Check if it's base64 encoded (starts with common base64 chars and no {)
    if (!configStr.trim().startsWith('{') && !configStr.trim().startsWith('***')) {
      decoded = Buffer.from(configStr, 'base64').toString('utf-8');
    }
  } catch (e) {
    // Not base64, use as-is
    decoded = configStr;
  }
  // Remove any leading *** characters
  decoded = decoded.replace(/^\*\*\*+/, '').trim();
  serviceAccount = JSON.parse(decoded);
} catch (error) {
  console.error('Failed to parse FIREBASE_ADMIN_CONFIG:', error.message);
  console.error('Config starts with:', process.env.FIREBASE_ADMIN_CONFIG?.substring(0, 50));
  serviceAccount = {};
}
const APP_ID = process.env.APP_ID || 'morning-pulse-app';

if (Object.keys(serviceAccount).length === 0) {
  console.error('FIREBASE_ADMIN_CONFIG environment variable is required');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

/**
 * Generate static JSON file for today's news
 */
/**
 * Generate static JSON file for today's news
 */
async function generateStaticNews() {
  try {
    const today = new Date().toISOString().split('T')[0];
    // 🔧 FIX: Use correct Firestore path structure
    const newsPath = `news/v2/${APP_ID}/daily/dates/${today}`;
    const newsRef = db.doc(newsPath);
    
    console.log(`📡 Fetching news from Firestore: ${newsPath}`);
    const snapshot = await newsRef.get();
    
    if (!snapshot.exists) {
      console.log(`⚠️  No news data found for ${today}`);
      console.log('ℹ️  This is normal if news aggregator hasn\'t run yet today');
      
      // Try to get the most recent news from the last 7 days
      console.log('🔍 Searching for recent news from the past 7 days...');
      for (let daysAgo = 1; daysAgo <= 7; daysAgo++) {
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - daysAgo);
        const dateStr = pastDate.toISOString().split('T')[0];
        // 🔧 FIX: Use correct Firestore path structure
        const pastNewsPath = `news/v2/${APP_ID}/daily/dates/${dateStr}`;
        const pastNewsRef = db.doc(pastNewsPath);
        const pastSnapshot = await pastNewsRef.get();
        
        if (pastSnapshot.exists) {
          console.log(`✅ Found news from ${dateStr} (${daysAgo} days ago)`);
          const data = pastSnapshot.data();
          return await writeNewsFiles(data, dateStr, today);
        }
      }
      
      console.log('❌ No recent news found in the past 7 days');
      return null;
    }
    
    const data = snapshot.data();
    return await writeNewsFiles(data, today, today);
  } catch (error) {
    console.error('❌ Error generating static news:', error);
    throw error;
  }
}

/**
 * Write news data to static JSON files
 */
async function writeNewsFiles(data, originalDate, filenameDate) {
  const categories = data.categories || {};
  
  // Create output directory in website/public/data (will be copied to dist during build)
  const outputDir = path.join(__dirname, '../website/public/data');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log(`📁 Created output directory: ${outputDir}`);
  }
  
  // Write JSON file with today's date in filename
  const outputFile = path.join(outputDir, `news-${filenameDate}.json`);
  const jsonData = {
    date: originalDate,
    generatedAt: new Date().toISOString(),
    timestamp: data.timestamp || Date.now(),
    categories: categories
  };
  
  fs.writeFileSync(outputFile, JSON.stringify(jsonData, null, 2));
  console.log(`✅ Generated static news file: ${outputFile}`);
  console.log(`   Categories: ${Object.keys(categories).length}`);
  console.log(`   Articles: ${Object.values(categories).flat().length}`);
  
  // Also create a latest.json file
  const latestFile = path.join(outputDir, 'news-latest.json');
  fs.writeFileSync(latestFile, JSON.stringify(jsonData, null, 2));
  console.log(`✅ Created latest news file: ${latestFile}`);
  
  return jsonData;
}

/**
 * Generate static opinions data
 */
async function generateStaticOpinions() {
  try {
    console.log('📡 Fetching published opinions from Firestore...');
    const opinionsPath = `artifacts/${APP_ID}/public/data/opinions`;
    const opinionsRef = db.collection(opinionsPath);
    
    // Get only published opinions
    const snapshot = await opinionsRef
      .where('status', '==', 'published')
      .orderBy('publishedAt', 'desc')
      .limit(50) // Get last 50 published opinions
      .get();
    
    if (snapshot.empty) {
      console.log('⚠️  No published opinions found');
      return null;
    }
    
    const opinions = [];
    snapshot.forEach(doc => {
      opinions.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    console.log(`✅ Found ${opinions.length} published opinions`);
    
    // Create output directory
    const outputDir = path.join(__dirname, '../website/public/data');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Write opinions JSON file
    const outputFile = path.join(outputDir, 'opinions.json');
    const jsonData = {
      generatedAt: new Date().toISOString(),
      count: opinions.length,
      opinions: opinions
    };
    
    fs.writeFileSync(outputFile, JSON.stringify(jsonData, null, 2));
    console.log(`✅ Generated static opinions file: ${outputFile}`);
    
    return jsonData;
  } catch (error) {
    console.error('❌ Error generating static opinions:', error);
    // Don't throw - opinions are optional
    return null;
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    console.log('🚀 Starting static site generation...');
    console.log('📅 Date:', new Date().toISOString());
    console.log('🏢 App ID:', APP_ID);
    console.log('');
    
    // Generate news data
    const newsData = await generateStaticNews();
    
    // Generate opinions data
    const opinionsData = await generateStaticOpinions();
    
    console.log('');
    console.log('✅ Static site generation complete');
    console.log('📊 Summary:');
    console.log(`   News: ${newsData ? 'Generated' : 'Not available'}`);
    console.log(`   Opinions: ${opinionsData ? `${opinionsData.count} published` : 'Not available'}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Static site generation failed:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

main();
