import React from 'react';

interface AdvertisePageProps {
  onBack: () => void;
}

const AdvertisePage: React.FC<AdvertisePageProps> = ({ onBack }) => {
  return (
    <div className="institutional-page">
      <div className="page-header">
        <button onClick={onBack} className="back-button">← Back to News</button>
        <h1 className="page-title">Advertise With Us</h1>
      </div>
      
      <div className="page-content">
        <div className="value-proposition">
          <h2>360-Degree News Network</h2>
          <p className="lead-text">
            We don't just host ads; we pulse them across the web, our WhatsApp Channel, and social media.
          </p>
          <p>
            Partner with Morning Pulse and reach your audience through multiple touchpoints. 
            Our multi-channel approach ensures maximum visibility and engagement.
          </p>
        </div>

        <div className="pricing-tiers">
          <div className="pricing-card">
            <div className="pricing-header">
              <h3>Basic Pulse</h3>
              <div className="price">
                <span className="currency">$</span>
                <span className="amount">5</span>
                <span className="period">/month</span>
              </div>
            </div>
            <ul className="pricing-features">
              <li>✓ Website Sidebar Placement</li>
              <li>✓ Weekly WhatsApp Channel Mention</li>
              <li>✓ Basic Analytics</li>
            </ul>
            <button 
              className="pricing-cta"
              onClick={() => window.location.hash = 'advertiser/register'}
            >
              Get Started
            </button>
          </div>

          <div className="pricing-card featured">
            <div className="featured-badge">Most Popular</div>
            <div className="pricing-header">
              <h3>Premium Pulse</h3>
              <div className="price">
                <span className="currency">$</span>
                <span className="amount">15</span>
                <span className="period">/month</span>
              </div>
            </div>
            <ul className="pricing-features">
              <li>✓ Header Banner Placement</li>
              <li>✓ Daily WhatsApp Channel Blast</li>
              <li>✓ X (Twitter) / Social Media Sharing</li>
              <li>✓ Advanced Analytics</li>
              <li>✓ Priority Support</li>
            </ul>
            <button 
              className="pricing-cta"
              onClick={() => window.location.hash = 'advertiser/register'}
            >
              Get Started
            </button>
          </div>

          <div className="pricing-card">
            <div className="pricing-header">
              <h3>Enterprise Pulse</h3>
              <div className="price">
                <span className="currency">Custom</span>
              </div>
            </div>
            <ul className="pricing-features">
              <li>✓ Full Institutional Partnership</li>
              <li>✓ Custom Placement Options</li>
              <li>✓ Dedicated Account Manager</li>
              <li>✓ White-Label Solutions</li>
              <li>✓ Multi-Platform Campaign Management</li>
            </ul>
            <button 
              className="pricing-cta"
              onClick={() => window.location.hash = 'advertiser/register'}
            >
              Contact Sales
            </button>
          </div>
        </div>

        <div className="cta-section">
          <h2>Partner with a 360-degree news network</h2>
          <p>Contact us to discuss how Morning Pulse can amplify your brand</p>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <a 
              href="mailto:ads@morningpulse.net?subject=Advertising%20Inquiry&body=Hello%20Morning%20Pulse%20Ad%20Team,%0D%0A%0D%0AI%20am%20interested%20in%20advertising%20with%20Morning%20Pulse.%0D%0A%0D%0A[Please%20provide%20details%20about%20your%20advertising%20needs]" 
              className="primary-cta-button"
              style={{ backgroundColor: '#f59e0b', color: 'white' }}
            >
              Contact Ad Team
            </a>
            <a href="mailto:info@morningpulse.net" className="primary-cta-button">
              General Inquiries
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvertisePage;
