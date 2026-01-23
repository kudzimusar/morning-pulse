/**
 * Subscription Management Service
 * Handles subscriber registration, payment processing, and subscription management
 * Subscribers are stored at: artifacts/{appId}/public/data/subscribers/{uid}
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
  onSnapshot
} from 'firebase/firestore';
import { 
  getAuth,
  createUserWithEmailAndPassword,
  User
} from 'firebase/auth';
import { getApp } from 'firebase/app';

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

export interface Subscriber {
  uid: string;
  email: string;
  whatsapp?: string;
  subscriptionTier: 'micro-pulse' | 'premium' | 'enterprise';
  status: 'active' | 'cancelled' | 'expired' | 'pending_payment';
  paymentStatus: 'paid' | 'pending' | 'failed';
  startDate: Date;
  endDate: Date;
  paymentId?: string;
  stripeCustomerId?: string;
  createdAt: Date;
  updatedAt?: Date;
}

/**
 * Register a new subscriber
 * Creates Firebase Auth user and subscriber document
 */
export const registerSubscriber = async (
  email: string,
  password: string,
  whatsapp: string,
  tier: 'micro-pulse' | 'premium' = 'micro-pulse'
): Promise<string> => {
  const auth = getAuth();
  const db = getDb();
  
  try {
    // 1. Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;
    
    // 2. Create subscriber document using mandatory path
    const subscriberRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'subscribers', uid);
    
    const now = new Date();
    const endDate = new Date(now);
    endDate.setMonth(endDate.getMonth() + 1); // 1 month subscription
    
    await setDoc(subscriberRef, {
      email,
      whatsapp: whatsapp || '',
      subscriptionTier: tier,
      status: 'pending_payment',
      paymentStatus: 'pending',
      startDate: serverTimestamp(),
      endDate: serverTimestamp(), // Will be updated after payment
      createdAt: serverTimestamp(),
    });
    
    console.log('✅ Subscriber registered:', uid);
    return uid;
  } catch (error: any) {
    console.error('❌ Subscriber registration failed:', error);
    throw new Error(`Failed to register subscriber: ${error.message}`);
  }
};

/**
 * Get subscriber by UID
 */
export const getSubscriber = async (uid: string): Promise<Subscriber | null> => {
  const db = getDb();
  const subscriberRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'subscribers', uid);
  
  try {
    const snap = await getDoc(subscriberRef);
    if (snap.exists()) {
      const data = snap.data();
      return {
        uid: snap.id,
        email: data.email || '',
        whatsapp: data.whatsapp,
        subscriptionTier: data.subscriptionTier || 'micro-pulse',
        status: data.status || 'pending_payment',
        paymentStatus: data.paymentStatus || 'pending',
        startDate: data.startDate?.toDate?.() || new Date(),
        endDate: data.endDate?.toDate?.() || new Date(),
        paymentId: data.paymentId,
        stripeCustomerId: data.stripeCustomerId,
        createdAt: data.createdAt?.toDate?.() || new Date(),
        updatedAt: data.updatedAt?.toDate?.() || undefined,
      };
    }
    return null;
  } catch (error: any) {
    console.error('Error fetching subscriber:', error);
    throw new Error(`Failed to fetch subscriber: ${error.message}`);
  }
};

/**
 * Get current subscriber data
 */
export const getCurrentSubscriber = async (): Promise<Subscriber | null> => {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) return null;
  
  return getSubscriber(user.uid);
};

/**
 * Subscribe to real-time subscriber updates (admin only)
 */
export const subscribeToSubscribers = (
  callback: (subscribers: Subscriber[]) => void,
  onError?: (error: any) => void
): (() => void) => {
  const db = getDb();
  const subscribersRef = collection(db, 'artifacts', APP_ID, 'public', 'data', 'subscribers');
  
  const unsubscribe = onSnapshot(subscribersRef, (snapshot) => {
    const subscribers: Subscriber[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      subscribers.push({
        uid: docSnap.id,
        email: data.email || '',
        whatsapp: data.whatsapp,
        subscriptionTier: data.subscriptionTier || 'micro-pulse',
        status: data.status || 'pending_payment',
        paymentStatus: data.paymentStatus || 'pending',
        startDate: data.startDate?.toDate?.() || new Date(),
        endDate: data.endDate?.toDate?.() || new Date(),
        paymentId: data.paymentId,
        stripeCustomerId: data.stripeCustomerId,
        createdAt: data.createdAt?.toDate?.() || new Date(),
        updatedAt: data.updatedAt?.toDate?.() || undefined,
      });
    });
    callback(subscribers);
  }, (error) => {
    console.error('❌ Firestore Permission Error (Subscribers):', error);
    if (onError) onError(error);
  });
  
  return unsubscribe;
};

/**
 * Get all active subscribers (for admin)
 */
export const getActiveSubscribers = async (): Promise<Subscriber[]> => {
  const db = getDb();
  const subscribersRef = collection(db, 'artifacts', APP_ID, 'public', 'data', 'subscribers');
  const q = query(subscribersRef, where('status', '==', 'active'));
  
  try {
    const snapshot = await getDocs(q);
    const subscribers: Subscriber[] = [];
    
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      subscribers.push({
        uid: docSnap.id,
        email: data.email || '',
        whatsapp: data.whatsapp,
        subscriptionTier: data.subscriptionTier || 'micro-pulse',
        status: 'active',
        paymentStatus: data.paymentStatus || 'paid',
        startDate: data.startDate?.toDate?.() || new Date(),
        endDate: data.endDate?.toDate?.() || new Date(),
        paymentId: data.paymentId,
        stripeCustomerId: data.stripeCustomerId,
        createdAt: data.createdAt?.toDate?.() || new Date(),
        updatedAt: data.updatedAt?.toDate?.() || undefined,
      });
    });
    
    return subscribers.sort((a, b) => {
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
  } catch (error: any) {
    console.error('Error fetching active subscribers:', error);
    throw new Error(`Failed to fetch subscribers: ${error.message}`);
  }
};

/**
 * Get all subscribers (for admin)
 */
export const getAllSubscribers = async (): Promise<Subscriber[]> => {
  const db = getDb();
  const subscribersRef = collection(db, 'artifacts', APP_ID, 'public', 'data', 'subscribers');
  
  try {
    const snapshot = await getDocs(subscribersRef);
    const subscribers: Subscriber[] = [];
    
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      subscribers.push({
        uid: docSnap.id,
        email: data.email || '',
        whatsapp: data.whatsapp,
        subscriptionTier: data.subscriptionTier || 'micro-pulse',
        status: data.status || 'pending_payment',
        paymentStatus: data.paymentStatus || 'pending',
        startDate: data.startDate?.toDate?.() || new Date(),
        endDate: data.endDate?.toDate?.() || new Date(),
        paymentId: data.paymentId,
        stripeCustomerId: data.stripeCustomerId,
        createdAt: data.createdAt?.toDate?.() || new Date(),
        updatedAt: data.updatedAt?.toDate?.() || undefined,
      });
    });
    
    return subscribers.sort((a, b) => {
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
  } catch (error: any) {
    console.error('Error fetching subscribers:', error);
    throw new Error(`Failed to fetch subscribers: ${error.message}`);
  }
};

/**
 * Activate subscription after payment
 */
export const activateSubscription = async (
  uid: string,
  paymentId: string,
  stripeCustomerId?: string
): Promise<void> => {
  const db = getDb();
  const subscriberRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'subscribers', uid);
  
  try {
    const now = new Date();
    const endDate = new Date(now);
    endDate.setMonth(endDate.getMonth() + 1); // 1 month from now
    
    await updateDoc(subscriberRef, {
      status: 'active',
      paymentStatus: 'paid',
      paymentId,
      stripeCustomerId: stripeCustomerId || null,
      startDate: serverTimestamp(),
      endDate: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    console.log('✅ Subscription activated:', uid);
  } catch (error: any) {
    console.error('❌ Error activating subscription:', error);
    throw new Error(`Failed to activate subscription: ${error.message}`);
  }
};

/**
 * Cancel subscription
 */
export const cancelSubscription = async (uid: string): Promise<void> => {
  const db = getDb();
  const subscriberRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'subscribers', uid);
  
  try {
    await updateDoc(subscriberRef, {
      status: 'cancelled',
      updatedAt: serverTimestamp(),
    });
    
    console.log('✅ Subscription cancelled:', uid);
  } catch (error: any) {
    console.error('❌ Error cancelling subscription:', error);
    throw new Error(`Failed to cancel subscription: ${error.message}`);
  }
};

/**
 * Renew subscription
 */
export const renewSubscription = async (uid: string, paymentId: string): Promise<void> => {
  const db = getDb();
  const subscriberRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'subscribers', uid);
  
  try {
    const subscriber = await getSubscriber(uid);
    if (!subscriber) {
      throw new Error('Subscriber not found');
    }
    
    const now = new Date();
    const endDate = new Date(now);
    endDate.setMonth(endDate.getMonth() + 1);
    
    await updateDoc(subscriberRef, {
      status: 'active',
      paymentStatus: 'paid',
      paymentId,
      startDate: serverTimestamp(),
      endDate: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    console.log('✅ Subscription renewed:', uid);
  } catch (error: any) {
    console.error('❌ Error renewing subscription:', error);
    throw new Error(`Failed to renew subscription: ${error.message}`);
  }
};

/**
 * Update subscriber profile
 */
export const updateSubscriberProfile = async (
  uid: string,
  updates: {
    whatsapp?: string;
  }
): Promise<void> => {
  const db = getDb();
  const subscriberRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'subscribers', uid);
  
  try {
    await updateDoc(subscriberRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
    
    console.log('✅ Subscriber profile updated:', uid);
  } catch (error: any) {
    console.error('❌ Error updating subscriber profile:', error);
    throw new Error(`Failed to update subscriber profile: ${error.message}`);
  }
};

/**
 * Check if subscription is active
 */
export const isSubscriptionActive = async (): Promise<boolean> => {
  const subscriber = await getCurrentSubscriber();
  if (!subscriber) return false;
  
  if (subscriber.status !== 'active') return false;
  
  // Check if subscription has expired
  const now = new Date();
  return subscriber.endDate > now;
};

/**
 * Process payment (placeholder - integrate with Stripe/PayPal)
 * TODO: Implement actual payment processing
 */
export const processPayment = async (
  amount: number,
  currency: string = 'USD',
  paymentMethodId: string
): Promise<{ success: boolean; paymentId?: string; error?: string }> => {
  // TODO: Integrate with Stripe/PayPal
  // For now, simulate successful payment
  console.log('💳 Processing payment:', { amount, currency, paymentMethodId });
  
  // Simulate payment processing delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Generate mock payment ID
  const mockPaymentId = `pay_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  
  return {
    success: true,
    paymentId: mockPaymentId,
  };
};
