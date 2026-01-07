import React, { useState } from 'react';

interface SubscriptionPageProps {
  onBack: () => void;
}

const SubscriptionPage: React.FC<SubscriptionPageProps> = ({ onBack }) => {
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Redirect to registration page
    window.location.hash = 'subscriber/register';
  };

  return (
    <div className="institutional-page">
      <div className="page-header">
        <button onClick={onBack} className="back-button">← Back to News</button>
        <h1 className="page-title">Subscribe to Morning Pulse</h1>
      </div>
      
      <div className="page-content">
        <div className="subscription-hero">
          <h2>Morning Pulse Premium</h2>
          <p className="lead-text">Ad-free experience, full archive access, and daily WhatsApp digest</p>
          <div className="free-trial-badge">
            <span>✨ Try Morning Pulse Premium for 7 days free</span>
          </div>
        </div>

        <div className="subscription-pricing">
          <div className="subscription-card">
            <div className="pricing-header">
              <h3>Micro-Pulse Plan</h3>
              <div className="price">
                <span className="currency">$</span>
                <span className="amount">0.50</span>
                <span className="period">/month</span>
              </div>
              <p className="price-note">Less than a cup of coffee</p>
            </div>
            
            <div className="subscription-benefits">
              <h4>What You Get:</h4>
              <ul className="benefits-list">
                <li>✓ Ad-free browsing experience</li>
                <li>✓ Access to full News Archive</li>
                <li>✓ Daily WhatsApp Morning Digest</li>
                <li>✓ Priority support</li>
                <li>✓ Early access to new features</li>
              </ul>
            </div>

            <form onSubmit={handleSubmit} className="subscription-form">
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="whatsapp">WhatsApp Number (for daily digest)</label>
                <input
                  type="tel"
                  id="whatsapp"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="+263 XXX XXX XXX"
                  required
                />
              </div>

              <button type="submit" className="subscription-cta">
                Start 7-Day Free Trial
              </button>
              
              <p className="form-note">
                Cancel anytime. No hidden fees.
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPage;
