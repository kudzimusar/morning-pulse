/**
 * Unsplash API Proxy
 * Proxies requests to Unsplash API to avoid exposing API key in frontend
 * 
 * Usage: GET /unsplash-image?query=news&category=tech
 */

const axios = require('axios');

// Unsplash API key - should be set as environment variable
const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY || 'hsg8ZqdAsnjzsxkq_uKUFH0-hbCFQzX0jOnzEkBAnko';

/**
 * Get a random image from Unsplash based on search query
 * Returns a high-quality image URL
 */
async function getUnsplashImage(query, width = 800, height = 600) {
  try {
    // Unsplash API endpoint for random photo with search
    const apiUrl = 'https://api.unsplash.com/photos/random';
    
    const response = await axios.get(apiUrl, {
      params: {
        query: query,
        orientation: 'landscape',
        w: width,
        h: height,
        fit: 'crop',
      },
      headers: {
        'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`,
        'Accept-Version': 'v1',
      },
      timeout: 5000, // 5 second timeout
    });

    if (response.data && response.data.urls) {
      // Return the regular URL (or 'regular' size for better quality)
      return response.data.urls.regular || response.data.urls.small;
    }
    
    return null;
  } catch (error) {
    console.error('❌ Unsplash API error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    return null;
  }
}

/**
 * HTTP Cloud Function: Unsplash Image Proxy
 * 
 * Query parameters:
 * - query: Search query (e.g., "tech news", "sports")
 * - category: Optional category name
 * - headline: Optional headline text
 * - width: Image width (default: 800)
 * - height: Image height (default: 600)
 * 
 * Returns: JSON with image URL
 */
exports.unsplashImage = async (req, res) => {
  // Enable CORS for all origins (since this is a public proxy)
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { query, category, headline, width, height } = req.query;

    // Build search query from parameters
    let searchQuery = query || '';
    
    if (category && !searchQuery.includes(category)) {
      searchQuery = category + (searchQuery ? ', ' + searchQuery : '');
    }
    
    if (headline) {
      // Extract first few meaningful words from headline
      const headlineWords = headline
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 3) // Only meaningful words
        .slice(0, 3) // First 3 meaningful words
        .join(' ');
      
      if (headlineWords && !searchQuery.includes(headlineWords)) {
        searchQuery = searchQuery ? searchQuery + ', ' + headlineWords : headlineWords;
      }
    }

    // Default search query if empty
    if (!searchQuery || searchQuery.trim() === '') {
      searchQuery = 'news';
    }

    // Parse dimensions
    const imgWidth = parseInt(width) || 800;
    const imgHeight = parseInt(height) || 600;

    console.log(`📸 Fetching Unsplash image for query: "${searchQuery}"`);

    // Fetch image from Unsplash
    const imageUrl = await getUnsplashImage(searchQuery, imgWidth, imgHeight);

    if (imageUrl) {
      res.status(200).json({
        success: true,
        url: imageUrl,
        query: searchQuery,
      });
    } else {
      // Fallback: Return a placeholder service URL
      const seed = (searchQuery + Date.now()).replace(/[^a-z0-9]/gi, '').substring(0, 20);
      const fallbackUrl = `https://picsum.photos/seed/${seed}/${imgWidth}/${imgHeight}`;
      
      res.status(200).json({
        success: false,
        url: fallbackUrl,
        query: searchQuery,
        fallback: true,
      });
    }
  } catch (error) {
    console.error('❌ Error in unsplashImage proxy:', error);
    
    // Return fallback image
    const seed = (req.query.query || 'news').replace(/[^a-z0-9]/gi, '').substring(0, 20);
    const fallbackUrl = `https://picsum.photos/seed/${seed}/800/600`;
    
    res.status(200).json({
      success: false,
      url: fallbackUrl,
      query: req.query.query || 'news',
      fallback: true,
      error: error.message,
    });
  }
};
