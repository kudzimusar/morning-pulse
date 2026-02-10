const functions = require("firebase-functions");
const admin = require("firebase-admin");

/**
 * Scheduled function to aggregate daily statistics
 * Runs every day at midnight
 */
exports.aggregateDailyStats = functions.pubsub
    .schedule('0 0 * * *')
    .timeZone('UTC')
    .onRun(async (context) => {
        const db = admin.firestore();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const dateStr = yesterday.toISOString().split('T')[0];

        try {
            // 1. Get total views for yesterday from daily increments
            const dailyRef = db.doc(`analytics/daily/stats/${dateStr}`);
            const dailySnap = await dailyRef.get();
            const dailyData = dailySnap.exists ? dailySnap.data() : { totalViews: 0 };

            // 2. Aggregate article performance
            // (In a real app, you might query articles that were viewed yesterday)

            // 3. Aggregate subscriber growth
            const subsSnap = await db.collection('subscribers')
                .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(yesterday))
                .get();

            const newSubscribers = subsSnap.size;

            // 4. Update the aggregate document
            await dailyRef.set({
                summary: {
                    views: dailyData.totalViews || 0,
                    newSubscribers,
                    revenue: 0, // Would pull from a revenue collection
                    processedAt: admin.firestore.FieldValue.serverTimestamp()
                }
            }, { merge: true });

            console.log(`✅ Daily stats aggregated for ${dateStr}`);
        } catch (error) {
            console.error(`❌ Error in daily aggregation:`, error);
        }
    });

/**
 * Trigger to update staff metrics whenever an article is published
 */
exports.onArticlePublished = functions.firestore
    .document('artifacts/{appId}/public/data/opinions/{opinionId}')
    .onCreate(async (snap, context) => {
        const data = snap.data();
        if (data.status !== 'published') return;

        const authorUid = data.authorUid || data.authorId;
        if (!authorUid) return;

        const db = admin.firestore();
        const staffRef = db.doc(`analytics/staff/data/${authorUid}`);

        try {
            await staffRef.set({
                articlesPublished: admin.firestore.FieldValue.increment(1),
                lastPublishedAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        } catch (error) {
            console.error(`Error updating staff metrics:`, error);
        }
    });
