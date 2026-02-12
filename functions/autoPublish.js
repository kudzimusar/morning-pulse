/**
 * Auto-Publish Scheduled Stories
 * Automatically publishes articles when their scheduled time arrives
 * 
 * Entry point: autoPublishScheduledStories
 * 
 * Triggered by: Cloud Scheduler (every 5 minutes)
 */

const admin = require('firebase-admin');
const APP_ID = process.env.APP_ID || 'morning-pulse-app';

/**
 * Initialize Firebase if needed
 */
function initFirebase() {
  if (admin.apps.length === 0) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_CONFIG);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  }
}

/**
 * Auto-Publish Scheduled Stories Function
 * Finds articles scheduled for publication and publishes them
 * POST /autoPublishScheduledStories
 */
exports.autoPublishScheduledStories = async (req, res) => {
  // Enable CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }
  
  try {
    console.log('🕐 Auto-publisher running...');
    
    initFirebase();
    const db = admin.firestore();
    
    const now = admin.firestore.Timestamp.now();
    
    // Find articles that are:
    // 1. Not yet published (isPublished = false)
    // 2. Have a schedulePublishAt time that is <= now
    const snapshot = await db
      .collection(`artifacts/${APP_ID}/public/data/opinions`)
      .where('isPublished', '==', false)
      .where('schedulePublishAt', '<=', now)
      .get();
    
    if (snapshot.empty) {
      console.log('✅ No articles ready for auto-publishing');
      res.status(200).json({
        success: true,
        message: 'No articles to publish',
        publishedCount: 0
      });
      return;
    }
    
    console.log(`📝 Found ${snapshot.size} articles ready to publish`);
    
    // Publish articles
    const batch = db.batch();
    const publishedArticles = [];
    
    snapshot.forEach(doc => {
      const data = doc.data();
      
      // Update article to published
      batch.update(doc.ref, {
        isPublished: true,
        publishedAt: admin.firestore.FieldValue.serverTimestamp(),
        autoPublished: true,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      publishedArticles.push({
        id: doc.id,
        headline: data.headline,
        author: data.authorName,
        scheduledFor: data.schedulePublishAt?.toDate().toISOString()
      });
      
      console.log(`✅ Publishing: ${data.headline}`);
    });
    
    // Commit batch
    await batch.commit();
    
    // Log auto-publish event
    await db.collection('auto_publish_logs').add({
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      publishedCount: publishedArticles.length,
      articles: publishedArticles
    });
    
    console.log(`✅ Auto-published ${publishedArticles.length} articles`);
    
    res.status(200).json({
      success: true,
      message: `Successfully published ${publishedArticles.length} articles`,
      publishedCount: publishedArticles.length,
      articles: publishedArticles
    });
  } catch (error) {
    console.error('❌ Error in auto-publisher:', error);
    res.status(500).json({
      error: 'Failed to auto-publish articles',
      message: error.message
    });
  }
};
