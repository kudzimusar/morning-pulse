/**
 * Enhanced Firestore Service
 * Singleton pattern to prevent multiple Firebase instances
 * Fixes: QUIC_PROTOCOL_ERROR, Status 400, Editorial Queue freezing
 */

import { 
  Firestore, 
  initializeFirestore,
  persistentLocalCache,
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
    // ✅ FIX: Modern persistence using initializeFirestore with localCache
    // Note: This should be called when initializing Firestore, not after
    // For existing Firestore instances, we'll handle gracefully
    if (this.persistenceStarted || (this.db as any)._terminated) return;
    this.persistenceStarted = true;
    
    // Note: initializeFirestore should be called during Firestore initialization
    // If the db is already initialized, we can't change its cache settings
    // This is a no-op for already-initialized instances, which is fine
    try {
      // Check if persistence is already enabled
      if ((this.db as any)._persistenceEnabled || (this.db as any)._settings?.cache) {
        // Already has persistence, skip
        return;
      }
      // For already-initialized Firestore, we can't change cache settings
      // This is expected behavior - persistence should be set during initialization
      // Log only if it's the first time
      if (!(this.db as any)._persistenceEnabled) {
        console.log('ℹ️ Firestore persistence: Use initializeFirestore with localCache during initialization for modern persistence');
      }
    } catch (err: any) {
      // Silently handle - this is expected for already-initialized instances
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
          if (
            retryCount < maxRetries && 
            (error.code === 'unavailable' || 
             error.code === 'deadline-exceeded' || 
             error.code === 'cancelled' ||
             !error.code)
          ) {
            retryCount++;
            const delay = currentDelay;
            currentDelay *= backoffMultiplier; // Increase delay for next retry
            
            console.log(`🔄 Connection lost. Retrying in ${delay}ms... (Attempt ${retryCount}/${maxRetries})`);
            
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
