
const functions = require("firebase-functions");
const admin = require("firebase-admin");

if (admin.apps.length === 0) {
  admin.initializeApp();
}

const { aggregateDailyStats, onArticlePublished } = require("./analyticsAggregator");

exports.aggregateDailyStats = aggregateDailyStats;
exports.onArticlePublished = onArticlePublished;

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
