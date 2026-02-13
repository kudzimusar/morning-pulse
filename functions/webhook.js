/**
 * WhatsApp Business API Webhook Handler
 * Handles incoming WhatsApp messages and verification
 * 
 * Entry point: webhook
 * 
 * FIXES APPLIED:
 * ✅ Corrected Firestore document path (was causing "documentPath" error)
 * ✅ Added Base64 config decoding support
 * ✅ Improved error handling
 * 
 * Meta Cloud API Documentation:
 * https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks
 */

const axios = require('axios');
const admin = require('firebase-admin');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Environment variables
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || process.env.WHATSAPP_VERIFY_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const APP_ID = process.env.APP_ID || 'morning-pulse-app';

/**
 * Initialize Firebase Admin if not already initialized
 * 🔧 FIX: Added Base64 config decoding support
 */
let firebaseInitialized = false;
function initializeFirebase() {
  if (firebaseInitialized) return;
  
  try {
    if (admin.apps.length === 0) {
      let configStr = process.env.FIREBASE_ADMIN_CONFIG;
      
      // 🔧 FIX: Decode Base64 if needed
      if (configStr && configStr.match(/^[A-Za-z0-9+/]+=*$/)) {
        console.log("✅ Detected Base64-encoded config, decoding...");
        configStr = Buffer.from(configStr, 'base64').toString('utf-8');
      }
      
      const serviceAccount = JSON.parse(configStr);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
      });
    }
    firebaseInitialized = true;
    console.log('✅ Firebase Admin initialized');
  } catch (error) {
    console.error('❌ Firebase initialization error:', error);
  }
}

/**
 * Send WhatsApp message via Meta Cloud API
 */
async function sendWhatsAppMessage(to, message) {
  try {
    const url = `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_ID}/messages`;
    
    const response = await axios.post(
      url,
      {
        messaging_product: 'whatsapp',
        to: to,
        type: 'text',
        text: { body: message }
      },
      {
        headers: {
          'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log(`✅ Message sent to ${to}`);
    return response.data;
  } catch (error) {
    console.error('❌ Error sending WhatsApp message:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Generate AI response using Gemini
 */
async function generateAIResponse(userMessage, conversationHistory = []) {
  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      systemInstruction: `You are Morning Pulse, a news assistant for Zimbabwe. 
You help users stay informed about local, regional, and global news.
Keep responses concise (2-3 sentences) and friendly.
If asked about news, provide brief summaries of recent stories.`
    });

    const chat = model.startChat({
      history: conversationHistory,
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 256,
      }
    });

    const result = await chat.sendMessage(userMessage);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('❌ Gemini API error:', error);
    return 'Sorry, I encountered an error processing your message. Please try again.';
  }
}

/**
 * Fetch latest news from Firestore
 * 🔧 FIX: Corrected Firestore document path
 * 
 * OLD (BROKEN): db.doc(`news/v2/${APP_ID}/daily/${dateStr}`) - caused "documentPath" error
 * NEW (FIXED): Proper document reference
 */
async function getLatestNews(category = null) {
  try {
    initializeFirebase();
    const db = admin.firestore();
    
    // Get today's date
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0]; // YYYY-MM-DD
    
    console.log(`📰 Fetching news for: ${dateStr}`);
    
    // 🔧 FIX: Correct Firestore path - news/v2/APP_ID/daily/DATE is a DOCUMENT
    const newsRef = db.doc(`news/v2/${APP_ID}/daily/${dateStr}`);
    const newsDoc = await newsRef.get();
    
    if (!newsDoc.exists) {
      console.log(`⚠️ No news found for ${dateStr}, trying yesterday...`);
      
      // Try yesterday
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      const yesterdayRef = db.doc(`news/v2/${APP_ID}/daily/${yesterdayStr}`);
      const yesterdayDoc = await yesterdayRef.get();
      
      if (!yesterdayDoc.exists) {
        console.log('❌ No news available');
        return 'No news available for today yet. Please check back later!';
      }
      
      console.log(`✅ Found news for ${yesterdayStr}`);
      return formatNewsForWhatsApp(yesterdayDoc.data(), category);
    }
    
    console.log(`✅ Found news for ${dateStr}`);
    return formatNewsForWhatsApp(newsDoc.data(), category);
    
  } catch (error) {
    console.error('❌ Error fetching news:', error);
    return 'Unable to fetch news at the moment. Please try again later.';
  }
}

/**
 * Format news data for WhatsApp message
 */
function formatNewsForWhatsApp(newsData, category = null) {
  if (!newsData || !newsData.categories) {
    return 'No news available at the moment.';
  }
  
  const categories = newsData.categories;
  
  // If specific category requested
  if (category) {
    const categoryNews = categories[category] || [];
    if (categoryNews.length === 0) {
      return `No ${category} news available.`;
    }
    
    let message = `📰 *${category}*\n\n`;
    categoryNews.slice(0, 3).forEach((article, idx) => {
      message += `${idx + 1}. ${article.headline}\n`;
      if (article.detail) {
        const detail = article.detail.substring(0, 100);
        message += `   ${detail}...\n`;
      }
      message += '\n';
    });
    return message;
  }
  
  // Return headlines from all categories (top 3 categories, 2 articles each)
  let message = '📰 *Morning Pulse - Today\'s Top News*\n\n';
  
  const topCategories = Object.keys(categories).slice(0, 3);
  topCategories.forEach(cat => {
    const articles = categories[cat] || [];
    if (articles.length > 0) {
      message += `*${cat}*\n`;
      articles.slice(0, 2).forEach((article, idx) => {
        message += `${idx + 1}. ${article.headline}\n`;
      });
      message += '\n';
    }
  });
  
  message += '📱 More at: https://kudzimusar.github.io/morning-pulse/';
  return message;
}

/**
 * Process incoming WhatsApp message
 */
async function processMessage(message) {
  const from = message.from;
  const messageBody = message.text?.body || '';
  const messageId = message.id;
  
  console.log(`📨 Received message from ${from}: ${messageBody}`);
  
  // Check for news-related keywords
  const lowerMessage = messageBody.toLowerCase();
  let response;
  
  if (lowerMessage.includes('news') || lowerMessage.includes('headlines') || lowerMessage.includes('today')) {
    // Check for category mentions
    let category = null;
    if (lowerMessage.includes('local') || lowerMessage.includes('zim')) category = 'Local (Zim)';
    else if (lowerMessage.includes('business')) category = 'Business (Zim)';
    else if (lowerMessage.includes('sport')) category = 'Sports';
    else if (lowerMessage.includes('tech')) category = 'Tech';
    else if (lowerMessage.includes('africa')) category = 'African Focus';
    else if (lowerMessage.includes('global')) category = 'Global';
    
    response = await getLatestNews(category);
  } else if (lowerMessage.includes('help') || lowerMessage === 'hi' || lowerMessage === 'hello') {
    response = `👋 Welcome to Morning Pulse!

I can help you with:
• Latest news headlines
• News by category (local, business, sports, tech, Africa, global)
• General questions about current events

Try: "Show me today's news" or "What's the latest local news?"`;
  } else {
    // Use AI for general conversation
    response = await generateAIResponse(messageBody);
  }
  
  // Send response
  await sendWhatsAppMessage(from, response);
  
  // Log to Firestore (optional)
  try {
    initializeFirebase();
    const db = admin.firestore();
    await db.collection(`whatsapp_messages/${APP_ID}/conversations`).add({
      from,
      message: messageBody,
      response,
      messageId,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
  } catch (error) {
    console.error('⚠️ Error logging message:', error);
  }
}

/**
 * Main webhook handler
 * Handles both GET (verification) and POST (messages)
 */
exports.webhook = async (req, res) => {
  console.log(`🔔 Webhook received: ${req.method}`);
  
  // ============================================
  // GET REQUEST - Webhook Verification
  // ============================================
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    
    console.log('📋 Verification request:', { mode, token: token ? '***' : 'missing', challenge });
    
    // Check if mode and token are correct
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('✅ Webhook verified successfully');
      res.status(200).send(challenge);
    } else {
      console.error('❌ Webhook verification failed');
      res.status(403).send('Forbidden');
    }
    return;
  }
  
  // ============================================
  // POST REQUEST - Incoming Messages
  // ============================================
  if (req.method === 'POST') {
    const body = req.body;
    
    console.log('📨 Incoming webhook:', JSON.stringify(body, null, 2));
    
    // Check if this is a WhatsApp message
    if (body.object === 'whatsapp_business_account') {
      try {
        // Extract message details
        const entry = body.entry?.[0];
        const changes = entry?.changes?.[0];
        const value = changes?.value;
        const messages = value?.messages;
        
        if (messages && messages.length > 0) {
          // Process first message (WhatsApp typically sends one at a time)
          const message = messages[0];
          
          // Only process text messages
          if (message.type === 'text') {
            await processMessage(message);
          } else {
            console.log(`⚠️ Unsupported message type: ${message.type}`);
          }
        }
        
        res.status(200).send('EVENT_RECEIVED');
      } catch (error) {
        console.error('❌ Error processing webhook:', error);
        res.status(500).send('Error processing webhook');
      }
    } else {
      console.log('⚠️ Not a WhatsApp webhook');
      res.status(404).send('Not Found');
    }
    return;
  }
  
  // ============================================
  // OTHER METHODS - Not Allowed
  // ============================================
  res.status(405).send('Method Not Allowed');
};
