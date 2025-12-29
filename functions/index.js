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

// --- CONFIGURATION ---

// Constants and Environment Variables
const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID;
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const WHATSAPP_VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const APP_ID = process.env.APP_ID || 'morning-pulse-app';

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

const SYSTEM_PROMPT = `You are "Morning Pulse", a high-density news aggregator for Zimbabwe. 
Your output must mirror the professional "Kukurigo" style.

1. CATEGORY COVERAGE: You must summarize news from all 7 categories: Local, Business, Africa, Global, Sports, Tech, and General.

2. FORMATTING RULES:
   - HEADER: _In the Press [Current Date]: [One sentence summary of the 2 most important global or local headlines]_
   - BODY: For each news item, provide a 2-3 sentence paragraph. 
   - CITATION: Every paragraph MUST end with an italicized bold source (e.g., _*— NewsDay*_ or _*— Bloomberg*_).
   - SEPARATOR: Use a single empty line between different news stories.
   - FOOTER: _Morning Pulse Updates©️_

3. TONE: Factual, journalistic, and strictly objective. Do not add personal AI commentary.`;

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

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

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
      const searchQuery = categoryQueries[category] || 'news today';
      const prompt = `Find the top 3-5 most important and recent news stories for: ${category}.
Search for: ${searchQuery}

For each story, provide:
1. A clear headline (max 100 characters)
2. A detailed 2-3 sentence summary
3. The source/publication name
4. The URL if available

Format as JSON array:
[
  {
    "headline": "Headline text",
    "detail": "Detailed summary",
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
async function handleNewsQuery(userMessage, userId) {
  try {
    // Get current date for header
    const today = new Date();
    const dateStr = today.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    
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
    
    // Step 4: Use gemini-2.5-flash for response generation with timeout
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        maxOutputTokens: 1024
      }
    });
    
    // Step 5: Build comprehensive prompt
    const prompt = `${SYSTEM_PROMPT}

Today's Date: ${dateStr}

Available News Data (all 7 categories):
${formattedNews}

User Request: ${userMessage}

Generate a complete Morning Pulse news bulletin in the exact Kukurigo style format specified above. 
- Include news from all available categories
- Use the header format with date
- Write 2-3 sentence paragraphs for each story
- End each paragraph with source citation: _*— Source Name*_
- Use empty lines between stories
- End with footer: _Morning Pulse Updates©️_

If the user asks a specific question, answer it using the news context provided. If they ask for "news" or "update", provide the full formatted bulletin.`;

    // Generate content with timeout
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Request timeout after 30 seconds')), 30000)
    );
    
    const generatePromise = model.generateContent(prompt);
    const result = await Promise.race([generatePromise, timeoutPromise]);
    const response = result.response;
    const text = response.text();

    if (!text || text.trim() === '') {
      console.error('❌ Empty response from Gemini API');
      return "I'm sorry, I couldn't generate a response. Please try again.";
    }

    console.log(`✅ Gemini AI response generated with Kukurigo formatting (${text.length} characters)`);
    return text;
    
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
            const aiResponse = await handleNewsQuery(messageText, from);
            
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
  console.warn('newsAggregator module not available:', error.message);
  console.warn('News aggregation features will be unavailable.');
}
