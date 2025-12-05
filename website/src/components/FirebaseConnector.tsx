import React, { useEffect } from 'react';
import { initializeApp, FirebaseApp } from 'firebase/app';
import { getFirestore, doc, onSnapshot, Firestore } from 'firebase/firestore';
import { NewsStory } from '../../../types';

interface FirebaseConnectorProps {
  onNewsUpdate: (data: { [category: string]: NewsStory[] }) => void;
  onError: (error: string) => void;
}

// Firebase config will be injected at build time or runtime
const getFirebaseConfig = (): any => {
  // Try to get from window (injected at runtime)
  if (typeof window !== 'undefined' && (window as any).__firebase_config) {
    try {
      const config = (window as any).__firebase_config;
      // If it's already an object, return it; otherwise parse as JSON
      return typeof config === 'string' ? JSON.parse(config) : config;
    } catch (e) {
      console.error('Failed to parse Firebase config from window:', e);
    }
  }
  
  // Try to get from environment variable (build time)
  const configStr = import.meta.env.VITE_FIREBASE_CONFIG;
  if (configStr) {
    try {
      // If it's already an object, return it; otherwise parse as JSON
      if (typeof configStr === 'string' && configStr.trim()) {
        return JSON.parse(configStr);
      } else if (typeof configStr === 'object') {
        return configStr;
      }
    } catch (e) {
      console.error('Failed to parse Firebase config from env:', e);
      console.error('Config string:', configStr?.substring(0, 50) + '...');
    }
  }
  
  console.warn('⚠️ Firebase config not found. Check VITE_FIREBASE_CONFIG environment variable.');
  return null;
};

const FirebaseConnector: React.FC<FirebaseConnectorProps> = ({ onNewsUpdate, onError }) => {
  useEffect(() => {
    console.log('🔍 FirebaseConnector: Initializing...');
    const config = getFirebaseConfig();
    if (!config || Object.keys(config).length === 0) {
      console.error('❌ Firebase configuration not available or empty');
      console.log('💡 To enable real-time mode, add FIREBASE_CONFIG to GitHub Secrets');
      onError('Firebase configuration not available. Static mode will be used if available.');
      return;
    }
    
    console.log('✅ Firebase config found, initializing connection...');

    let app: FirebaseApp;
    let db: Firestore;
    let unsubscribe: (() => void) | null = null;

    try {
      app = initializeApp(config);
      db = getFirestore(app);
      
      const appId = (window as any).__app_id || 'morning-pulse-app';
      const today = new Date().toISOString().split('T')[0];
      const newsPath = `artifacts/${appId}/public/data/news/${today}`;
      
      console.log('📂 Looking for news at path:', newsPath);
      const newsRef = doc(db, newsPath);
      
      unsubscribe = onSnapshot(
        newsRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            const categories = data.categories || {};
            const categoryCount = Object.keys(categories).length;
            console.log('✅ News found in Firestore:', categoryCount, 'categories');
            if (categoryCount > 0) {
              onNewsUpdate(categories);
            } else {
              console.warn('⚠️ News document exists but has no categories');
              onError('News document exists but is empty');
            }
          } else {
            console.warn('⚠️ No news document found for today:', today);
            console.log('💡 News aggregator may not have run yet, or news is stored at a different path');
            onError(`No news data found for ${today}. The news aggregator may need to run first.`);
          }
        },
        (error) => {
          console.error('❌ Firestore error:', error);
          onError('Failed to load news from database: ' + error.message);
        }
      );
    } catch (error: any) {
      console.error('Firebase initialization error:', error);
      onError('Failed to initialize Firebase');
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [onNewsUpdate, onError]);

  return null; // This component doesn't render anything
};

export default FirebaseConnector;

