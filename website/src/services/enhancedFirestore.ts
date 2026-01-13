/**
 * Enhanced Firestore Service
 * Singleton pattern to prevent multiple Firebase instances
 * Fixes: QUIC_PROTOCOL_ERROR, Status 400, Editorial Queue freezing
 */

import { 
  Firestore, 
  enableIndexedDbPersistence, 
  onSnapshot, 
  Query, 
  DocumentReference,
  Unsubscribe
} from 'firebase/firestore';

interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  backoffMultiplier?: number;
}

export class EnhancedFirestore {
  private static instances: Map<string, EnhancedFirestore> = new Map();
  private db: Firestore;
  private persistenceStarted: boolean = false;

  private constructor(db: Firestore) {
    this.db = db;
    this.enablePersistence();
  }

  public static getInstance(db: Firestore): EnhancedFirestore {
    // Use database ID as key to ensure one instance per database
    const dbId = (db as any)._databaseId?.database || 'default';
    if (!this.instances.has(dbId)) {
      this.instances.set(dbId, new EnhancedFirestore(db));
    }
    return this.instances.get(dbId)!;
  }

  private async enablePersistence(): Promise<void> {
    // ✅ FIX: Check if persistence is already enabled or db is terminated
    if (this.persistenceStarted || (this.db as any)._terminated) return;
    this.persistenceStarted = true; // Set immediately to prevent multiple calls
    
    try {
      // Check if already initialized to prevent the "Multiple Tabs" console spam
      await enableIndexedDbPersistence(this.db);
      // Only log success if it's the first time (quietly handle subsequent calls)
      if (!(this.db as any)._persistenceEnabled) {
        console.log('✅ Firestore persistence enabled');
      }
    } catch (err: any) {
      // Quietly handle the error so it doesn't lock the UI thread
      // Don't log warnings for expected errors (multiple tabs, etc.)
      if (err.code === 'failed-precondition') {
        // Multiple tabs - this is expected, don't spam console
        // Silently handle
      } else if (err.code === 'unimplemented') {
        // Browser doesn't support - expected in some browsers
        // Silently handle
      } else {
        // Other errors - only log if unexpected
        if (err.code && !['failed-precondition', 'unimplemented'].includes(err.code)) {
          console.warn('⚠️ Persistence skipped:', err.code);
        }
      }
      // Mark as started even on error to prevent retry spam
      this.persistenceStarted = true;
    }
  }

  subscribeWithRetry<T>(
    ref: Query | DocumentReference,
    onData: (data: T) => void,
    onError?: (error: any) => void,
    options: RetryOptions = {}
  ): Unsubscribe {
    const { 
      maxRetries = 5, 
      initialDelay = 1500, 
      backoffMultiplier = 2 
    } = options;
    
    let retryCount = 0;
    let currentDelay = initialDelay;
    let unsubscribe: Unsubscribe | null = null;
    let active = true;

    const execute = (): void => {
      if (!active) return;
      
      unsubscribe = onSnapshot(
        ref,
        (snapshot: any) => {
          // Success - reset retry state
          retryCount = 0;
          currentDelay = initialDelay;
          
          // Handle QuerySnapshot (collection) vs DocumentSnapshot (document)
          let data: any;
          if (snapshot.docs) {
            // Query snapshot - collection
            data = snapshot.docs.map((doc: any) => ({ 
              id: doc.id, 
              ...doc.data() 
            }));
          } else if (snapshot.exists && snapshot.exists()) {
            // Document snapshot
            data = {
              id: snapshot.id,
              ...snapshot.data()
            };
          } else {
            // Document doesn't exist
            data = null;
          }
          
          onData(data as T);
        },
        (error: any) => {
          console.error(`❌ Firestore Error (Attempt ${retryCount + 1}/${maxRetries}):`, error.code || error.message);
          
          // Retry logic for specific failure codes seen in logs
          // NOTE: `permission-denied` can happen briefly if Firestore starts before Auth token is ready.
          const isAuthLag = error.code === 'permission-denied' && retryCount < 2;

          if (
            retryCount < maxRetries &&
            (isAuthLag ||
              error.code === 'unavailable' ||
              error.code === 'deadline-exceeded' ||
              error.code === 'cancelled' ||
              !error.code)
          ) {
            retryCount++;
            const delay = currentDelay;
            currentDelay *= backoffMultiplier; // Increase delay for next retry
            
            if (isAuthLag) {
              console.log(`🔄 Auth may still be initializing. Retrying in ${delay}ms... (Attempt ${retryCount}/${maxRetries})`);
            } else {
              console.log(`🔄 Connection lost. Retrying in ${delay}ms... (Attempt ${retryCount}/${maxRetries})`);
            }
            
            setTimeout(() => {
              if (unsubscribe) {
                unsubscribe();
                unsubscribe = null;
              }
              if (active) {
                execute();
              }
            }, delay);
          } else {
            // Max retries reached or non-retryable error
            console.error('❌ Max retries reached or non-retryable error');
            if (onError) {
              onError(error);
            }
          }
        }
      );
    };

    execute();
    
    // Return cleanup function
    return () => {
      active = false;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }
}

export default EnhancedFirestore;
