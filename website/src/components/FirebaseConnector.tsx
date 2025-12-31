import React, { useEffect } from 'react';
import { initializeApp, FirebaseApp } from 'firebase/app';
import { getFirestore, doc, onSnapshot, getDoc, Firestore } from 'firebase/firestore';
import { NewsStory } from '../../../types';

interface FirebaseConnectorProps {
  onNewsUpdate: (data: { [category: string]: NewsStory[] }) => void;
  onError: (error: string) => void;
}

// Hardcoded Firebase config for local development fallback
// This matches the project: gen-lang-client-0999441419
const HARDCODED_FIREBASE_CONFIG = {
  apiKey: "AIzaSyCAh6j7mhTtiQGN5855Tt-hCRVrNXbNxYE",
  authDomain: "gen-lang-client-0999441419.firebaseapp.com",
  projectId: "gen-lang-client-0999441419",
  storageBucket: "gen-lang-client-0999441419.firebasestorage.app",
  messagingSenderId: "328455476104",
  appId: "1:328455476104:web:396deccbc5613e353f603d",
  measurementId: "G-60S2YK429K"
};

// Firebase config will be injected at build time or runtime
const getFirebaseConfig = (): any => {
  // Priority 1: Try to get from window (injected at runtime via firebase-config.js)
  if (typeof window !== 'undefined' && (window as any).__firebase_config) {
    const config = (window as any).__firebase_config;
    if (typeof config === 'object' && config !== null && config.apiKey && config.apiKey !== 'YOUR_API_KEY') {
      console.log('✅ Using Firebase config from window.__firebase_config');
      return config;
    } else {
      console.warn('⚠️ window.__firebase_config exists but is invalid or placeholder');
    }
  } else {
    console.warn('⚠️ window.__firebase_config is MISSING');
  }
  
  // Priority 2: Try to get from environment variable (build time)
  const configStr = import.meta.env.VITE_FIREBASE_CONFIG;
  if (configStr && typeof configStr === 'string' && configStr.trim() && configStr !== 'null') {
    try {
      let parsed = JSON.parse(configStr);
      // If it's still a string (double-stringified), parse again
      if (typeof parsed === 'string') {
        parsed = JSON.parse(parsed);
        console.log('✅ Using Firebase config from VITE_FIREBASE_CONFIG (double-parsed)');
        return parsed;
      }
      console.log('✅ Using Firebase config from VITE_FIREBASE_CONFIG');
      return parsed;
    } catch (e) {
      console.error('❌ Failed to parse VITE_FIREBASE_CONFIG:', e);
      console.error('   Config string preview:', configStr?.substring(0, 100) + '...');
    }
  } else {
    console.warn('⚠️ VITE_FIREBASE_CONFIG is MISSING or empty');
  }
  
  // Priority 3: Use hardcoded fallback for local development
  console.log('⚠️ Using hardcoded Firebase config for local development');
  console.log('   To use production config, set FIREBASE_CONFIG secret in GitHub Actions');
  return HARDCODED_FIREBASE_CONFIG;
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
        
        // Use Firestore path segments: artifacts/morning-pulse-app/public/data/news/${YYYY-MM-DD}
        // Path structure: doc(db, 'artifacts', appId, 'public', 'data', 'news', dateString)
        
        // Try today first, then yesterday as fallback
        const today = new Date();
        const todayString = today.toISOString().split('T')[0]; // YYYY-MM-DD format
        
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayString = yesterday.toISOString().split('T')[0];
        
        console.log(`📂 Fetching news from Firestore...`);
        console.log(`   Path: artifacts/${appId}/public/data/news/${todayString}`);
        
        // Try today first
        const todayRef = doc(db, 'artifacts', appId, 'public', 'data', 'news', todayString);
        let snapshot = await getDoc(todayRef);
        
        if (snapshot.exists()) {
          const data = snapshot.data();
          const categories = data.categories || {};
          const categoryCount = Object.keys(categories).length;
          
          if (categoryCount > 0) {
            console.log(`✅ News found for today (${todayString}):`, categoryCount, 'categories');
            console.log('   Categories:', Object.keys(categories));
            onNewsUpdate(categories);
            
            // Set up real-time listener for today's document
            unsubscribe = onSnapshot(
              todayRef,
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
              (error: any) => {
                console.error('❌ Firestore real-time error:', error);
              }
            );
            return;
          }
        }
        
        // Fallback to yesterday
        console.log(`⚠️ No news found for today, trying yesterday (${yesterdayString})...`);
        const yesterdayRef = doc(db, 'artifacts', appId, 'public', 'data', 'news', yesterdayString);
        snapshot = await getDoc(yesterdayRef);
        
        if (snapshot.exists()) {
          const data = snapshot.data();
          const categories = data.categories || {};
          const categoryCount = Object.keys(categories).length;
          
          if (categoryCount > 0) {
            console.log(`✅ News found for yesterday (${yesterdayString}):`, categoryCount, 'categories');
            console.log('   Categories:', Object.keys(categories));
            onNewsUpdate(categories);
            
            // Set up real-time listener for yesterday's document
            unsubscribe = onSnapshot(
              yesterdayRef,
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
              (error: any) => {
                console.error('❌ Firestore real-time error:', error);
              }
            );
            return;
          }
        }
        
        // No news found at all
        console.warn('⚠️ No news found for today or yesterday');
        onError('Morning Pulse is currently gathering today\'s news. Please check back shortly.');
        
        // Set up real-time listener for today as fallback (in case news gets added)
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
            }
          },
          (error: any) => {
            console.error('❌ Firestore error:', error);
            console.error('   Error code:', error.code);
            console.error('   Error message:', error.message);
          }
        );
      } catch (error: any) {
        console.error('❌ Firebase initialization error:', error);
        console.error('   Error code:', error.code);
        console.error('   Error message:', error.message);
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

