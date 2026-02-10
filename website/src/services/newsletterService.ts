import { collection, addDoc, query, getDocs, where, Timestamp } from 'firebase/firestore';
import { generateNewsletterHTML as sharedGenerateNewsletterHTML, NewsletterArticle, NewsletterAd } from '../../../shared/newsletterTemplates';
import { db } from './firebase';

const getDb = () => db;
const APP_ID = (window as any).__app_id || 'morning-pulse-app';

/**
 * Subscribe a new user to the newsletter
 */
export const subscribeToNewsletter = async (
  email: string,
  name?: string,
  interests?: string[]
): Promise<{ success: boolean; message: string }> => {
  try {
    const url = 'https://us-central1-gen-lang-client-0999441419.cloudfunctions.net/manageSubscription';
    console.log(`🔗 POST to ${url}`);

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
 */
export const getActiveSubscribers = async (): Promise<any[]> => {
  const db = getDb();
  // Standardized to root collection: subscribers
  const subscribersRef = collection(db, 'subscribers');
  const q = query(subscribersRef, where('status', '==', 'active'));

  const snapshot = await getDocs(q);
  const subscribers: any[] = [];

  snapshot.forEach((doc) => {
    subscribers.push({ id: doc.id, ...doc.data() });
  });

  return subscribers;
};

/**
 * Download newsletter HTML as file
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

/**
 * Preview newsletter in new browser tab
 */
export function previewNewsletter(html: string) {
  const previewWindow = window.open('', '_blank');
  if (!previewWindow) {
    throw new Error('Popup blocked. Please allow popups for preview.');
  }

  previewWindow.document.open();
  previewWindow.document.write(html);
  previewWindow.document.close();
}

/**
 * Generate newsletter HTML from articles
 */
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
      where('paymentStatus', '==', 'paid'),
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

  const newsletterArticles: NewsletterArticle[] = articles.map(article => ({
    id: article.id,
    headline: article.headline,
    subHeadline: article.subHeadline,
    authorName: article.authorName,
    slug: article.slug,
    publishedAt: article.publishedAt instanceof Date
      ? article.publishedAt
      : (article.publishedAt?.toDate?.() || new Date()),
    imageUrl: article.finalImageUrl || article.imageUrl
  }));

  return sharedGenerateNewsletterHTML({
    title,
    currentDate,
    articles: newsletterArticles,
    ads,
    type
  });
};

/**
 * Send newsletter immediately
 */
export const sendNewsletter = async (params: {
  subject: string;
  html: string;
  interests?: string[];
}): Promise<{ success: boolean; message: string; stats?: any }> => {
  const { subject, html, interests } = params;

  try {
    const url = 'https://us-central1-gen-lang-client-0999441419.cloudfunctions.net/sendNewsletter';
    console.log(`📧 Sending newsletter via ${url}`);
    console.log(`📧 Subject: ${subject?.substring(0, 50)}...`);
    console.log(`📧 HTML length: ${html?.length || 0} chars`);

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        newsletter: { subject, html },
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
 * Unsubscribe
 */
export const unsubscribeFromNewsletter = async (
  email: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await fetch('https://us-central1-gen-lang-client-0999441419.cloudfunctions.net/manageSubscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
 * Update preferences
 */
export const updateNewsletterPreferences = async (
  email: string,
  name?: string,
  interests?: string[]
): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await fetch('https://us-central1-gen-lang-client-0999441419.cloudfunctions.net/manageSubscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
 * Send scheduled newsletter
 */
export const sendScheduledNewsletter = async (
  newsletterType: 'daily' | 'weekly' = 'weekly'
): Promise<{ success: boolean; message: string; stats?: any }> => {
  try {
    const response = await fetch('https://us-central1-gen-lang-client-0999441419.cloudfunctions.net/sendScheduledNewsletter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newsletterType })
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
