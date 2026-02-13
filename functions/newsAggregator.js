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
    // 🔧 FIX: Decode Base64-encoded FIREBASE_ADMIN_CONFIG before parsing
    let configStr = process.env.FIREBASE_ADMIN_CONFIG;
    
    // Check if it's Base64 encoded (contains only Base64 characters)
    if (configStr && configStr.match(/^[A-Za-z0-9+/]+=*$/)) {
      console.log("✅ Detected Base64-encoded FIREBASE_ADMIN_CONFIG, decoding...");
      configStr = Buffer.from(configStr, 'base64').toString('utf-8');
      console.log("✅ Successfully decoded Base64 config");
    }
    
    const serviceAccount = JSON.parse(configStr);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: `https://gen-lang-client-0999441419.firebaseio.com`
    });
    console.log("✅ Firebase Admin initialized successfully.");
    firebaseAdminInitialized = true;
  } catch (error) {
    console.error("❌ Firebase config parsing failed:", error);
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

async function fetchNewsForCategory(genAI, category, country = "Zimbabwe", retries = 3) {
    console.log(`🌀 Fetching news for category: ${category} in ${country}...`);
    
    // ✅ ALREADY FIXED: Using gemini-1.5-flash (not deprecated gemini-pro)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Provide a list of 5 recent, real, and verifiable news headlines for the category "${category}" from ${country}. Present them as a VALID JSON array where each object has "headline", "detail", "source", and "url".`;

    for (let i = 0; i < retries; i++) {
        try {
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = await response.text();

            // Clean the text to ensure it's valid JSON
            const cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim();

            const articles = JSON.parse(cleanedText);
            console.log(`✅ Successfully fetched ${articles.length} articles for ${category}`);
            return articles.map(article => ({ ...article, category, id: Math.random().toString(36).substring(2, 15) }));
        } catch (error) {
            console.error(`❌ Error fetching news for category: ${category} on attempt ${i + 1}`, error);
            if (i < retries - 1) {
                await new Promise(res => setTimeout(res, 1000));
            }
        }
    }
    console.error(`❌ Failed to fetch news for category: ${category} after ${retries} attempts.`);
    return [];
}

exports.newsAggregator = functions
    .runWith({ timeoutSeconds: 540, memory: '1GB' })
    .https.onRequest(async (req, res) => {
        console.log("🚀 Starting daily news aggregation...");
        initializeFirebase();

        const appId = process.env.APP_ID || "morning-pulse-app";
        const country = req.query.country || "Zimbabwe";
        const categories = [
            "Local (Zim)",
            "Business (Zim)",
            "African Focus",
            "Global",
            "Sports",
            "Tech",
            "General News"
        ];

        try {
            const genAI = new GoogleGenerativeAI(getGeminiApiKey());
            const allArticles = [];
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
                 res.status(500).json({ success: false, message: "No articles could be fetched." });
                 return;
            }

            console.log(`✅ News aggregation complete. Total articles: ${allArticles.length}`);

            const date = new Date().toISOString().split('T')[0];
            const dbPath = `artifacts/${appId}/public/data/news/${date}`;

            await admin.firestore().doc(dbPath).set({
                date,
                country,
                categories: newsByCategories,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });

            console.log(`✅ News stored successfully for ${date} at ${dbPath}`);

            res.status(200).json({
                success: true,
                date,
                categories: Object.keys(newsByCategories),
                totalArticles: allArticles.length,
                message: "News aggregated successfully"
            });
        } catch (error) {
            console.error("❌ Critical error in news aggregation function:", error);
            res.status(500).json({
                success: false,
                message: "An unexpected error occurred during news aggregation.",
                error: error.message
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
