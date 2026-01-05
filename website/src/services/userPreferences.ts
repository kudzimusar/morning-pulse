/**
 * User Preferences Service
 * Tracks user preferences like category interests and provides personalized ordering
 */

const STORAGE_KEY_PREFIX = 'morning-pulse-';

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
    if (e.name !== 'QuotaExceededError') {
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
