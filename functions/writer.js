/**
 * Writer Management Functions
 * Handles writer metrics and payment statements
 * 
 * Entry points:
 * - computeWriterMetrics
 * - generateWriterStatements
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
 * Compute Writer Metrics Function
 * Calculates performance metrics for writers
 * POST /computeWriterMetrics
 * Body: { writerId?, startDate?, endDate? }
 */
exports.computeWriterMetrics = async (req, res) => {
  // Enable CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }
  
  try {
    initFirebase();
    const db = admin.firestore();
    
    const { writerId, startDate, endDate } = req.body || req.query;
    
    console.log('📊 Computing writer metrics...');
    
    // Build query
    let query = db.collection(`artifacts/${APP_ID}/public/data/opinions`)
      .where('isPublished', '==', true);
    
    // Filter by writer if specified
    if (writerId) {
      query = query.where('authorUid', '==', writerId);
    }
    
    // Filter by date range if specified
    if (startDate) {
      const start = admin.firestore.Timestamp.fromDate(new Date(startDate));
      query = query.where('publishedAt', '>=', start);
    }
    
    if (endDate) {
      const end = admin.firestore.Timestamp.fromDate(new Date(endDate));
      query = query.where('publishedAt', '<=', end);
    }
    
    const snapshot = await query.get();
    
    // Aggregate metrics by writer
    const writerMetrics = {};
    
    snapshot.forEach(doc => {
      const data = doc.data();
      const authorUid = data.authorUid || 'unknown';
      const authorName = data.authorName || 'Unknown Writer';
      
      if (!writerMetrics[authorUid]) {
        writerMetrics[authorUid] = {
          authorUid,
          authorName,
          articlesPublished: 0,
          totalViews: 0,
          averageViews: 0,
          categories: {},
          articles: []
        };
      }
      
      writerMetrics[authorUid].articlesPublished++;
      writerMetrics[authorUid].totalViews += data.views || 0;
      
      // Track categories
      const category = data.category || 'Uncategorized';
      writerMetrics[authorUid].categories[category] = 
        (writerMetrics[authorUid].categories[category] || 0) + 1;
      
      // Add article details
      writerMetrics[authorUid].articles.push({
        id: doc.id,
        headline: data.headline,
        publishedAt: data.publishedAt,
        views: data.views || 0,
        category
      });
    });
    
    // Calculate averages
    Object.values(writerMetrics).forEach(metrics => {
      metrics.averageViews = metrics.articlesPublished > 0
        ? Math.round(metrics.totalViews / metrics.articlesPublished)
        : 0;
    });
    
    console.log(`✅ Computed metrics for ${Object.keys(writerMetrics).length} writers`);
    
    res.status(200).json({
      success: true,
      totalWriters: Object.keys(writerMetrics).length,
      totalArticles: snapshot.size,
      metrics: Object.values(writerMetrics)
    });
  } catch (error) {
    console.error('❌ Error computing writer metrics:', error);
    res.status(500).json({
      error: 'Failed to compute writer metrics',
      message: error.message
    });
  }
};

/**
 * Generate Writer Statements Function
 * Generates payment/performance statements for writers
 * POST /generateWriterStatements
 * Body: { writerId?, month?, year? }
 */
exports.generateWriterStatements = async (req, res) => {
  // Enable CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }
  
  try {
    initFirebase();
    const db = admin.firestore();
    
    const { writerId, month, year } = req.body || req.query;
    
    // Default to current month/year if not specified
    const now = new Date();
    const targetMonth = month ? parseInt(month) : now.getMonth();
    const targetYear = year ? parseInt(year) : now.getFullYear();
    
    console.log(`📄 Generating statements for ${targetMonth + 1}/${targetYear}`);
    
    // Calculate date range for the month
    const startDate = new Date(targetYear, targetMonth, 1);
    const endDate = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59);
    
    // Build query
    let query = db.collection(`artifacts/${APP_ID}/public/data/opinions`)
      .where('isPublished', '==', true)
      .where('publishedAt', '>=', admin.firestore.Timestamp.fromDate(startDate))
      .where('publishedAt', '<=', admin.firestore.Timestamp.fromDate(endDate));
    
    if (writerId) {
      query = query.where('authorUid', '==', writerId);
    }
    
    const snapshot = await query.get();
    
    // Aggregate by writer
    const statements = {};
    const RATE_PER_ARTICLE = 10; // $10 per article (configurable)
    
    snapshot.forEach(doc => {
      const data = doc.data();
      const authorUid = data.authorUid || 'unknown';
      const authorName = data.authorName || 'Unknown Writer';
      
      if (!statements[authorUid]) {
        statements[authorUid] = {
          authorUid,
          authorName,
          month: targetMonth + 1,
          year: targetYear,
          period: `${targetMonth + 1}/${targetYear}`,
          articlesPublished: 0,
          totalEarnings: 0,
          ratePerArticle: RATE_PER_ARTICLE,
          articles: []
        };
      }
      
      statements[authorUid].articlesPublished++;
      statements[authorUid].totalEarnings += RATE_PER_ARTICLE;
      
      statements[authorUid].articles.push({
        id: doc.id,
        headline: data.headline,
        publishedAt: data.publishedAt?.toDate().toISOString(),
        category: data.category,
        views: data.views || 0,
        payment: RATE_PER_ARTICLE
      });
    });
    
    // Store statements in Firestore
    const batch = db.batch();
    const statementsCollection = db.collection('writer_statements');
    
    Object.values(statements).forEach(statement => {
      const docRef = statementsCollection.doc(
        `${statement.authorUid}_${targetYear}_${targetMonth + 1}`
      );
      batch.set(docRef, {
        ...statement,
        generatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });
    
    await batch.commit();
    
    console.log(`✅ Generated ${Object.keys(statements).length} writer statements`);
    
    res.status(200).json({
      success: true,
      totalWriters: Object.keys(statements).length,
      totalArticles: snapshot.size,
      period: `${targetMonth + 1}/${targetYear}`,
      statements: Object.values(statements)
    });
  } catch (error) {
    console.error('❌ Error generating writer statements:', error);
    res.status(500).json({
      error: 'Failed to generate writer statements',
      message: error.message
    });
  }
};
