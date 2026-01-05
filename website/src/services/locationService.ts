/**
 * Location Detection Service
 * Detects user's country via IP geolocation and provides country switching
 * Supports manual selection persistence (overrides auto-detection)
 */

export interface CountryInfo {
  code: string;
  name: string;
  flag?: string;
  timezone?: string;
}

// Country to timezone mapping
const COUNTRY_TIMEZONES: { [code: string]: string } = {
  'ZW': 'Africa/Harare',
  'ZA': 'Africa/Johannesburg',
  'GB': 'Europe/London',
  'US': 'America/New_York',
  'KE': 'Africa/Nairobi',
  'NG': 'Africa/Lagos',
  'GH': 'Africa/Accra',
  'EG': 'Africa/Cairo',
  'AU': 'Australia/Sydney',
  'CA': 'America/Toronto',
  'IN': 'Asia/Kolkata',
  'CN': 'Asia/Shanghai',
  'JP': 'Asia/Tokyo',
  'FR': 'Europe/Paris',
  'DE': 'Europe/Berlin',
};

// Common countries for news aggregation
export const SUPPORTED_COUNTRIES: CountryInfo[] = [
  { code: 'ZW', name: 'Zimbabwe', flag: '🇿🇼', timezone: COUNTRY_TIMEZONES['ZW'] },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦', timezone: COUNTRY_TIMEZONES['ZA'] },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', timezone: COUNTRY_TIMEZONES['GB'] },
  { code: 'US', name: 'United States', flag: '🇺🇸', timezone: COUNTRY_TIMEZONES['US'] },
  { code: 'KE', name: 'Kenya', flag: '🇰🇪', timezone: COUNTRY_TIMEZONES['KE'] },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬', timezone: COUNTRY_TIMEZONES['NG'] },
  { code: 'GH', name: 'Ghana', flag: '🇬🇭', timezone: COUNTRY_TIMEZONES['GH'] },
  { code: 'EG', name: 'Egypt', flag: '🇪🇬', timezone: COUNTRY_TIMEZONES['EG'] },
  { code: 'AU', name: 'Australia', flag: '🇦🇺', timezone: COUNTRY_TIMEZONES['AU'] },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', timezone: COUNTRY_TIMEZONES['CA'] },
  { code: 'IN', name: 'India', flag: '🇮🇳', timezone: COUNTRY_TIMEZONES['IN'] },
  { code: 'CN', name: 'China', flag: '🇨🇳', timezone: COUNTRY_TIMEZONES['CN'] },
  { code: 'JP', name: 'Japan', flag: '🇯🇵', timezone: COUNTRY_TIMEZONES['JP'] },
  { code: 'FR', name: 'France', flag: '🇫🇷', timezone: COUNTRY_TIMEZONES['FR'] },
  { code: 'DE', name: 'Germany', flag: '🇩🇪', timezone: COUNTRY_TIMEZONES['DE'] },
];

/**
 * Get timezone for a country code
 */
export const getCountryTimezone = (code: string): string => {
  return COUNTRY_TIMEZONES[code] || 'UTC';
};

/**
 * Detect user's country via IP geolocation
 * Uses ipapi.co (free tier) or ip-api.com as fallback
 */
export const detectUserLocation = async (): Promise<CountryInfo> => {
  try {
    // Try ipapi.co first (free tier: 1000 requests/day)
    try {
      const response = await fetch('https://ipapi.co/json/', {
        signal: AbortSignal.timeout(5000),
      });
      if (response.ok) {
        const data = await response.json();
        const countryCode = data.country_code || 'ZW';
        const countryName = data.country_name || 'Zimbabwe';
        
        // Check if country is supported, otherwise default to Zimbabwe
        const country = SUPPORTED_COUNTRIES.find(c => c.code === countryCode);
        if (country) {
          console.log(`✅ Detected country: ${countryName} (${countryCode})`);
          return country;
        }
        console.log(`⚠️ Country ${countryName} not fully supported, defaulting to Zimbabwe`);
        return SUPPORTED_COUNTRIES[0]; // Default to Zimbabwe
      }
    } catch (e) {
      console.log('⚠️ ipapi.co failed, trying fallback...');
    }

    // Fallback to ip-api.com
    try {
      const response = await fetch('http://ip-api.com/json/?fields=countryCode,country', {
        signal: AbortSignal.timeout(5000),
      });
      if (response.ok) {
        const data = await response.json();
        const countryCode = data.countryCode || 'ZW';
        const countryName = data.country || 'Zimbabwe';
        
        const country = SUPPORTED_COUNTRIES.find(c => c.code === countryCode);
        if (country) {
          console.log(`✅ Detected country (fallback): ${countryName} (${countryCode})`);
          return country;
        }
        return SUPPORTED_COUNTRIES[0];
      }
    } catch (e) {
      console.log('⚠️ ip-api.com also failed');
    }

    // Final fallback: Default to Zimbabwe
    console.log('⚠️ Location detection failed, defaulting to Zimbabwe');
    return SUPPORTED_COUNTRIES[0];
  } catch (error) {
    console.error('❌ Error detecting location:', error);
    return SUPPORTED_COUNTRIES[0]; // Default to Zimbabwe
  }
};

/**
 * Get country info by code
 */
export const getCountryByCode = (code: string): CountryInfo | undefined => {
  return SUPPORTED_COUNTRIES.find(c => c.code === code);
};

/**
 * Get country info by name
 */
export const getCountryByName = (name: string): CountryInfo | undefined => {
  return SUPPORTED_COUNTRIES.find(c => c.name.toLowerCase() === name.toLowerCase());
};

/**
 * Clean up old localStorage entries to free up space
 */
const cleanupLocalStorage = (): void => {
  try {
    const keys = Object.keys(localStorage);
    const morningPulseKeys = keys.filter(key => key.startsWith('morning-pulse-'));
    
    // Sort by key to identify old entries (keep most recent)
    if (morningPulseKeys.length > 50) {
      // Keep only the most recent 30 entries (country preference + category preferences)
      const toRemove = morningPulseKeys.slice(30);
      toRemove.forEach(key => {
        if (key !== 'morning-pulse-country') { // Never remove country preference
          localStorage.removeItem(key);
        }
      });
      console.log(`🧹 Cleaned up ${toRemove.length} old localStorage entries`);
    }
  } catch (e) {
    console.warn('Failed to cleanup localStorage:', e);
  }
};

/**
 * Store user's selected country in localStorage
 * Marks it as a manual selection to override auto-detection
 */
export const saveUserCountry = (country: CountryInfo, isManualSelection: boolean = true): void => {
  try {
    const countryData = {
      ...country,
      manualSelection: isManualSelection,
    };
    localStorage.setItem('morning-pulse-country', JSON.stringify(countryData));
    console.log(`✅ Saved country preference: ${country.name} (${isManualSelection ? 'manual' : 'auto'})`);
  } catch (e: any) {
    if (e.name === 'QuotaExceededError') {
      console.warn('⚠️ LocalStorage quota exceeded, attempting cleanup...');
      // Try to cleanup old entries
      try {
        cleanupLocalStorage();
        // Retry saving country preference
        const countryData = {
          ...country,
          manualSelection: isManualSelection,
        };
        localStorage.setItem('morning-pulse-country', JSON.stringify(countryData));
        console.log(`✅ Saved country preference after cleanup: ${country.name}`);
      } catch (retryError) {
        console.error('❌ Failed to save country preference even after cleanup:', retryError);
      }
    } else {
      console.error('Failed to save country preference:', e);
    }
  }
};

/**
 * Get user's selected country from localStorage
 * Returns null if no manual selection exists (allows auto-detection)
 */
export const getUserCountry = (): CountryInfo | null => {
  try {
    const stored = localStorage.getItem('morning-pulse-country');
    if (stored) {
      const data = JSON.parse(stored);
      // Check if it's a manual selection (if manualSelection is true or undefined for backward compatibility)
      if (data.manualSelection !== false) {
        // Verify it's still a supported country
        const country = SUPPORTED_COUNTRIES.find(c => c.code === data.code);
        if (country) {
          return country;
        }
      }
    }
  } catch (e) {
    console.error('Failed to load country preference:', e);
  }
  return null;
};

/**
 * Check if user has manually selected a country
 */
export const hasManualCountrySelection = (): boolean => {
  try {
    const stored = localStorage.getItem('morning-pulse-country');
    if (stored) {
      const data = JSON.parse(stored);
      return data.manualSelection !== false; // Default to true for backward compatibility
    }
  } catch (e) {
    // Ignore errors
  }
  return false;
};

/**
 * Clear manual country selection (allows auto-detection on next load)
 */
export const clearManualCountrySelection = (): void => {
  try {
    localStorage.removeItem('morning-pulse-country');
    console.log('✅ Cleared manual country selection');
  } catch (e) {
    console.error('Failed to clear country preference:', e);
  }
};
