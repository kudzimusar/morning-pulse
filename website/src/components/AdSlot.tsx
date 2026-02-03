import React, { useState, useEffect, useRef } from 'react';
import { CountryInfo } from '../services/locationService';
import { 
  getAdsForSlot, 
  trackAdImpression, 
  trackAdClickDetailed,
  Ad 
} from '../services/advertiserService';
import { getAuth } from 'firebase/auth';
import { getApp } from 'firebase/app';

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
  const [isClosed, setIsClosed] = useState(false); // ✅ FIX: Add close state
  const [firebaseReady, setFirebaseReady] = useState(false); // ✅ FIX: Track Firebase readiness
  const adRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // ✅ FIX: Check Firebase readiness before loading ads
  useEffect(() => {
    const checkFirebase = () => {
      try {
        const app = getApp();
        if (app && app.name) {
          setFirebaseReady(true);
          return true;
        }
      } catch (error: any) {
        // Firebase not ready yet - this is expected initially
        if (error.code !== 'app/no-app') {
          console.log(`⏳ [AdSlot] Firebase check: ${error.message}`);
        }
        return false;
      }
      return false;
    };

    // Check immediately
    if (checkFirebase()) {
      return;
    }

    // Poll for Firebase initialization (max 10 seconds)
    let attempts = 0;
    const maxAttempts = 20;
    const interval = setInterval(() => {
      attempts++;
      if (checkFirebase() || attempts >= maxAttempts) {
        clearInterval(interval);
        if (attempts >= maxAttempts && !firebaseReady) {
          // ✅ FIX: Still try to load ads even if check fails (Firebase might be ready but check failed)
          console.log(`⚠️ [AdSlot] Firebase check timed out, but will attempt to load ads anyway for slot: ${slotId}`);
          setFirebaseReady(true); // Set to true to allow ad loading attempt
        }
      }
    }, 500);

    return () => clearInterval(interval);
  }, [slotId, firebaseReady]);

  // Load ads for this slot (try even if Firebase check failed)
  useEffect(() => {
    if (isClosed) return; // ✅ FIX: Don't load if closed

    // ✅ FIX: Add small delay to ensure Firebase is ready, then try loading
    const loadAds = async () => {
      // Wait a bit for Firebase to initialize
      await new Promise(resolve => setTimeout(resolve, 1000));
      
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
            
            // ✅ FIX: Validate creativeUrl
            if (!ad.creativeUrl || ad.creativeUrl.trim() === '') {
              console.error(`❌ [AdSlot] Ad ${ad.id} has empty creativeUrl!`);
            } else {
              console.log(`   ✅ Creative URL is valid: ${ad.creativeUrl}`);
            }
          });
        }
      } catch (err: any) {
        console.error(`❌ [AdSlot] Error loading ads for slot: ${slotId}`, err);
        console.error('   Error details:', err.message, err.code);
        // ✅ FIX: Set error but don't prevent fallback from showing
        setError('load_failed');
      } finally {
        setLoading(false);
      }
    };

    loadAds();
  }, [slotId, isClosed]);

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
              // ✅ FIX: Only track impressions for PAID ads
              if (currentAd.paymentStatus === 'paid') {
                trackAdImpression(currentAd.id, slotId, {
                  userAgent: navigator.userAgent,
                  referrer: document.referrer,
                }).catch((err) => {
                  console.error('Failed to track impression:', err);
                });
              }
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
    
    // ✅ FIX: Only track clicks for PAID ads (Client or House)
    if (ad.paymentStatus === 'paid') {
      await trackAdClickDetailed(ad.id, slotId, {
        userAgent: navigator.userAgent,
        referrer: document.referrer,
      });
    }

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
      <div 
        className="ad-slot" 
        style={{
          ...style,
          position: 'relative',
          width: '100%',
          maxWidth: '100%'
        }}
      >
        {/* ✅ FIX: Close button on fallback too */}
        <button
          onClick={() => setIsClosed(true)}
          style={{
            position: 'absolute',
            top: '4px',
            right: '4px',
            zIndex: 10,
            background: 'rgba(0, 0, 0, 0.6)',
            color: '#fff',
            border: 'none',
            borderRadius: '50%',
            width: '24px',
            height: '24px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px',
            fontWeight: 'bold',
            lineHeight: '1',
            padding: 0,
            transition: 'background 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(0, 0, 0, 0.8)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(0, 0, 0, 0.6)';
          }}
          aria-label="Close ad"
          title="Close ad"
        >
          ×
        </button>
        <div className="ad-slot-content" style={{
          padding: '16px',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          backgroundColor: '#f9fafb',
          textAlign: 'center',
          minHeight: '100px',
          maxWidth: '100%',
          width: '100%',
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
      <div 
        className={`ad-slot ${className}`} 
        style={{
          ...style,
          position: 'relative',
          width: '100%',
          maxWidth: '100%'
        }}
      >
        {/* ✅ FIX: Close button on loading state too */}
        <button
          onClick={() => setIsClosed(true)}
          style={{
            position: 'absolute',
            top: '4px',
            right: '4px',
            zIndex: 10,
            background: 'rgba(0, 0, 0, 0.6)',
            color: '#fff',
            border: 'none',
            borderRadius: '50%',
            width: '24px',
            height: '24px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px',
            fontWeight: 'bold',
            lineHeight: '1',
            padding: 0,
            transition: 'background 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(0, 0, 0, 0.8)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(0, 0, 0, 0.6)';
          }}
          aria-label="Close ad"
          title="Close ad"
        >
          ×
        </button>
        <div className="ad-slot-content" style={{
          padding: '16px',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          backgroundColor: '#f9fafb',
          minHeight: '100px',
          maxWidth: '100%',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{ fontSize: '12px', color: '#9ca3af' }}>Loading ad...</div>
        </div>
      </div>
    );
  }

  // ✅ FIX: Don't render if closed
  if (isClosed) {
    return null;
  }

  // Error or no ads - show fallback (but only log once to prevent spam)
  if (error || ads.length === 0) {
    // Only log once per error state change
    if (error && !loading) {
      // Suppress repeated logs - only log on first error
    }
    return renderFallback();
  }

  // Render actual ad
  const currentAd = ads[currentAdIndex];
  if (!currentAd) {
    console.warn(`⚠️ [AdSlot] No current ad at index ${currentAdIndex} for slot: ${slotId}`);
    return renderFallback();
  }

  // ✅ FIX: Validate creativeUrl before rendering
  if (!currentAd.creativeUrl || currentAd.creativeUrl.trim() === '') {
    console.error(`❌ [AdSlot] Ad ${currentAd.id} has empty or missing creativeUrl`);
    console.error('   Full ad data:', JSON.stringify(currentAd, null, 2));
    setError('no_creative_url');
    return renderFallback();
  }

  console.log(`🎨 [AdSlot] Rendering ad for slot: ${slotId}`, {
    adId: currentAd.id,
    title: currentAd.title,
    creativeUrl: currentAd.creativeUrl,
    destinationUrl: currentAd.destinationUrl,
    placement: currentAd.placement,
    currentAdIndex,
    totalAds: ads.length
  });

  return (
    <div 
      className={`ad-slot ${className}`} 
      style={{
        ...style,
        position: 'relative',
        width: '100%',
        maxWidth: '100%'
      }}
      ref={adRef}
    >
      {/* ✅ FIX: Close button */}
      <button
        onClick={() => setIsClosed(true)}
        style={{
          position: 'absolute',
          top: '4px',
          right: '4px',
          zIndex: 10,
          background: 'rgba(0, 0, 0, 0.6)',
          color: '#fff',
          border: 'none',
          borderRadius: '50%',
          width: '24px',
          height: '24px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '16px',
          fontWeight: 'bold',
          lineHeight: '1',
          padding: 0,
          transition: 'background 0.2s'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(0, 0, 0, 0.8)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(0, 0, 0, 0.6)';
        }}
        aria-label="Close ad"
        title="Close ad"
      >
        ×
      </button>
      <div className="ad-slot-content" style={{
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        overflow: 'hidden',
        backgroundColor: '#fff',
        position: 'relative',
        maxHeight: slotId === 'header_banner' ? '120px' : 'none', // ✅ FIX: Constrain header ad height
        maxWidth: '100%', // ✅ FIX: Ensure responsive width
        width: '100%', // ✅ FIX: Full width but constrained
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div className="ad-label" style={{
          position: 'absolute',
          top: '4px',
          left: '4px', // ✅ FIX: Move label to left to avoid close button
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
          href={currentAd.destinationUrl || currentAd.creativeUrl}
          onClick={(e) => handleAdClick(currentAd, e)}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'block',
            textDecoration: 'none',
            color: 'inherit',
            width: '100%',
            maxWidth: '100%', // ✅ FIX: Ensure responsive
            maxHeight: slotId === 'header_banner' ? '120px' : 'none',
            overflow: 'hidden',
            position: 'relative'
          }}
        >
          <img
            src={currentAd.creativeUrl}
            alt={currentAd.title || 'Advertisement'}
            style={{
              width: '100%',
              height: 'auto',
              display: 'block',
              maxWidth: '100%', // ✅ FIX: Ensure responsive
              maxHeight: slotId === 'header_banner' ? '120px' : 'none',
              objectFit: slotId === 'header_banner' ? 'contain' : 'cover',
              objectPosition: 'center',
              visibility: 'visible',
              opacity: 1,
              minHeight: slotId === 'header_banner' ? '60px' : 'auto'
            }}
            loading="lazy"
            onError={(e) => {
              // Fallback if image fails to load
              const target = e.target as HTMLImageElement;
              console.error('❌ [AdSlot] Ad image failed to load:', currentAd.creativeUrl);
              console.error('   Ad ID:', currentAd.id);
              console.error('   Ad Title:', currentAd.title);
              console.error('   Slot ID:', slotId);
              console.error('   Image src attempted:', target.src);
              console.error('   Image naturalWidth:', target.naturalWidth);
              console.error('   Image naturalHeight:', target.naturalHeight);
              console.error('   Error event:', e);
              setError('image_load_failed');
            }}
            onLoad={(e) => {
              // ✅ FIX: Log successful image load for debugging
              const target = e.target as HTMLImageElement;
              console.log('✅ [AdSlot] Ad image loaded successfully:', {
                slotId,
                adId: currentAd.id,
                creativeUrl: currentAd.creativeUrl,
                title: currentAd.title,
                imageWidth: target.naturalWidth,
                imageHeight: target.naturalHeight,
                renderedWidth: target.width,
                renderedHeight: target.height
              });
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
