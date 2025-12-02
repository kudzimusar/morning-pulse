/**
 * WhatsApp Webhook Handler for Google Cloud Functions
 * Entry point: webhook
 */

import { GoogleGenAI } from '@google/genai';
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin (lazy initialization to avoid module load errors)
let db;
let firebaseInitialized = false;

function initializeFirebase() {
  if (firebaseInitialized) return db;
  
  try {
    const serviceAccountStr = process.env.FIREBASE_ADMIN_CONFIG;
    if (!serviceAccountStr) {
      console.warn('FIREBASE_ADMIN_CONFIG not set, Firebase features will be disabled');
      firebaseInitialized = true;
      return null;
    }
    
    const serviceAccount = JSON.parse(serviceAccountStr);
    if (Object.keys(serviceAccount).length > 0) {
      // Check if already initialized
      if (admin.apps.length === 0) {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount)
        });
      }
      db = getFirestore();
      firebaseInitialized = true;
      console.log('Firebase Admin initialized successfully');
      return db;
    }
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
    firebaseInitialized = true;
    return null;
  }
  
  firebaseInitialized = true;
  return null;
}

// Initialize Gemini AI
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Constants
const SYSTEM_PROMPT = `You are the "Morning Pulse" AI, a helpful and concise news assistant for Zimbabwean readers. 
When answering questions:
1. Be concise (WhatsApp style).
2. If the user asks about current headlines, refer to the provided context.
3. If using Google Search, cite sources clearly at the bottom.
4. Keep the tone professional but conversational.
`;

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

const INITIAL_POLL_DATA = {
  id: 'current_pulse_poll',
  question: "Quick Community Poll: Do you feel the proposed speed limiters for buses will improve road safety?",
  options: {
    "Yes, enforcement will follow.": 0,
    "No, poor enforcement will negate the effect.": 0,
    "I am unsure.": 0
  },
  voters: {},
  totalVotes: 0,
  timestamp: Date.now()
};

/**
 * Send WhatsApp message via Meta API
 */
async function sendWhatsAppMessage(phoneNumberId, to, message) {
  const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: to,
      type: 'text',
      text: { body: message }
    })
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('WhatsApp API Error:', error);
    throw new Error(`WhatsApp API error: ${response.status}`);
  }

  return await response.json();
}

/**
 * Generate AI response using Gemini
 */
async function generateAIResponse(userMessage, userId) {
  try {
    if (!ai) {
      return "AI service is not configured. Please check GEMINI_API_KEY environment variable.";
    }
    
    // Aggregate news headlines for context
    const headlines = Object.values(NEWS_DATA).flat().map(s => s.headline).join('\n');
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-09-2025',
      contents: userMessage,
      config: {
        systemInstruction: `${SYSTEM_PROMPT}\n\nContextual Headlines:\n${headlines}`,
        tools: [{ googleSearch: {} }],
      },
    });

    let text = response.text || "I'm sorry, I couldn't generate a response.";
    let sources = [];

    // Extract grounding metadata if available
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (groundingChunks) {
      sources = groundingChunks
        .map((chunk) => chunk.web)
        .filter((web) => !!web && !!web.uri && !!web.title)
        .map((web) => ({ title: web.title, uri: web.uri }));
    }

    if (sources.length > 0) {
      text += `\n\n**Sources:**\n${sources.map(s => `- [${s.title}](${s.uri})`).join('\n')}`;
    }

    return text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "I'm having trouble connecting to the network right now. Please try again later.";
  }
}

/**
 * Main webhook handler
 */
export const webhook = async (req, res) => {
  // Handle GET request (webhook verification)
  if (req.method === 'GET') {
    // Extract query parameters - Cloud Functions uses req.query directly
    // Also handle URL parsing as fallback
    let mode, token, challenge;
    
    if (req.query) {
      // Standard Cloud Functions query parameter access
      mode = req.query['hub.mode'];
      token = req.query['hub.verify_token'];
      challenge = req.query['hub.challenge'];
    } else if (req.url) {
      // Fallback: parse from URL
      const url = new URL(req.url, `https://${req.headers.host || 'localhost'}`);
      mode = url.searchParams.get('hub.mode');
      token = url.searchParams.get('hub.verify_token');
      challenge = url.searchParams.get('hub.challenge');
    }

    // Check both VERIFY_TOKEN and WHATSAPP_VERIFY_TOKEN for compatibility
    const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || process.env.VERIFY_TOKEN;
    
    console.log('Webhook verification attempt:', { 
      mode, 
      token: token ? 'present' : 'missing', 
      verifyToken: verifyToken ? 'present' : 'missing',
      challenge: challenge ? 'present' : 'missing',
      tokenMatch: token === verifyToken
    });
    
    // Meta requires: hub.mode === 'subscribe' AND hub.verify_token matches
    if (mode === 'subscribe' && token === verifyToken && challenge) {
      console.log('Webhook verified successfully');
      // Meta requires: Return challenge as plain text (not JSON, not HTML)
      res.set('Content-Type', 'text/plain');
      res.status(200).send(challenge);
      return;
    } else {
      console.log('Webhook verification failed:', { 
        mode, 
        modeMatch: mode === 'subscribe',
        tokenMatch: token === verifyToken,
        hasChallenge: !!challenge
      });
      res.status(403).send('Forbidden');
      return;
    }
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
          
          console.log(`Received message from ${from}: ${messageText}`);

          // Handle special commands
          if (messageText.toLowerCase() === '*upgrade*') {
            const firestoreDb = initializeFirebase();
            if (firestoreDb) {
              const appId = process.env.APP_ID || 'default-app-id';
              const prefPath = `artifacts/${appId}/users/${from}/preferences/settings`;
              await firestoreDb.doc(prefPath).update({ isPremium: true });
            }
            await sendWhatsAppMessage(
              process.env.WHATSAPP_PHONE_ID,
              from,
              "✅ You've been upgraded to Premium! You now have access to keyword alerts and premium features."
            );
            return;
          }

          // Generate AI response
          const aiResponse = await generateAIResponse(messageText, from);
          
          // Send response
          await sendWhatsAppMessage(
            process.env.WHATSAPP_PHONE_ID,
            from,
            aiResponse
          );
        }
        
        res.status(200).send('OK');
      } else {
        res.status(404).send('Not Found');
      }
    } catch (error) {
      console.error('Webhook error:', error);
      res.status(500).send('Internal Server Error');
    }
    return;
  }

  res.status(405).send('Method Not Allowed');
};
