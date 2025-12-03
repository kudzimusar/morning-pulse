/**
 * WhatsApp Webhook Handler for Google Cloud Functions
 * Entry point: webhook
 */

// CommonJS Imports
const { GoogleGenAI } = require('@google/genai');
const admin = require('firebase-admin');
const axios = require('axios'); // Used for robust HTTP requests

// --- CONFIGURATION ---

// Constants and Environment Variables
const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID;
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const WHATSAPP_VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN; // Matches environment variable name in YAML
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const APP_ID = process.env.APP_ID || 'default-app-id';

const SYSTEM_PROMPT = `You are the "Morning Pulse" AI, a helpful and concise news assistant for Zimbabwean readers. 
When answering questions:
1. Be concise (WhatsApp style).
2. If the user asks about current headlines, refer to the provided context.
3. If using Google Search, cite sources clearly at the bottom.
4. Keep the tone professional but conversational.
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

// Initialize Firebase Admin
let db;
try {
  // Use a fallback to ensure parsing doesn't crash the startup
  const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_CONFIG || '{}');
  if (Object.keys(serviceAccount).length > 0) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    db = admin.firestore();
    console.log('Firebase Admin initialized.');
  } else {
    console.warn('Firebase Admin config missing or empty. Firestore functions will be unavailable.');
  }
} catch (error) {
  console.error('Firebase Admin initialization error (FATAL TO FUNCTION):', error.message);
  // Do not crash the process, but log the error
}

// Initialize Gemini AI
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

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
 * Generate AI response using Gemini
 */
async function generateAIResponse(userMessage, userId) {
  try {
    // Aggregate news headlines for context
    const headlines = Object.values(NEWS_DATA).flat().map(s => s.headline).join('\n');
    
    const contents = [{ role: 'user', parts: [{ text: userMessage }] }];
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-09-2025',
      contents: contents,
      config: {
        systemInstruction: `${SYSTEM_PROMPT}\n\nContextual Headlines:\n${headlines}`,
        tools: [{ google_search: {} }],
      },
    });

    let text = response.candidates?.[0]?.content?.parts?.[0]?.text || "I'm sorry, I couldn't generate a response.";
    let sources = [];

    // Extract grounding metadata if available
    const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
    if (groundingMetadata && groundingMetadata.groundingAttributions) {
        sources = groundingMetadata.groundingAttributions
            .map(attribution => ({
                uri: attribution.web?.uri,
                title: attribution.web?.title,
            }))
            .filter(source => source.uri && source.title); // Ensure sources are valid
    }

    if (sources.length > 0) {
      // Basic markdown formatting for sources
      text += `\n\n*Sources*:\n${sources.map(s => `- ${s.title}`).join('\n')}`;
    }

    return text;
  } catch (error) {
    console.error("Gemini API Error:", error.message);
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

          // Handle *UPGRADE* command using Firestore
          if (messageText.toLowerCase().includes('upgrade')) {
             if (db) {
               const prefPath = `artifacts/${APP_ID}/users/${from}/preferences/settings`;
               await db.doc(prefPath).set({ isPremium: true }, { merge: true });
               await sendWhatsAppMessage(from, "✅ You've been upgraded to Premium! You now have access to keyword alerts and premium features.");
               res.status(200).send('OK');
               return;
             }
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

