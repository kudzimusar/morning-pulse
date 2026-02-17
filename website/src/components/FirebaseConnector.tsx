import React, { useEffect, useRef } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { NewsStory } from '../types';
import { CountryInfo } from '../services/locationService';
import EnhancedFirestore from '../services/enhancedFirestore';
import { db } from '../services/firebase';

interface FirebaseConnectorProps {
  onNewsUpdate: (data: { [category: string]: NewsStory[] }, lastUpdated?: Date) => void;
  onError: (error: string) => void;
  userCountry?: CountryInfo;
  selectedDate?: string;
  onGlobalDataUpdate?: (globalData: any) => void;
}

// Helper function to transform category names based on country
const transformCategoriesForCountry = (
  categories: { [category: string]: NewsStory[] },
  country: CountryInfo
): { [category: string]: NewsStory[] } => {
  const transformed: { [category: string]: NewsStory[] } = {};

  Object.keys(categories).forEach((categoryKey) => {
    let newCategoryKey = categoryKey;
    if (categoryKey === 'Local (Zim)' || categoryKey.startsWith('Local')) {
      newCategoryKey = country.code === 'ZW' ? 'Local (Zim)' : `Local (${country.name})`;
    }
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
  if (data.updatedAt?.toDate) return data.updatedAt.toDate();
  if (data.updatedAt?.seconds) return new Date(data.updatedAt.seconds * 1000);
  if (data.timestamp) return new Date(data.timestamp);
  return null;
};

const FirebaseConnector: React.FC<FirebaseConnectorProps> = ({
  onNewsUpdate,
  onError,
  userCountry,
  selectedDate,
  onGlobalDataUpdate
}) => {
  const onNewsUpdateRef = useRef(onNewsUpdate);
  const onErrorRef = useRef(onError);
  const onGlobalDataUpdateRef = useRef(onGlobalDataUpdate);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const countryKeyRef = useRef<string>(`${userCountry?.code || 'ZW'}-${userCountry?.name || 'Zimbabwe'}`);
  const userCountryRef = useRef<CountryInfo | undefined>(userCountry);
  const lastFetchTime = useRef<number>(0);
  const lastFetchedDateRef = useRef<string>('');

  useEffect(() => {
    onNewsUpdateRef.current = onNewsUpdate;
    onErrorRef.current = onError;
    onGlobalDataUpdateRef.current = onGlobalDataUpdate;
    userCountryRef.current = userCountry;
  }, [onNewsUpdate, onError, onGlobalDataUpdate, userCountry]);

  useEffect(() => {
    const now = Date.now();
    if (now - lastFetchTime.current < 2000) return;
    lastFetchTime.current = now;

    const currentCountryKey = `${userCountryRef.current?.code || 'ZW'}-${userCountryRef.current?.name || 'Zimbabwe'}`;
    if (countryKeyRef.current === currentCountryKey && intervalRef.current) return;
    countryKeyRef.current = currentCountryKey;

    let unsubscribe: (() => void) | null = null;

    const tryFetchNewsForDate = async (dateString: string, country: CountryInfo) => {
      try {
        const appId = 'morning-pulse-app';
        // ✅ CORRECT Firestore path: news/v2/[appId]/daily/dates/[date]
        const newsRef = doc(db, 'news', 'v2', appId, 'daily', 'dates', dateString);
        const snapshot = await getDoc(newsRef);

        if (snapshot.exists()) {
          const data = snapshot.data();
          let categories = data[country.code] || data[country.name] || data['Zimbabwe'] || data.categories || {};
          if (Object.keys(categories).length > 0) {
            const timestamp = getDocumentTimestamp(data) || new Date();
            return { success: true, data: { categories, fullData: data }, timestamp };
          }
        }
        return { success: false };
      } catch (error) {
        console.error(`❌ Error fetching news for ${dateString}:`, error);
        return { success: false };
      }
    };

    const tryExtendedDateFallback = async (country: CountryInfo, startDate: Date) => {
      for (let i = 7; i < 30; i++) {
        const checkDate = new Date(startDate);
        checkDate.setDate(startDate.getDate() - i);
        const dateString = checkDate.toISOString().split('T')[0];
        const result = await tryFetchNewsForDate(dateString, country);
        if (result.success) return { ...result, date: dateString };
      }
      return { success: false };
    };

    const loadLatestNews = async (isIntervalCheck = false) => {
      try {
        const country = userCountryRef.current || { code: 'ZW', name: 'Zimbabwe' };
        const targetDate = selectedDate || new Date().toISOString().split('T')[0];
        const today = new Date();

        let foundNews = false;
        let newsData: any = null;
        let newsTimestamp: Date | null = null;
        let foundDate = '';

        if (selectedDate) {
          const result = await tryFetchNewsForDate(targetDate, country);
          if (result.success) {
            foundNews = true;
            newsData = result.data;
            newsTimestamp = result.timestamp || null;
            foundDate = targetDate;
          }
        }

        if (!foundNews) {
          for (let i = 0; i < 7; i++) {
            const checkDate = new Date(today);
            checkDate.setDate(today.getDate() - i);
            const dateString = checkDate.toISOString().split('T')[0];
            const result = await tryFetchNewsForDate(dateString, country);
            if (result.success) {
              foundNews = true;
              newsData = result.data;
              newsTimestamp = result.timestamp || null;
              foundDate = dateString;
              break;
            }
          }
        }

        const result = await tryExtendedDateFallback(country, today) as any;
        if (result.success) {
          foundNews = true;
          newsData = result.data;
          newsTimestamp = result.timestamp || null;
          foundDate = result.date || '';
        }

        if (foundNews && newsData) {
          const { categories, fullData } = newsData;
          if (onGlobalDataUpdateRef.current) onGlobalDataUpdateRef.current(fullData);
          const transformed = transformCategoriesForCountry(categories, country);
          lastFetchedDateRef.current = foundDate;
          onNewsUpdateRef.current(transformed, newsTimestamp || undefined);

          if (!unsubscribe) {
            const appId = 'morning-pulse-app';
            // ✅ CORRECT Firestore path: news/v2/[appId]/daily/dates/[date]
            const newsRef = doc(db, 'news', 'v2', appId, 'daily', 'dates', foundDate);
            const enhancedFirestore = EnhancedFirestore.getInstance(db);
            unsubscribe = enhancedFirestore.subscribeWithRetry<any>(
              newsRef,
              (realtimeData) => {
                if (realtimeData) {
                  if (onGlobalDataUpdateRef.current) onGlobalDataUpdateRef.current(realtimeData);
                  const currentCountry = userCountryRef.current || { code: 'ZW', name: 'Zimbabwe' };
                  let realtimeCategories = realtimeData[currentCountry.code] || realtimeData[currentCountry.name] || realtimeData['Zimbabwe'] || realtimeData.categories || {};
                  if (Object.keys(realtimeCategories).length > 0) {
                    const timestamp = getDocumentTimestamp(realtimeData) || new Date();
                    const transformed = transformCategoriesForCountry(realtimeCategories, currentCountry);
                    onNewsUpdateRef.current(transformed, timestamp);
                  }
                }
              },
              (error) => console.error('❌ Firestore real-time error:', error)
            );
          }
        } else {
          onErrorRef.current(`Gathering news for ${country.name}. Please check back shortly.`);
        }
      } catch (error: any) {
        console.error('❌ News load error:', error);
        onErrorRef.current('Connection error: ' + error.message);
      }
    };

    loadLatestNews();
    intervalRef.current = setInterval(() => loadLatestNews(true), 30 * 60 * 1000);

    return () => {
      if (unsubscribe) unsubscribe();
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [selectedDate]);

  return null;
};

export default FirebaseConnector;
