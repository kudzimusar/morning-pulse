/**
 * Newsletter Management Functions
 * Handles newsletter sending and subscription management
 * 
 * Entry points:
 * - sendNewsletter
 * - manageSubscription
 * - sendScheduledNewsletter
 */

const admin = require('firebase-admin');
const { generateNewsletterHTML } = require('./newsletterTemplates');
const cors = require('cors');

// CORS Handler
const corsHandler = cors({ origin: true });

// Brevo (SendinBlue) API
const BREVO_API_KEY = process.env.MORNING_PULSE_BREVO;
const FROM_EMAIL = process.env.NEWSLETTER_FROM_EMAIL || 'news@morningpulse.zw';
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
 * Send email via Brevo API
 */
async function sendEmailViaBrevo(to, subject, htmlContent) {
  const fetch = (await import('node-fetch')).default;

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': BREVO_API_KEY,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        sender: {
          name: 'Morning Pulse',
          email: FROM_EMAIL
        },
        to: [{ email: to }],
        subject: subject,
        htmlContent: htmlContent
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Brevo API Error (${response.status}):`, errorText);
      throw new Error(`Brevo API error: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    console.log(`✅ Email sent to ${to}:`, result.messageId);
    return result;
  } catch (error) {
    console.error(`❌ Error sending email to ${to}:`, error.message);
    throw error;
  }
}

/**
 * Fetch published opinions/editorials for newsletter
 */
async function fetchPublishedOpinions(limit = 5) {
  try {
    initFirebase();
    const db = admin.firestore();

    const snapshot = await db
      .collection(`artifacts/${APP_ID}/public/data/opinions`)
      .where('isPublished', '==', true)
      .orderBy('publishedAt', 'desc')
      .limit(limit)
      .get();

    const opinions = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      opinions.push({
        id: doc.id,
        headline: data.headline || 'Untitled',
        subHeadline: data.subHeadline || '',
        authorName: data.authorName || 'Editorial Team',
        authorTitle: data.authorTitle || '',
        category: data.category || 'Opinion',
        imageUrl: data.imageUrl || null,
        slug: data.slug || doc.id,
        publishedAt: data.publishedAt
      });
    });

    return opinions;
  } catch (error) {
    console.error('❌ Error fetching opinions:', error);
    return [];
  }
}

/**
 * Send Newsletter Function
 * POST /sendNewsletter
 * Body: { email, type }
 */
exports.sendNewsletter = async (req, res) => {
  return corsHandler(req, res, async () => {

    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    try {
      const { email, type = 'weekly' } = req.body;

      if (!email) {
        res.status(400).json({ error: 'Email is required' });
        return;
      }

      console.log(`📧 Sending ${type} newsletter to ${email}`);

      // Fetch latest published opinions
      const articles = await fetchPublishedOpinions(10);

      if (articles.length === 0) {
        res.status(404).json({ error: 'No published articles available' });
        return;
      }

      // Generate newsletter HTML
      const currentDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      const html = generateNewsletterHTML({
        title: type === 'weekly' ? 'Weekly Briefing' : 'Daily Pulse',
        currentDate,
        articles,
        type,
        baseUrl: 'https://kudzimusar.github.io/morning-pulse/'
      });

      // Send via Brevo
      await sendEmailViaBrevo(
        email,
        `Morning Pulse - ${type === 'weekly' ? 'Weekly Briefing' : 'Daily Update'}`,
        html
      );

      res.status(200).json({
        success: true,
        message: 'Newsletter sent successfully',
        articlesCount: articles.length
      });
    } catch (error) {
      console.error('❌ Error in sendNewsletter:', error);
      res.status(500).json({
        error: 'Failed to send newsletter',
        message: error.message
      });
    }
  });
};

/**
 * Manage Subscription Function
 * POST /manageSubscription
 * Body: { email, action: 'subscribe' | 'unsubscribe' }
 */
exports.manageSubscription = async (req, res) => {
  return corsHandler(req, res, async () => {

    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    try {
      const { email, action } = req.body;

      if (!email || !action) {
        res.status(400).json({ error: 'Email and action are required' });
        return;
      }

      if (!['subscribe', 'unsubscribe'].includes(action)) {
        res.status(400).json({ error: 'Action must be subscribe or unsubscribe' });
        return;
      }

      initFirebase();
      const db = admin.firestore();
      const subscriberRef = db.collection('subscribers').doc(email);

      if (action === 'subscribe') {
        await subscriberRef.set({
          email,
          subscribedAt: admin.firestore.FieldValue.serverTimestamp(),
          active: true,
          source: 'website'
        }, { merge: true });

        console.log(`✅ Subscribed: ${email}`);

        res.status(200).json({
          success: true,
          message: 'Successfully subscribed to Morning Pulse newsletter'
        });
      } else {
        await subscriberRef.update({
          active: false,
          unsubscribedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        console.log(`✅ Unsubscribed: ${email}`);

        res.status(200).json({
          success: true,
          message: 'Successfully unsubscribed from Morning Pulse newsletter'
        });
      }
    } catch (error) {
      console.error('❌ Error in manageSubscription:', error);
      res.status(500).json({
        error: 'Failed to manage subscription',
        message: error.message
      });
    }
  });
};

/**
 * Send Scheduled Newsletter Function
 * Triggered by Cloud Scheduler or manual invocation
 * POST /sendScheduledNewsletter
 */
exports.sendScheduledNewsletter = async (req, res) => {
  return corsHandler(req, res, async () => {

    try {
      console.log('📧 Starting scheduled newsletter send...');

      initFirebase();
      const db = admin.firestore();

      // Fetch active subscribers
      const subscribersSnapshot = await db
        .collection('subscribers')
        .where('active', '==', true)
        .get();

      if (subscribersSnapshot.empty) {
        console.log('⚠️ No active subscribers found');
        res.status(200).json({
          success: true,
          message: 'No active subscribers',
          sentCount: 0
        });
        return;
      }

      // Fetch latest opinions
      const articles = await fetchPublishedOpinions(10);

      if (articles.length === 0) {
        console.log('⚠️ No published articles available');
        res.status(200).json({
          success: true,
          message: 'No articles to send',
          sentCount: 0
        });
        return;
      }

      // Generate newsletter HTML
      const currentDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      const html = generateNewsletterHTML({
        title: 'Weekly Briefing',
        currentDate,
        articles,
        type: 'weekly',
        baseUrl: 'https://kudzimusar.github.io/morning-pulse/'
      });

      // Send to all subscribers
      let sentCount = 0;
      let errorCount = 0;
      const subscribers = [];

      subscribersSnapshot.forEach(doc => {
        subscribers.push(doc.data().email);
      });

      console.log(`📧 Sending to ${subscribers.length} subscribers...`);

      for (const email of subscribers) {
        try {
          await sendEmailViaBrevo(
            email,
            'Morning Pulse - Weekly Briefing',
            html
          );
          sentCount++;

          // Add small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.error(`❌ Failed to send to ${email}:`, error.message);
          errorCount++;
        }
      }

      console.log(`✅ Newsletter send complete: ${sentCount} sent, ${errorCount} errors`);

      // Log send event
      await db.collection('newsletter_sends').add({
        sentAt: admin.firestore.FieldValue.serverTimestamp(),
        subscriberCount: subscribers.length,
        sentCount,
        errorCount,
        articleCount: articles.length
      });

      res.status(200).json({
        success: true,
        message: 'Scheduled newsletter sent',
        sentCount,
        errorCount,
        totalSubscribers: subscribers.length
      });
    } catch (error) {
      console.error('❌ Error in sendScheduledNewsletter:', error);
      res.status(500).json({
        error: 'Failed to send scheduled newsletter',
        message: error.message
      });
    }
  });
};
