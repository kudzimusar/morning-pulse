import React, { useEffect } from 'react';
import { initializeApp, FirebaseApp } from 'firebase/app';
import { getFirestore, doc, onSnapshot, getDoc, Firestore } from 'firebase/firestore';
import { NewsStory } from '../../../types';

interface FirebaseConnectorProps {
  onNewsUpdate: (data: { [category: string]: NewsStory[] }) => void;
  onError: (error: string) => void;
}

// Firebase config will be injected at build time or runtime
const getFirebaseConfig = (): any => {
  // Try to get from window (injected at runtime via firebase-config.js)
  if (typeof window !== 'undefined' && (window as any).__firebase_config) {
    try {
      const config = (window as any).__firebase_config;
      // If it's already an object, return it; otherwise parse as JSON
      if (typeof config === 'object' && config !== null) {
        return config;
      } else if (typeof config === 'string' && config.trim()) {
        return JSON.parse(config);
      }
    } catch (e) {
      console.error('Failed to parse Firebase config from window:', e);
    }
  }
  
  // Try to get from environment variable (build time)
  const configStr = import.meta.env.VITE_FIREBASE_CONFIG;
  if (configStr && typeof configStr === 'string' && configStr.trim() && configStr !== 'null') {
    try {
      // The config might be double-stringified, so try parsing twice if needed
      let parsed = JSON.parse(configStr);
      // If the result is still a string, parse again
      if (typeof parsed === 'string') {
        parsed = JSON.parse(parsed);
      }
      return parsed;
    } catch (e) {
      console.error('Failed to parse Firebase config from env:', e);
      console.error('Config string preview:', configStr?.substring(0, 100) + '...');
      console.error('Config string type:', typeof configStr);
    }
  }
  
  console.warn('⚠️ Firebase config not found. Check FIREBASE_CONFIG secret or VITE_FIREBASE_CONFIG environment variable.');
  return null;
};

const FirebaseConnector: React.FC<FirebaseConnectorProps> = ({ onNewsUpdate, onError }) => {
  useEffect(() => {
    console.log('🔍 FirebaseConnector: Initializing...');
    const config = getFirebaseConfig();
    if (!config || Object.keys(config).length === 0) {
      console.log('ℹ️ Firebase configuration not available - will use static mode');
      // Don't call onError - let static mode handle it silently
      return;
    }
    
    console.log('✅ Firebase config found, initializing connection...');

    let app: FirebaseApp;
    let db: Firestore;
    let unsubscribe: (() => void) | null = null;

    const loadLatestNews = async () => {
      try {
        app = initializeApp(config);
        db = getFirestore(app);
        
        const appId = (window as any).__app_id || 'morning-pulse-app';
        const newsCollectionPath = `artifacts/${appId}/public/data/news`;
        
        // Try to find the latest news by checking today, yesterday, etc.
        let found = false;
        
        for (let i = 0; i < 7; i++) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateString = date.toISOString().split('T')[0];
          const newsPath = `${newsCollectionPath}/${dateString}`;
          const newsRef = doc(db, newsPath);
          
          console.log(`📂 Checking news for date: ${dateString}`);
          
          try {
            const snapshot = await getDoc(newsRef);
            if (snapshot.exists()) {
              const data = snapshot.data();
              const categories = data.categories || {};
              const categoryCount = Object.keys(categories).length;
              
              if (categoryCount > 0) {
                console.log(`✅ News found for ${dateString}:`, categoryCount, 'categories');
                onNewsUpdate(categories);
                found = true;
                
                // Set up real-time listener for this document
                unsubscribe = onSnapshot(
                  newsRef,
                  (realtimeSnapshot) => {
                    if (realtimeSnapshot.exists()) {
                      const realtimeData = realtimeSnapshot.data();
                      const realtimeCategories = realtimeData.categories || {};
                      if (Object.keys(realtimeCategories).length > 0) {
                        console.log('✅ News updated in real-time');
                        onNewsUpdate(realtimeCategories);
                      }
                    }
                  },
                  (error) => {
                    console.error('❌ Firestore real-time error:', error);
                  }
                );
                break;
              }
            }
          } catch (docError) {
            console.log(`⚠️ Error checking ${dateString}:`, docError);
            continue;
          }
        }
        
        if (!found) {
          // Set up real-time listener for today's document as fallback
          const today = new Date().toISOString().split('T')[0];
          const todayPath = `${newsCollectionPath}/${today}`;
          const todayRef = doc(db, todayPath);
          
          console.log('📂 Setting up real-time listener for today:', today);
          unsubscribe = onSnapshot(
            todayRef,
            (snapshot) => {
              if (snapshot.exists()) {
                const data = snapshot.data();
                const categories = data.categories || {};
                const categoryCount = Object.keys(categories).length;
                if (categoryCount > 0) {
                  console.log('✅ News found in Firestore (real-time):', categoryCount, 'categories');
                  onNewsUpdate(categories);
                }
              } else {
                console.warn('⚠️ No news document found. News aggregator may need to run.');
                onError(`No news data found. The news aggregator may need to run first.`);
              }
            },
            (error) => {
              console.error('❌ Firestore error:', error);
              onError('Failed to load news from database: ' + error.message);
            }
          );
        }
      } catch (error: any) {
        console.error('Firebase initialization error:', error);
        onError('Failed to initialize Firebase: ' + error.message);
      }
    };
    
    loadLatestNews();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [onNewsUpdate, onError]); // Handlers are stable via useCallback in App.tsx

  return null; // This component doesn't render anything
};

export default FirebaseConnector;

