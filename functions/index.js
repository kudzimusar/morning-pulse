/**
 * WhatsApp Webhook Handler for Google Cloud Functions
 * Entry point: webhook
 * 
 * Multi-dimensional news system front-end that fetches and formats news
 * from 7-category scraping architecture in Kukurigo style.
 */

// CommonJS Imports
const { GoogleGenerativeAI } = require('@google/generative-ai');
const admin = require('firebase-admin');
const axios = require('axios');
const cors = require('cors');

// CORS Handler
const corsHandler = cors({ origin: true });

// --- CONFIGURATION ---

// Constants and Environment Variables
const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID;
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const WHATSAPP_VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const APP_ID = process.env.APP_ID || 'morning-pulse-app';

// Email Configuration (Brevo)
const BREVO_API_KEY = process.env.MORNING_PULSE_BREVO;
const NEWSLETTER_FROM_EMAIL = process.env.NEWSLETTER_FROM_EMAIL || 'buynsellpvtltd@gmail.com';
const NEWSLETTER_FROM_NAME = 'Morning Pulse News';

// =======================
// GLOBAL CORS HELPER
// =======================
function setCorsHeaders(req, res) {
  // Set CORS headers explicitly
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '3600');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return true; // Signal that we handled OPTIONS
  }
  return false;
}

// Expected news categories from newsAggregator
const NEWS_CATEGORIES = [
  'Local (Zim)',
  'Business (Zim)',
  'African Focus',
  'Global',
  'Sports',
  'Tech',
  'General News'
];

const getSystemPrompt = (country = 'Zimbabwe') => {
  const isZimbabwe = country === 'Zimbabwe' || country === 'ZW';
  const localCategory = isZimbabwe ? 'Local (Zim)' : `Local (${country})`;
  const businessCategory = isZimbabwe ? 'Business (Zim)' : 'Business';

  return `You are "Morning Pulse", a global news aggregator with local focus. 
Your output must mirror the professional "Kukurigo" style.

CRITICAL REQUIREMENTS:
1. CATEGORY COVERAGE: You MUST provide a comprehensive report covering ALL 7 categories: ${localCategory}, ${businessCategory}, African Focus, Global, Sports, Tech, and General News.

${!isZimbabwe ? `2. LOCAL NEWS PRIORITY: For the "${localCategory}" section, prioritize local sources and news specifically from ${country}. Use local news outlets and sources from that nation.` : ''}

2. CONTENT DEPTH:
   - Be concise and focused. Provide 2-3 key headlines per category with brief summaries.
   - Write 1 full paragraph for EACH of the 7 categories.
   - Each paragraph must be 2-3 sentences long with essential information.
   - Aim for clarity and brevity while covering essential news.
   - Total response length should be approximately 400-600 words.

3. FORMATTING RULES:
   - HEADER: _In the Press [Current Date]: [Top 2-3 most important headlines across categories]_
   - BODY: Write 7 distinct paragraphs (one per category), each 2-3 sentences.
   - CITATION: Every paragraph MUST end with italicized bold source: _*— Source Name*_ (e.g., _*— NewsDay*_ or _*— Bloomberg*_).
   - SEPARATOR: Use a single empty line between different news categories.
   - FOOTER: _Morning Pulse Updates©️_

4. TONE: Factual, journalistic, and strictly objective. Do not add personal AI commentary.

5. STYLE: Maintain Kukurigo professional newspaper style with proper formatting.`;
};

// Mock Data for fallback (kept for backward compatibility)
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

// Initialize Brevo
if (BREVO_API_KEY) {
  console.log('✅ Brevo API Key detected');
} else {
  console.warn('⚠️ MORNING_PULSE_BREVO not set. Email features will be unavailable.');
}

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// --- MESSAGE DEDUPLICATION ---

// In-memory cace to prevent processing duplicate messages
const processedMessages = new Set();

// --- UTILITY FUNCTIONS ---

/**
 * Send WhatsApp message via Meta API using Axios
 */
async function sendWhatsAppMessage(to, message) {
  if (!to) {
    console.error('❌ sendWhatsAppMessage: No recipient phone number provided');
    return null;
  }

  if (!message || message.trim() === '') {
    console.error('❌ sendWhatsAppMessage: Empty message body');
    return null;
  }

  const url = `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_ID}/messages`;

  try {
    console.log(`📤 Sending WhatsApp message to ${to} (${message.length} chars)`);
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
    console.log(`✅ WhatsApp message sent successfully to ${to}`);
    return response.data;
  } catch (error) {
    console.error('❌ WhatsApp API Error:', error.response ? JSON.stringify(error.response.data) : error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data));
    }
    return null;
  }
}

/**
 * Get today's news from Firestore with all 7 categories
 * Returns structured news data organized by category
 */
async function getTodaysNews() {
  try {
    if (!db) {
      console.warn('⚠️ Firestore not initialized, will use search fallback');
      return null;
    }

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const newsPath = `artifacts/${APP_ID}/public/data/news/${today}`;

    const newsDoc = await db.doc(newsPath).get();

    if (newsDoc.exists) {
      const data = newsDoc.data();
      const categories = data.categories || {};

      // Verify we have data for at least some categories
      if (Object.keys(categories).length > 0) {
        console.log(`✅ Using fresh news from Firestore: ${today} (${Object.keys(categories).length} categories)`);

        // Ensure all 7 categories are represented (even if empty)
        const structuredNews = {};
        NEWS_CATEGORIES.forEach(category => {
          structuredNews[category] = categories[category] || [];
        });

        return structuredNews;
      } else {
        console.log('ℹ️ News document exists but empty, will use search fallback');
        return null;
      }
    } else {
      console.log(`ℹ️ No news document found for ${today}, will use search fallback`);
      return null;
    }
  } catch (error) {
    console.error('❌ Error fetching news from Firestore:', error.message);
    return null; // Return null to trigger search fallback
  }
}

/**
 * Fetch news using Google Search fallback for missing categories
 * Uses Gemini with googleSearch tool to find news
 * For fallback scenarios, only fetches 3 key categories to avoid timeouts
 */
async function fetchNewsWithSearch(missingCategories = null) {
  try {
    // For fallback scenarios, only fetch 3 key categories to avoid timeouts
    const fallbackCategories = ['Local (Zim)', 'Business (Zim)', 'Global'];
    const categoriesToFetch = missingCategories || fallbackCategories;

    console.log(`🔍 Fetching news via Google Search for ${categoriesToFetch.length} categories (fallback mode)`);

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      tools: [{ googleSearch: {} }],
      generationConfig: {
        maxOutputTokens: 1024
      }
    });

    // Build search query for all missing categories
    const categoryQueries = {
      'Local (Zim)': 'latest Zimbabwe news today',
      'Business (Zim)': 'Zimbabwe business economy news today',
      'African Focus': 'latest Africa news today',
      'Global': 'world news headlines today',
      'Sports': 'sports news today',
      'Tech': 'technology news today',
      'General News': 'breaking news today'
    };

    const searchPromises = categoriesToFetch.map(async (category) => {
      // Optimized search query for speed and specificity
      const today = new Date();
      const dateStr = today.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
      const optimizedQuery = `Latest news for ${category === 'Local (Zim)' ? 'Zimbabwe' : category === 'Business (Zim)' ? 'Zimbabwe Business' : category === 'African Focus' ? 'Africa' : category === 'Global' ? 'World' : category} for ${dateStr}. Provide detailed paragraphs and sources.`;

      const prompt = `Find the top 3-5 most important and recent news stories for: ${category}.
Search for: ${optimizedQuery}

For each story, provide:
1. A clear headline (max 100 characters)
2. A detailed 3-4 sentence summary with context
3. The source/publication name
4. The URL if available

Format as JSON array:
[
  {
    "headline": "Headline text",
    "detail": "Detailed 3-4 sentence summary with context",
    "source": "Source name",
    "url": "https://url.com"
  }
]

Only return valid JSON, no additional text.`;

      try {
        // Add timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Request timeout after 15 seconds')), 15000)
        );

        const generatePromise = model.generateContent(prompt);
        const result = await Promise.race([generatePromise, timeoutPromise]);
        const response = await result.response;
        let text = response.text().trim();

        // Extract JSON from markdown code blocks if present
        if (text.startsWith('```json')) {
          text = text.replace(/^```json\n?/, '').replace(/\n?```$/, '');
        } else if (text.startsWith('```')) {
          text = text.replace(/^```\n?/, '').replace(/\n?```$/, '');
        }

        const articles = JSON.parse(text);

        // Add metadata
        return {
          category: category,
          articles: articles.map((article, index) => ({
            id: `${category.substring(0, 1).toUpperCase()}${String(index + 1).padStart(2, '0')}`,
            category: category,
            headline: article.headline,
            detail: article.detail,
            source: article.source || 'Various',
            url: article.url || ''
          }))
        };
      } catch (error) {
        console.error(`❌ Error fetching ${category}:`, error.message);
        return { category: category, articles: [] };
      }
    });

    const results = await Promise.all(searchPromises);

    // Organize by category
    const newsByCategory = {};
    results.forEach(result => {
      if (result.articles.length > 0) {
        newsByCategory[result.category] = result.articles;
      }
    });

    console.log(`✅ Fetched ${Object.keys(newsByCategory).length} categories via search`);
    return newsByCategory;
  } catch (error) {
    console.error('❌ Error in search fallback:', error.message);
    return null;
  }
}

/**
 * Format news data for Gemini prompt
 * Converts structured news into readable text format
 */
function formatNewsForPrompt(newsData) {
  if (!newsData || Object.keys(newsData).length === 0) {
    return 'No news data available.';
  }

  let formatted = '';
  NEWS_CATEGORIES.forEach(category => {
    const articles = newsData[category] || [];
    if (articles.length > 0) {
      formatted += `\n\n**${category}:**\n`;
      articles.forEach(article => {
        formatted += `- Headline: ${article.headline}\n`;
        formatted += `  Detail: ${article.detail}\n`;
        formatted += `  Source: ${article.source}\n`;
      });
    }
  });

  return formatted || 'No news articles found.';
}

/**
 * Handle news query - processes news request and returns formatted response
 * This function is called asynchronously after webhook acknowledges Meta
 */
async function handleNewsQuery(userMessage, userId, country = 'Zimbabwe') {
  try {
    // Get current date for header
    const today = new Date();
    const dateStr = today.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

    // Get system prompt based on country
    const systemPrompt = getSystemPrompt(country);

    // Step 1: Try to get news from Firestore
    let newsData = await getTodaysNews();

    // Step 2: If Firestore is empty or missing, use Google Search fallback
    if (!newsData || Object.keys(newsData).length === 0) {
      console.log('📡 Firestore news unavailable, using Google Search fallback');
      newsData = await fetchNewsWithSearch();

      // If search also fails, use hardcoded fallback
      if (!newsData || Object.keys(newsData).length === 0) {
        console.log('⚠️ Search fallback failed, using hardcoded news');
        newsData = NEWS_DATA;
      }
    }

    // Step 3: Format news for prompt
    const formattedNews = formatNewsForPrompt(newsData);

    // Step 4: Use gemini-2.5-flash for response generation with extended timeout
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      // Critical fix for the 30s SDK timeout - extend to 240 seconds
      requestOptions: { timeout: 240000 }
    });

    // Step 5: Build comprehensive prompt
    const prompt = `${systemPrompt}

Today's Date: ${dateStr}
${country !== 'Zimbabwe' ? `\nTarget Country: ${country}\n` : ''}

Available News Data (all 7 categories):
${formattedNews}

User Request: ${userMessage}

CRITICAL: Generate a COMPLETE Morning Pulse news bulletin covering ALL 7 categories.
- Write ONE paragraph (2-3 sentences) for EACH category: Local (Zim), Business (Zim), African Focus, Global, Sports, Tech, General News
- Use the header format: _In the Press [Date]: [Top Headlines]_
- Each paragraph must be concise (2-3 sentences) with essential context
- End each paragraph with source citation: _*— Source Name*_
- Use empty lines between categories
- End with footer: _Morning Pulse Updates©️_
- Total length: 400-600 words (concise but comprehensive)

If the user asks a specific question, answer it using the news context provided. If they ask for "news" or "update", provide the full formatted bulletin with all 7 categories.`;

    // Generate content with timeout and token limits
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout after 25 seconds')), 25000)
    );

    const generatePromise = model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: 1024,  // Balanced for speed and detail
        temperature: 0.7
      }
    });

    const result = await Promise.race([generatePromise, timeoutPromise]);
    const response = result.response;
    let responseText = response.text();

    if (!responseText || responseText.trim() === '') {
      console.error('❌ Empty response from Gemini API');
      return "I'm sorry, I couldn't generate a response. Please try again.";
    }

    // WhatsApp limit is 4096 chars, leave buffer for formatting
    const MAX_LENGTH = 4000;
    const originalLength = responseText.length;

    if (responseText.length > MAX_LENGTH) {
      responseText = responseText.substring(0, MAX_LENGTH) + '\n\n... (Message truncated due to length. Ask for specific category for full details)';
      console.log(`⚠️ Response truncated from ${originalLength} to ${responseText.length} chars`);
    }

    console.log(`✅ Gemini AI response generated with Kukurigo formatting (${responseText.length} characters)`);
    return responseText;

  } catch (error) {
    console.error("❌ Error in handleNewsQuery:", error.message);
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
 * Responds immediately to Meta, then processes in background
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
    const body = req.body;

    // CRITICAL: Acknowledge Meta immediately to prevent timeout
    res.status(200).send('EVENT_RECEIVED');

    // Process message in background (don't await - let it run asynchronously)
    // Store the promise to keep function alive
    const backgroundTask = (async () => {
      try {
        if (body.object === 'whatsapp_business_account') {
          const entry = body.entry?.[0];
          const changes = entry?.changes?.[0];
          const value = changes?.value;

          if (value?.messages) {
            const message = value.messages[0];
            const messageId = message.id;

            // Skip if already processed (prevents duplicates from WhatsApp retries)
            if (processedMessages.has(messageId)) {
              console.log(`⏭️ Skipping duplicate message: ${messageId}`);
              return;
            }

            // Add to processed set
            processedMessages.add(messageId);

            // Clean up old messages after 10 minutes
            setTimeout(() => {
              processedMessages.delete(messageId);
            }, 600000);

            const from = message.from;
            const messageText = message.text?.body || '';

            if (!from) {
              console.error('❌ No sender phone number found');
              return;
            }

            if (message.type !== 'text') {
              await sendWhatsAppMessage(from, "I currently only process text messages. Please type your query!");
              return;
            }

            console.log(`📨 Processing message from ${from}: ${messageText}`);

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
              return;
            }

            // Handle news queries - this may take 20-30 seconds
            // Process in background and send response when ready
            console.log(`🔄 Starting news query processing for ${from}...`);

            // Extract country from message if specified, otherwise default to Zimbabwe
            let country = 'Zimbabwe';
            const countryMatch = messageText.match(/(?:for|from)\s+([A-Za-z\s]+)/i);
            if (countryMatch) {
              country = countryMatch[1].trim();
            }

            const aiResponse = await handleNewsQuery(messageText, from, country);

            if (!aiResponse || aiResponse.trim() === '') {
              console.error('❌ Empty response from handleNewsQuery');
              await sendWhatsAppMessage(from, "⚠️ I couldn't generate a response. Please try again.");
              return;
            }

            console.log(`✅ Generated response (${aiResponse.length} chars), sending to ${from}...`);

            // Send response via WhatsApp
            const sendResult = await sendWhatsAppMessage(from, aiResponse);

            if (sendResult) {
              console.log('✅ WhatsApp message sent successfully');
            } else {
              console.error(`❌ Failed to send WhatsApp message to ${from}`);
            }
          }
        }
      } catch (error) {
        console.error('❌ Background processing error:', error.message);
        console.error('Stack trace:', error.stack);
        // Try to send error message to user if we have their number
        try {
          if (body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.from) {
            const from = body.entry[0].changes[0].value.messages[0].from;
            await sendWhatsAppMessage(from, "⚠️ I encountered an error processing your request. Please try again in a moment.");
          }
        } catch (sendError) {
          console.error('❌ Failed to send error message:', sendError.message);
        }
      }
    })(); // Immediately invoked async function - runs in background

    // Keep the promise reference to prevent early termination
    // In Cloud Functions, the function will stay alive until the promise resolves
    backgroundTask.catch(err => {
      console.error('❌ Unhandled error in background task:', err);
    });

    // Function returns immediately after starting background task
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
  console.error('Error loading newsAggregator:', error);
  console.warn('newsAggregator module not available:', error.message);
  console.warn('News aggregation features will be unavailable.');
}
/**
 * HTTP Cloud Function to fetch opinions from Firestore
 * This endpoint allows the frontend to fetch opinions without needing 'list' permission
 * Backend has admin access, so it can list the collection
 */
exports.getOpinions = async (req, res) => {
  // Set CORS headers and handle preflight
  if (setCorsHeaders(req, res)) return;

  if (req.method !== 'GET') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  try {
    if (!db) {
      res.status(500).json({ error: 'Firebase not initialized' });
      return;
    }

    const status = req.query.status || 'all'; // 'pending', 'published', or 'all'
    const appId = APP_ID;

    // Use admin SDK path structure: artifacts/{appId}/public/data/opinions
    const opinionsRef = db.collection('artifacts').doc(appId)
      .collection('public').doc('data')
      .collection('opinions');

    let query = opinionsRef;

    // Apply status filter if specified
    if (status === 'pending') {
      query = query.where('status', '==', 'pending');
    } else if (status === 'published') {
      query = query.where('status', '==', 'published');
    }

    // Order by submittedAt or publishedAt
    if (status === 'published') {
      query = query.orderBy('publishedAt', 'desc');
    } else if (status === 'pending') {
      query = query.orderBy('submittedAt', 'desc');
    }

    const snapshot = await query.get();
    const opinions = [];

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      opinions.push({
        id: docSnap.id,
        ...data,
        submittedAt: data.submittedAt?.toDate ? data.submittedAt.toDate().toISOString() : (data.submittedAt || null),
        publishedAt: data.publishedAt?.toDate ? data.publishedAt.toDate().toISOString() : (data.publishedAt || null),
      });
    });

    res.status(200).json({ opinions });
  } catch (error) {
    console.error('Error fetching opinions:', error);
    res.status(500).json({ error: error.message });
  }
};

// Export Unsplash image proxy function (with error handling)
try {
  const unsplashProxyModule = require('./unsplashProxy');
  if (unsplashProxyModule && unsplashProxyModule.unsplashImage) {
    exports.unsplashImage = unsplashProxyModule.unsplashImage;
    console.log('unsplashImage function exported successfully.');
  }
} catch (error) {
  console.warn('unsplashProxy module not available:', error.message);
  console.warn('Unsplash image proxy features will be unavailable.');
}

// --- EMAIL NEWSLETTER FUNCTIONS ---

/**
 * Send single email via Brevo REST API
 */
async function sendBrevoEmail({ toEmail, toName, subject, html }) {
  if (!BREVO_API_KEY || BREVO_API_KEY.length < 10) {
    console.error('❌ CRITICAL: Brevo API key is missing or invalid.');
    return { success: false, error: 'Brevo API key not configured' };
  }

  try {
    console.log(`📡 Attempting Brevo API call to: ${toEmail}`);
    const response = await axios.post('https://api.brevo.com/v3/smtp/email', {
      sender: {
        email: NEWSLETTER_FROM_EMAIL,
        name: NEWSLETTER_FROM_NAME
      },
      to: [{ email: toEmail, name: toName || '' }],
      subject,
      htmlContent: html,
      headers: {
        'List-Unsubscribe': `<https://kudzimusar.github.io/morning-pulse/?action=unsubscribe>, <mailto:${NEWSLETTER_FROM_EMAIL}?subject=Unsubscribe>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
      }
    }, {
      headers: {
        'api-key': BREVO_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 10000 // 10 second timeout
    });

    console.log(`✅ Brevo success for ${toEmail}: MessageID ${response.data.messageId}`);
    return { success: true, result: response.data };
  } catch (error) {
    let errorDetail = error.message;
    if (error.response) {
      errorDetail = `Status ${error.response.status}: ${JSON.stringify(error.response.data)}`;
      console.error(`❌ Brevo API Error Response for ${toEmail}:`, JSON.stringify(error.response.data, null, 2));
    }
    console.error(`❌ Brevo API Failure for ${toEmail}:`, errorDetail);
    return { success: false, error: errorDetail };
  }
}

/**
 * Send email newsletter via Brevo (iterative for now to ensure delivery)
 * @param {Object} newsletter - Newsletter data
 * @param {Object[]} recipients - List of subscriber objects {email, name}
 */
async function sendNewsletterEmail(newsletter, recipients) {
  const { subject, html } = newsletter;
  const results = [];

  // Brevo free tier has daily limits, so we send one by one
  // In a high-volume scenario, we'd use their batch/template API
  for (const recipient of recipients) {
    const result = await sendBrevoEmail({
      toEmail: recipient.email,
      toName: recipient.name,
      subject,
      html
    });
    results.push({ ...result, email: recipient.email });
  }

  return results;
}

/**
 * Get active newsletter subscribers from Firestore
 */
async function getNewsletterSubscribers() {
  if (!db) {
    throw new Error('Firebase not initialized');
  }

  const subscribersRef = db.collection('artifacts')
    .doc(APP_ID)
    .collection('public')
    .doc('data')
    .collection('subscribers');

  const snapshot = await subscribersRef
    .where('status', '==', 'active')
    .where('emailNewsletter', '==', true)
    .get();

  const subscribers = [];
  snapshot.forEach(doc => {
    const data = doc.data();
    if (data.email && data.email.trim()) {
      subscribers.push({
        id: doc.id,
        email: data.email,
        name: data.name || null,
        interests: data.interests || [],
        subscribedAt: data.subscribedAt?.toDate?.() || new Date()
      });
    }
  });

  console.log(`📧 Found ${subscribers.length} active newsletter subscribers`);
  return subscribers;
}

/**
 * Segment subscribers by interests
 * @param {Array} subscribers - All subscribers
 * @param {string[]} interests - Filter by these interests (optional)
 */
function segmentSubscribers(subscribers, interests = null) {
  if (!interests || interests.length === 0) {
    return subscribers; // Return all if no interests specified
  }

  return subscribers.filter(sub => {
    if (!sub.interests || sub.interests.length === 0) {
      return false; // Skip if no interests set
    }
    return interests.some(interest => sub.interests.includes(interest));
  });
}

/**
 * Cloud Function: Send newsletter to all subscribers
 * Trigger: HTTP POST with newsletter content
 */
exports.sendNewsletter = async (req, res) => {
  return corsHandler(req, res, async () => {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
      return;
    }

    try {
      const { newsletter, interests } = req.body;

      if (!newsletter || !newsletter.subject || !newsletter.html) {
        res.status(400).json({ error: 'Missing required fields: newsletter.subject, newsletter.html' });
        return;
      }

      // Get subscribers
      const allSubscribers = await getNewsletterSubscribers();

      if (allSubscribers.length === 0) {
        res.status(200).json({
          success: true,
          message: 'No active subscribers found',
          sent: 0
        });
        return;
      }

      // Segment subscribers if interests specified
      const targetSubscribers = segmentSubscribers(allSubscribers, interests);

      if (targetSubscribers.length === 0) {
        res.status(200).json({
          success: true,
          message: 'No subscribers match the specified interests',
          sent: 0
        });
        return;
      }

      console.log(`📧 Sending newsletter "${newsletter.subject}" to ${targetSubscribers.length} subscribers`);

      // Send the newsletter
      const results = await sendNewsletterEmail(newsletter, targetSubscribers);

      // Calculate success stats
      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;

      // Log the newsletter send
      const sentAt = admin.firestore.FieldValue.serverTimestamp();
      const sendDoc = await db.collection('artifacts').doc(APP_ID).collection('analytics').doc('newsletters').collection('sends').add({
        subject: newsletter.subject,
        sentAt,
        totalSubscribers: allSubscribers.length,
        targetedSubscribers: targetSubscribers.length,
        successfulSends: successful,
        failedSends: failed,
        interests: interests || null
      });

      // Log Ad Impressions if ads were included in the HTML
      if (newsletter.adIds && Array.isArray(newsletter.adIds)) {
        const adImpressionsRef = db.collection('artifacts')
          .doc(APP_ID)
          .collection('analytics')
          .doc('newsletterAdImpressions')
          .collection('logs');

        for (const adId of newsletter.adIds) {
          await adImpressionsRef.add({
            adId,
            newsletterSendId: sendDoc.id,
            sentAt,
            impressionCount: successful
          });
        }
      }

      res.status(200).json({
        success: true,
        message: `Newsletter sent successfully to ${successful} subscribers`,
        stats: {
          totalSubscribers: allSubscribers.length,
          targetedSubscribers: targetSubscribers.length,
          successfulSends: successful,
          failedSends: failed
        }
      });

    } catch (error) {
      console.error('❌ Newsletter send error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });
};

/**
 * Cloud Function: Manage newsletter subscriptions
 * Supports subscribe, unsubscribe, and update preferences
 */
exports.manageSubscription = async (req, res) => {
  return corsHandler(req, res, async () => {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
      return;
    }

    try {
      const { action, email, name, interests } = req.body;

      if (!email || !action) {
        res.status(400).json({ error: 'Missing required fields: email, action' });
        return;
      }

      const subscriberRef = db.collection('artifacts')
        .doc(APP_ID)
        .collection('public')
        .doc('data')
        .collection('subscribers')
        .doc(email.toLowerCase());

      if (action === 'subscribe') {
        await subscriberRef.set({
          email: email.toLowerCase(),
          name: name || null,
          interests: interests || [],
          status: 'active',
          emailNewsletter: true,
          subscribedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        res.status(200).json({
          success: true,
          message: 'Successfully subscribed to newsletter',
          subscriber: { email, name, interests }
        });

      } else if (action === 'unsubscribe') {
        await subscriberRef.update({
          status: 'inactive',
          emailNewsletter: false,
          unsubscribedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        res.status(200).json({
          success: true,
          message: 'Successfully unsubscribed from newsletter'
        });

      } else if (action === 'update') {
        await subscriberRef.update({
          name: name || null,
          interests: interests || [],
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        res.status(200).json({
          success: true,
          message: 'Subscription preferences updated',
          subscriber: { email, name, interests }
        });

      } else {
        res.status(400).json({ error: 'Invalid action. Use: subscribe, unsubscribe, update' });
      }

    } catch (error) {
      console.error('❌ Subscription management error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });
};

/**
 * Generate newsletter HTML from articles
 */
function generateNewsletterHTML({ title, currentDate, articles, ads, type }) {
  const baseUrl = 'https://kudzimusar.github.io/morning-pulse/';

  const articleHTML = articles.map((article, index) => {
    const url = `${baseUrl}#opinion/${article.slug || article.id}`;
    const pubDate = article.publishedAt.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });

    return `
      <tr>
        <td style="padding: 20px 0; border-bottom: 1px solid #e5e5e5;">
          ${article.imageUrl ? `
            <a href="${url}" style="display: block; margin-bottom: 16px;">
              <img src="${article.imageUrl}" alt="${article.headline}" style="width: 100%; max-width: 600px; height: auto; border-radius: 8px;" />
            </a>
          ` : ''}

          <h2 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 700; line-height: 1.3;">
            <a href="${url}" style="color: #000; text-decoration: none;">${article.headline}</a>
          </h2>

          <p style="margin: 0 0 12px 0; font-size: 16px; color: #666; font-style: italic;">
            ${article.subHeadline}
          </p>

          <div style="margin-bottom: 12px;">
            <span style="font-size: 12px; color: #999;">
              By <strong style="color: #666;">${article.authorName}</strong> • ${pubDate}
            </span>
          </div>

          <a href="${url}" style="display: inline-block; padding: 10px 20px; background-color: #000; color: #fff; text-decoration: none; border-radius: 4px; font-size: 14px; font-weight: 600;">
            Read Full Article →
          </a>
        </td>
      </tr>
    `;
  }).join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: Georgia, serif; background-color: #f9fafb;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden;">

          <!-- Header -->
          <tr>
            <td style="padding: 40px 30px; background-color: #000; text-align: center;">
              <h1 style="margin: 0; color: #fff; font-size: 32px; font-weight: 900; letter-spacing: 0.05em;">
                MORNING PULSE
              </h1>
              <p style="margin: 12px 0 0 0; color: #fff; font-size: 14px; letter-spacing: 0.1em; text-transform: uppercase;">
                ${title}
              </p>
            </td>
          </tr>

          <!-- Date -->
          <tr>
            <td style="padding: 20px 30px; background-color: #f9fafb; border-bottom: 2px solid #000;">
              <p style="margin: 0; font-size: 14px; color: #666; text-align: center;">
                ${currentDate}
              </p>
            </td>
          </tr>

          <!-- Articles -->
          <tr>
            <td style="padding: 0 30px;">
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                ${articleHTML}
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px; background-color: #f9fafb; text-align: center; border-top: 1px solid #e5e5e5;">
              <p style="margin: 0 0 12px 0; font-size: 12px; color: #999;">
                You're receiving this because you subscribed to Morning Pulse newsletters.
              </p>
              <p style="margin: 0; font-size: 12px;">
                <a href="https://kudzimusar.github.io/morning-pulse/?action=manage" style="color: #000; text-decoration: underline;">Manage Subscription</a>
                •
                <a href="https://kudzimusar.github.io/morning-pulse/?action=unsubscribe" style="color: #000; text-decoration: underline;">Unsubscribe</a>
                •
                <a href="https://kudzimusar.github.io/morning-pulse/privacy-policy" style="color: #000; text-decoration: underline;">Privacy Policy</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Cloud Function: Scheduled newsletter sender
 * Automatically sends newsletters on schedule (can be triggered by Cloud Scheduler)
 */
exports.sendScheduledNewsletter = async (req, res) => {
  return corsHandler(req, res, async () => {

    try {
      const { newsletterType = 'weekly' } = req.body || {};

      // Get recent published opinions (last 7 days for weekly, 1 day for daily)
      const cutoffDate = new Date();
      if (newsletterType === 'weekly') {
        cutoffDate.setDate(cutoffDate.getDate() - 7);
      } else if (newsletterType === 'daily') {
        cutoffDate.setDate(cutoffDate.getDate() - 1);
      }

      const opinionsRef = db.collection('artifacts')
        .doc(APP_ID)
        .collection('public')
        .doc('data')
        .collection('opinions');

      const snapshot = await opinionsRef
        .where('status', '==', 'published')
        .where('publishedAt', '>=', cutoffDate)
        .orderBy('publishedAt', 'desc')
        .limit(15)
        .get();

      const articles = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        articles.push({
          id: doc.id,
          headline: data.headline,
          subHeadline: data.subHeadline,
          authorName: data.authorName,
          slug: data.slug,
          publishedAt: data.publishedAt?.toDate?.() || new Date(),
          imageUrl: data.finalImageUrl || data.imageUrl
        });
      });

      if (articles.length === 0) {
        res.status(200).json({
          success: true,
          message: 'No new articles for newsletter period',
          articlesCount: 0
        });
        return;
      }

      // Generate newsletter HTML
      const title = `Morning Pulse ${newsletterType === 'weekly' ? 'Weekly' : 'Daily'} Digest`;
      const currentDate = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });

      // Fetch active newsletter ads
      let ads = {};
      try {
        const adsRef = db.collection('artifacts')
          .doc(APP_ID)
          .collection('public')
          .doc('data')
          .collection('ads');

        const activeAdsSnapshot = await adsRef
          .where('status', '==', 'active')
          .where('placement', 'in', ['newsletter_top', 'newsletter_inline', 'newsletter_footer'])
          .get();

        const activeAds = [];
        activeAdsSnapshot.forEach(doc => {
          const data = doc.data();
          activeAds.push({
            id: doc.id,
            advertiserName: data.advertiserName || 'Sponsor',
            headline: data.title,
            body: data.description,
            imageUrl: data.creativeUrl,
            destinationUrl: data.destinationUrl,
            placement: data.placement
          });
        });

        ads = {
          top: activeAds.find(a => a.placement === 'newsletter_top'),
          inline: activeAds.filter(a => a.placement === 'newsletter_inline'),
          footer: activeAds.find(a => a.placement === 'newsletter_footer')
        };
      } catch (adError) {
        console.warn('⚠️ Could not fetch ads for newsletter:', adError.message);
      }

      const newsletterHTML = generateNewsletterHTML({
        title,
        currentDate,
        articles,
        ads,
        type: newsletterType
      });

      // Get subscribers
      const subscribers = await getNewsletterSubscribers();

      if (subscribers.length === 0) {
        res.status(200).json({
          success: true,
          message: 'No subscribers found',
          articlesCount: articles.length
        });
        return;
      }

      // Send newsletter
      const results = await sendNewsletterEmail({
        subject: `Morning Pulse ${newsletterType === 'weekly' ? 'Weekly' : 'Daily'} Digest`,
        html: newsletterHTML
      }, subscribers);

      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;

      // Log analytics
      try {
        const sendId = `${newsletterType}_${Date.now()}`;
        const sentAt = admin.firestore.FieldValue.serverTimestamp();

        await db.collection('artifacts')
          .doc(APP_ID)
          .collection('analytics')
          .doc('newsletters')
          .collection('sends')
          .doc(sendId)
          .set({
            subject: title,
            sentAt,
            totalSubscribers: subscribers.length,
            targetedSubscribers: subscribers.length,
            successfulSends: successful,
            failedSends: failed,
            newsletterType,
            articlesCount: articles.length,
            adIds: [
              ...(ads.top ? [ads.top.id] : []),
              ...(ads.inline ? ads.inline.map(a => a.id) : []),
              ...(ads.footer ? [ads.footer.id] : [])
            ]
          });

        // Log Ad Impressions
        const adImpressionsRef = db.collection('artifacts')
          .doc(APP_ID)
          .collection('analytics')
          .doc('newsletterAdImpressions')
          .collection('logs');

        const impressionLogs = [];
        if (ads.top) impressionLogs.push({ adId: ads.top.id, placement: 'top' });
        if (ads.inline) ads.inline.forEach(a => impressionLogs.push({ adId: a.id, placement: 'inline' }));
        if (ads.footer) impressionLogs.push({ adId: ads.footer.id, placement: 'footer' });

        for (const log of impressionLogs) {
          await adImpressionsRef.add({
            ...log,
            newsletterSendId: sendId,
            sentAt,
            impressionCount: successful // Each successful email is one impression
          });
        }
      } catch (logError) {
        console.error('❌ Failed to log newsletter analytics:', logError);
      }

      res.status(200).json({
        success: true,
        message: `Scheduled ${newsletterType} newsletter sent to ${successful} subscribers`,
        stats: {
          articlesCount: articles.length,
          subscribersCount: subscribers.length,
          successfulSends: successful,
          failedSends: failed
        }
      });

    } catch (error) {
      console.error('❌ Scheduled newsletter error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });
};



/**
 * Part A: The Redirect Cloud Function (handleShortLink)
 * Handles requests from /s/** for social media unfurling and user redirection.
 */
// ============================================
// WRITER PERFORMANCE METRICS (Sprint 3)
// ============================================

/**
 * Cloud Function: Compute Writer Metrics
 * Aggregates writer performance stats from opinions collection
 * Can be triggered by HTTP request or Cloud Scheduler
 */
exports.computeWriterMetrics = async (req, res) => {
  // Set CORS headers and handle preflight
  if (setCorsHeaders(req, res)) return;

  try {
    if (!db) {
      res.status(500).json({ error: 'Firebase not initialized' });
      return;
    }

    console.log('📊 Computing writer metrics...');

    // Get all opinions to aggregate stats
    const opinionsRef = db.collection('artifacts')
      .doc(APP_ID)
      .collection('public')
      .doc('data')
      .collection('opinions');

    const opinionsSnap = await opinionsRef.get();

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Aggregate by writerId (authorId)
    const writerStats = {};

    opinionsSnap.forEach(docSnap => {
      const data = docSnap.data();
      const writerId = data.authorId;

      // Skip if no authorId (anonymous submissions)
      if (!writerId) return;

      // Initialize writer stats if needed
      if (!writerStats[writerId]) {
        writerStats[writerId] = {
          writerId,
          writerName: data.authorName || 'Unknown',
          rolling30d: {
            submitted: 0,
            published: 0,
            rejected: 0,
            totalReviewHours: 0,
            reviewedCount: 0,
            totalViews: 0,
          },
          lifetime: {
            totalSubmitted: 0,
            totalPublished: 0,
            totalRejected: 0,
            totalViews: 0,
            firstPublishedAt: null,
            lastPublishedAt: null,
          },
          categoryBreakdown: {}
        };
      }

      const stats = writerStats[writerId];
      const submittedAt = data.submittedAt?.toDate?.() || new Date();
      const publishedAt = data.publishedAt?.toDate?.();
      const status = data.status;
      const category = data.category || 'general';

      // Update writer name if newer
      if (data.authorName) stats.writerName = data.authorName;

      // Lifetime stats
      stats.lifetime.totalSubmitted++;

      if (status === 'published') {
        stats.lifetime.totalPublished++;

        // Track first/last published dates
        if (publishedAt) {
          if (!stats.lifetime.firstPublishedAt || publishedAt < stats.lifetime.firstPublishedAt) {
            stats.lifetime.firstPublishedAt = publishedAt;
          }
          if (!stats.lifetime.lastPublishedAt || publishedAt > stats.lifetime.lastPublishedAt) {
            stats.lifetime.lastPublishedAt = publishedAt;
          }
        }

        // Category breakdown
        if (!stats.categoryBreakdown[category]) {
          stats.categoryBreakdown[category] = { published: 0, views: 0 };
        }
        stats.categoryBreakdown[category].published++;

        // Calculate review time
        if (publishedAt && submittedAt) {
          const reviewHours = (publishedAt.getTime() - submittedAt.getTime()) / (1000 * 60 * 60);
          stats.rolling30d.totalReviewHours += reviewHours;
          stats.rolling30d.reviewedCount++;
        }
      } else if (status === 'rejected') {
        stats.lifetime.totalRejected++;
      }

      // 30-day stats
      if (submittedAt >= thirtyDaysAgo) {
        stats.rolling30d.submitted++;
        if (status === 'published') stats.rolling30d.published++;
        if (status === 'rejected') stats.rolling30d.rejected++;
      }
    });

    // Calculate derived metrics and save
    const metricsRef = db.collection('artifacts')
      .doc(APP_ID)
      .collection('public')
      .doc('data')
      .collection('writerMetrics');

    const batch = db.batch();
    let processedCount = 0;

    for (const writerId in writerStats) {
      const stats = writerStats[writerId];

      // Calculate averages and rates
      const avgReviewHours = stats.rolling30d.reviewedCount > 0
        ? stats.rolling30d.totalReviewHours / stats.rolling30d.reviewedCount
        : 0;

      const rejectionRate = stats.lifetime.totalSubmitted > 0
        ? (stats.lifetime.totalRejected / stats.lifetime.totalSubmitted) * 100
        : 0;

      const avgViewsPerArticle = stats.lifetime.totalPublished > 0
        ? stats.lifetime.totalViews / stats.lifetime.totalPublished
        : 0;

      const metricsDoc = {
        writerId,
        writerName: stats.writerName,
        rolling30d: {
          submitted: stats.rolling30d.submitted,
          published: stats.rolling30d.published,
          rejected: stats.rolling30d.rejected,
          avgReviewHours: Math.round(avgReviewHours * 10) / 10,
          rejectionRate: Math.round((stats.rolling30d.rejected / Math.max(stats.rolling30d.submitted, 1)) * 1000) / 10,
          totalViews: stats.rolling30d.totalViews,
          avgViewsPerArticle: 0 // Views tracking not implemented yet
        },
        lifetime: {
          totalSubmitted: stats.lifetime.totalSubmitted,
          totalPublished: stats.lifetime.totalPublished,
          totalRejected: stats.lifetime.totalRejected,
          totalViews: stats.lifetime.totalViews,
          avgViewsPerArticle: Math.round(avgViewsPerArticle * 10) / 10,
          firstPublishedAt: stats.lifetime.firstPublishedAt || null,
          lastPublishedAt: stats.lifetime.lastPublishedAt || null,
        },
        lastComputed: admin.firestore.FieldValue.serverTimestamp(),
        categoryBreakdown: stats.categoryBreakdown
      };

      const writerMetricRef = metricsRef.doc(writerId);
      batch.set(writerMetricRef, metricsDoc, { merge: true });
      processedCount++;
    }

    await batch.commit();

    console.log(`✅ Writer metrics computed for ${processedCount} writers`);

    res.status(200).json({
      success: true,
      message: `Computed metrics for ${processedCount} writers`,
      writersProcessed: processedCount,
      computedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error computing writer metrics:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.handleShortLink = async (req, res) => {
  // Extract the ID from the URL (e.g., /s/Abc123 -> Abc123)
  const pathParts = req.path.split('/');
  const shortId = pathParts[pathParts.length - 1];

  if (!shortId) {
    return res.status(404).send('Short link ID missing');
  }

  try {
    if (!db) {
      console.error('❌ Firestore not initialized in handleShortLink');
      return res.status(500).send('Internal Server Error');
    }

    // 2. Lookup the originalUrl and metadata from Firestore
    const shortLinkDoc = await db.collection('short_links').doc(shortId).get();

    if (!shortLinkDoc.exists) {
      console.warn(`⚠️ Short link not found: ${shortId}`);
      return res.status(404).send('Short link not found');
    }

    const data = shortLinkDoc.data();
    const { originalUrl, title, summary, coverImage } = data;

    // Increment click count asynchronously
    db.collection('short_links').doc(shortId).update({
      clicks: admin.firestore.FieldValue.increment(1)
    }).catch(err => console.error('Error incrementing clicks:', err));

    // 3. Unfurling Logic: Detect Social Media Bots
    const userAgent = req.headers['user-agent'] || '';
    const isBot = /Twitterbot|facebookexternalhit|WhatsApp|TelegramBot|Slackbot|LinkedInBot|Embedly/i.test(userAgent);

    if (isBot) {
      console.log(`🤖 Bot detected: ${userAgent}. Serving metadata for ${shortId}`);
      // Return static HTML with Open Graph tags
      const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <meta name="description" content="${summary}">
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="article">
    <meta property="og:url" content="${originalUrl}">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${summary}">
    <meta property="og:image" content="${coverImage}">

    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:url" content="${originalUrl}">
    <meta property="twitter:title" content="${title}">
    <meta property="twitter:description" content="${summary}">
    <meta property="twitter:image" content="${coverImage}">
</head>
<body>
    <p>Redirecting to <a href="${originalUrl}">${title}</a>...</p>
    <script>window.location.href = "${originalUrl}";</script>
</body>
</html>`;
      res.set('Content-Type', 'text/html');
      return res.status(200).send(html);
    }

    // 4. User Logic: Redirect human users
    console.log(`👤 Human user detected. Redirecting ${shortId} to ${originalUrl}`);
    return res.redirect(301, originalUrl);

  } catch (error) {
    console.error('❌ Error in handleShortLink:', error);
    return res.status(500).send('Internal Server Error');
  }
};

/**
 * generateWriterStatements - Generates monthly payment statements for writers
 * 
 * HTTP Cloud Function that creates payment statements for writers based on 
 * their published articles in the specified period.
 * 
 * Query params:
 *   - periodStart: ISO date string (required) - Start of billing period
 *   - periodEnd: ISO date string (required) - End of billing period
 *   - writerId: string (optional) - Generate for specific writer only
 * 
 * Collection: writerPayments/{writerUid}/statements/{statementId}
 */
exports.generateWriterStatements = async (req, res) => {
  // CORS handling
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).send('');
  }

  try {
    // Get period parameters
    const { periodStart, periodEnd, writerId } = req.query;

    if (!periodStart || !periodEnd) {
      return res.status(400).json({
        success: false,
        error: 'periodStart and periodEnd query parameters are required'
      });
    }

    const startDate = new Date(periodStart);
    const endDate = new Date(periodEnd);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date format. Use ISO date strings.'
      });
    }

    console.log(`📊 Generating statements for period: ${periodStart} to ${periodEnd}`);

    // Build query for published opinions in the period
    let opinionsQuery = db.collection('opinions')
      .where('status', '==', 'published')
      .where('publishedAt', '>=', startDate)
      .where('publishedAt', '<=', endDate);

    const opinionsSnapshot = await opinionsQuery.get();

    if (opinionsSnapshot.empty) {
      console.log('⚠️ No published opinions found in the specified period');
      return res.status(200).json({
        success: true,
        message: 'No published articles in the specified period',
        statementsGenerated: 0
      });
    }

    // Group opinions by writer
    const writerArticles = {};

    opinionsSnapshot.forEach((doc) => {
      const opinion = doc.data();
      const authorId = opinion.authorId;

      // Skip if filtering by specific writer and this isn't them
      if (writerId && authorId !== writerId) {
        return;
      }

      if (!writerArticles[authorId]) {
        writerArticles[authorId] = {
          writerId: authorId,
          writerName: opinion.authorName || 'Unknown',
          articles: []
        };
      }

      // Calculate word count from body
      const wordCount = opinion.body ? opinion.body.split(/\s+/).filter(w => w.length > 0).length : 0;

      writerArticles[authorId].articles.push({
        opinionId: doc.id,
        headline: opinion.headline || 'Untitled',
        publishedAt: opinion.publishedAt?.toDate ? opinion.publishedAt.toDate() : new Date(opinion.publishedAt),
        wordCount: wordCount
      });
    });

    // Fetch writer payment profiles and generate statements
    const batch = db.batch();
    let statementsGenerated = 0;

    for (const authorId of Object.keys(writerArticles)) {
      const writerData = writerArticles[authorId];

      // Fetch writer's payment profile
      const writerDoc = await db.collection('writers').doc(authorId).get();
      let paymentProfile = {
        model: 'per-article',
        rate: 0,
        currency: 'USD',
        payoutMethod: 'manual'
      };

      if (writerDoc.exists) {
        const writerProfile = writerDoc.data();
        if (writerProfile.paymentProfile) {
          paymentProfile = {
            ...paymentProfile,
            ...writerProfile.paymentProfile
          };
        }
        writerData.writerName = writerProfile.displayName || writerProfile.name || writerData.writerName;
      }

      // Calculate total amounts based on payment model
      let totalAmountDue = 0;
      const totalWords = writerData.articles.reduce((sum, a) => sum + a.wordCount, 0);
      const articlesCount = writerData.articles.length;

      switch (paymentProfile.model) {
        case 'per-article':
          totalAmountDue = articlesCount * (paymentProfile.rate || 0);
          break;
        case 'per-word':
          totalAmountDue = totalWords * (paymentProfile.rate || 0);
          break;
        case 'salary':
          // For salary model, rate represents monthly salary
          totalAmountDue = paymentProfile.rate || 0;
          break;
        default:
          totalAmountDue = 0;
      }

      // Calculate per-article amounts for statement details
      const articlesWithAmounts = writerData.articles.map(article => ({
        ...article,
        amount: paymentProfile.model === 'per-article'
          ? (paymentProfile.rate || 0)
          : paymentProfile.model === 'per-word'
            ? article.wordCount * (paymentProfile.rate || 0)
            : totalAmountDue / articlesCount // Distribute salary evenly
      }));

      // Create statement document
      const statementId = `${periodStart.substring(0, 7)}-${Date.now()}`;
      const statementRef = db.collection('writerPayments').doc(authorId)
        .collection('statements').doc(statementId);

      const statement = {
        id: statementId,
        writerId: authorId,
        writerName: writerData.writerName,
        periodStart: startDate,
        periodEnd: endDate,
        paymentModel: paymentProfile.model,
        rate: paymentProfile.rate || 0,
        currency: paymentProfile.currency || 'USD',
        articlesCount: articlesCount,
        wordsCount: totalWords,
        totalAmountDue: totalAmountDue,
        status: 'pending',
        generatedAt: admin.firestore.FieldValue.serverTimestamp(),
        articles: articlesWithAmounts
      };

      batch.set(statementRef, statement);
      statementsGenerated++;

      console.log(`📝 Generated statement for ${writerData.writerName}: ${articlesCount} articles, ${paymentProfile.currency} ${totalAmountDue.toFixed(2)}`);
    }

    await batch.commit();

    console.log(`✅ Generated ${statementsGenerated} payment statements`);

    res.status(200).json({
      success: true,
      message: `Generated ${statementsGenerated} payment statements`,
      statementsGenerated: statementsGenerated,
      period: {
        start: periodStart,
        end: periodEnd
      }
    });

  } catch (error) {
    console.error('❌ Error generating writer statements:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * autoPublishScheduledStories - Server-side auto-publisher for scheduled stories
 * 
 * HTTP Cloud Function that checks for scheduled stories and publishes them
 * when their scheduled time has passed. This replaces client-side polling
 * for more reliable scheduled publishing.
 * 
 * RECOMMENDED: Set up Cloud Scheduler to call this every 5 minutes
 *   - Cron expression: "0/5 * * * *" (every 5 minutes)
 *   - Target: HTTP
 *   - URL: https://[region]-[project-id].cloudfunctions.net/autoPublishScheduledStories
 * 
 * Can also be called manually via HTTP GET/POST.
 * 
 * Collection: artifacts/morning-pulse-app/public/data/opinions
 */
exports.autoPublishScheduledStories = async (req, res) => {
  // CORS handling
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).send('');
  }

  try {
    console.log('🕐 Auto-publisher: Checking for scheduled stories...');

    const now = new Date();

    // Query for scheduled stories where scheduledFor has passed
    const opinionsRef = db.collection('artifacts')
      .doc('morning-pulse-app')
      .collection('public')
      .collection('data')
      .collection('opinions');

    const scheduledQuery = opinionsRef
      .where('status', '==', 'scheduled');

    const snapshot = await scheduledQuery.get();

    if (snapshot.empty) {
      console.log('📭 No scheduled stories found');
      return res.status(200).json({
        success: true,
        message: 'No scheduled stories to publish',
        publishedCount: 0,
        checkedAt: now.toISOString()
      });
    }

    console.log(`📋 Found ${snapshot.size} scheduled stories to check`);

    const batch = db.batch();
    let publishedCount = 0;
    const publishedStories = [];

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      const scheduledFor = data.scheduledFor?.toDate ? data.scheduledFor.toDate() :
        data.scheduledFor ? new Date(data.scheduledFor) : null;

      if (!scheduledFor) {
        console.warn(`⚠️ Story ${docSnap.id} is scheduled but has no scheduledFor timestamp`);
        continue;
      }

      // Check if scheduled time has passed
      if (scheduledFor <= now) {
        console.log(`📰 Auto-publishing: "${data.headline}" (scheduled for ${scheduledFor.toISOString()})`);

        const docRef = opinionsRef.doc(docSnap.id);

        batch.update(docRef, {
          status: 'published',
          publishedAt: admin.firestore.FieldValue.serverTimestamp(),
          autoPublished: true,
          autoPublishedAt: admin.firestore.FieldValue.serverTimestamp(),
          // Keep editorialMeta approval timestamp for SLA tracking
          'editorialMeta.approvalAt': admin.firestore.FieldValue.serverTimestamp()
        });

        publishedCount++;
        publishedStories.push({
          id: docSnap.id,
          headline: data.headline || 'Untitled',
          scheduledFor: scheduledFor.toISOString(),
          authorName: data.authorName || 'Unknown'
        });
      } else {
        const timeUntil = Math.round((scheduledFor - now) / 1000 / 60);
        console.log(`⏰ Story "${data.headline}" scheduled for ${timeUntil} minutes from now`);
      }
    }

    if (publishedCount > 0) {
      await batch.commit();
      console.log(`✅ Auto-published ${publishedCount} stories`);

      // Log to auto-publish audit collection (optional)
      try {
        await db.collection('autoPublishLog').add({
          publishedCount,
          publishedStories,
          executedAt: admin.firestore.FieldValue.serverTimestamp(),
          triggeredBy: 'cloud-function'
        });
      } catch (logError) {
        console.warn('Could not write to audit log:', logError.message);
      }
    }

    res.status(200).json({
      success: true,
      message: publishedCount > 0
        ? `Auto-published ${publishedCount} scheduled stories`
        : 'No stories were ready to publish',
      publishedCount,
      publishedStories,
      checkedAt: now.toISOString()
    });

  } catch (error) {
    console.error('❌ Error in auto-publisher:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};


// Export Ask Pulse AI Proxy function
try {
  const askPulseAIProxyModule = require('./askPulseAIProxy');
  if (askPulseAIProxyModule && askPulseAIProxyModule.askPulseAIProxy) {
    exports.askPulseAIProxy = askPulseAIProxyModule.askPulseAIProxy;
    console.log('✅ askPulseAIProxy function exported successfully.');
  } else {
    console.warn('⚠️ askPulseAIProxy module loaded but function not found');
  }
} catch (error) {
  console.error('❌ Failed to load askPulseAIProxy module:', error.message);
  // Don't throw - allow other functions to work
}
