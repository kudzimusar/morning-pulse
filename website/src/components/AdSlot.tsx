import React from 'react';

interface AdSlotProps {
  label?: string;
}

const AdSlot: React.FC<AdSlotProps> = ({ label = 'Sponsored' }) => {
  return (
    <div className="ad-slot">
      <div className="ad-slot-content">
        <div className="ad-label">{label}</div>
        <div className="ad-placeholder">
          <p>{getAdMessage()}</p>
          <a href="#advertising" className="ad-cta">Partner with us</a>
        </div>
      </div>
    </div>
  );
};

export default AdSlot;
