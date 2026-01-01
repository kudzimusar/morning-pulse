import React, { useState, useEffect, useRef } from 'react';
import { CountryInfo, SUPPORTED_COUNTRIES } from '../services/locationService';

interface CountrySwitcherProps {
  currentCountry: CountryInfo;
  onCountryChange: (country: CountryInfo) => void;
}

const CountrySwitcher: React.FC<CountrySwitcherProps> = ({ currentCountry, onCountryChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleCountrySelect = (country: CountryInfo) => {
    onCountryChange(country);
    setIsOpen(false);
  };

  return (
    <div className="country-switcher" ref={dropdownRef}>
      <button
        className="country-switcher-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-label="Switch country"
      >
        <span className="globe-icon">🌍</span>
        <span className="country-code">{currentCountry.code}</span>
        <span className={`dropdown-arrow ${isOpen ? 'open' : ''}`}>▼</span>
      </button>

      {isOpen && (
        <div className="country-dropdown">
          <div className="country-dropdown-header">
            <span>Select Country</span>
          </div>
          <div className="country-dropdown-list">
            {SUPPORTED_COUNTRIES.map((country) => (
              <button
                key={country.code}
                className={`country-option ${country.code === currentCountry.code ? 'active' : ''}`}
                onClick={() => handleCountrySelect(country)}
              >
                <span className="country-flag">{getCountryFlag(country.code)}</span>
                <span className="country-name">{country.name}</span>
                {country.code === currentCountry.code && (
                  <span className="selected-indicator">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Simple flag emoji mapping (you can enhance this)
const getCountryFlag = (code: string): string => {
  const flags: { [key: string]: string } = {
    'ZW': '🇿🇼',
    'ZA': '🇿🇦',
    'GB': '🇬🇧',
    'US': '🇺🇸',
    'KE': '🇰🇪',
    'NG': '🇳🇬',
    'GH': '🇬🇭',
    'EG': '🇪🇬',
    'AU': '🇦🇺',
    'CA': '🇨🇦',
    'IN': '🇮🇳',
    'CN': '🇨🇳',
    'JP': '🇯🇵',
    'FR': '🇫🇷',
    'DE': '🇩🇪',
  };
  return flags[code] || '🌍';
};

export default CountrySwitcher;
