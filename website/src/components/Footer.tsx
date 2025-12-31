import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="premium-footer">
      <div className="footer-content">
        {/* About Column */}
        <div className="footer-column">
          <h3 className="footer-title">About</h3>
          <p className="footer-text">
            Morning Pulse is a premium, multi-dimensional news aggregator bringing you 
            comprehensive coverage across Local, Business, African Focus, Global, Sports, 
            Tech, and General News. We deliver curated, timely news to keep you informed.
          </p>
        </div>

        {/* Quick Links Column */}
        <div className="footer-column">
          <h3 className="footer-title">Quick Links</h3>
          <ul className="footer-links">
            <li><a href="#categories">News Categories</a></li>
            <li><a href="#archive">News Archive</a></li>
            <li><a href="#subscription">Subscription</a></li>
            <li><a href="#advertising">Advertise With Us</a></li>
          </ul>
        </div>

        {/* Contact Column */}
        <div className="footer-column">
          <h3 className="footer-title">Contact</h3>
          <ul className="footer-contact">
            <li>
              <strong>WhatsApp Channel:</strong>
              <a href="https://whatsapp.com/channel/0029VbCUPQvH5JLtAzsAFR2p" target="_blank" rel="noopener noreferrer">
                Join Morning Pulse
              </a>
            </li>
            <li>
              <strong>Email:</strong>
              <a href="mailto:info@morningpulse.net">info@morningpulse.net</a>
            </li>
            <li>
              <strong>Location:</strong>
              <span>Global</span>
            </li>
          </ul>
        </div>

        {/* Organization Column */}
        <div className="footer-column">
          <h3 className="footer-title">Our Organization</h3>
          <ul className="footer-links">
            <li><a href="#about">About Us</a></li>
            <li><a href="#editorial">Editorial Guidelines</a></li>
            <li><a href="#privacy">Privacy Policy</a></li>
            <li><a href="#advertising">Advertise With Us</a></li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} Morning Pulse. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
