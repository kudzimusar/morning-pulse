/**
 * Advertiser Management Service
 * Handles advertiser registration, ad submission, and ad management
 * Advertisers: artifacts/morning-pulse-app/public/data/advertisers/{uid}
 * Ads: artifacts/morning-pulse-app/public/data/ads/{adId}
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
  addDoc
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

const APP_ID = 'morning-pulse-app';

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
  placement: 'header' | 'sidebar' | 'inline';
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
    creativeUrl: string;
    placement: 'header' | 'sidebar' | 'inline';
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
