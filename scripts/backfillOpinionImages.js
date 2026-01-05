/**
 * Backfill script: add imageUrl to existing opinion docs that don't have one.
 *
 * Usage:
 *   FIREBASE_ADMIN_CONFIG='...' APP_ID='morning-pulse-app' node scripts/backfillOpinionImages.js
 *
 * Notes:
 * - Uses the same FIREBASE_ADMIN_CONFIG parsing approach as scripts/generateStaticSite.js
 * - Updates collection path: artifacts/{APP_ID}/public/data/opinions
 */
const admin = require('firebase-admin');

// --- Firebase Admin init (mirrors scripts/generateStaticSite.js) ---
let serviceAccount = {};
try {
  const configStr = process.env.FIREBASE_ADMIN_CONFIG || '{}';
  let decoded = configStr;
  try {
    if (!configStr.trim().startsWith('{') && !configStr.trim().startsWith('***')) {
      decoded = Buffer.from(configStr, 'base64').toString('utf-8');
    }
  } catch (e) {
    decoded = configStr;
  }
  decoded = decoded.replace(/^\*\*\*+/, '').trim();
  serviceAccount = JSON.parse(decoded);
} catch (error) {
  console.error('Failed to parse FIREBASE_ADMIN_CONFIG:', error.message);
  serviceAccount = {};
}

const APP_ID = process.env.APP_ID || 'morning-pulse-app';

if (Object.keys(serviceAccount).length === 0) {
  console.error('FIREBASE_ADMIN_CONFIG environment variable is required');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

function getImageByTopic(headline, id) {
  const lower = String(headline || '').toLowerCase();
  let searchTerm = 'news,journalism';

  if (lower.includes('tech') || lower.includes('ai') || lower.includes('artificial') || lower.includes('digital')) {
    searchTerm = 'technology,computer,digital';
  } else if (lower.includes('polit') || lower.includes('government') || lower.includes('election')) {
    searchTerm = 'government,politics,democracy';
  } else if (lower.includes('econom') || lower.includes('business') || lower.includes('finance') || lower.includes('market')) {
    searchTerm = 'business,finance,economy';
  } else if (lower.includes('climate') || lower.includes('environment') || lower.includes('energy')) {
    searchTerm = 'nature,environment,climate';
  } else if (lower.includes('health') || lower.includes('medical') || lower.includes('pandemic')) {
    searchTerm = 'health,medical,science';
  } else if (lower.includes('educat') || lower.includes('school') || lower.includes('university')) {
    searchTerm = 'education,learning,student';
  } else if (lower.includes('sport') || lower.includes('game') || lower.includes('athlete')) {
    searchTerm = 'sports,competition,athlete';
  }

  const sig = id ? `&sig=${encodeURIComponent(String(id))}` : '';
  return `https://source.unsplash.com/1200x800/?${searchTerm}${sig}`;
}

async function backfillImages() {
  const opinionsRef = db
    .collection('artifacts')
    .doc(APP_ID)
    .collection('public')
    .doc('data')
    .collection('opinions');

  const snapshot = await opinionsRef.get();
  let updated = 0;
  let scanned = 0;

  for (const docSnap of snapshot.docs) {
    scanned += 1;
    const opinion = docSnap.data() || {};
    const existingUrl = typeof opinion.imageUrl === 'string' ? opinion.imageUrl : '';
    const hasValidUrl = /^https?:\/\//i.test(existingUrl);

    if (!hasValidUrl) {
      const imageUrl = getImageByTopic(opinion.headline || '', docSnap.id);
      await docSnap.ref.set(
        {
          imageUrl,
          imageGeneratedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      console.log(`✅ Updated opinion ${docSnap.id}: ${(opinion.headline || '').slice(0, 80)}`);
      updated += 1;
    }
  }

  console.log(`\n🎉 Scanned ${scanned} opinions. Updated ${updated} missing/invalid imageUrl fields.`);
}

backfillImages()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Backfill failed:', err);
    process.exit(1);
  });

