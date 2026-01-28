/**
 * Newsletter Service
 * Handles subscriber management and newsletter generation
 */

import { getFirestore, collection, addDoc, query, getDocs, where, Timestamp, Firestore } from 'firebase/firestore';
import { getApp } from 'firebase/app';
import { generateNewsletterHTML as sharedGenerateNewsletterHTML, NewsletterArticle, NewsletterAd } from '../../../shared/newsletterTemplates';

const APP_ID = (window as any).__app_id || 'morning-pulse-app';

// Get Firestore instance
const getDb = (): Firestore => {
  try {
    const app = getApp();
    return getFirestore(app);
  } catch (error) {
    console.error('Firebase initialization error:', error);
    throw new Error('Firebase not initialized');
  }
};

/**
 * Subscribe a new user to the newsletter
 * @param email - User email
 * @param name - User name (optional)
 * @param interests - User interests (optional)
 */
export const subscribeToNewsletter = async (
  email: string,
  name?: string,
  interests?: string[]
): Promise<{ success: boolean; message: string }> => {
  try {
    // We use the manageSubscription cloud function for consistency
    const response = await fetch('https://us-central1-morning-pulse-app.cloudfunctions.net/manageSubscription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'subscribe',
        email,
        name,
        interests
      })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to subscribe');
    }

    return result;
  } catch (error: any) {
    console.error('Newsletter subscription error:', error);
    throw new Error(error.message || 'Failed to subscribe to newsletter');
  }
};

/**
 * Get all active subscribers
 * Note: In production, this would be a protected admin-only call
 */
export const getActiveSubscribers = async (): Promise<any[]> => {
  const db = getDb();
  const subscribersRef = collection(db, 'artifacts', APP_ID, 'public', 'data', 'subscribers');
  const q = query(subscribersRef, where('status', '==', 'active'), where('emailNewsletter', '==', true));
  
  const snapshot = await getDocs(q);
  const subscribers: any[] = [];
  
  snapshot.forEach((doc) => {
    subscribers.push({ id: doc.id, ...doc.data() });
  });
  
  return subscribers;
};

/**
 * Generate newsletter HTML from articles
 * @param articles - List of articles to include
 * @param type - 'daily' or 'weekly'
 */
export function downloadNewsletter(html: string, filename = 'newsletter.html') {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();

  URL.revokeObjectURL(url);
}

export const generateNewsletter = async (
  articles: any[],
  type: 'daily' | 'weekly' = 'weekly'
): Promise<string> => {
  const db = getDb();
  const title = `Morning Pulse ${type === 'weekly' ? 'Weekly' : 'Daily'} Digest`;
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  // Fetch active newsletter ads
  let ads: any = {};
  try {
    const adsRef = collection(db, 'artifacts', APP_ID, 'public', 'data', 'ads');
    const q = query(
      adsRef, 
      where('status', '==', 'active'),
      where('placement', 'in', ['newsletter_top', 'newsletter_inline', 'newsletter_footer'])
    );
    
    const snapshot = await getDocs(q);
    const activeAds: any[] = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      activeAds.push({
        id: doc.id,
        advertiserName: data.advertiserName || 'Sponsor',
        headline: data.title,
        body: data.description,
        imageUrl: data.creativeUrl,
        destinationUrl: data.destinationUrl,
        placement: data.placement
      });
    });

    ads = {
      top: activeAds.find(a => a.placement === 'newsletter_top'),
      inline: activeAds.filter(a => a.placement === 'newsletter_inline'),
      footer: activeAds.find(a => a.placement === 'newsletter_footer')
    };
  } catch (adError) {
    console.warn('Could not fetch ads for newsletter:', adError);
  }

  // Map to shared interface
  const newsletterArticles: NewsletterArticle[] = articles.map(article => ({
    id: article.id,
    headline: article.headline,
    subHeadline: article.subHeadline,
    authorName: article.authorName,
    slug: article.slug,
    publishedAt: article.publishedAt instanceof Date ? article.publishedAt : (article.publishedAt?.toDate?.() || new Date()),
    imageUrl: article.finalImageUrl || article.imageUrl
  }));

  // Use the centralized template generator
  return sharedGenerateNewsletterHTML({
    title,
    currentDate,
    articles: newsletterArticles,
    ads,
    type
  });
};

/**
 * Send newsletter to subscribers
 * @param subject - Email subject
 * @param html - Email HTML content
 * @param interests - Optional interest filtering
 */
export const sendNewsletter = async (
  subject: string,
  html: string,
  interests?: string[]
): Promise<{ success: boolean; message: string; stats?: any }> => {
  try {
    const response = await fetch('https://us-central1-morning-pulse-app.cloudfunctions.net/sendNewsletter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        newsletter: {
          subject,
          html
        },
        interests
      })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to send newsletter');
    }

    return result;
  } catch (error: any) {
    console.error('Newsletter send error:', error);
    throw new Error(error.message || 'Failed to send newsletter');
  }
};

/**
 * NEW: Unsubscribe from newsletter
 * @param email - Subscriber email
 */
export const unsubscribeFromNewsletter = async (
  email: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await fetch('https://us-central1-morning-pulse-app.cloudfunctions.net/manageSubscription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'unsubscribe',
        email
      })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to unsubscribe');
    }

    return result;
  } catch (error: any) {
    console.error('Newsletter unsubscribe error:', error);
    throw new Error(error.message || 'Failed to unsubscribe from newsletter');
  }
};

/**
 * NEW: Update newsletter subscription preferences
 * @param email - Subscriber email
 * @param name - Updated name
 * @param interests - Updated interests array
 */
export const updateNewsletterPreferences = async (
  email: string,
  name?: string,
  interests?: string[]
): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await fetch('https://us-central1-morning-pulse-app.cloudfunctions.net/manageSubscription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'update',
        email,
        name,
        interests
      })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to update preferences');
    }

    return result;
  } catch (error: any) {
    console.error('Newsletter preferences update error:', error);
    throw new Error(error.message || 'Failed to update newsletter preferences');
  }
};

/**
 * NEW: Send scheduled newsletter (daily/weekly)
 * @param newsletterType - 'daily' or 'weekly'
 */
export const sendScheduledNewsletter = async (
  newsletterType: 'daily' | 'weekly' = 'weekly'
): Promise<{ success: boolean; message: string; stats?: any }> => {
  try {
    const response = await fetch('https://us-central1-morning-pulse-app.cloudfunctions.net/sendScheduledNewsletter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        newsletterType
      })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to send scheduled newsletter');
    }

    return result;
  } catch (error: any) {
    console.error('Scheduled newsletter send error:', error);
    throw new Error(error.message || 'Failed to send scheduled newsletter');
  }
};
