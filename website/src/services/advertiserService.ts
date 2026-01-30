/**
 * Advertiser Management Service
 * Handles advertiser registration, ad submission, and ad management
 * Advertisers: artifacts/{appId}/public/data/advertisers/{uid}
 * Ads: artifacts/{appId}/public/data/ads/{adId}
 */

import { 
  getFirestore, 
  collection, 
  query, 
  where,
  getDocs,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  Firestore,
  addDoc,
  onSnapshot
} from 'firebase/firestore';
import { 
  getAuth,
  createUserWithEmailAndPassword,
  User
} from 'firebase/auth';
import { getApp } from 'firebase/app';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

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

const APP_ID = (window as any).__app_id || 'morning-pulse-app';

export interface Advertiser {
  uid: string;
  companyName: string;
  contactEmail: string;
  contactPhone: string;
  website?: string;
  status: 'pending_approval' | 'approved' | 'rejected';
  approvedAt?: Date;
  rejectedReason?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface Ad {
  id: string;
  advertiserId: string;
  title: string;
  description?: string;
  creativeUrl: string;
  destinationUrl?: string;
  placement: 'header' | 'sidebar' | 'inline' | 'newsletter_top' | 'newsletter_inline' | 'newsletter_footer';
  status: 'pending' | 'approved' | 'active' | 'expired' | 'rejected';
  startDate: Date;
  endDate: Date;
  clicks: number;
  views: number;
  paymentStatus: 'paid' | 'pending' | 'failed';
  paymentId?: string;
  createdAt: Date;
  updatedAt?: Date;
}

/**
 * Register a new advertiser
 */
export const registerAdvertiser = async (
  email: string,
  password: string,
  companyName: string,
  contactPhone: string,
  website?: string
): Promise<string> => {
  const auth = getAuth();
  const db = getDb();
  
  try {
    // 1. Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;
    
    // 2. Create advertiser document
    const advertiserRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'advertisers', uid);
    await setDoc(advertiserRef, {
      companyName,
      contactEmail: email,
      contactPhone,
      website: website || '',
      status: 'pending_approval',
      createdAt: serverTimestamp(),
    });
    
    console.log('✅ Advertiser registered:', uid);
    return uid;
  } catch (error: any) {
    console.error('❌ Advertiser registration failed:', error);
    throw new Error(`Failed to register advertiser: ${error.message}`);
  }
};

/**
 * Get advertiser by UID
 */
export const getAdvertiser = async (uid: string): Promise<Advertiser | null> => {
  const db = getDb();
  const advertiserRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'advertisers', uid);
  
  try {
    const snap = await getDoc(advertiserRef);
    if (snap.exists()) {
      const data = snap.data();
      return {
        uid: snap.id,
        companyName: data.companyName || '',
        contactEmail: data.contactEmail || '',
        contactPhone: data.contactPhone || '',
        website: data.website,
        status: data.status || 'pending_approval',
        approvedAt: data.approvedAt?.toDate?.() || undefined,
        rejectedReason: data.rejectedReason,
        createdAt: data.createdAt?.toDate?.() || new Date(),
        updatedAt: data.updatedAt?.toDate?.() || undefined,
      };
    }
    return null;
  } catch (error: any) {
    console.error('Error fetching advertiser:', error);
    throw new Error(`Failed to fetch advertiser: ${error.message}`);
  }
};

/**
 * Get advertiser by current auth user
 */
export const getCurrentAdvertiser = async (): Promise<Advertiser | null> => {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) return null;
  return getAdvertiser(user.uid);
};

/**
 * Get all pending advertisers (for admin)
 */
export const getPendingAdvertisers = async (): Promise<Advertiser[]> => {
  const db = getDb();
  const advertisersRef = collection(db, 'artifacts', APP_ID, 'public', 'data', 'advertisers');
  const q = query(advertisersRef, where('status', '==', 'pending_approval'));
  
  try {
    const snapshot = await getDocs(q);
    const advertisers: Advertiser[] = [];
    
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      advertisers.push({
        uid: docSnap.id,
        companyName: data.companyName || '',
        contactEmail: data.contactEmail || '',
        contactPhone: data.contactPhone || '',
        website: data.website,
        status: 'pending_approval',
        approvedAt: data.approvedAt?.toDate?.() || undefined,
        rejectedReason: data.rejectedReason,
        createdAt: data.createdAt?.toDate?.() || new Date(),
        updatedAt: data.updatedAt?.toDate?.() || undefined,
      });
    });
    
    return advertisers.sort((a, b) => {
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
  } catch (error: any) {
    console.error('Error fetching pending advertisers:', error);
    throw new Error(`Failed to fetch pending advertisers: ${error.message}`);
  }
};

/**
 * Get all approved advertisers
 */
export const getApprovedAdvertisers = async (): Promise<Advertiser[]> => {
  const db = getDb();
  const advertisersRef = collection(db, 'artifacts', APP_ID, 'public', 'data', 'advertisers');
  const q = query(advertisersRef, where('status', '==', 'approved'));
  
  try {
    const snapshot = await getDocs(q);
    const advertisers: Advertiser[] = [];
    
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      advertisers.push({
        uid: docSnap.id,
        companyName: data.companyName || '',
        contactEmail: data.contactEmail || '',
        contactPhone: data.contactPhone || '',
        website: data.website,
        status: 'approved',
        approvedAt: data.approvedAt?.toDate?.() || undefined,
        rejectedReason: data.rejectedReason,
        createdAt: data.createdAt?.toDate?.() || new Date(),
        updatedAt: data.updatedAt?.toDate?.() || undefined,
      });
    });
    
    return advertisers.sort((a, b) => {
      const nameA = a.companyName.toLowerCase();
      const nameB = b.companyName.toLowerCase();
      return nameA.localeCompare(nameB);
    });
  } catch (error: any) {
    console.error('Error fetching approved advertisers:', error);
    throw new Error(`Failed to fetch approved advertisers: ${error.message}`);
  }
};

/**
 * Approve advertiser (admin only)
 */
export const approveAdvertiser = async (uid: string): Promise<void> => {
  const db = getDb();
  const advertiserRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'advertisers', uid);
  
  try {
    await updateDoc(advertiserRef, {
      status: 'approved',
      approvedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    console.log('✅ Advertiser approved:', uid);
  } catch (error: any) {
    console.error('❌ Error approving advertiser:', error);
    throw new Error(`Failed to approve advertiser: ${error.message}`);
  }
};

/**
 * Reject advertiser (admin only)
 */
export const rejectAdvertiser = async (uid: string, reason: string): Promise<void> => {
  const db = getDb();
  const advertiserRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'advertisers', uid);
  
  try {
    await updateDoc(advertiserRef, {
      status: 'rejected',
      rejectedReason: reason,
      updatedAt: serverTimestamp(),
    });
    
    console.log('✅ Advertiser rejected:', uid);
  } catch (error: any) {
    console.error('❌ Error rejecting advertiser:', error);
    throw new Error(`Failed to reject advertiser: ${error.message}`);
  }
};

/**
 * Submit a new ad
 */
export const submitAd = async (
  advertiserId: string,
  adData: {
    title: string;
    description?: string;
    destinationUrl?: string;
    creativeUrl: string;
    placement: 'header' | 'sidebar' | 'inline' | 'newsletter_top' | 'newsletter_inline' | 'newsletter_footer';
    startDate: Date;
    endDate: Date;
  }
): Promise<string> => {
  const db = getDb();
  const adsRef = collection(db, 'artifacts', APP_ID, 'public', 'data', 'ads');
  
  try {
    const docRef = await addDoc(adsRef, {
      advertiserId,
      title: adData.title,
      description: adData.description || '',
      destinationUrl: adData.destinationUrl || '',
      creativeUrl: adData.creativeUrl,
      placement: adData.placement,
      status: 'pending',
      startDate: serverTimestamp(),
      endDate: serverTimestamp(),
      clicks: 0,
      views: 0,
      paymentStatus: 'pending',
      createdAt: serverTimestamp(),
    });
    
    console.log('✅ Ad submitted:', docRef.id);
    return docRef.id;
  } catch (error: any) {
    console.error('❌ Error submitting ad:', error);
    throw new Error(`Failed to submit ad: ${error.message}`);
  }
};

/**
 * Upload ad creative to Firebase Storage
 */
export const uploadAdCreative = async (file: File, advertiserId: string): Promise<string> => {
  try {
    const storage = getStorage();
    const fileName = `ads/${advertiserId}/${Date.now()}_${file.name}`;
    const storageRef = ref(storage, fileName);
    
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    
    console.log('✅ Ad creative uploaded:', downloadURL);
    return downloadURL;
  } catch (error: any) {
    console.error('❌ Error uploading ad creative:', error);
    throw new Error(`Failed to upload ad creative: ${error.message}`);
  }
};

/**
 * Get ads by advertiser
 */
export const getAdsByAdvertiser = async (advertiserId: string): Promise<Ad[]> => {
  const db = getDb();
  const adsRef = collection(db, 'artifacts', APP_ID, 'public', 'data', 'ads');
  const q = query(adsRef, where('advertiserId', '==', advertiserId));
  
  try {
    const snapshot = await getDocs(q);
    const ads: Ad[] = [];
    
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      ads.push({
        id: docSnap.id,
        advertiserId: data.advertiserId,
        title: data.title || '',
        description: data.description,
        creativeUrl: data.creativeUrl || '',
        destinationUrl: data.destinationUrl,
        placement: data.placement || 'sidebar',
        status: data.status || 'pending',
        startDate: data.startDate?.toDate?.() || new Date(),
        endDate: data.endDate?.toDate?.() || new Date(),
        clicks: data.clicks || 0,
        views: data.views || 0,
        paymentStatus: data.paymentStatus || 'pending',
        paymentId: data.paymentId,
        createdAt: data.createdAt?.toDate?.() || new Date(),
        updatedAt: data.updatedAt?.toDate?.() || undefined,
      });
    });
    
    return ads.sort((a, b) => {
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
  } catch (error: any) {
    console.error('Error fetching ads:', error);
    throw new Error(`Failed to fetch ads: ${error.message}`);
  }
};

/**
 * Get all pending ads (for admin)
 */
export const getPendingAds = async (): Promise<Ad[]> => {
  const db = getDb();
  const adsRef = collection(db, 'artifacts', APP_ID, 'public', 'data', 'ads');
  const q = query(adsRef, where('status', '==', 'pending'));
  
  try {
    const snapshot = await getDocs(q);
    const ads: Ad[] = [];
    
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      ads.push({
        id: docSnap.id,
        advertiserId: data.advertiserId,
        title: data.title || '',
        description: data.description,
        creativeUrl: data.creativeUrl || '',
        destinationUrl: data.destinationUrl,
        placement: data.placement || 'sidebar',
        status: 'pending',
        startDate: data.startDate?.toDate?.() || new Date(),
        endDate: data.endDate?.toDate?.() || new Date(),
        clicks: data.clicks || 0,
        views: data.views || 0,
        paymentStatus: data.paymentStatus || 'pending',
        paymentId: data.paymentId,
        createdAt: data.createdAt?.toDate?.() || new Date(),
        updatedAt: data.updatedAt?.toDate?.() || undefined,
      });
    });
    
    return ads.sort((a, b) => {
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
  } catch (error: any) {
    console.error('Error fetching pending ads:', error);
    throw new Error(`Failed to fetch pending ads: ${error.message}`);
  }
};

/**
 * Get all active ads
 */
export const getActiveAds = async (): Promise<Ad[]> => {
  const db = getDb();
  const adsRef = collection(db, 'artifacts', APP_ID, 'public', 'data', 'ads');
  const q = query(adsRef, where('status', '==', 'active'));
  
  try {
    const snapshot = await getDocs(q);
    const ads: Ad[] = [];
    
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      ads.push({
        id: docSnap.id,
        advertiserId: data.advertiserId,
        title: data.title || '',
        description: data.description,
        creativeUrl: data.creativeUrl || '',
        destinationUrl: data.destinationUrl,
        placement: data.placement || 'sidebar',
        status: 'active',
        startDate: data.startDate?.toDate?.() || new Date(),
        endDate: data.endDate?.toDate?.() || new Date(),
        clicks: data.clicks || 0,
        views: data.views || 0,
        paymentStatus: data.paymentStatus || 'pending',
        paymentId: data.paymentId,
        createdAt: data.createdAt?.toDate?.() || new Date(),
        updatedAt: data.updatedAt?.toDate?.() || undefined,
      });
    });
    
    return ads;
  } catch (error: any) {
    console.error('Error fetching active ads:', error);
    throw new Error(`Failed to fetch active ads: ${error.message}`);
  }
};

/**
 * Subscribe to real-time ad updates (admin only)
 */
export const subscribeToAds = (
  callback: (ads: Ad[]) => void,
  onError?: (error: any) => void
): (() => void) => {
  const db = getDb();
  const adsRef = collection(db, 'artifacts', APP_ID, 'public', 'data', 'ads');
  
  const unsubscribe = onSnapshot(adsRef, (snapshot) => {
    const ads: Ad[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      ads.push({
        id: docSnap.id,
        advertiserId: data.advertiserId,
        title: data.title || '',
        description: data.description,
        creativeUrl: data.creativeUrl || '',
        destinationUrl: data.destinationUrl,
        placement: data.placement || 'sidebar',
        status: data.status || 'pending',
        startDate: data.startDate?.toDate?.() || new Date(),
        endDate: data.endDate?.toDate?.() || new Date(),
        clicks: data.clicks || 0,
        views: data.views || 0,
        paymentStatus: data.paymentStatus || 'pending',
        paymentId: data.paymentId,
        createdAt: data.createdAt?.toDate?.() || new Date(),
        updatedAt: data.updatedAt?.toDate?.() || undefined,
      });
    });
    callback(ads);
  }, (error) => {
    console.error('❌ Firestore Permission Error (Ads):', error);
    if (onError) onError(error);
  });
  
  return unsubscribe;
};

/**
 * Approve ad (admin only)
 */
export const approveAd = async (adId: string, paymentId?: string): Promise<void> => {
  const db = getDb();
  const adRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'ads', adId);
  
  try {
    await updateDoc(adRef, {
      status: 'approved',
      paymentStatus: paymentId ? 'paid' : 'pending',
      paymentId: paymentId || null,
      updatedAt: serverTimestamp(),
    });
    
    console.log('✅ Ad approved:', adId);
  } catch (error: any) {
    console.error('❌ Error approving ad:', error);
    throw new Error(`Failed to approve ad: ${error.message}`);
  }
};

/**
 * Reject ad (admin only)
 */
export const rejectAd = async (adId: string, reason?: string): Promise<void> => {
  const db = getDb();
  const adRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'ads', adId);
  
  try {
    await updateDoc(adRef, {
      status: 'rejected',
      updatedAt: serverTimestamp(),
    });
    
    console.log('✅ Ad rejected:', adId);
  } catch (error: any) {
    console.error('❌ Error rejecting ad:', error);
    throw new Error(`Failed to reject ad: ${error.message}`);
  }
};

/**
 * Activate ad (admin only - after payment)
 */
export const activateAd = async (adId: string): Promise<void> => {
  const db = getDb();
  const adRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'ads', adId);
  
  try {
    await updateDoc(adRef, {
      status: 'active',
      updatedAt: serverTimestamp(),
    });
    
    console.log('✅ Ad activated:', adId);
  } catch (error: any) {
    console.error('❌ Error activating ad:', error);
    throw new Error(`Failed to activate ad: ${error.message}`);
  }
};

/**
 * Track ad view
 */
export const trackAdView = async (adId: string): Promise<void> => {
  const db = getDb();
  const adRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'ads', adId);
  
  try {
    const adSnap = await getDoc(adRef);
    if (adSnap.exists()) {
      const currentViews = adSnap.data().views || 0;
      await updateDoc(adRef, {
        views: currentViews + 1,
      });
    }
  } catch (error: any) {
    console.error('Error tracking ad view:', error);
  }
};

/**
 * Track ad click
 */
export const trackAdClick = async (adId: string): Promise<void> => {
  const db = getDb();
  const adRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'ads', adId);
  
  try {
    const adSnap = await getDoc(adRef);
    if (adSnap.exists()) {
      const currentClicks = adSnap.data().clicks || 0;
      await updateDoc(adRef, {
        clicks: currentClicks + 1,
      });
    }
  } catch (error: any) {
    console.error('Error tracking ad click:', error);
  }
};

/**
 * Check if advertiser is approved
 */
export const isAdvertiserApproved = async (): Promise<boolean> => {
  const advertiser = await getCurrentAdvertiser();
  return advertiser?.status === 'approved' || false;
};

// ===========================================
// ENTERPRISE EXTENSIONS - CAMPAIGNS
// ===========================================

export interface Campaign {
  id: string;
  advertiserId: string;
  name: string;
  startDate: Date;
  endDate: Date;
  totalBudget: number;
  dailyCap?: number;
  priorityTier: 'premium' | 'standard' | 'house';
  targetingRules?: {
    categories?: string[];
    countries?: string[];
    devices?: string[];
  };
  adIds: string[];
  slotIds: string[];
  status: 'draft' | 'active' | 'paused' | 'completed';
  createdAt: Date;
  createdBy: string;
  updatedAt?: Date;
}

/**
 * Create a new campaign
 */
export const createCampaign = async (
  advertiserId: string,
  campaignData: {
    name: string;
    startDate: Date;
    endDate: Date;
    totalBudget: number;
    dailyCap?: number;
    priorityTier: 'premium' | 'standard' | 'house';
    targetingRules?: Campaign['targetingRules'];
    slotIds: string[];
  }
): Promise<string> => {
  const db = getDb();
  const auth = getAuth();
  const campaignsRef = collection(db, 'artifacts', APP_ID, 'public', 'data', 'campaigns');
  
  try {
    const docRef = await addDoc(campaignsRef, {
      advertiserId,
      name: campaignData.name,
      startDate: serverTimestamp(),
      endDate: serverTimestamp(),
      totalBudget: campaignData.totalBudget,
      dailyCap: campaignData.dailyCap || null,
      priorityTier: campaignData.priorityTier,
      targetingRules: campaignData.targetingRules || {},
      adIds: [],
      slotIds: campaignData.slotIds,
      status: 'draft',
      createdAt: serverTimestamp(),
      createdBy: auth.currentUser?.uid || advertiserId,
    });
    
    console.log('✅ Campaign created:', docRef.id);
    return docRef.id;
  } catch (error: any) {
    console.error('❌ Error creating campaign:', error);
    throw new Error(`Failed to create campaign: ${error.message}`);
  }
};

/**
 * Update campaign
 */
export const updateCampaign = async (
  campaignId: string,
  updates: Partial<Campaign>
): Promise<void> => {
  const db = getDb();
  const campaignRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'campaigns', campaignId);
  
  try {
    const updateData: any = {
      updatedAt: serverTimestamp(),
    };
    
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.startDate !== undefined) updateData.startDate = serverTimestamp();
    if (updates.endDate !== undefined) updateData.endDate = serverTimestamp();
    if (updates.totalBudget !== undefined) updateData.totalBudget = updates.totalBudget;
    if (updates.dailyCap !== undefined) updateData.dailyCap = updates.dailyCap;
    if (updates.priorityTier !== undefined) updateData.priorityTier = updates.priorityTier;
    if (updates.targetingRules !== undefined) updateData.targetingRules = updates.targetingRules;
    if (updates.adIds !== undefined) updateData.adIds = updates.adIds;
    if (updates.slotIds !== undefined) updateData.slotIds = updates.slotIds;
    if (updates.status !== undefined) updateData.status = updates.status;
    
    await updateDoc(campaignRef, updateData);
    console.log('✅ Campaign updated:', campaignId);
  } catch (error: any) {
    console.error('❌ Error updating campaign:', error);
    throw new Error(`Failed to update campaign: ${error.message}`);
  }
};

/**
 * Attach ad to campaign
 */
export const attachAdToCampaign = async (campaignId: string, adId: string): Promise<void> => {
  const db = getDb();
  const campaignRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'campaigns', campaignId);
  
  try {
    const campaignSnap = await getDoc(campaignRef);
    if (!campaignSnap.exists()) {
      throw new Error('Campaign not found');
    }
    
    const currentAdIds = campaignSnap.data().adIds || [];
    if (!currentAdIds.includes(adId)) {
      await updateDoc(campaignRef, {
        adIds: [...currentAdIds, adId],
        updatedAt: serverTimestamp(),
      });
      console.log('✅ Ad attached to campaign:', adId);
    }
  } catch (error: any) {
    console.error('❌ Error attaching ad to campaign:', error);
    throw new Error(`Failed to attach ad: ${error.message}`);
  }
};

/**
 * Get campaigns by advertiser
 */
export const getCampaignsByAdvertiser = async (advertiserId: string): Promise<Campaign[]> => {
  const db = getDb();
  const campaignsRef = collection(db, 'artifacts', APP_ID, 'public', 'data', 'campaigns');
  const q = query(campaignsRef, where('advertiserId', '==', advertiserId));
  
  try {
    const snapshot = await getDocs(q);
    const campaigns: Campaign[] = [];
    
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      campaigns.push({
        id: docSnap.id,
        advertiserId: data.advertiserId,
        name: data.name || '',
        startDate: data.startDate?.toDate?.() || new Date(),
        endDate: data.endDate?.toDate?.() || new Date(),
        totalBudget: data.totalBudget || 0,
        dailyCap: data.dailyCap,
        priorityTier: data.priorityTier || 'standard',
        targetingRules: data.targetingRules,
        adIds: data.adIds || [],
        slotIds: data.slotIds || [],
        status: data.status || 'draft',
        createdAt: data.createdAt?.toDate?.() || new Date(),
        createdBy: data.createdBy || '',
        updatedAt: data.updatedAt?.toDate?.() || undefined,
      });
    });
    
    return campaigns.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch (error: any) {
    console.error('Error fetching campaigns:', error);
    throw new Error(`Failed to fetch campaigns: ${error.message}`);
  }
};

/**
 * Get campaign analytics
 */
export const getCampaignAnalytics = async (campaignId: string): Promise<{
  impressions: number;
  clicks: number;
  ctr: number;
  spend: number;
}> => {
  const db = getDb();
  
  try {
    // Get campaign
    const campaignRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'campaigns', campaignId);
    const campaignSnap = await getDoc(campaignRef);
    
    if (!campaignSnap.exists()) {
      throw new Error('Campaign not found');
    }
    
    const adIds = campaignSnap.data().adIds || [];
    
    // Get impressions for all ads in campaign
    const impressionsRef = collection(db, 'artifacts', APP_ID, 'public', 'data', 'adImpressions');
    const impressionsQuery = query(impressionsRef, where('adId', 'in', adIds.length > 0 ? adIds : ['']));
    const impressionsSnap = await getDocs(impressionsQuery);
    
    // Get clicks for all ads in campaign
    const clicksRef = collection(db, 'artifacts', APP_ID, 'public', 'data', 'adClicks');
    const clicksQuery = query(clicksRef, where('adId', 'in', adIds.length > 0 ? adIds : ['']));
    const clicksSnap = await getDocs(clicksQuery);
    
    const impressions = impressionsSnap.size;
    const clicks = clicksSnap.size;
    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
    
    // Calculate spend (placeholder - would need actual pricing logic)
    const spend = 0; // TODO: Implement pricing calculation
    
    return { impressions, clicks, ctr, spend };
  } catch (error: any) {
    console.error('Error fetching campaign analytics:', error);
    throw new Error(`Failed to fetch campaign analytics: ${error.message}`);
  }
};

// ===========================================
// AD SLOTS (INVENTORY REGISTRY)
// ===========================================

export interface AdSlot {
  slotId: string;
  pageType: 'article' | 'home' | 'section';
  sizes: string[];
  priorityTier: 'premium' | 'standard' | 'house';
  maxAds: number;
  createdAt: Date;
}

/**
 * Get ad slot by ID
 */
export const getAdSlot = async (slotId: string): Promise<AdSlot | null> => {
  const db = getDb();
  const slotRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'adSlots', slotId);
  
  try {
    const snap = await getDoc(slotRef);
    if (snap.exists()) {
      const data = snap.data();
      return {
        slotId: snap.id,
        pageType: data.pageType || 'article',
        sizes: data.sizes || [],
        priorityTier: data.priorityTier || 'standard',
        maxAds: data.maxAds || 1,
        createdAt: data.createdAt?.toDate?.() || new Date(),
      };
    }
    return null;
  } catch (error: any) {
    console.error('Error fetching ad slot:', error);
    throw new Error(`Failed to fetch ad slot: ${error.message}`);
  }
};

/**
 * Get ads for a specific slot (for rendering)
 */
export const getAdsForSlot = async (
  slotId: string,
  options?: {
    limit?: number;
    priorityTier?: 'premium' | 'standard' | 'house';
  }
): Promise<Ad[]> => {
  const db = getDb();
  
  try {
    // Get slot configuration
    const slot = await getAdSlot(slotId);
    if (!slot) {
      return [];
    }
    
    // Map slotId to placement (FIXED - use full slotId)
    const placementMap: Record<string, 'header' | 'sidebar' | 'inline'> = {
      'header_banner': 'header',
      'homepage_sidebar_1': 'sidebar',
      'homepage_sidebar_2': 'sidebar',
      'article_inline_1': 'inline',
      'article_inline_2': 'inline',
      'article_sidebar_1': 'sidebar',
      'footer_1': 'sidebar',
    };
    
    const placement = placementMap[slotId] || 'sidebar';
    const limit = options?.limit || slot.maxAds || 1;
    
    // Get active ads matching placement, payment status, and date range
    const adsRef = collection(db, 'artifacts', APP_ID, 'public', 'data', 'ads');
    const now = new Date();
    
    // Query active ads with paid status
    const activeAdsQuery = query(
      adsRef,
      where('status', '==', 'active'),
      where('placement', '==', placement),
      where('paymentStatus', '==', 'paid')
    );
    
    const snapshot = await getDocs(activeAdsQuery);
    const ads: Ad[] = [];
    
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      
      // ✅ FIX: Harden date filtering - ensure proper Timestamp conversion
      let startDate: Date;
      let endDate: Date;
      
      // Handle Firestore Timestamp objects
      if (data.startDate && typeof data.startDate.toDate === 'function') {
        startDate = data.startDate.toDate();
      } else if (data.startDate && data.startDate.seconds) {
        // Handle Timestamp object with seconds property
        startDate = new Date(data.startDate.seconds * 1000);
      } else if (data.startDate) {
        // Handle string or number timestamps
        startDate = new Date(data.startDate);
      } else {
        startDate = new Date(0); // Default to epoch if missing
      }
      
      if (data.endDate && typeof data.endDate.toDate === 'function') {
        endDate = data.endDate.toDate();
      } else if (data.endDate && data.endDate.seconds) {
        // Handle Timestamp object with seconds property
        endDate = new Date(data.endDate.seconds * 1000);
      } else if (data.endDate) {
        // Handle string or number timestamps
        endDate = new Date(data.endDate);
      } else {
        endDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // Default to 1 year from now if missing
      }
      
      // Validate dates are valid
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        console.warn(`⚠️ Invalid date range for ad ${docSnap.id}, skipping`);
        return;
      }
      
      // Filter by date range
      if (startDate <= now && endDate >= now) {
        ads.push({
          id: docSnap.id,
          advertiserId: data.advertiserId,
          title: data.title || '',
          description: data.description,
          creativeUrl: data.creativeUrl || '',
          destinationUrl: data.destinationUrl,
          placement: data.placement || 'sidebar',
          status: 'active',
          startDate,
          endDate,
          clicks: data.clicks || 0,
          views: data.views || 0,
          paymentStatus: data.paymentStatus || 'pending',
          paymentId: data.paymentId,
          createdAt: data.createdAt?.toDate?.() || new Date(),
          updatedAt: data.updatedAt?.toDate?.() || undefined,
        });
      }
    });
    
    // ✅ FIX: Add fallback logger when no ads found
    if (ads.length === 0) {
      const countryName = (window as any).__user_country?.name || 'Unknown';
      console.log(`🔍 [getAdsForSlot] AdSlot [${slotId}] found 0 active ads for ${countryName}`);
      console.log(`   Query filters: Placement=${placement}, Status=active, PaymentStatus=paid`);
      console.log(`   Slot lookup: ${slot ? 'Found' : 'NOT FOUND'} (slotId: ${slotId})`);
      if (slot) {
        console.log(`   Slot config:`, { maxAds: slot.maxAds, priorityTier: slot.priorityTier });
      }
    } else {
      console.log(`✅ [getAdsForSlot] AdSlot [${slotId}] found ${ads.length} active ads`);
    }
    
    // Sort by priority tier (premium first) and return limited results
    const priorityOrder = { premium: 0, standard: 1, house: 2 };
    ads.sort((a, b) => {
      // Simple rotation for now - can be enhanced with campaign priority
      return Math.random() - 0.5;
    });
    
    return ads.slice(0, limit);
  } catch (error: any) {
    console.error('Error fetching ads for slot:', slotId, error);
    // Return empty array on error (graceful degradation)
    return [];
  }
};

// ===========================================
// IMPRESSION & CLICK TRACKING
// ===========================================

export interface AdImpression {
  id: string;
  adId: string;
  slotId: string;
  timestamp: Date;
  userId?: string;
  userAgent?: string;
  referrer?: string;
}

export interface AdClick {
  id: string;
  adId: string;
  slotId: string;
  timestamp: Date;
  userId?: string;
  userAgent?: string;
  referrer?: string;
}

/**
 * Track ad impression (write to collection)
 */
export const trackAdImpression = async (
  adId: string,
  slotId: string,
  metadata?: {
    userId?: string;
    userAgent?: string;
    referrer?: string;
  }
): Promise<string> => {
  const db = getDb();
  const impressionsRef = collection(db, 'artifacts', APP_ID, 'public', 'data', 'adImpressions');
  const auth = getAuth();
  
  try {
    // Also update the ad's view count (backward compatibility)
    await trackAdView(adId);
    
    // Create impression record
    const docRef = await addDoc(impressionsRef, {
      adId,
      slotId,
      timestamp: serverTimestamp(),
      userId: metadata?.userId || auth.currentUser?.uid || null,
      userAgent: metadata?.userAgent || (typeof navigator !== 'undefined' ? navigator.userAgent : null),
      referrer: metadata?.referrer || (typeof document !== 'undefined' ? document.referrer : null),
    });
    
    console.log('✅ Impression tracked:', docRef.id);
    return docRef.id;
  } catch (error: any) {
    console.error('Error tracking impression:', error);
    // Don't throw - tracking failures shouldn't break ad rendering
    return '';
  }
};

/**
 * Track ad click (write to collection)
 */
export const trackAdClickDetailed = async (
  adId: string,
  slotId: string,
  metadata?: {
    userId?: string;
    userAgent?: string;
    referrer?: string;
  }
): Promise<string> => {
  const db = getDb();
  const clicksRef = collection(db, 'artifacts', APP_ID, 'public', 'data', 'adClicks');
  const auth = getAuth();
  
  try {
    // Also update the ad's click count (backward compatibility)
    await trackAdClick(adId);
    
    // Create click record
    const docRef = await addDoc(clicksRef, {
      adId,
      slotId,
      timestamp: serverTimestamp(),
      userId: metadata?.userId || auth.currentUser?.uid || null,
      userAgent: metadata?.userAgent || (typeof navigator !== 'undefined' ? navigator.userAgent : null),
      referrer: metadata?.referrer || (typeof document !== 'undefined' ? document.referrer : null),
    });
    
    console.log('✅ Click tracked:', docRef.id);
    return docRef.id;
  } catch (error: any) {
    console.error('Error tracking click:', error);
    // Don't throw - tracking failures shouldn't break ad rendering
    return '';
  }
};

// ===========================================
// INVOICES (BILLING)
// ===========================================

export interface Invoice {
  id: string;
  advertiserId: string;
  campaignId?: string;
  adId?: string;
  amount: number;
  currency: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  dueDate: Date;
  createdAt: Date;
  paidAt?: Date;
  invoiceNumber: string;
  lineItems?: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  notes?: string;
  paymentMethod?: 'stripe' | 'manual' | 'wire';
  paymentId?: string;
}

/**
 * Get invoices by advertiser
 */
export const getAdvertiserInvoices = async (advertiserId: string): Promise<Invoice[]> => {
  const db = getDb();
  const invoicesRef = collection(db, 'artifacts', APP_ID, 'public', 'data', 'invoices');
  const q = query(invoicesRef, where('advertiserId', '==', advertiserId));
  
  try {
    const snapshot = await getDocs(q);
    const invoices: Invoice[] = [];
    
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      invoices.push({
        id: docSnap.id,
        advertiserId: data.advertiserId,
        campaignId: data.campaignId,
        adId: data.adId,
        amount: data.amount || 0,
        currency: data.currency || 'USD',
        status: data.status || 'draft',
        dueDate: data.dueDate?.toDate() || new Date(),
        createdAt: data.createdAt?.toDate() || new Date(),
        paidAt: data.paidAt?.toDate(),
        invoiceNumber: data.invoiceNumber || '',
      });
    });
    
    return invoices.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch (error: any) {
    console.error('Error fetching invoices:', error);
    throw new Error(`Failed to fetch invoices: ${error.message}`);
  }
};
