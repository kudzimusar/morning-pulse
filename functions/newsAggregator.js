/**
 * Daily News Aggregation Service for Google Cloud Functions
 * Entry point: newsAggregator
 * 
 * This function uses Gemini AI with googleSearch to fetch real news articles
 * for multiple categories and stores them in Firestore for both the bot and website.
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const admin = require('firebase-admin');

// --- CONFIGURATION ---
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const APP_ID = process.env.APP_ID || 'morning-pulse-app';

// News categories to fetch
const NEWS_CATEGORIES = [
  'Local (Zim)',
  'Business (Zim)',
  'African Focus',
  'Global',
  'Sports',
  'Tech',
  'General News'
];

// Initialize Firebase Admin
let db;
try {
  if (!admin.apps.length) {
    const configString = process.env.FIREBASE_ADMIN_CONFIG;
    
    if (!configString || configString.trim() === '') {
      console.warn('FIREBASE_ADMIN_CONFIG is empty. Firestore will be unavailable.');
    } else {
      const serviceAccount = JSON.parse(configString);
      
      if (serviceAccount.project_id && serviceAccount.private_key) {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount)
        });
        db = admin.firestore();
        console.log('✅ Firebase Admin initialized successfully in newsAggregator');
      } else {
        console.warn('Firebase config incomplete');
      }
    }
  } else {
    db = admin.firestore();
    console.log('✅ Using existing Firebase Admin instance');
  }
} catch (error) {
  console.error('❌ Firebase initialization error:', error.message);
}

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

/**
 * Generate search query for a category - focused on today's breaking news
 */
function getCategorySearchQuery(category) {
  // Get today's date in a more specific format for better search results
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  const queries = {
    'Local (Zim)': `breaking news Zimbabwe ${dateStr} latest headlines`,
    'Business (Zim)': `Zimbabwe business news ${dateStr} economy latest developments`,
    'African Focus': `Africa breaking news ${dateStr} latest headlines`,
    'Global': `world breaking news ${dateStr} latest headlines`,
    'Sports': `sports breaking news ${dateStr} latest scores results`,
    'Tech': `technology breaking news ${dateStr} latest innovations`,
    'General News': `breaking news ${dateStr} latest headlines worldwide`
  };
  return queries[category] || `breaking news ${dateStr} latest headlines`;
}

/**
 * Fetch news for a specific category using Gemini AI with googleSearch
 */
async function fetchNewsForCategory(category) {
  try {
    const searchQuery = getCategorySearchQuery(category);
    const today = new Date();
    const dateStr = today.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });

    const prompt = `Find ONLY the top 3-5 most IMPORTANT BREAKING NEWS stories from TODAY (${dateStr}) related to: ${category}.

CRITICAL REQUIREMENTS:
- Only include news stories published TODAY (${dateStr})
- Filter out any stories from previous days, weeks, or months
- Focus on breaking news, recent developments, and fresh headlines
- Prioritize stories with timestamps from the last 24 hours

Search specifically for: ${searchQuery}

For each news story, provide:
1. A clear, concise headline (max 100 characters)
2. A detailed summary (2-3 sentences) with today's date context
3. The source/publication name
4. The URL if available (must be from today if possible)

Format your response as a JSON array with this structure:
[
  {
    "headline": "Headline text",
    "detail": "Detailed summary of the news story",
    "source": "Source name",
    "url": "https://source-url.com/article"
  }
]

Only return valid JSON, no additional text. If no fresh news from today exists, return an empty array [].`;

    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      tools: [{
        googleSearch: {
          // Configure search to prioritize recent results
          "resultCount": 5
        }
      }],
      generationConfig: {
        temperature: 0.1, // Lower temperature for more consistent, factual results
        topK: 1,
        topP: 1,
        maxOutputTokens: 2048,
      }
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Extract JSON from response (handle markdown code blocks if present)
    let jsonText = text.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```\n?/, '').replace(/\n?```$/, '');
    }

    const articles = JSON.parse(jsonText);

    // Extract sources from grounding metadata if available
    const candidate = response.candidates?.[0];
    let sources = [];
    if (candidate && candidate.groundingMetadata) {
      const groundingMetadata = candidate.groundingMetadata;
      if (groundingMetadata.groundingAttributions) {
        sources = groundingMetadata.groundingAttributions
          .map(attribution => ({
            uri: attribution.web?.uri,
            title: attribution.web?.title,
          }))
          .filter(source => source.uri && source.title);
      }
    }

    // Merge sources with articles if URLs are missing
    const enrichedArticles = articles.map((article, index) => {
      const articleWithSource = {
        ...article,
        url: article.url || (sources[index]?.uri || '')
      };
      return articleWithSource;
    });

    // Filter to ensure only fresh, recent articles (additional validation)
    const today = new Date();
    const todayStr = today.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });

    const freshArticles = enrichedArticles.filter(article => {
      // Check if headline or detail mentions today's date
      const content = (article.headline + ' ' + article.detail).toLowerCase();
      const todayWords = todayStr.toLowerCase().split(' ');

      // Check for date indicators in content
      const hasTodayIndicator = todayWords.some(word =>
        content.includes(word) ||
        content.includes('today') ||
        content.includes('breaking') ||
        content.includes('latest')
      );

      // If article doesn't have clear freshness indicators, still include it
      // since we trust Gemini's filtering, but log for monitoring
      if (!hasTodayIndicator && enrichedArticles.length > 0) {
        console.log(`⚠️ Article may not be fresh: "${article.headline.substring(0, 50)}..."`);
      }

      return true; // Keep all articles for now, but log suspicious ones
    });

    return freshArticles;
  } catch (error) {
    console.error(`Error fetching news for ${category}:`, error.message);
    // Return empty array on error to continue with other categories
    return [];
  }
}

/**
 * Store news articles in Firestore
 */
async function storeNewsInFirestore(newsData, dateString) {
  if (!db) {
    console.error('Firestore not initialized. Cannot store news.');
    return;
  }

  try {
    const newsPath = `artifacts/${APP_ID}/public/data/news/${dateString}`;
    const newsRef = db.doc(newsPath);

    const newsDocument = {
      date: dateString,
      timestamp: Date.now(),
      categories: newsData,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    };

    await newsRef.set(newsDocument, { merge: true });
    console.log(`✅ News stored successfully for ${dateString}`);
    return newsDocument;
  } catch (error) {
    console.error('Error storing news in Firestore:', error.message);
    throw error;
  }
}

/**
 * Main news aggregator function
 */
exports.newsAggregator = async (req, res) => {
  // Handle CORS for HTTP triggers
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  try {
    console.log('Starting daily news aggregation...');
    
    // Get today's date in YYYY-MM-DD format
    const today = new Date();
    const dateString = today.toISOString().split('T')[0];
    
    console.log(`Fetching news for date: ${dateString}`);

    // Fetch news for all categories in parallel
    const categoryPromises = NEWS_CATEGORIES.map(async (category) => {
      console.log(`Fetching news for category: ${category}`);
      const articles = await fetchNewsForCategory(category);
      
      // Add category and IDs to each article
      const articlesWithMetadata = articles.map((article, index) => {
        const categoryPrefix = category.substring(0, 1).toUpperCase();
        const id = `${categoryPrefix}${String(index + 1).padStart(2, '0')}`;
        
        return {
          id: id,
          category: category,
          headline: article.headline,
          detail: article.detail,
          source: article.source,
          url: article.url || '',
          date: dateString,
          timestamp: Date.now()
        };
      });

      return {
        category: category,
        articles: articlesWithMetadata
      };
    });

    const categoryResults = await Promise.all(categoryPromises);

    // Organize news by category
    const newsByCategory = {};
    categoryResults.forEach(result => {
      if (result.articles.length > 0) {
        newsByCategory[result.category] = result.articles;
      }
    });

    // Store in Firestore
    await storeNewsInFirestore(newsByCategory, dateString);

    const totalArticles = Object.values(newsByCategory).reduce((sum, articles) => sum + articles.length, 0);
    
    console.log(`✅ News aggregation complete. Total articles: ${totalArticles}`);

    // Return success response
    if (req.method === 'GET' || req.method === 'POST') {
      res.status(200).json({
        success: true,
        date: dateString,
        categories: Object.keys(newsByCategory),
        totalArticles: totalArticles,
        message: 'News aggregated successfully'
      });
    }
  } catch (error) {
    console.error('News aggregation error:', error);
    
    if (req.method === 'GET' || req.method === 'POST') {
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Failed to aggregate news'
      });
    }
  }
};

