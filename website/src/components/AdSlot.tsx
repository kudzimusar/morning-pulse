import React, { useState, useEffect, useRef } from 'react';
import { CountryInfo } from '../services/locationService';
import { 
  getAdsForSlot, 
  trackAdImpression, 
  trackAdClickDetailed,
  Ad 
} from '../services/advertiserService';
import { getAuth } from 'firebase/auth';

interface AdSlotProps {
  slotId: string;
  label?: string;
  userCountry?: CountryInfo;
  className?: string;
  style?: React.CSSProperties;
  fallbackMessage?: string;
}

const AdSlot: React.FC<AdSlotProps> = ({ 
  slotId, 
  label = 'Sponsored', 
  userCountry,
  className = '',
  style,
  fallbackMessage
}) => {
  const [ads, setAds] = useState<Ad[]>([]);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [impressionTracked, setImpressionTracked] = useState(false);
  const adRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Load ads for this slot
  useEffect(() => {
    const loadAds = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log(`🔍 [AdSlot] Loading ads for slot: ${slotId}`);
        const slotAds = await getAdsForSlot(slotId, { limit: 3 });
        console.log(`📊 [AdSlot] Found ${slotAds.length} ads for slot: ${slotId}`, slotAds);
        setAds(slotAds);
        
        if (slotAds.length === 0) {
          console.warn(`⚠️ [AdSlot] No ads found for slot: ${slotId}`);
          setError('no_ads');
        } else {
          // ✅ FIX: Log ad details for debugging
          slotAds.forEach((ad, index) => {
            console.log(`📢 [AdSlot] Ad ${index + 1}:`, {
              id: ad.id,
              title: ad.title,
              creativeUrl: ad.creativeUrl,
              destinationUrl: ad.destinationUrl,
              placement: ad.placement,
              status: ad.status,
              paymentStatus: ad.paymentStatus,
              startDate: ad.startDate,
              endDate: ad.endDate
            });
          });
        }
      } catch (err: any) {
        console.error(`❌ [AdSlot] Error loading ads for slot: ${slotId}`, err);
        console.error('   Error details:', err.message, err.code);
        setError('load_failed');
      } finally {
        setLoading(false);
      }
    };

    loadAds();
  }, [slotId]);

  // Track impression when ad becomes visible (Intersection Observer)
  useEffect(() => {
    if (ads.length === 0 || impressionTracked) return;

    const currentAd = ads[currentAdIndex];
    if (!currentAd || !adRef.current) return;

    // Set up Intersection Observer to track when ad is visible
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
            // Ad is at least 50% visible
            if (!impressionTracked && currentAd) {
              trackAdImpression(currentAd.id, slotId, {
                userAgent: navigator.userAgent,
                referrer: document.referrer,
              }).catch((err) => {
                console.error('Failed to track impression:', err);
              });
              setImpressionTracked(true);
            }
          }
        });
      },
      { threshold: 0.5 }
    );

    observerRef.current.observe(adRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [ads, currentAdIndex, slotId, impressionTracked]);

  // Handle ad click
  const handleAdClick = async (ad: Ad, e: React.MouseEvent) => {
    e.preventDefault();
    
    // Track click
    await trackAdClickDetailed(ad.id, slotId, {
      userAgent: navigator.userAgent,
      referrer: document.referrer,
    });

    // Open ad destination URL (preferred) or fallback to advertiser website
    const destinationUrl = ad.destinationUrl || ad.creativeUrl;
    if (destinationUrl) {
      // Check if it's a valid URL
      if (destinationUrl.startsWith('http://') || destinationUrl.startsWith('https://')) {
        window.open(destinationUrl, '_blank', 'noopener,noreferrer');
      } else {
        // If not a full URL, treat as relative or add https://
        window.open(`https://${destinationUrl}`, '_blank', 'noopener,noreferrer');
      }
    }
  };

  // Rotate ads (simple rotation every 10 seconds)
  useEffect(() => {
    if (ads.length <= 1) return;

    const rotationInterval = setInterval(() => {
      setCurrentAdIndex((prev) => (prev + 1) % ads.length);
      setImpressionTracked(false); // Reset for new ad
    }, 10000); // 10 seconds

    return () => clearInterval(rotationInterval);
  }, [ads.length]);

  // Render fallback/house ad
  const renderFallback = () => {
    const defaultMessage = fallbackMessage || 
      (userCountry?.code === 'ZW' 
        ? 'Partner with Morning Pulse - Zimbabwe-focused advertising available'
        : 'Partner with Morning Pulse - Global advertising opportunities');
    
    return (
      <div className="ad-slot" style={style}>
        <div className="ad-slot-content" style={{
          padding: '16px',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          backgroundColor: '#f9fafb',
          textAlign: 'center',
          minHeight: '100px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <div className="ad-label" style={{
            fontSize: '10px',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            color: '#6b7280',
            marginBottom: '8px',
            letterSpacing: '0.5px'
          }}>
            {label}
          </div>
          <div className="ad-placeholder" style={{
            fontSize: '14px',
            color: '#4b5563',
            marginBottom: '12px'
          }}>
            <p style={{ margin: 0 }}>{defaultMessage}</p>
          </div>
          <a 
            href="#advertise" 
            className="ad-cta"
            style={{
              display: 'inline-block',
              padding: '8px 16px',
              backgroundColor: '#000',
              color: '#fff',
              textDecoration: 'none',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: '500'
            }}
          >
            Partner with us
          </a>
        </div>
      </div>
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className={`ad-slot ${className}`} style={style}>
        <div className="ad-slot-content" style={{
          padding: '16px',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          backgroundColor: '#f9fafb',
          minHeight: '100px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{ fontSize: '12px', color: '#9ca3af' }}>Loading ad...</div>
        </div>
      </div>
    );
  }

  // Error or no ads - show fallback
  if (error || ads.length === 0) {
    return renderFallback();
  }

  // Render actual ad
  const currentAd = ads[currentAdIndex];
  if (!currentAd) {
    return renderFallback();
  }

  return (
    <div 
      className={`ad-slot ${className}`} 
      style={style}
      ref={adRef}
    >
      <div className="ad-slot-content" style={{
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        overflow: 'hidden',
        backgroundColor: '#fff',
        position: 'relative',
        maxHeight: slotId === 'header_banner' ? '120px' : 'none', // ✅ FIX: Constrain header ad height
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div className="ad-label" style={{
          position: 'absolute',
          top: '4px',
          right: '4px',
          fontSize: '9px',
          fontWeight: 'bold',
          textTransform: 'uppercase',
          color: '#6b7280',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          padding: '2px 6px',
          borderRadius: '2px',
          zIndex: 1
        }}>
          {label}
        </div>
        <a
          href={currentAd.creativeUrl}
          onClick={(e) => handleAdClick(currentAd, e)}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'block',
            textDecoration: 'none',
            color: 'inherit'
          }}
        >
          <img
            src={currentAd.creativeUrl}
            alt={currentAd.title || 'Advertisement'}
            style={{
              width: '100%',
              height: 'auto',
              display: 'block',
              maxWidth: '100%',
              maxHeight: '120px', // ✅ FIX: Constrain header ad height
              objectFit: 'contain', // ✅ FIX: Maintain aspect ratio without cropping
              objectPosition: 'center'
            }}
            loading="lazy"
            onError={(e) => {
              // Fallback if image fails to load
              console.error('❌ Ad image failed to load:', currentAd.creativeUrl);
              console.error('   Ad ID:', currentAd.id);
              console.error('   Ad Title:', currentAd.title);
              setError('image_load_failed');
            }}
            onLoad={() => {
              // ✅ FIX: Log successful image load for debugging
              console.log('✅ Ad image loaded successfully:', currentAd.creativeUrl);
            }}
          />
        </a>
        {ads.length > 1 && (
          <div style={{
            position: 'absolute',
            bottom: '4px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: '4px'
          }}>
            {ads.map((_, index) => (
              <div
                key={index}
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: index === currentAdIndex ? '#000' : '#d1d5db',
                  transition: 'background-color 0.3s'
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdSlot;
