import React from 'react';
import { CountryInfo } from '../services/locationService';

interface AdSlotProps {
  label?: string;
  userCountry?: CountryInfo;
}

// Country-based advertising logic
const getAdMessage = (userCountry?: CountryInfo): string => {
  if (userCountry?.code === 'ZW') {
    return 'Partner with Morning Pulse - Zimbabwe-focused advertising available';
  }
  return 'Partner with Morning Pulse - Global advertising opportunities';
};

const AdSlot: React.FC<AdSlotProps> = ({ label = 'Sponsored', userCountry }) => {
  return (
    <div className="ad-slot">
      <div className="ad-slot-content">
        <div className="ad-label">{label}</div>
        <div className="ad-placeholder">
          <p>{getAdMessage(userCountry)}</p>
          <a href="#advertising" className="ad-cta">Partner with us</a>
        </div>
      </div>
    </div>
  );
};

export default AdSlot;
