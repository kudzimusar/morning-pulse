import React, { useEffect } from 'react';
import { initializeApp, FirebaseApp } from 'firebase/app';
import { getFirestore, doc, onSnapshot, getDoc, Firestore } from 'firebase/firestore';
import { NewsStory } from '../../../types';
import { CountryInfo } from '../services/locationService';

interface FirebaseConnectorProps {
  onNewsUpdate: (data: { [category: string]: NewsStory[] }) => void;
  onError: (error: string) => void;
  userCountry?: CountryInfo;
  selectedDate?: string;
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

// Helper function to transform category names based on country
const transformCategoriesForCountry = (
  categories: { [category: string]: NewsStory[] },
  country: CountryInfo
): { [category: string]: NewsStory[] } => {
  const transformed: { [category: string]: NewsStory[] } = {};
  
  Object.keys(categories).forEach((categoryKey) => {
    let newCategoryKey = categoryKey;
    
    // Transform Local category based on country
    if (categoryKey === 'Local (Zim)' || categoryKey.startsWith('Local')) {
      if (country.code === 'ZW') {
        newCategoryKey = 'Local (Zim)';
      } else {
        newCategoryKey = `Local (${country.name})`;
      }
    }
    
    // Update articles' category field
    const articles = categories[categoryKey].map(article => ({
      ...article,
      category: newCategoryKey
    }));
    
    transformed[newCategoryKey] = articles;
  });
  
  return transformed;
};

const FirebaseConnector: React.FC<FirebaseConnectorProps> = ({ onNewsUpdate, onError, userCountry, selectedDate }) => {
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
        const country = userCountry || { code: 'ZW', name: 'Zimbabwe' };
        const dateString = selectedDate || new Date().toISOString().split('T')[0];
        
        // Determine Firestore path based on country
        // If Zimbabwe, use standard path: artifacts/morning-pulse-app/public/data/news/${date}
        // If other country, use: artifacts/morning-pulse-app/public/data/news/${date}/${countryCode}
        let newsRef;
        let newsPath: string;
        
        if (country.code === 'ZW') {
          // Standard Zimbabwe path
          newsPath = `artifacts/${appId}/public/data/news/${dateString}`;
          newsRef = doc(db, 'artifacts', appId, 'public', 'data', 'news', dateString);
        } else {
          // Country-specific path
          newsPath = `artifacts/${appId}/public/data/news/${dateString}/${country.code}`;
          newsRef = doc(db, 'artifacts', appId, 'public', 'data', 'news', dateString, country.code);
        }
        
        console.log(`📂 Fetching news from Firestore...`);
        console.log(`   Country: ${country.name} (${country.code})`);
        console.log(`   Path: ${newsPath}`);
        
        // Try selected date first
        let snapshot = await getDoc(newsRef);
        
        if (snapshot.exists()) {
          const data = snapshot.data();
          const categories = data.categories || {};
          const categoryCount = Object.keys(categories).length;
          
          if (categoryCount > 0) {
            console.log(`✅ News found for ${country.name} (${dateString}):`, categoryCount, 'categories');
            console.log('   Categories:', Object.keys(categories));
            
            // Transform Local category name based on country
            const transformedCategories = transformCategoriesForCountry(categories, country);
            onNewsUpdate(transformedCategories);
            
            // Set up real-time listener
            unsubscribe = onSnapshot(
              newsRef,
              (realtimeSnapshot) => {
                if (realtimeSnapshot.exists()) {
                  const realtimeData = realtimeSnapshot.data();
                  const realtimeCategories = realtimeData.categories || {};
                  if (Object.keys(realtimeCategories).length > 0) {
                    console.log('✅ News updated in real-time');
                    const transformed = transformCategoriesForCountry(realtimeCategories, country);
                    onNewsUpdate(transformed);
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
        
        // If country-specific news not found and not Zimbabwe, try fallback to Zimbabwe
        if (country.code !== 'ZW') {
          console.log(`⚠️ No news found for ${country.name}, trying Zimbabwe fallback...`);
          const fallbackRef = doc(db, 'artifacts', appId, 'public', 'data', 'news', dateString);
          snapshot = await getDoc(fallbackRef);
          
          if (snapshot.exists()) {
            const data = snapshot.data();
            const categories = data.categories || {};
            const categoryCount = Object.keys(categories).length;
            
            if (categoryCount > 0) {
              console.log(`✅ Using Zimbabwe news as fallback:`, categoryCount, 'categories');
              const transformed = transformCategoriesForCountry(categories, country);
              onNewsUpdate(transformed);
              
              unsubscribe = onSnapshot(
                fallbackRef,
                (realtimeSnapshot) => {
                  if (realtimeSnapshot.exists()) {
                    const realtimeData = realtimeSnapshot.data();
                    const realtimeCategories = realtimeData.categories || {};
                    if (Object.keys(realtimeCategories).length > 0) {
                      const transformed = transformCategoriesForCountry(realtimeCategories, country);
                      onNewsUpdate(transformed);
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
        }
        
        // No news found at all
        console.warn(`⚠️ No news found for ${country.name} on ${dateString}`);
        onError(`Morning Pulse is currently gathering news for ${country.name}. Please check back shortly.`);
        
        // Set up real-time listener as fallback
        unsubscribe = onSnapshot(
          newsRef,
          (snapshot) => {
            if (snapshot.exists()) {
              const data = snapshot.data();
              const categories = data.categories || {};
              const categoryCount = Object.keys(categories).length;
              if (categoryCount > 0) {
                console.log('✅ News found in Firestore (real-time):', categoryCount, 'categories');
                const transformed = transformCategoriesForCountry(categories, country);
                onNewsUpdate(transformed);
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
  }, [onNewsUpdate, onError, userCountry, selectedDate]); // Include country and date dependencies

  return null; // This component doesn't render anything
};

export default FirebaseConnector;

