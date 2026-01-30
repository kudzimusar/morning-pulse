/**
 * Writer Payment Service (Sprint 4)
 * Manages payment statements and contributor payment operations
 */

import { 
  getFirestore,
  collection, 
  doc, 
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  addDoc,
  query,
  where,
  orderBy,
  Timestamp,
  serverTimestamp,
  Firestore
} from 'firebase/firestore';
import { getApp } from 'firebase/app';
import { WriterPaymentStatement, WriterPaymentSummary, PaymentStatementStatus } from '../../types';

const APP_ID = (window as any).__app_id || 'morning-pulse-app';

// Get Firestore instance
let db: Firestore | null = null;

const getDb = (): Firestore | null => {
  if (db) return db;
  
  try {
    const app = getApp();
    db = getFirestore(app);
    return db;
  } catch (e) {
    console.error('Firebase initialization error in writerPaymentService:', e);
    return null;
  }
};

/**
 * Helper to convert Firestore doc to WriterPaymentStatement
 */
const docToStatement = (docSnap: any): WriterPaymentStatement => {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    writerId: data.writerId,
    writerName: data.writerName || 'Unknown',
    writerEmail: data.writerEmail || '',
    periodStart: data.periodStart?.toDate?.() || new Date(),
    periodEnd: data.periodEnd?.toDate?.() || new Date(),
    periodLabel: data.periodLabel,
    paymentModel: data.paymentModel || 'per-article',
    rate: data.rate || 0,
    currency: data.currency || 'USD',
    articlesCount: data.articlesCount || 0,
    articlesPublished: (data.articlesPublished || []).map((a: any) => ({
      opinionId: a.opinionId,
      headline: a.headline,
      publishedAt: a.publishedAt?.toDate?.() || new Date(),
      wordCount: a.wordCount,
      amount: a.amount || 0,
    })),
    totalWordCount: data.totalWordCount,
    grossAmount: data.grossAmount || 0,
    deductions: data.deductions || [],
    netAmount: data.netAmount || 0,
    status: data.status || 'draft',
    createdAt: data.createdAt?.toDate?.() || new Date(),
    generatedBy: data.generatedBy,
    generatedByName: data.generatedByName,
    approvedAt: data.approvedAt?.toDate?.(),
    approvedBy: data.approvedBy,
    approvedByName: data.approvedByName,
    paidAt: data.paidAt?.toDate?.(),
    paidBy: data.paidBy,
    paidByName: data.paidByName,
    paymentReference: data.paymentReference,
    paymentMethod: data.paymentMethod,
    adminNotes: data.adminNotes,
    writerNotes: data.writerNotes,
  };
};

/**
 * Get all payment statements for a writer
 */
export const getWriterStatements = async (writerId: string): Promise<WriterPaymentStatement[]> => {
  const db = getDb();
  if (!db) throw new Error('Firebase not initialized');

  try {
    const statementsRef = collection(db, 'artifacts', APP_ID, 'public', 'data', 'writerPayments', writerId, 'statements');
    const snapshot = await getDocs(statementsRef);
    
    const statements: WriterPaymentStatement[] = [];
    snapshot.forEach((docSnap) => {
      statements.push(docToStatement(docSnap));
    });
    
    // Sort by period start (newest first)
    return statements.sort((a, b) => b.periodStart.getTime() - a.periodStart.getTime());
  } catch (error: any) {
    console.error('Error fetching writer statements:', error);
    throw new Error(`Failed to fetch statements: ${error.message}`);
  }
};

/**
 * Get a single payment statement
 */
export const getStatement = async (writerId: string, statementId: string): Promise<WriterPaymentStatement | null> => {
  const db = getDb();
  if (!db) throw new Error('Firebase not initialized');

  try {
    const statementRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'writerPayments', writerId, 'statements', statementId);
    const snap = await getDoc(statementRef);
    
    if (!snap.exists()) return null;
    return docToStatement(snap);
  } catch (error: any) {
    console.error('Error fetching statement:', error);
    throw new Error(`Failed to fetch statement: ${error.message}`);
  }
};

/**
 * Get all pending statements (for admin review)
 */
export const getPendingStatements = async (): Promise<WriterPaymentStatement[]> => {
  const db = getDb();
  if (!db) throw new Error('Firebase not initialized');

  try {
    // Get all writers' payment docs
    const paymentsRef = collection(db, 'artifacts', APP_ID, 'public', 'data', 'writerPayments');
    const writersSnap = await getDocs(paymentsRef);
    
    const allStatements: WriterPaymentStatement[] = [];
    
    // For each writer, get pending statements
    for (const writerDoc of writersSnap.docs) {
      const statementsRef = collection(db, 'artifacts', APP_ID, 'public', 'data', 'writerPayments', writerDoc.id, 'statements');
      const q = query(statementsRef, where('status', '==', 'pending'));
      const statementsSnap = await getDocs(q);
      
      statementsSnap.forEach((docSnap) => {
        allStatements.push(docToStatement(docSnap));
      });
    }
    
    // Sort by created date (oldest first for processing)
    return allStatements.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  } catch (error: any) {
    console.error('Error fetching pending statements:', error);
    throw new Error(`Failed to fetch pending statements: ${error.message}`);
  }
};

/**
 * Get all statements by status
 */
export const getStatementsByStatus = async (status: PaymentStatementStatus): Promise<WriterPaymentStatement[]> => {
  const db = getDb();
  if (!db) throw new Error('Firebase not initialized');

  try {
    const paymentsRef = collection(db, 'artifacts', APP_ID, 'public', 'data', 'writerPayments');
    const writersSnap = await getDocs(paymentsRef);
    
    const allStatements: WriterPaymentStatement[] = [];
    
    for (const writerDoc of writersSnap.docs) {
      const statementsRef = collection(db, 'artifacts', APP_ID, 'public', 'data', 'writerPayments', writerDoc.id, 'statements');
      const q = query(statementsRef, where('status', '==', status));
      const statementsSnap = await getDocs(q);
      
      statementsSnap.forEach((docSnap) => {
        allStatements.push(docToStatement(docSnap));
      });
    }
    
    return allStatements.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch (error: any) {
    console.error('Error fetching statements by status:', error);
    throw new Error(`Failed to fetch statements: ${error.message}`);
  }
};

/**
 * Create a new payment statement (admin action)
 */
export const createStatement = async (
  statement: Omit<WriterPaymentStatement, 'id' | 'createdAt' | 'status'>
): Promise<string> => {
  const db = getDb();
  if (!db) throw new Error('Firebase not initialized');

  try {
    const statementsRef = collection(db, 'artifacts', APP_ID, 'public', 'data', 'writerPayments', statement.writerId, 'statements');
    
    const docData = {
      ...statement,
      periodStart: Timestamp.fromDate(statement.periodStart),
      periodEnd: Timestamp.fromDate(statement.periodEnd),
      articlesPublished: statement.articlesPublished.map(a => ({
        ...a,
        publishedAt: Timestamp.fromDate(a.publishedAt),
      })),
      status: 'pending' as PaymentStatementStatus,
      createdAt: serverTimestamp(),
    };
    
    const docRef = await addDoc(statementsRef, docData);
    console.log('✅ Payment statement created:', docRef.id);
    return docRef.id;
  } catch (error: any) {
    console.error('Error creating statement:', error);
    throw new Error(`Failed to create statement: ${error.message}`);
  }
};

/**
 * Approve a payment statement (admin action)
 */
export const approveStatement = async (
  writerId: string,
  statementId: string,
  approvedBy: string,
  approvedByName: string,
  adminNotes?: string
): Promise<void> => {
  const db = getDb();
  if (!db) throw new Error('Firebase not initialized');

  try {
    const statementRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'writerPayments', writerId, 'statements', statementId);
    
    await updateDoc(statementRef, {
      status: 'approved',
      approvedAt: serverTimestamp(),
      approvedBy,
      approvedByName,
      ...(adminNotes && { adminNotes }),
    });
    
    console.log('✅ Statement approved:', statementId);
  } catch (error: any) {
    console.error('Error approving statement:', error);
    throw new Error(`Failed to approve statement: ${error.message}`);
  }
};

/**
 * Mark statement as paid (admin action)
 */
export const markStatementPaid = async (
  writerId: string,
  statementId: string,
  paidBy: string,
  paidByName: string,
  paymentReference?: string,
  paymentMethod?: string
): Promise<void> => {
  const db = getDb();
  if (!db) throw new Error('Firebase not initialized');

  try {
    const statementRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'writerPayments', writerId, 'statements', statementId);
    
    await updateDoc(statementRef, {
      status: 'paid',
      paidAt: serverTimestamp(),
      paidBy,
      paidByName,
      ...(paymentReference && { paymentReference }),
      ...(paymentMethod && { paymentMethod }),
    });
    
    console.log('✅ Statement marked as paid:', statementId);
  } catch (error: any) {
    console.error('Error marking statement paid:', error);
    throw new Error(`Failed to mark statement paid: ${error.message}`);
  }
};

/**
 * Dispute a statement (writer or admin action)
 */
export const disputeStatement = async (
  writerId: string,
  statementId: string,
  notes: string,
  isWriter: boolean = false
): Promise<void> => {
  const db = getDb();
  if (!db) throw new Error('Firebase not initialized');

  try {
    const statementRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'writerPayments', writerId, 'statements', statementId);
    
    const updateData: any = {
      status: 'disputed',
    };
    
    if (isWriter) {
      updateData.writerNotes = notes;
    } else {
      updateData.adminNotes = notes;
    }
    
    await updateDoc(statementRef, updateData);
    
    console.log('✅ Statement disputed:', statementId);
  } catch (error: any) {
    console.error('Error disputing statement:', error);
    throw new Error(`Failed to dispute statement: ${error.message}`);
  }
};

/**
 * Cancel a statement (admin action)
 */
export const cancelStatement = async (
  writerId: string,
  statementId: string,
  reason: string
): Promise<void> => {
  const db = getDb();
  if (!db) throw new Error('Firebase not initialized');

  try {
    const statementRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'writerPayments', writerId, 'statements', statementId);
    
    await updateDoc(statementRef, {
      status: 'cancelled',
      adminNotes: reason,
    });
    
    console.log('✅ Statement cancelled:', statementId);
  } catch (error: any) {
    console.error('Error cancelling statement:', error);
    throw new Error(`Failed to cancel statement: ${error.message}`);
  }
};

/**
 * Get payment summary for all writers (admin dashboard)
 */
export const getPaymentSummaries = async (): Promise<WriterPaymentSummary[]> => {
  const db = getDb();
  if (!db) throw new Error('Firebase not initialized');

  try {
    // Get all writers
    const writersRef = collection(db, 'artifacts', APP_ID, 'public', 'data', 'writers');
    const q = query(writersRef, where('status', '==', 'approved'));
    const writersSnap = await getDocs(q);
    
    const summaries: WriterPaymentSummary[] = [];
    
    for (const writerDoc of writersSnap.docs) {
      const writerData = writerDoc.data();
      
      // Get writer's statements
      const statementsRef = collection(db, 'artifacts', APP_ID, 'public', 'data', 'writerPayments', writerDoc.id, 'statements');
      const statementsSnap = await getDocs(statementsRef);
      
      let pendingStatements = 0;
      let pendingAmount = 0;
      let totalPaid = 0;
      let lastPaymentDate: Date | undefined;
      
      statementsSnap.forEach((stmtDoc) => {
        const stmt = stmtDoc.data();
        if (stmt.status === 'pending' || stmt.status === 'approved') {
          pendingStatements++;
          pendingAmount += stmt.netAmount || 0;
        }
        if (stmt.status === 'paid') {
          totalPaid += stmt.netAmount || 0;
          const paidAt = stmt.paidAt?.toDate?.();
          if (paidAt && (!lastPaymentDate || paidAt > lastPaymentDate)) {
            lastPaymentDate = paidAt;
          }
        }
      });
      
      summaries.push({
        writerId: writerDoc.id,
        writerName: writerData.name || 'Unknown',
        writerEmail: writerData.email || '',
        tier: writerData.tier,
        paymentModel: writerData.paymentProfile?.model,
        currency: writerData.paymentProfile?.currency || 'USD',
        currentPeriodArticles: 0, // Would need to calculate from opinions
        currentPeriodAmount: 0,
        pendingStatements,
        pendingAmount,
        totalPaid,
        totalStatements: statementsSnap.size,
        lastPaymentDate,
      });
    }
    
    // Sort by pending amount (highest first)
    return summaries.sort((a, b) => b.pendingAmount - a.pendingAmount);
  } catch (error: any) {
    console.error('Error fetching payment summaries:', error);
    throw new Error(`Failed to fetch payment summaries: ${error.message}`);
  }
};

/**
 * Export statements to CSV format
 */
export const exportStatementsToCSV = (statements: WriterPaymentStatement[]): string => {
  const headers = [
    'Statement ID',
    'Writer Name',
    'Writer Email',
    'Period',
    'Articles',
    'Gross Amount',
    'Net Amount',
    'Currency',
    'Status',
    'Created',
    'Paid Date',
    'Payment Reference'
  ].join(',');
  
  const rows = statements.map(s => [
    s.id,
    `"${s.writerName}"`,
    s.writerEmail,
    s.periodLabel || `${s.periodStart.toLocaleDateString()} - ${s.periodEnd.toLocaleDateString()}`,
    s.articlesCount,
    s.grossAmount.toFixed(2),
    s.netAmount.toFixed(2),
    s.currency,
    s.status,
    s.createdAt.toLocaleDateString(),
    s.paidAt?.toLocaleDateString() || '',
    s.paymentReference || ''
  ].join(','));
  
  return [headers, ...rows].join('\n');
};

// =====================================================
// ADMIN COMPONENT HELPER FUNCTIONS (Sprint 4)
// =====================================================

/**
 * Re-export WriterPaymentStatement type for components
 */
export type { WriterPaymentStatement };

/**
 * Get all payment statements across all writers (admin function)
 */
export const getAllPaymentStatements = async (): Promise<WriterPaymentStatement[]> => {
  const db = getDb();
  if (!db) throw new Error('Firebase not initialized');

  try {
    // Get all writers' payment root docs
    const paymentsRef = collection(db, 'writerPayments');
    const writersSnap = await getDocs(paymentsRef);
    
    const allStatements: WriterPaymentStatement[] = [];
    
    // For each writer, get all statements
    for (const writerDoc of writersSnap.docs) {
      const statementsRef = collection(db, 'writerPayments', writerDoc.id, 'statements');
      const statementsSnap = await getDocs(statementsRef);
      
      statementsSnap.forEach((docSnap) => {
        const data = docSnap.data();
        allStatements.push({
          id: docSnap.id,
          writerId: writerDoc.id,
          writerName: data.writerName || 'Unknown',
          writerEmail: data.writerEmail || '',
          periodStart: data.periodStart?.toDate?.() || new Date(),
          periodEnd: data.periodEnd?.toDate?.() || new Date(),
          periodLabel: data.periodLabel,
          paymentModel: data.paymentModel || 'per-article',
          rate: data.rate || 0,
          currency: data.currency || 'USD',
          articlesCount: data.articlesCount || 0,
          articlesPublished: (data.articles || data.articlesPublished || []).map((a: any) => ({
            opinionId: a.opinionId,
            headline: a.headline,
            publishedAt: a.publishedAt?.toDate?.() || new Date(),
            wordCount: a.wordCount,
            amount: a.amount || 0,
          })),
          totalWordCount: data.wordsCount || data.totalWordCount || 0,
          grossAmount: data.totalAmountDue || data.grossAmount || 0,
          deductions: data.deductions || [],
          netAmount: data.totalAmountDue || data.netAmount || 0,
          totalAmountDue: data.totalAmountDue || 0,
          wordsCount: data.wordsCount || 0,
          status: data.status || 'pending',
          createdAt: data.createdAt?.toDate?.() || data.generatedAt?.toDate?.() || new Date(),
          generatedBy: data.generatedBy,
          generatedByName: data.generatedByName,
          approvedAt: data.approvedAt?.toDate?.(),
          approvedBy: data.approvedBy,
          approvedByName: data.approvedByName,
          paidAt: data.paidAt?.toDate?.(),
          paidBy: data.paidBy,
          paidByName: data.paidByName,
          paymentReference: data.paymentReference || data.transactionId,
          paymentMethod: data.paymentMethod,
          adminNotes: data.adminNotes || data.notes,
          writerNotes: data.writerNotes,
        });
      });
    }
    
    // Sort by period start (newest first)
    return allStatements.sort((a, b) => b.periodStart.getTime() - a.periodStart.getTime());
  } catch (error: any) {
    console.error('Error fetching all statements:', error);
    throw new Error(`Failed to fetch statements: ${error.message}`);
  }
};

/**
 * Update payment statement status (simplified for admin component)
 */
export const updatePaymentStatementStatus = async (
  writerId: string,
  statementId: string,
  newStatus: 'pending' | 'approved' | 'paid' | 'failed',
  additionalData?: { paidAt?: Date; transactionId?: string }
): Promise<void> => {
  const db = getDb();
  if (!db) throw new Error('Firebase not initialized');

  try {
    const statementRef = doc(db, 'writerPayments', writerId, 'statements', statementId);
    
    const updateData: any = {
      status: newStatus,
    };
    
    if (additionalData?.paidAt) {
      updateData.paidAt = Timestamp.fromDate(additionalData.paidAt);
    }
    if (additionalData?.transactionId) {
      updateData.transactionId = additionalData.transactionId;
      updateData.paymentReference = additionalData.transactionId;
    }
    
    await updateDoc(statementRef, updateData);
    console.log(`✅ Statement ${statementId} status updated to ${newStatus}`);
  } catch (error: any) {
    console.error('Error updating statement status:', error);
    throw new Error(`Failed to update statement status: ${error.message}`);
  }
};

/**
 * Trigger statement generation via Cloud Function
 */
export const triggerStatementGeneration = async (
  periodStart: string,
  periodEnd: string,
  writerId?: string
): Promise<{ statementsGenerated: number }> => {
  // Build the Cloud Function URL
  const functionUrl = process.env.REACT_APP_FUNCTIONS_URL || 'https://us-central1-your-project.cloudfunctions.net';
  
  const params = new URLSearchParams({
    periodStart,
    periodEnd,
    ...(writerId && { writerId })
  });
  
  try {
    const response = await fetch(`${functionUrl}/generateWriterStatements?${params.toString()}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }
    
    const data = await response.json();
    return {
      statementsGenerated: data.statementsGenerated || 0
    };
  } catch (error: any) {
    console.error('Error triggering statement generation:', error);
    throw new Error(`Failed to generate statements: ${error.message}`);
  }
};
