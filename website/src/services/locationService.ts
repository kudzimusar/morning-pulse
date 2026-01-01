/**
 * Location Detection Service
 * Detects user's country via IP geolocation and provides country switching
 */

export interface CountryInfo {
  code: string;
  name: string;
}

// Common countries for news aggregation
export const SUPPORTED_COUNTRIES: CountryInfo[] = [
  { code: 'ZW', name: 'Zimbabwe' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'US', name: 'United States' },
  { code: 'KE', name: 'Kenya' },
  { code: 'NG', name: 'Nigeria' },
  { code: 'GH', name: 'Ghana' },
  { code: 'EG', name: 'Egypt' },
  { code: 'AU', name: 'Australia' },
  { code: 'CA', name: 'Canada' },
  { code: 'IN', name: 'India' },
  { code: 'CN', name: 'China' },
  { code: 'JP', name: 'Japan' },
  { code: 'FR', name: 'France' },
  { code: 'DE', name: 'Germany' },
];

/**
 * Detect user's country via IP geolocation
 * Uses ipapi.co (free tier) or ip-api.com as fallback
 */
export const detectUserLocation = async (): Promise<CountryInfo> => {
  try {
    // Try ipapi.co first (free tier: 1000 requests/day)
    try {
      const response = await fetch('https://ipapi.co/json/', {
        timeout: 5000,
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
        timeout: 5000,
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
 * Store user's selected country in localStorage
 */
export const saveUserCountry = (country: CountryInfo): void => {
  try {
    localStorage.setItem('morning-pulse-country', JSON.stringify(country));
  } catch (e: any) {
    if (e.name === 'QuotaExceededError') {
      console.warn('LocalStorage quota exceeded, country preference not saved');
    } else {
      console.error('Failed to save country preference:', e);
    }
  }
};

/**
 * Get user's selected country from localStorage
 */
export const getUserCountry = (): CountryInfo | null => {
  try {
    const stored = localStorage.getItem('morning-pulse-country');
    if (stored) {
      const country = JSON.parse(stored);
      // Verify it's still a supported country
      if (SUPPORTED_COUNTRIES.find(c => c.code === country.code)) {
        return country;
      }
    }
  } catch (e) {
    console.error('Failed to load country preference:', e);
  }
  return null;
};
