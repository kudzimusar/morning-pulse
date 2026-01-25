/**
 * Billing Service
 * Handles invoice generation, payment processing, and revenue tracking
 */

import { 
  getFirestore, 
  collection, 
  doc,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
  Firestore,
  addDoc
} from 'firebase/firestore';
import { getApp } from 'firebase/app';

const APP_ID = (window as any).__app_id || 'morning-pulse-app';

const getDb = (): Firestore => {
  try {
    const app = getApp();
    return getFirestore(app);
  } catch (error) {
    console.error('Firebase initialization error:', error);
    throw new Error('Firebase not initialized');
  }
};

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
  lineItems: InvoiceLineItem[];
  notes?: string;
  paymentMethod?: 'stripe' | 'manual' | 'wire';
  paymentId?: string;
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Payment {
  id: string;
  advertiserId: string;
  invoiceId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentMethod: 'stripe' | 'manual' | 'wire';
  paymentIntentId?: string; // Stripe payment intent ID
  createdAt: Date;
  completedAt?: Date;
  metadata?: Record<string, any>;
}

/**
 * Generate invoice number
 */
const generateInvoiceNumber = (): string => {
  const prefix = 'MP';
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}-${year}-${random}`;
};

/**
 * Create invoice
 */
export const createInvoice = async (
  advertiserId: string,
  invoiceData: {
    campaignId?: string;
    adId?: string;
    amount: number;
    currency?: string;
    lineItems: InvoiceLineItem[];
    dueDate: Date;
    notes?: string;
  }
): Promise<string> => {
  const db = getDb();
  const invoicesRef = collection(db, 'artifacts', APP_ID, 'public', 'data', 'invoices');
  
  try {
    const invoiceNumber = generateInvoiceNumber();
    const dueDate = invoiceData.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // Default 30 days
    
    const docRef = await addDoc(invoicesRef, {
      advertiserId,
      campaignId: invoiceData.campaignId || null,
      adId: invoiceData.adId || null,
      amount: invoiceData.amount,
      currency: invoiceData.currency || 'USD',
      status: 'draft',
      dueDate: serverTimestamp(),
      invoiceNumber,
      lineItems: invoiceData.lineItems,
      notes: invoiceData.notes || '',
      createdAt: serverTimestamp(),
    });
    
    console.log('✅ Invoice created:', docRef.id);
    return docRef.id;
  } catch (error: any) {
    console.error('❌ Error creating invoice:', error);
    throw new Error(`Failed to create invoice: ${error.message}`);
  }
};

/**
 * Send invoice (change status to 'sent')
 */
export const sendInvoice = async (invoiceId: string): Promise<void> => {
  const db = getDb();
  const invoiceRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'invoices', invoiceId);
  
  try {
    await updateDoc(invoiceRef, {
      status: 'sent',
      updatedAt: serverTimestamp(),
    });
    
    console.log('✅ Invoice sent:', invoiceId);
  } catch (error: any) {
    console.error('❌ Error sending invoice:', error);
    throw new Error(`Failed to send invoice: ${error.message}`);
  }
};

/**
 * Mark invoice as paid
 */
export const markInvoicePaid = async (
  invoiceId: string,
  paymentData: {
    paymentId?: string;
    paymentMethod?: 'stripe' | 'manual' | 'wire';
    paymentIntentId?: string;
  }
): Promise<void> => {
  const db = getDb();
  const invoiceRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'invoices', invoiceId);
  
  try {
    // Update invoice
    await updateDoc(invoiceRef, {
      status: 'paid',
      paidAt: serverTimestamp(),
      paymentMethod: paymentData.paymentMethod || 'manual',
      paymentId: paymentData.paymentId || null,
      updatedAt: serverTimestamp(),
    });
    
    // Create payment record
    const invoiceSnap = await getDoc(invoiceRef);
    if (invoiceSnap.exists()) {
      const invoiceData = invoiceSnap.data();
      await createPayment({
        advertiserId: invoiceData.advertiserId,
        invoiceId,
        amount: invoiceData.amount,
        currency: invoiceData.currency || 'USD',
        paymentMethod: paymentData.paymentMethod || 'manual',
        paymentIntentId: paymentData.paymentIntentId,
      });
    }
    
    // Update ad payment status if invoice is for an ad
    if (invoiceData.adId) {
      const adsRef = collection(db, 'artifacts', APP_ID, 'public', 'data', 'ads');
      const adRef = doc(adsRef, invoiceData.adId);
      await updateDoc(adRef, {
        paymentStatus: 'paid',
        paymentId: paymentData.paymentId || invoiceId,
        updatedAt: serverTimestamp(),
      });
    }
    
    console.log('✅ Invoice marked as paid:', invoiceId);
  } catch (error: any) {
    console.error('❌ Error marking invoice as paid:', error);
    throw new Error(`Failed to mark invoice as paid: ${error.message}`);
  }
};

/**
 * Create payment record
 */
export const createPayment = async (
  paymentData: {
    advertiserId: string;
    invoiceId: string;
    amount: number;
    currency: string;
    paymentMethod: 'stripe' | 'manual' | 'wire';
    paymentIntentId?: string;
    metadata?: Record<string, any>;
  }
): Promise<string> => {
  const db = getDb();
  const paymentsRef = collection(db, 'artifacts', APP_ID, 'public', 'data', 'payments');
  
  try {
    const docRef = await addDoc(paymentsRef, {
      advertiserId: paymentData.advertiserId,
      invoiceId: paymentData.invoiceId,
      amount: paymentData.amount,
      currency: paymentData.currency,
      status: 'completed',
      paymentMethod: paymentData.paymentMethod,
      paymentIntentId: paymentData.paymentIntentId || null,
      metadata: paymentData.metadata || {},
      createdAt: serverTimestamp(),
      completedAt: serverTimestamp(),
    });
    
    console.log('✅ Payment created:', docRef.id);
    return docRef.id;
  } catch (error: any) {
    console.error('❌ Error creating payment:', error);
    throw new Error(`Failed to create payment: ${error.message}`);
  }
};

/**
 * Get all invoices (admin)
 */
export const getAllInvoices = async (): Promise<Invoice[]> => {
  const db = getDb();
  const invoicesRef = collection(db, 'artifacts', APP_ID, 'public', 'data', 'invoices');
  
  try {
    const snapshot = await getDocs(invoicesRef);
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
        lineItems: data.lineItems || [],
        notes: data.notes,
        paymentMethod: data.paymentMethod,
        paymentId: data.paymentId,
      });
    });
    
    return invoices.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch (error: any) {
    console.error('Error fetching invoices:', error);
    throw new Error(`Failed to fetch invoices: ${error.message}`);
  }
};

/**
 * Get revenue summary
 */
export const getRevenueSummary = async (options?: {
  startDate?: Date;
  endDate?: Date;
  advertiserId?: string;
}): Promise<{
  totalRevenue: number;
  pendingRevenue: number;
  paidInvoices: number;
  pendingInvoices: number;
  overdueInvoices: number;
}> => {
  const db = getDb();
  const invoicesRef = collection(db, 'artifacts', APP_ID, 'public', 'data', 'invoices');
  
  try {
    let q = query(invoicesRef);
    
    if (options?.advertiserId) {
      q = query(invoicesRef, where('advertiserId', '==', options.advertiserId));
    }
    
    const snapshot = await getDocs(q);
    
    let totalRevenue = 0;
    let pendingRevenue = 0;
    let paidInvoices = 0;
    let pendingInvoices = 0;
    let overdueInvoices = 0;
    
    const now = new Date();
    
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const invoiceDate = data.createdAt?.toDate() || new Date();
      const dueDate = data.dueDate?.toDate() || new Date();
      
      // Apply date filters
      if (options?.startDate && invoiceDate < options.startDate) return;
      if (options?.endDate && invoiceDate > options.endDate) return;
      
      const amount = data.amount || 0;
      const status = data.status || 'draft';
      
      if (status === 'paid') {
        totalRevenue += amount;
        paidInvoices++;
      } else if (status === 'sent' || status === 'draft') {
        pendingRevenue += amount;
        pendingInvoices++;
        
        if (dueDate < now) {
          overdueInvoices++;
        }
      }
    });
    
    return {
      totalRevenue,
      pendingRevenue,
      paidInvoices,
      pendingInvoices,
      overdueInvoices,
    };
  } catch (error: any) {
    console.error('Error calculating revenue summary:', error);
    throw new Error(`Failed to calculate revenue summary: ${error.message}`);
  }
};

/**
 * Auto-generate invoice for ad (when ad is approved)
 */
export const generateInvoiceForAd = async (
  adId: string,
  pricing: {
    amount: number;
    currency?: string;
    description?: string;
  }
): Promise<string> => {
  const db = getDb();
  
  try {
    // Get ad to find advertiser
    const adRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'ads', adId);
    const adSnap = await getDoc(adRef);
    
    if (!adSnap.exists()) {
      throw new Error('Ad not found');
    }
    
    const adData = adSnap.data();
    const advertiserId = adData.advertiserId;
    
    // Create invoice
    const invoiceId = await createInvoice(advertiserId, {
      adId,
      amount: pricing.amount,
      currency: pricing.currency || 'USD',
      lineItems: [{
        description: pricing.description || `Advertisement: ${adData.title || 'Ad Campaign'}`,
        quantity: 1,
        unitPrice: pricing.amount,
        total: pricing.amount,
      }],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    });
    
    // Auto-send invoice
    await sendInvoice(invoiceId);
    
    console.log('✅ Invoice generated and sent for ad:', adId);
    return invoiceId;
  } catch (error: any) {
    console.error('❌ Error generating invoice for ad:', error);
    throw new Error(`Failed to generate invoice: ${error.message}`);
  }
};

/**
 * Check and mark overdue invoices
 */
export const checkOverdueInvoices = async (): Promise<number> => {
  const db = getDb();
  const invoicesRef = collection(db, 'artifacts', APP_ID, 'public', 'data', 'invoices');
  const q = query(invoicesRef, where('status', 'in', ['sent', 'draft']));
  
  try {
    const snapshot = await getDocs(q);
    const now = new Date();
    let updatedCount = 0;
    
    snapshot.forEach(async (docSnap) => {
      const data = docSnap.data();
      const dueDate = data.dueDate?.toDate();
      
      if (dueDate && dueDate < now && data.status !== 'overdue') {
        const invoiceRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'invoices', docSnap.id);
        await updateDoc(invoiceRef, {
          status: 'overdue',
          updatedAt: serverTimestamp(),
        });
        updatedCount++;
      }
    });
    
    console.log(`✅ Marked ${updatedCount} invoices as overdue`);
    return updatedCount;
  } catch (error: any) {
    console.error('❌ Error checking overdue invoices:', error);
    throw new Error(`Failed to check overdue invoices: ${error.message}`);
  }
};
