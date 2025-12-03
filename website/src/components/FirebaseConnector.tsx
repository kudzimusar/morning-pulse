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
      return JSON.parse((window as any).__firebase_config);
    } catch (e) {
      console.error('Failed to parse Firebase config from window');
    }
  }
  
  // Try to get from environment variable (build time)
  const configStr = import.meta.env.VITE_FIREBASE_CONFIG;
  if (configStr) {
    try {
      return JSON.parse(configStr);
    } catch (e) {
      console.error('Failed to parse Firebase config from env');
    }
  }
  
  return null;
};

const FirebaseConnector: React.FC<FirebaseConnectorProps> = ({ onNewsUpdate, onError }) => {
  useEffect(() => {
    const config = getFirebaseConfig();
    if (!config || Object.keys(config).length === 0) {
      onError('Firebase configuration not available');
      return;
    }

    let app: FirebaseApp;
    let db: Firestore;
    let unsubscribe: (() => void) | null = null;

    try {
      app = initializeApp(config);
      db = getFirestore(app);
      
      const appId = (window as any).__app_id || 'default-app-id';
      const today = new Date().toISOString().split('T')[0];
      const newsPath = `artifacts/${appId}/public/data/news/${today}`;
      
      const newsRef = doc(db, newsPath);
      
      unsubscribe = onSnapshot(
        newsRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            const categories = data.categories || {};
            onNewsUpdate(categories);
          } else {
            onError('No news data found for today');
          }
        },
        (error) => {
          console.error('Firestore error:', error);
          onError('Failed to load news from database');
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

