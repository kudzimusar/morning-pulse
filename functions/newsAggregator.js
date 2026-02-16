const functions = require("firebase-functions");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const admin = require("firebase-admin");

// --- UTILITIES ---
let firebaseAdminInitialized = false;

function initializeFirebase() {
  if (firebaseAdminInitialized) {
    console.log("✅ Using existing Firebase Admin instance");
    return;
  }
  try {
    // 🔧 FIX: Decode Base64 config before parsing
    let configStr = process.env.FIREBASE_ADMIN_CONFIG;
    
    // Check if it's Base64 encoded (matches Base64 pattern)
    if (configStr && configStr.match(/^[A-Za-z0-9+/]+=*$/)) {
      console.log("✅ Detected Base64-encoded config, decoding...");
      configStr = Buffer.from(configStr, 'base64').toString('utf-8');
    }
    
    const serviceAccount = JSON.parse(configStr);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: `https://gen-lang-client-0999441419.firebaseio.com`
    });
    console.log("✅ Firebase Admin initialized successfully.");
    firebaseAdminInitialized = true;
  } catch (error) {
    console.error("❌ Parsed Firebase config from FIREBASE_ADMIN_CONFIG failed", error);
    // Fallback for local testing if needed
    if (process.env.NODE_ENV !== 'production') {
        const serviceAccount = require("./serviceAccountKey.json");
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log("✅ Firebase Admin initialized with local key.");
        firebaseAdminInitialized = true;
    }
  }
}

function getGeminiApiKey() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("❌ GEMINI_API_KEY environment variable not set.");
        throw new functions.https.HttpsError('internal', 'GEMINI_API_KEY not configured.');
    }
    return apiKey;
}

// --- CORE NEWS AGGREGATION LOGIC ---

async function fetchNewsForCategory(genAI, category, country = "Global", retries = 3) {
    console.log(`🌀 Fetching news for category: ${category} (${country})...`);
    
    // ✅ CRITICAL FIX: Use gemini-2.5-flash (proven to work)
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Enhanced prompt for global categories
    const prompt = `Provide a list of 5 recent, real, and verifiable news headlines for the "${category}" category${country !== 'Global' ? ` with focus on ${country}` : ' from around the world'}. Present them as a VALID JSON array where each object has "headline", "detail", "source", and "url".`;

    for (let i = 0; i < retries; i++) {
        try {
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = await response.text();

            // Clean the text to ensure it's valid JSON
            const cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim();

            const articles = JSON.parse(cleanedText);
            console.log(`✅ Successfully fetched ${articles.length} articles for ${category}`);
            return articles.map(article => ({ 
                ...article, 
                category, 
                id: Math.random().toString(36).substring(2, 15),
                fetchedAt: new Date().toISOString()
            }));
        } catch (error) {
            console.error(`❌ Error fetching news for category: ${category} on attempt ${i + 1}`, error);
            if (i < retries - 1) {
                await new Promise(res => setTimeout(res, 1000)); // Wait 1 second before retrying
            }
        }
    }
    console.error(`❌ Failed to fetch news for category: ${category} after ${retries} attempts.`);
    return []; // Return empty array on failure to avoid breaking Promise.all
}

exports.newsAggregator = functions
    .runWith({ timeoutSeconds: 540, memory: '1GB' })
    .https.onRequest(async (req, res) => {
        console.log("🚀 Starting daily news aggregation with 12 global categories...");
        initializeFirebase();

        const appId = process.env.APP_ID || "morning-pulse-app";
        const country = req.query.country || "Global";
        
        // 🌍 NEW: 12 Global Categories for worldwide coverage
        const categories = [
            "Politics",              // Government, elections, policy
            "Finance & Economy",     // Markets, business, trade
            "Technology",            // AI, gadgets, startups, innovation
            "Science",               // Space, environment, research
            "Health",                // Medicine, wellness, public health
            "Sports",                // All sports, competitions, athletics
            "Entertainment",         // Movies, music, celebrity, culture
            "Crime & Justice",       // Law enforcement, courts, legal
            "Education",             // Schools, universities, learning
            "Lifestyle",             // Travel, food, fashion, living
            "Opinion/Editorial",     // Op-eds, analysis, commentary
            "World"                  // General international news
        ];

        try {
            const genAI = new GoogleGenerativeAI(getGeminiApiKey());
            const allArticles = [];
            
            console.log(`📊 Fetching news for ${categories.length} categories...`);
            
            // Fetch news for all categories in parallel
            const categoryPromises = categories.map(category =>
                fetchNewsForCategory(genAI, category, country)
            );

            const results = await Promise.all(categoryPromises);

            const newsByCategories = {};
            categories.forEach((category, index) => {
                newsByCategories[category] = results[index] || [];
                allArticles.push(...(results[index] || []));
            });

            if (allArticles.length === 0) {
                 console.warn("⚠️ No articles were fetched across all categories. Aborting storage.");
                 res.status(500).json({ 
                     success: false, 
                     message: "No articles could be fetched.",
                     categories: categories.length,
                     attemptedCategories: categories
                 });
                 return;
            }

            console.log(`✅ News aggregation complete. Total articles: ${allArticles.length} across ${Object.keys(newsByCategories).length} categories`);

            const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
            
            // 🔧 FIX: Correct Firestore path with EVEN number of segments
            // OLD (BROKEN): news/v2/morning-pulse-app/daily/2026-02-16 = 5 segments (odd)
            // NEW (FIXED): news/v2/morning-pulse-app/daily/dates/2026-02-16 = 6 segments (even)
            const dbPath = `news/v2/${appId}/daily/dates/${date}`;

            await admin.firestore().doc(dbPath).set({
                date,
                country,
                categories: newsByCategories,
                totalArticles: allArticles.length,
                categoryCount: Object.keys(newsByCategories).length,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                version: "2.0", // Upgraded to 12 global categories
                globalCoverage: true
            });

            console.log(`✅ News stored successfully for ${date} at ${dbPath}`);
            console.log(`📈 Coverage: ${Object.keys(newsByCategories).length} categories, ${allArticles.length} total articles`);

            res.status(200).json({
                success: true,
                date,
                categories: Object.keys(newsByCategories),
                totalArticles: allArticles.length,
                categoryBreakdown: Object.fromEntries(
                    Object.entries(newsByCategories).map(([cat, articles]) => [cat, articles.length])
                ),
                message: "News aggregated successfully",
                version: "2.0",
                globalCoverage: true
            });
        } catch (error) {
            console.error("❌ Critical error in news aggregation function:", error);
            res.status(500).json({
                success: false,
                message: "An unexpected error occurred during news aggregation.",
                error: error.message,
                stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined
            });
        }
    });

// --- OTHER EXPORTS (for completeness) ---
try {
    const unsplashProxy = require('./unsplashProxy');
    exports.unsplashImage = unsplashProxy.unsplashImage;
    console.log("✅ unsplashImage function exported successfully.");
} catch (e) { console.error("Could not export unsplashImage", e); }

try {
    const askPulseAIProxy = require('./askPulseAIProxy');
    exports.askPulseAIProxy = askPulseAIProxy.askPulseAIProxy;
    console.log("✅ askPulseAIProxy function exported successfully.");
} catch(e) { console.error("Could not export askPulseAIProxy", e); }
