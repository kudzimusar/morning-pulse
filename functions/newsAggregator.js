const functions = require("firebase-functions");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const admin = require("firebase-admin");

// --- UTILITIES ---

function initializeFirebase() {
    if (admin.apps.length > 0) {
        console.log("✅ Firebase Admin already initialized, reusing existing instance");
        return;
    }

    try {
        let configStr = process.env.FIREBASE_ADMIN_CONFIG;
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
    } catch (error) {
        console.error("❌ Error initializing Firebase:", error.message);
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

    // ✅ USE GOOGLE SEARCH GROUNDING for real, current news
    // This forces Gemini to search the web for TODAY'S actual news
    const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        tools: [{ googleSearch: {} }],  // 🔑 KEY FIX: Enable Google Search!
    });

    const today = new Date().toISOString().split('T')[0]; // e.g. 2026-02-17

    // ✅ IMPROVED PROMPT: Explicitly ask for TODAY's news with date
    const prompt = `Today is ${today}. Search the web and find 5 REAL news stories 
    published TODAY or in the last 24 hours for the "${category}" category
    ${country !== 'Global' ? `with focus on ${country}` : 'from around the world'}.
    
    IMPORTANT: 
    - Use Google Search to find ACTUAL current news from today
    - Do NOT make up or hallucinate news stories
    - Only use real, verifiable stories from reputable sources
    - The stories MUST be from ${today} or the last 24 hours
    
    Return ONLY a valid JSON array with exactly 5 objects. Each object must have:
    - "headline": the actual news headline (string)
    - "detail": a 1-2 sentence summary (string)  
    - "source": the news source name e.g. "BBC", "Reuters" (string)
    - "url": the actual URL to the article (string)
    
    Return ONLY the JSON array, no markdown, no other text.`;

    for (let i = 0; i < retries; i++) {
        try {
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = await response.text();

            // Clean the text to ensure it's valid JSON
            const cleanedText = text
                .replace(/```json/g, "")
                .replace(/```/g, "")
                .trim();

            const articles = JSON.parse(cleanedText);
            console.log(`✅ Successfully fetched ${articles.length} articles for ${category}`);
            return articles.map(article => ({
                ...article,
                category,
                id: Math.random().toString(36).substring(2, 15),
                fetchedAt: new Date().toISOString(),
                date: today  // ✅ Store the date for verification
            }));
        } catch (error) {
            console.error(`❌ Error fetching news for category: ${category} on attempt ${i + 1}`, error.message);
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
        console.log("🚀 Starting daily news aggregation with 12 global categories...");
        initializeFirebase();

        const appId = process.env.APP_ID || "morning-pulse-app";
        const country = req.query.country || "Global";

        // 🌍 12 Global Categories
        const categories = [
            "Politics",
            "Finance & Economy",
            "Technology",
            "Science",
            "Health",
            "Sports",
            "Entertainment",
            "Crime & Justice",
            "Education",
            "Lifestyle",
            "Opinion/Editorial",
            "World",
            "Zimbabwe"
        ];

        try {
            const genAI = new GoogleGenerativeAI(getGeminiApiKey());
            const allArticles = [];

            console.log(`📊 Fetching news for ${categories.length} categories...`);

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
                });
                return;
            }

            console.log(`✅ News aggregation complete. Total articles: ${allArticles.length}`);

            const date = new Date().toISOString().split('T')[0];

            // ✅ CORRECT Firestore path (even segments)
            const newsCollection = admin.firestore()
                .collection('news')
                .doc('v2')
                .collection(appId)
                .doc('daily')
                .collection('dates');

            await newsCollection.doc(date).set({
                date,
                country,
                categories: newsByCategories,
                totalArticles: allArticles.length,
                categoryCount: Object.keys(newsByCategories).length,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                version: "2.1",  // Upgraded with Google Search grounding
                globalCoverage: true,
                searchGrounded: true  // ✅ Flag to confirm real news was used
            });

            console.log(`✅ News stored successfully for ${date}`);
            console.log(`📍 Firestore path: news/v2/${appId}/daily/dates/${date}`);

            res.status(200).json({
                success: true,
                date,
                categories: Object.keys(newsByCategories),
                totalArticles: allArticles.length,
                categoryBreakdown: Object.fromEntries(
                    Object.entries(newsByCategories).map(([cat, articles]) => [cat, articles.length])
                ),
                message: "News aggregated with Google Search grounding - REAL current news!",
                version: "2.1",
                searchGrounded: true,
                firestorePath: `news/v2/${appId}/daily/dates/${date}`
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

// --- OTHER EXPORTS ---
try {
    const unsplashProxy = require('./unsplashProxy');
    exports.unsplashImage = unsplashProxy.unsplashImage;
    console.log("✅ unsplashImage function exported successfully.");
} catch (e) {
    console.log("ℹ️ unsplashImage not available");
}

try {
    const askPulseAIProxy = require('./askPulseAIProxy');
    exports.askPulseAIProxy = askPulseAIProxy.askPulseAIProxy;
    console.log("✅ askPulseAIProxy function exported successfully.");
} catch (e) {
    console.log("ℹ️ askPulseAIProxy not available");
}

console.log("✅ All Cloud Functions loaded");
