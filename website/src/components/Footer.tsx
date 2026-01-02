import React from 'react';

const Footer: React.FC = () => {
  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, page: string) => {
    e.preventDefault();
    window.location.hash = page;
  };

  return (
    <footer className="premium-footer">
      <div className="footer-content">
        {/* Column 1: Quick Links */}
        <div className="footer-column">
          <h3 className="footer-title">Quick Links</h3>
          <ul className="footer-links">
            <li><a href="#news" onClick={(e) => handleLinkClick(e, 'news')}>News Categories</a></li>
            <li><a href="#archive" onClick={(e) => handleLinkClick(e, 'news')}>Archive</a></li>
            <li><a href="#subscription" onClick={(e) => handleLinkClick(e, 'subscribe')}>Subscription</a></li>
            <li><a href="#advertise" onClick={(e) => handleLinkClick(e, 'advertise')}>Advertise</a></li>
          </ul>
        </div>

        {/* Column 2: Organization */}
        <div className="footer-column">
          <h3 className="footer-title">Organization</h3>
          <ul className="footer-links">
            <li><a href="#about" onClick={(e) => handleLinkClick(e, 'about')}>About Us</a></li>
            <li><a href="#editorial" onClick={(e) => handleLinkClick(e, 'editorial')}>Editorial Guidelines</a></li>
            <li><a href="#privacy" onClick={(e) => handleLinkClick(e, 'privacy')}>Privacy Policy</a></li>
          </ul>
        </div>

        {/* Column 3: Contact */}
        <div className="footer-column">
          <h3 className="footer-title">Contact</h3>
          <ul className="footer-contact">
            <li>
              <strong>WhatsApp:</strong>
              <a href="https://whatsapp.com/channel/0029VbCUPQvH5JLtAzsAFR2p" target="_blank" rel="noopener noreferrer">
                Join Morning Pulse
              </a>
            </li>
            <li>
              <strong>Email:</strong>
              <a href="mailto:info@morningpulse.net">info@morningpulse.net</a>
            </li>
          </ul>
        </div>

        {/* Column 4: Location */}
        <div className="footer-column">
          <h3 className="footer-title">Location</h3>
          <p className="footer-text">
            Global / Harare
          </p>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} Morning Pulse. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
