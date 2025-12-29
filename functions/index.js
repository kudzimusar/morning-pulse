/**
 * WhatsApp Webhook Handler for Google Cloud Functions
 * Entry point: webhook
 */

// CommonJS Imports
const { GoogleGenerativeAI } = require('@google/generative-ai');
const admin = require('firebase-admin');
const axios = require('axios'); // Used for robust HTTP requests

// --- CONFIGURATION ---

// Constants and Environment Variables
const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID;
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const WHATSAPP_VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN; // Matches environment variable name in YAML
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const APP_ID = process.env.APP_ID || 'morning-pulse-app';

const SYSTEM_PROMPT = `
You are "Morning Pulse", a premium Zimbabwean news assistant. 
Follow this strict formatting for every response:
1. Start with a relevant emoji and a bold title (e.g., 🇿🇼 *MORNING PULSE UPDATE*).
2. Use "—————" as a separator between different news items.
3. Use bold text (*Text*) for emphasis on key names, prices, or locations.
4. Use bullet points (•) for secondary details.
5. End with a short "Morning Pulse" signature.
Tone: Professional, concise, and focused on Zimbabwe.
`;

// Mock Data for contextual awareness
const NEWS_DATA = {
  'Local (Zim)': [
    { id: 'L01', category: 'Local (Zim)', headline: "Speed Limiters Proposed for Buses", detail: "The Zimbabwean Parliament is currently considering a bill that would mandate the installation of tamper-proof speed limiters on all commercial passenger buses. This move comes after a recent spate of fatal road accidents attributed to reckless driving and speeding.", source: "NewsDay" },
    { id: 'L02', category: 'Local (Zim)', headline: "Form 1 Enrolment Opens at Kutama High", detail: "Form 1 enrolment open at Kutama High School. Parents are advised to bring original birth certificates and result slips for verification before the deadline next week.", source: "The Herald" }
  ],
  'Business (Zim)': [
    { id: 'B01', category: 'Business (Zim)', headline: "New ZIDA Investment Zones Created", detail: "The Zimbabwe Investment Development Agency (ZIDA) has announced the creation of three new Special Economic Zones focusing on mining beneficiation and renewable energy projects.", source: "Chronicle" },
    { id: 'B02', category: 'Business (Zim)', headline: "Inflation Rate Hits 3-Month Low", detail: "The national statistics agency reported that the year-on-year inflation rate has dropped to its lowest point in three months, primarily due to stabilized fuel prices.", source: "ZimLive" }
  ],
  'African Focus': [
    { id: 'A01', category: 'African Focus', headline: "South Africa's ANC forms GNU with rivals", detail: "The ANC has successfully formed a Government of National Unity (GNU) with its main rivals, the DA and IFP, following a consensus decision after general elections.", source: "Daily Maverick" },
  ],
  'Global': [
    { id: 'G01', category: 'Global', headline: "US Federal Reserve Holds Interest Rates Steady", detail: "The US Federal Fed announced it will hold its key interest rate target steady, citing stable inflation and robust job growth.", source: "Bloomberg" },
  ]
};

// --- INITIALIZATION ---

// Initialize Firebase Admin with Base64 support
let db;
try {
  let serviceAccount = null;
  
  // Try Base64 encoded config first
  if (process.env.FIREBASE_ADMIN_CONFIG_BASE64) {
    try {
      const decodedString = Buffer.from(process.env.FIREBASE_ADMIN_CONFIG_BASE64, 'base64').toString('utf8');
      serviceAccount = JSON.parse(decodedString);
      console.log('✅ Decoded Firebase config from Base64');
    } catch (error) {
      console.error('❌ Failed to decode Base64 config:', error.message);
    }
  }
  
  // Fallback to regular config - but check if it's Base64-encoded
  if (!serviceAccount && process.env.FIREBASE_ADMIN_CONFIG) {
    try {
      const configString = process.env.FIREBASE_ADMIN_CONFIG.trim();
      
      // Detect if config is Base64-encoded (starts with base64-like pattern)
      // Base64 JSON typically starts with "ewog" (which is {" in base64)
      let parsedConfig = configString;
      
      // Try to detect Base64: if it doesn't start with '{' and contains base64 chars, try decoding
      if (!configString.startsWith('{') && /^[A-Za-z0-9+/=]+$/.test(configString)) {
        try {
          parsedConfig = Buffer.from(configString, 'base64').toString('utf8');
          console.log('✅ Detected and decoded Base64-encoded FIREBASE_ADMIN_CONFIG');
        } catch (decodeError) {
          // If decoding fails, try parsing as-is
          console.log('ℹ️ Tried Base64 decode, failed, attempting direct JSON parse');
        }
      }
      
      serviceAccount = JSON.parse(parsedConfig);
      console.log('✅ Parsed Firebase config from FIREBASE_ADMIN_CONFIG');
    } catch (error) {
      console.error('❌ Failed to parse FIREBASE_ADMIN_CONFIG:', error.message);
    }
  }

  if (serviceAccount) {
    // Check if Firebase is already initialized
    if (!admin.apps.length) {
      if (serviceAccount.project_id && serviceAccount.private_key) {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount)
        });
        db = admin.firestore();
        console.log('✅ Firebase Admin initialized successfully.');
      } else {
        console.warn('⚠️ Firebase config is incomplete. Firestore functions will be unavailable.');
      }
    } else {
      db = admin.firestore();
      console.log('✅ Using existing Firebase Admin instance');
    }
  } else {
    console.warn('⚠️ FIREBASE_ADMIN_CONFIG is empty. Firestore functions will be unavailable.');
  }
} catch (error) {
  console.error('❌ Firebase initialization error:', error.message);
  console.warn('⚠️ Continuing without Firebase. Premium features will be unavailable.');
}

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// --- UTILITY FUNCTIONS ---

/**
 * Send WhatsApp message via Meta API using Axios
 */
async function sendWhatsAppMessage(to, message) {
  const url = `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_ID}/messages`;
  
  try {
    const response = await axios.post(url, {
      messaging_product: 'whatsapp',
      to: to,
      type: 'text',
      text: { body: message }
    }, {
      headers: {
        'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      }
    });
    return response.data;
  } catch (error) {
    console.error('WhatsApp API Error:', error.response ? JSON.stringify(error.response.data) : error.message);
    return null;
  }
}

/**
 * Get today's news from Firestore, or fallback to hardcoded data
 */
async function getTodaysNews() {
  try {
    if (!db) {
      console.warn('⚠️ Firestore not initialized, using hardcoded news');
      return NEWS_DATA;
    }
    
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const newsPath = `artifacts/${APP_ID}/public/data/news/${today}`;
    
    const newsDoc = await db.doc(newsPath).get();
    
    if (newsDoc.exists) {
      const data = newsDoc.data();
      const categories = data.categories || {};
      
      // Convert Firestore format to NEWS_DATA format
      if (Object.keys(categories).length > 0) {
        console.log('✅ Using fresh news from Firestore:', today);
        return categories;
      } else {
        console.log('ℹ️ News document exists but empty, using hardcoded data');
        return NEWS_DATA;
      }
    } else {
      console.log('ℹ️ No news for today, using hardcoded data');
      return NEWS_DATA;
    }
  } catch (error) {
    console.error('❌ Error fetching news from Firestore:', error.message);
    return NEWS_DATA; // Fallback to hardcoded
  }
}

async function generateAIResponse(userMessage, userId) {
  try {
    // Get today's news from Firestore (or fallback to hardcoded)
    const newsData = await getTodaysNews();
    
    // Aggregate news headlines for context
    const headlines = Object.values(newsData).flat().map(s => s.headline).join('\n');
    
    // Use gemini-2.5-flash which is available with this API key
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash"
    });
    // Combine system prompt, context, and user message
    const prompt = `${SYSTEM_PROMPT}\n\nContextual Headlines:\n${headlines}\n\nUser Question: ${userMessage}\n\nAssistant:`;
    
    // Generate content
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    console.log('✅ Gemini AI response generated');
    return text || "I'm sorry, I couldn't generate a response.";
    
  } catch (error) {
    console.error("❌ Gemini API Error:", error.message);
    console.error("Error details:", {
      message: error.message,
      status: error.status,
      statusText: error.statusText
    });
    return "I'm having trouble connecting to the AI right now. Please try again later.";
  }
}

/**
 * Main webhook handler - CommonJS export
 */
exports.webhook = async (req, res) => {
  
  // Handle GET request (webhook verification)
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    // Support both VERIFY_TOKEN and WHATSAPP_VERIFY_TOKEN for compatibility
    const verifyToken = WHATSAPP_VERIFY_TOKEN || process.env.VERIFY_TOKEN;

    // 🔍 DEBUG LOGGING - Remove after fixing
    console.log('=== WEBHOOK VERIFICATION DEBUG ===');
    console.log('Received mode:', mode);
    console.log('Received token:', token);
    console.log('Expected token (WHATSAPP_VERIFY_TOKEN):', WHATSAPP_VERIFY_TOKEN || 'NOT SET');
    console.log('Expected token (VERIFY_TOKEN fallback):', process.env.VERIFY_TOKEN || 'NOT SET');
    console.log('Using token:', verifyToken || 'NOT SET');
    console.log('Tokens match:', token === verifyToken);
    console.log('Mode is subscribe:', mode === 'subscribe');
    if (token && verifyToken) {
      console.log('Token length received:', token.length);
      console.log('Token length expected:', verifyToken.length);
      console.log('Token comparison (strict):', token === verifyToken);
      console.log('Token comparison (trimmed):', token.trim() === verifyToken.trim());
    }
    console.log('Challenge present:', !!challenge);
    console.log('===================================');

    // This is the CRITICAL CHECK for Meta validation
    if (mode === 'subscribe' && token === verifyToken) {
      console.log('✅ Webhook verified successfully by Meta.');
      res.status(200).send(challenge);
    } else {
      console.error('❌ Webhook verification failed.');
      console.error('  - Mode match:', mode === 'subscribe', '(expected: subscribe, got:', mode, ')');
      console.error('  - Token match:', token === verifyToken);
      // Important: Must return a non-200 status on failure
      res.status(403).send('Forbidden: Token or mode mismatch.');
    }
    return;
  }

  // Handle POST request (incoming messages)
  if (req.method === 'POST') {
    try {
      const body = req.body;
      
      if (body.object === 'whatsapp_business_account') {
        const entry = body.entry?.[0];
        const changes = entry?.changes?.[0];
        const value = changes?.value;
        
        if (value?.messages) {
          const message = value.messages[0];
          const from = message.from;
          const messageText = message.text?.body || '';
          
          if (message.type !== 'text') {
             await sendWhatsAppMessage(from, "I currently only process text messages. Please type your query!");
             res.status(200).send('OK');
             return;
          }

          console.log(`Received message from ${from}: ${messageText}`);

          // Handle subscribe/upgrade command using Firestore collection structure
          const text = messageText.toLowerCase();
          if (text.includes('subscribe') || text.includes('upgrade')) {
            if (db) {
              try {
                // Use collection-based path: artifacts/{APP_ID}/public/data/subscribers/{from}
                const subRef = db.collection('artifacts')
                  .doc(APP_ID)
                  .collection('public')
                  .doc('data')
                  .collection('subscribers')
                  .doc(from);
                
                await subRef.set({
                  phoneNumber: from,
                  status: 'active',
                  subscribedAt: admin.firestore.FieldValue.serverTimestamp()
                }, { merge: true });
                
                await sendWhatsAppMessage(from, "✅ *Morning Pulse: Subscribed!*\n\nYou'll receive updates every 5 hours.");
                console.log(`✅ Subscribed user ${from} to Morning Pulse`);
              } catch (err) {
                console.error('❌ Subscription error:', err.message);
                await sendWhatsAppMessage(from, "⚠️ Database error. Try later.");
              }
            } else {
              await sendWhatsAppMessage(from, "⚠️ Database not initialized.");
            }
            res.status(200).send('OK');
            return;
          }
          
          // Generate AI response
          const aiResponse = await generateAIResponse(messageText, from);
          
          // Send response
          await sendWhatsAppMessage(from, aiResponse);
        }
        
        // IMPORTANT: Always respond 200 OK to the Meta platform quickly
        res.status(200).send('OK');
      } else {
        res.status(404).send('Not Found: Object not whatsapp_business_account');
      }
    } catch (error) {
      console.error('Webhook processing error:', error.message);
      res.status(500).send('Internal Server Error');
    }
    return;
  }

  res.status(405).send('Method Not Allowed');
};

// Export newsAggregator function (with error handling)
try {
  const newsAggregatorModule = require('./newsAggregator');
  if (newsAggregatorModule && newsAggregatorModule.newsAggregator) {
    exports.newsAggregator = newsAggregatorModule.newsAggregator;
    console.log('newsAggregator function exported successfully.');
  }
} catch (error) {
  console.warn('newsAggregator module not available:', error.message);
  console.warn('News aggregation features will be unavailable.');
}

