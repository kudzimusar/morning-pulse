import React, { useEffect, useRef } from 'react';
import { initializeApp, FirebaseApp } from 'firebase/app';
import { getFirestore, doc, onSnapshot, getDoc, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { NewsStory } from '../../../types';
import { CountryInfo } from '../services/locationService';

interface FirebaseConnectorProps {
  onNewsUpdate: (data: { [category: string]: NewsStory[] }, lastUpdated?: Date) => void;
  onError: (error: string) => void;
  userCountry?: CountryInfo;
  selectedDate?: string;
  onGlobalDataUpdate?: (globalData: any) => void; // Callback to store entire document
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

// Helper to extract timestamp from document data
const getDocumentTimestamp = (data: any): Date | null => {
  if (data.updatedAt?.toDate) {
    return data.updatedAt.toDate();
  }
  if (data.updatedAt?.seconds) {
    return new Date(data.updatedAt.seconds * 1000);
  }
  if (data.timestamp) {
    return new Date(data.timestamp);
  }
  return null;
};

const FirebaseConnector: React.FC<FirebaseConnectorProps> = ({ onNewsUpdate, onError, userCountry, selectedDate, onGlobalDataUpdate }) => {
  // Use refs to store latest callbacks to avoid re-initialization
  const onNewsUpdateRef = useRef(onNewsUpdate);
  const onErrorRef = useRef(onError);
  const onGlobalDataUpdateRef = useRef(onGlobalDataUpdate);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastFetchedDateRef = useRef<string>('');

  // Update refs when callbacks change
  useEffect(() => {
    onNewsUpdateRef.current = onNewsUpdate;
    onErrorRef.current = onError;
    onGlobalDataUpdateRef.current = onGlobalDataUpdate;
  }, [onNewsUpdate, onError, onGlobalDataUpdate]);

  useEffect(() => {
    console.log('🔍 FirebaseConnector: Initializing...');
    const config = getFirebaseConfig();
    if (!config || Object.keys(config).length === 0) {
      console.log('ℹ️ Firebase configuration not available - will use static mode');
      return;
    }
    
    console.log('✅ Firebase config found, initializing connection...');

    let app: FirebaseApp;
    let auth: Auth;
    let db: Firestore;
    let unsubscribe: (() => void) | null = null;

    // Function to try fetching news for a specific date
    const tryFetchNewsForDate = async (dateString: string, country: CountryInfo): Promise<{ success: boolean; data?: any; timestamp?: Date }> => {
      try {
        const appId = (window as any).__app_id || 'morning-pulse-app';
        const newsPath = `artifacts/${appId}/public/data/news/${dateString}`;
        const newsRef = doc(db, 'artifacts', appId, 'public', 'data', 'news', dateString);
        
        const snapshot = await getDoc(newsRef);
        
        if (snapshot.exists()) {
          const data = snapshot.data();
          const currentCountry = country;
          
          // Extract country-specific data from document fields
          let categories = data[currentCountry.code] || data[currentCountry.name] || data['Zimbabwe'] || data.categories || {};
          
          if (!categories || Object.keys(categories).length === 0) {
            categories = data.categories || data['Zimbabwe'] || {};
          }
          
          const categoryCount = Object.keys(categories).length;
          
          if (categoryCount > 0) {
            const timestamp = getDocumentTimestamp(data) || new Date();
            console.log(`✅ News found for ${currentCountry.name} on ${dateString}:`, categoryCount, 'categories');
            return { success: true, data: { categories, fullData: data }, timestamp };
          }
        }
        
        return { success: false };
      } catch (error: any) {
        console.error(`❌ Error fetching news for ${dateString}:`, error);
        return { success: false };
      }
    };

    // Function to try additional dates beyond the 7-day window
    const tryExtendedDateFallback = async (country: CountryInfo, startDate: Date): Promise<{ success: boolean; data?: any; timestamp?: Date; date?: string }> => {
      try {
        // Try up to 30 days back
        for (let i = 7; i < 30; i++) {
          const checkDate = new Date(startDate);
          checkDate.setDate(startDate.getDate() - i);
          const dateString = checkDate.toISOString().split('T')[0];
          
          console.log(`   Trying extended date: ${dateString} (${i} days ago)...`);
          const result = await tryFetchNewsForDate(dateString, country);
          
          if (result.success && result.data) {
            return { success: true, data: result.data, timestamp: result.timestamp, date: dateString };
          }
        }
        
        return { success: false };
      } catch (error: any) {
        console.error('❌ Error in extended date fallback:', error);
        return { success: false };
      }
    };

    // Main function to load news with rolling date fallback
    const loadLatestNews = async (isIntervalCheck = false) => {
      try {
        if (!app || !db) {
          app = initializeApp(config);
          auth = getAuth(app);
          db = getFirestore(app);
        }
        
        const country = userCountry || { code: 'ZW', name: 'Zimbabwe' };
        const targetDate = selectedDate || new Date().toISOString().split('T')[0];
        
        console.log(`📂 Fetching news (${isIntervalCheck ? 'interval check' : 'initial load'})...`);
        console.log(`   Country: ${country.name} (${country.code})`);
        console.log(`   Target date: ${targetDate}`);
        
        let foundNews = false;
        let newsData: any = null;
        let newsTimestamp: Date | null = null;
        let foundDate = '';
        
        // Strategy 1: Try target date first (if it's a selected date, not just today)
        if (selectedDate) {
          const result = await tryFetchNewsForDate(targetDate, country);
          if (result.success && result.data) {
            foundNews = true;
            newsData = result.data;
            newsTimestamp = result.timestamp || null;
            foundDate = targetDate;
          }
        }
        
        // Strategy 2: Rolling date fallback - try today, then yesterday, then day before (up to 7 days back)
        if (!foundNews) {
          const today = new Date();
          for (let i = 0; i < 7; i++) {
            const checkDate = new Date(today);
            checkDate.setDate(today.getDate() - i);
            const dateString = checkDate.toISOString().split('T')[0];
            
            // Skip if we already tried this date
            if (dateString === targetDate && selectedDate) {
              continue;
            }
            
            console.log(`   Trying date: ${dateString} (${i === 0 ? 'today' : i === 1 ? 'yesterday' : `${i} days ago`})...`);
            const result = await tryFetchNewsForDate(dateString, country);
            
            if (result.success && result.data) {
              foundNews = true;
              newsData = result.data;
              newsTimestamp = result.timestamp || null;
              foundDate = dateString;
              console.log(`   ✅ Found news on ${dateString}`);
              break;
            }
          }
        }
        
        // Strategy 3: If still no news, try extended date fallback (up to 30 days)
        if (!foundNews) {
          console.log('   No news found in 7-day window, trying extended date range (up to 30 days)...');
          const result = await tryExtendedDateFallback(country, today);
          if (result.success && result.data) {
            foundNews = true;
            newsData = result.data;
            newsTimestamp = result.timestamp || null;
            foundDate = result.date || '';
            console.log(`   ✅ Found news from extended range: ${foundDate}`);
          }
        }
        
        if (foundNews && newsData) {
          const { categories, fullData } = newsData;
          
          // Store entire document globally for admin tool
          if (onGlobalDataUpdateRef.current && fullData) {
            onGlobalDataUpdateRef.current(fullData);
          }
          
          // Transform categories for country
          const transformedCategories = transformCategoriesForCountry(categories, country);
          lastFetchedDateRef.current = foundDate;
          
          // Update news with timestamp
          onNewsUpdateRef.current(transformedCategories, newsTimestamp || undefined);
          
          // Set up real-time listener on the found date
          if (!unsubscribe) {
            const appId = (window as any).__app_id || 'morning-pulse-app';
            const newsRef = doc(db, 'artifacts', appId, 'public', 'data', 'news', foundDate);
            
            unsubscribe = onSnapshot(
              newsRef,
              (realtimeSnapshot) => {
                if (realtimeSnapshot.exists()) {
                  const realtimeData = realtimeSnapshot.data();
                  
                  // Store entire document globally for admin tool
                  if (onGlobalDataUpdateRef.current) {
                    onGlobalDataUpdateRef.current(realtimeData);
                  }
                  
                  const currentCountry = userCountry || { code: 'ZW', name: 'Zimbabwe' };
                  let realtimeCategories = realtimeData[currentCountry.code] || realtimeData[currentCountry.name] || realtimeData['Zimbabwe'] || realtimeData.categories || {};
                  
                  if (!realtimeCategories || Object.keys(realtimeCategories).length === 0) {
                    realtimeCategories = realtimeData.categories || realtimeData['Zimbabwe'] || {};
                  }
                  
                  if (Object.keys(realtimeCategories).length > 0) {
                    console.log('✅ News updated in real-time for', currentCountry.name);
                    const timestamp = getDocumentTimestamp(realtimeData) || new Date();
                    const transformed = transformCategoriesForCountry(realtimeCategories, currentCountry);
                    onNewsUpdateRef.current(transformed, timestamp);
                  }
                }
              },
              (error: any) => {
                console.error('❌ Firestore real-time error:', error);
              }
            );
          }
        } else {
          // Only show error if NO news exists at all (after trying all strategies)
          console.warn(`⚠️ No news found for ${country.name} after checking all dates and most recent document`);
          onErrorRef.current(`Morning Pulse is currently gathering news for ${country.name}. Please check back shortly.`);
        }
      } catch (error: any) {
        console.error('❌ Firebase initialization error:', error);
        console.error('   Error code:', error.code);
        console.error('   Error message:', error.message);
        onErrorRef.current('Failed to initialize Firebase: ' + error.message);
      }
    };
    
    // Initial load
    loadLatestNews(false);
    
    // Set up 30-minute interval to check for newer news
    intervalRef.current = setInterval(() => {
      console.log('🔄 Interval check: Looking for newer news...');
      loadLatestNews(true);
    }, 30 * 60 * 1000); // 30 minutes

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [userCountry?.code, userCountry?.name, selectedDate]); // Only depend on primitive values, not functions

  return null; // This component doesn't render anything
};

export default FirebaseConnector;
