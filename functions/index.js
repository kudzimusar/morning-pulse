/**
 * Morning Pulse - Cloud Functions Index
 * Central export file for all Cloud Functions
 */

const functions = require("firebase-functions");
const admin = require("firebase-admin");

// Initialize Firebase Admin (only once)
if (admin.apps.length === 0) {
  admin.initializeApp();
}

// ============================================
// ANALYTICS FUNCTIONS (Firestore Triggers)
// ============================================
const { aggregateDailyStats, onArticlePublished } = require("./analyticsAggregator");
exports.aggregateDailyStats = aggregateDailyStats;
exports.onArticlePublished = onArticlePublished;

// ============================================
// STAFF MANAGEMENT (Firestore Trigger)
// ============================================
exports.setRoleOnStaffChange = functions.firestore
  .document('staff/{staffId}')
  .onWrite(async (change, context) => {
    const staffId = context.params.staffId;
    const newData = change.after.exists ? change.after.data() : null;
    const oldData = change.before.exists ? change.before.data() : null;

    // If data is the same, do nothing to prevent infinite loops.
    if (JSON.stringify(newData) === JSON.stringify(oldData)) {
      console.log(`No change detected for staff ${staffId}. Exiting function.`);
      return;
    }

    // If the document is deleted or the user has no role, remove all custom claims.
    if (!newData || !newData.role) {
      try {
        await admin.auth().setCustomUserClaims(staffId, null);
        console.log(`Custom claims removed for user ${staffId}.`);
      } catch (error) {
        console.error(`Error removing custom claims for ${staffId}:`, error);
      }
      return;
    }

    // Set the new role as a custom claim.
    const role = newData.role;
    const claims = { [role]: true };

    try {
      await admin.auth().setCustomUserClaims(staffId, claims);
      console.log(`Custom claim set for ${staffId}: ${JSON.stringify(claims)}`);
    } catch (error) {
      console.error(`Error setting custom claim for ${staffId}:`, error);
    }
  });

// ============================================
// WHATSAPP BOT (HTTP Function)
// ============================================
const { webhook } = require('./webhook');
exports.webhook = webhook;

// ============================================
// NEWS AGGREGATION (HTTP Function)
// ============================================
const { newsAggregator } = require('./newsAggregator');
exports.newsAggregator = newsAggregator;

// ============================================
// AI PROXY (HTTP Function)
// ============================================
const { askPulseAIProxy } = require('./askPulseAIProxy');
exports.askPulseAIProxy = askPulseAIProxy;

// ============================================
// UNSPLASH IMAGE PROXY (HTTP Function)
// ============================================
const { unsplashImage } = require('./unsplashProxy');
exports.unsplashImage = unsplashImage;

// ============================================
// NEWSLETTER FUNCTIONS (HTTP Functions)
// ============================================
const { 
  sendNewsletter, 
  manageSubscription, 
  sendScheduledNewsletter 
} = require('./newsletter');

exports.sendNewsletter = sendNewsletter;
exports.manageSubscription = manageSubscription;
exports.sendScheduledNewsletter = sendScheduledNewsletter;

// ============================================
// WRITER MANAGEMENT FUNCTIONS (HTTP Functions)
// ============================================
const { 
  computeWriterMetrics, 
  generateWriterStatements 
} = require('./writer');

exports.computeWriterMetrics = computeWriterMetrics;
exports.generateWriterStatements = generateWriterStatements;

// ============================================
// AUTO-PUBLISH FUNCTION (HTTP Function)
// ============================================
const { autoPublishScheduledStories } = require('./autoPublish');
exports.autoPublishScheduledStories = autoPublishScheduledStories;

console.log('✅ All Cloud Functions exported successfully');
