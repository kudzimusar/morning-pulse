/**
 * User Preferences Service
 * Tracks user preferences like category interests and provides personalized ordering
 */

const STORAGE_KEY_PREFIX = 'morning-pulse-';

/**
 * Clean up old category preference entries
 */
const cleanupCategoryPreferences = (): void => {
  try {
    const keys = Object.keys(localStorage);
    const categoryKeys = keys.filter(key => key.startsWith(`${STORAGE_KEY_PREFIX}category-`));
    
    // Sort by timestamp and remove oldest entries
    if (categoryKeys.length > 20) {
      const entries = categoryKeys
        .filter(key => key.includes('-time-'))
        .map(key => ({
          key,
          time: parseInt(localStorage.getItem(key) || '0', 10),
        }))
        .sort((a, b) => b.time - a.time); // Newest first
      
      // Keep top 15 most recent, remove the rest
      const toRemove = entries.slice(15).map(e => e.key);
      
      toRemove.forEach(key => {
        localStorage.removeItem(key);
        // Also remove the count key
        const countKey = key.replace('-time-', '-');
        if (countKey !== key) {
          localStorage.removeItem(countKey);
        }
      });
      
      console.log(`🧹 Cleaned up ${toRemove.length} old category preference entries`);
    }
  } catch (e) {
    console.warn('Failed to cleanup category preferences:', e);
  }
};

/**
 * Track category click/interaction
 */
export const trackCategoryInteraction = (category: string): void => {
  try {
    const key = `${STORAGE_KEY_PREFIX}category-${category}`;
    const currentCount = parseInt(localStorage.getItem(key) || '0', 10);
    localStorage.setItem(key, String(currentCount + 1));
    
    // Also track last interaction time for recency weighting
    const timeKey = `${STORAGE_KEY_PREFIX}category-time-${category}`;
    localStorage.setItem(timeKey, String(Date.now()));
  } catch (e: any) {
    if (e.name === 'QuotaExceededError') {
      console.warn('⚠️ LocalStorage quota exceeded, attempting cleanup...');
      // Try to cleanup old entries
      try {
        cleanupCategoryPreferences();
        // Retry tracking
        const key = `${STORAGE_KEY_PREFIX}category-${category}`;
        const currentCount = parseInt(localStorage.getItem(key) || '0', 10);
        localStorage.setItem(key, String(currentCount + 1));
        const timeKey = `${STORAGE_KEY_PREFIX}category-time-${category}`;
        localStorage.setItem(timeKey, String(Date.now()));
        console.log(`✅ Tracked category interaction after cleanup: ${category}`);
      } catch (retryError) {
        console.error('❌ Failed to track category interaction even after cleanup:', retryError);
      }
    } else {
      console.error('Failed to track category interaction:', e);
    }
  }
};

/**
 * Get interest score for a category
 * Returns a score based on click count and recency
 */
export const getCategoryInterestScore = (category: string): number => {
  try {
    const countKey = `${STORAGE_KEY_PREFIX}category-${category}`;
    const timeKey = `${STORAGE_KEY_PREFIX}category-time-${category}`;
    
    const count = parseInt(localStorage.getItem(countKey) || '0', 10);
    const lastTime = parseInt(localStorage.getItem(timeKey) || '0', 10);
    
    // Base score is the click count
    let score = count;
    
    // Recency bonus: add up to 2 points for recent interactions (within last 7 days)
    if (lastTime > 0) {
      const daysSinceInteraction = (Date.now() - lastTime) / (1000 * 60 * 60 * 24);
      if (daysSinceInteraction < 7) {
        score += 2 * (1 - daysSinceInteraction / 7);
      }
    }
    
    return score;
  } catch (e) {
    return 0;
  }
};

/**
 * Get ordered categories based on user interest scores
 * Higher interest categories come first
 */
export const getOrderedCategories = (defaultCategories: string[]): string[] => {
  try {
    // Calculate scores for all categories
    const scores = defaultCategories.map(cat => ({
      category: cat,
      score: getCategoryInterestScore(cat),
    }));
    
    // Sort by score (descending), then by default order for same scores
    scores.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      // If scores are equal, maintain default order
      return defaultCategories.indexOf(a.category) - defaultCategories.indexOf(b.category);
    });
    
    return scores.map(s => s.category);
  } catch (e) {
    return defaultCategories;
  }
};

/**
 * Reset all category preferences
 */
export const resetCategoryPreferences = (): void => {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(`${STORAGE_KEY_PREFIX}category-`)) {
        localStorage.removeItem(key);
      }
    });
    console.log('✅ Reset category preferences');
  } catch (e) {
    console.error('Failed to reset category preferences:', e);
  }
};
