/**
 * Ad Slot Initializer
 * Creates default ad slots in Firestore for the platform
 * Run this once to set up the inventory registry
 */

import { getFirestore, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { getApp } from 'firebase/app';
import { AdSlot } from './advertiserService';

const APP_ID = (window as any).__app_id || 'morning-pulse-app';

const getDb = () => {
  try {
    const app = getApp();
    return getFirestore(app);
  } catch (error) {
    console.error('Firebase initialization error:', error);
    throw new Error('Firebase not initialized');
  }
};

/**
 * Default ad slots configuration
 */
const DEFAULT_SLOTS: Omit<AdSlot, 'createdAt'>[] = [
  {
    slotId: 'header_banner',
    pageType: 'home',
    sizes: ['728x90', '970x250'],
    priorityTier: 'premium',
    maxAds: 1,
  },
  {
    slotId: 'homepage_sidebar_1',
    pageType: 'home',
    sizes: ['300x250', '300x600'],
    priorityTier: 'standard',
    maxAds: 1,
  },
  {
    slotId: 'homepage_sidebar_2',
    pageType: 'home',
    sizes: ['300x250'],
    priorityTier: 'standard',
    maxAds: 1,
  },
  {
    slotId: 'article_inline_1',
    pageType: 'article',
    sizes: ['300x250', '728x90'],
    priorityTier: 'standard',
    maxAds: 1,
  },
  {
    slotId: 'article_inline_2',
    pageType: 'article',
    sizes: ['300x250'],
    priorityTier: 'standard',
    maxAds: 1,
  },
  {
    slotId: 'article_sidebar_1',
    pageType: 'article',
    sizes: ['300x250', '300x600'],
    priorityTier: 'standard',
    maxAds: 1,
  },
  {
    slotId: 'footer_1',
    pageType: 'home',
    sizes: ['728x90'],
    priorityTier: 'house',
    maxAds: 1,
  },
];

/**
 * Initialize default ad slots
 * Call this function once (e.g., from admin dashboard) to set up slots
 */
export const initializeDefaultAdSlots = async (): Promise<void> => {
  const db = getDb();
  
  try {
    console.log('🔄 Initializing default ad slots...');
    
    for (const slot of DEFAULT_SLOTS) {
      const slotRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'adSlots', slot.slotId);
      
      // Check if slot already exists
      const existing = await getDoc(slotRef);
      
      if (!existing.exists()) {
        await setDoc(slotRef, {
          ...slot,
          createdAt: serverTimestamp(),
        });
        console.log(`✅ Created slot: ${slot.slotId}`);
      } else {
        console.log(`⏭️  Slot already exists: ${slot.slotId}`);
      }
    }
    
    console.log('✅ Ad slots initialization complete');
  } catch (error: any) {
    console.error('❌ Error initializing ad slots:', error);
    throw new Error(`Failed to initialize ad slots: ${error.message}`);
  }
};

/**
 * Get all ad slots (for admin UI)
 */
export const getAllAdSlots = async (): Promise<AdSlot[]> => {
  const db = getDb();
  const slotsRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'adSlots');
  
  // Note: This would need a collection query in production
  // For now, return the default slots
  return DEFAULT_SLOTS.map(slot => ({
    ...slot,
    createdAt: new Date(),
  }));
};
