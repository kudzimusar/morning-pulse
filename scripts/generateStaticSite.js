/**
 * Static Site Generation Script
 * Reads news from Firestore and generates static JSON files for GitHub Pages
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_CONFIG || '{}');
const APP_ID = process.env.APP_ID || 'default-app-id';

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
async function generateStaticNews() {
  try {
    const today = new Date().toISOString().split('T')[0];
    const newsPath = `artifacts/${APP_ID}/public/data/news/${today}`;
    const newsRef = db.doc(newsPath);
    
    const snapshot = await newsRef.get();
    
    if (!snapshot.exists) {
      console.log(`No news data found for ${today}`);
      return null;
    }
    
    const data = snapshot.data();
    const categories = data.categories || {};
    
    // Create output directory
    const outputDir = path.join(__dirname, '../website/dist/data');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Write JSON file
    const outputFile = path.join(outputDir, `news-${today}.json`);
    const jsonData = {
      date: today,
      timestamp: data.timestamp || Date.now(),
      categories: categories
    };
    
    fs.writeFileSync(outputFile, JSON.stringify(jsonData, null, 2));
    console.log(`✅ Generated static news file: ${outputFile}`);
    
    // Also create a latest.json symlink/file
    const latestFile = path.join(outputDir, 'news-latest.json');
    fs.writeFileSync(latestFile, JSON.stringify(jsonData, null, 2));
    console.log(`✅ Created latest news file: ${latestFile}`);
    
    return jsonData;
  } catch (error) {
    console.error('Error generating static news:', error);
    throw error;
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    console.log('Starting static site generation...');
    await generateStaticNews();
    console.log('✅ Static site generation complete');
    process.exit(0);
  } catch (error) {
    console.error('❌ Static site generation failed:', error);
    process.exit(1);
  }
}

main();

