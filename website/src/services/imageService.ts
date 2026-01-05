/**
 * Image Service
 * Handles image URL fetching with Unsplash API proxy fallback
 */

// Get Cloud Functions base URL (for production)
const getFunctionsUrl = (): string => {
  // In production, use the deployed Cloud Functions URL
  // This should be set as an environment variable
  if (import.meta.env.VITE_FUNCTIONS_URL) {
    return import.meta.env.VITE_FUNCTIONS_URL;
  }
  
  // For local development, use Firebase emulator or local function URL
  if (import.meta.env.DEV) {
    return 'http://localhost:5001/gen-lang-client-0999441419/us-central1';
  }
  
  // Production default (will be replaced by actual URL in deployment)
  return 'https://us-central1-gen-lang-client-0999441419.cloudfunctions.net';
};

/**
 * Get image URL from Unsplash API proxy
 * Falls back to Picsum Photos if proxy is unavailable
 */
export const getUnsplashImageUrl = async (
  category: string,
  headline: string,
  width: number = 800,
  height: number = 600
): Promise<string> => {
  try {
    const functionsUrl = getFunctionsUrl();
    const proxyUrl = `${functionsUrl}/unsplashImage`;
    
    // Build query parameters
    const params = new URLSearchParams({
      category: category || 'news',
      headline: headline || '',
      width: width.toString(),
      height: height.toString(),
    });

    const response = await fetch(`${proxyUrl}?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Add timeout to prevent hanging
      signal: AbortSignal.timeout(3000), // 3 second timeout
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success && data.url) {
        return data.url;
      }
      // If proxy returned fallback, use it
      if (data.url) {
        return data.url;
      }
    }
  } catch (error) {
    console.warn('⚠️ Unsplash proxy failed, using fallback:', error);
  }

  // Fallback to Picsum Photos with seeded URL
  const seed = (category + headline).replace(/[^a-z0-9]/gi, '').substring(0, 20);
  return `https://picsum.photos/seed/${seed}/${width}/${height}`;
};

/**
 * Get image URL with caching
 * Uses article ID + category as cache key
 */
const imageCache = new Map<string, string>();

export const getCachedUnsplashImageUrl = async (
  articleId: string,
  category: string,
  headline: string,
  width: number = 800,
  height: number = 600
): Promise<string> => {
  const cacheKey = `${articleId}-${category}-${width}-${height}`;
  
  // Check cache first
  if (imageCache.has(cacheKey)) {
    return imageCache.get(cacheKey)!;
  }

  // Fetch from proxy
  const imageUrl = await getUnsplashImageUrl(category, headline, width, height);
  
  // Cache the result
  imageCache.set(cacheKey, imageUrl);
  
  // Limit cache size (keep last 100 entries)
  if (imageCache.size > 100) {
    const firstKey = imageCache.keys().next().value;
    imageCache.delete(firstKey);
  }

  return imageUrl;
};
