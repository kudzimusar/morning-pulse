/**
 * SEO Slug Utility Functions
 * Converts headlines into URL-friendly slugs
 * Ensures uniqueness with validation
 */

import { collection, query, where, getDocs, Firestore } from 'firebase/firestore';

/**
 * Convert a headline into a URL-friendly slug
 * Example: "Big News in Zimbabwe!" → "big-news-in-zimbabwe"
 */
export const generateSlug = (headline: string): string => {
  return headline
    .toLowerCase()
    .trim()
    // Remove special characters and punctuation
    .replace(/[^\w\s-]/g, '')
    // Replace spaces with hyphens
    .replace(/\s+/g, '-')
    // Remove multiple consecutive hyphens
    .replace(/-+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, '');
};

/**
 * Check if a slug already exists in Firestore
 */
export const checkSlugExists = async (
  db: Firestore,
  slug: string,
  excludeId?: string
): Promise<boolean> => {
  try {
    const opinionsRef = collection(db, 'artifacts', 'morning-pulse-app', 'public', 'data', 'opinions');
    const q = query(opinionsRef, where('slug', '==', slug));
    const snapshot = await getDocs(q);
    
    // If excluding current opinion ID (for updates), check if any OTHER opinion has this slug
    if (excludeId) {
      return snapshot.docs.some(doc => doc.id !== excludeId);
    }
    
    return !snapshot.empty;
  } catch (error) {
    console.error('Error checking slug existence:', error);
    return false;
  }
};

/**
 * Generate a unique slug by appending random 3-digit number if needed
 */
export const generateUniqueSlug = async (
  db: Firestore,
  headline: string,
  excludeId?: string
): Promise<string> => {
  let slug = generateSlug(headline);
  
  // Check if slug exists
  const exists = await checkSlugExists(db, slug, excludeId);
  
  if (!exists) {
    return slug;
  }
  
  // Slug exists, append random 3-digit number
  const randomNum = Math.floor(100 + Math.random() * 900); // 100-999
  const uniqueSlug = `${slug}-${randomNum}`;
  
  // Double-check the new slug doesn't exist (very unlikely but possible)
  const uniqueExists = await checkSlugExists(db, uniqueSlug, excludeId);
  
  if (!uniqueExists) {
    return uniqueSlug;
  }
  
  // If still exists (extremely rare), add timestamp
  return `${slug}-${randomNum}-${Date.now()}`;
};

/**
 * Validate slug format
 * Must be lowercase, alphanumeric with hyphens only
 */
export const isValidSlug = (slug: string): boolean => {
  // Slug must be 3-200 characters, lowercase alphanumeric with hyphens
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return slugRegex.test(slug) && slug.length >= 3 && slug.length <= 200;
};

/**
 * Sanitize a manually entered slug
 * Ensures it follows proper format even if user types uppercase or spaces
 */
export const sanitizeSlug = (slug: string): string => {
  return slug
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
};

/**
 * Get the public URL for an opinion using its slug
 */
export const getOpinionUrl = (opinion: { slug?: string; id: string }): string => {
  const baseUrl = window.location.origin;
  if (opinion.slug) {
    return `${baseUrl}/#opinion/${opinion.slug}`;
  }
  // Fallback to ID-based URL
  return `${baseUrl}/#opinion/${opinion.id}`;
};
