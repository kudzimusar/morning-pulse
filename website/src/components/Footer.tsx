import React, { useState } from 'react';
import {
  Twitter,
  Linkedin,
  Facebook,
  MessageCircle,
  ArrowUp,
  Mail,
  Shield
} from 'lucide-react';

interface FooterLink {
  label: string;
  hash: string;
  external?: boolean;
  href?: string;
  categoryParam?: string; // For sections that need category filtering
}

interface FooterSection {
  title: string;
  links: FooterLink[];
}

const Footer: React.FC = () => {
  const [showBackToTop, setShowBackToTop] = useState(false);
  const currentYear = new Date().getFullYear();

  // Check scroll position for back-to-top button
  React.useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, link: FooterLink) => {
    if (link.external && link.href) {
      // External links open in new tab
      return;
    }
    e.preventDefault();

    // If link has categoryParam, create hash with query parameter
    if (link.categoryParam) {
      window.location.hash = `${link.hash}?category=${encodeURIComponent(link.categoryParam)}`;
    } else if (link.hash) {
      window.location.hash = link.hash;
    }

    // Scroll to top for hash navigation
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Structured footer navigation data
  const footerNavigation: {
    newsroom: FooterSection;
    sections: FooterSection;
    company: FooterSection;
    legal: FooterSection;
  } = {
    newsroom: {
      title: 'Newsroom',
      links: [
        { label: 'About Us', hash: 'about' },
        { label: 'Editorial Team', hash: 'about' }, // Can link to about or create separate page
        { label: 'Standards & Ethics', hash: 'editorial' },
        { label: 'Submit a Tip', hash: '#', external: true, href: 'mailto:tip@morningpulse.net?subject=Secure%20Tip' },
      ],
    },
    sections: {
      title: 'Sections',
      links: [
        { label: 'Opinion', hash: 'opinion' },
        { label: 'Business', hash: 'news', categoryParam: 'Finance & Economy' },
        { label: 'Technology', hash: 'news', categoryParam: 'Technology' },
        { label: 'World News', hash: 'news', categoryParam: 'World' },
      ],
    },
    company: {
      title: 'Company',
      links: [
        { label: 'Advertise With Us', hash: 'advertise' },
        { label: 'Media Kit', hash: 'advertise' },
        { label: 'Subscriptions', hash: 'subscribe' },
        { label: 'Careers', hash: 'join' },
      ],
    },
    legal: {
      title: 'Legal',
      links: [
        { label: 'Privacy Policy', hash: 'privacy' },
        { label: 'Terms of Service', hash: 'terms' },
        { label: 'Cookie Policy', hash: 'cookies' },
        { label: 'Accessibility', hash: 'privacy' },
      ],
    },
  };

  const socialLinks = [
    {
      name: 'Twitter',
      icon: Twitter,
      href: 'https://twitter.com/morningpulse',
      external: true,
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
      href: 'https://linkedin.com/company/morningpulse',
      external: true,
    },
    {
      name: 'Facebook',
      icon: Facebook,
      href: 'https://facebook.com/morningpulse',
      external: true,
    },
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      href: 'https://whatsapp.com/channel/0029VbCUPQvH5JLtAzsAFR2p',
      external: true,
    },
  ];

  return (
    <footer className="premium-footer">
      {/* Layer 1: Brand Strip */}
      <div className="footer-brand-strip">
        <div className="footer-brand-content">
          <div className="footer-brand-left">
            <div className="footer-logo">Morning Pulse</div>
            <p className="footer-tagline">Independent journalism since 2024</p>
          </div>
          <div className="footer-brand-right">
            <p className="footer-copyright">
              © {currentYear} Morning Pulse Media Group. All rights reserved.
            </p>
            <a
              href="#editorial"
              onClick={(e) => handleLinkClick(e, { label: 'Editorial Standards', hash: 'editorial' })}
              className="footer-standards-link"
            >
              Editorial Standards
            </a>
          </div>
        </div>
      </div>

      {/* Layer 2: Primary Navigation (4-column grid) */}
      <div className="footer-content">
        <div className="footer-column">
          <h3 className="footer-title">{footerNavigation.newsroom.title}</h3>
          <ul className="footer-links">
            {footerNavigation.newsroom.links.map((link, idx) => (
              <li key={idx}>
                <a
                  href={link.external ? link.href : `#${link.hash}`}
                  onClick={(e) => handleLinkClick(e, link)}
                  target={link.external ? '_blank' : undefined}
                  rel={link.external ? 'noopener noreferrer' : undefined}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="footer-column">
          <h3 className="footer-title">{footerNavigation.sections.title}</h3>
          <ul className="footer-links">
            {footerNavigation.sections.links.map((link, idx) => (
              <li key={idx}>
                <a
                  href={`#${link.hash}${link.categoryParam ? `?category=${encodeURIComponent(link.categoryParam)}` : ''}`}
                  onClick={(e) => handleLinkClick(e, link)}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="footer-column">
          <h3 className="footer-title">{footerNavigation.company.title}</h3>
          <ul className="footer-links">
            {footerNavigation.company.links.map((link, idx) => (
              <li key={idx}>
                <a
                  href={`#${link.hash}`}
                  onClick={(e) => handleLinkClick(e, link)}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="footer-column">
          <h3 className="footer-title">{footerNavigation.legal.title}</h3>
          <ul className="footer-links">
            {footerNavigation.legal.links.map((link, idx) => (
              <li key={idx}>
                <a
                  href={`#${link.hash}`}
                  onClick={(e) => handleLinkClick(e, link)}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Layer 3: Social & Contact */}
      <div className="footer-social-contact">
        <div className="footer-social">
          <span className="footer-social-label">Follow Us</span>
          <div className="footer-social-icons">
            {socialLinks.map((social, idx) => (
              <a
                key={idx}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="footer-social-icon"
                aria-label={social.name}
              >
                <social.icon size={20} />
              </a>
            ))}
          </div>
        </div>
        <div className="footer-contact-info">
          <a href="mailto:info@morningpulse.net" className="footer-contact-link">
            <Mail size={16} />
            <span>info@morningpulse.net</span>
          </a>
          <a
            href="mailto:tip@morningpulse.net?subject=Secure%20Tip"
            className="footer-contact-link footer-tip-line"
          >
            <Shield size={16} />
            <span>Secure Tip Line</span>
          </a>
        </div>
      </div>

      {/* Layer 4: Compliance */}
      <div className="footer-compliance">
        <div className="footer-compliance-links">
          <a href="#privacy" onClick={(e) => handleLinkClick(e, { label: 'Privacy', hash: 'privacy' })}>
            Privacy Policy
          </a>
          <span className="footer-compliance-separator">|</span>
          <a href="#terms" onClick={(e) => handleLinkClick(e, { label: 'Terms', hash: 'terms' })}>
            Terms of Service
          </a>
          <span className="footer-compliance-separator">|</span>
          <a href="#cookies" onClick={(e) => handleLinkClick(e, { label: 'Cookies', hash: 'cookies' })}>
            Cookie Policy
          </a>
          <span className="footer-compliance-separator">|</span>
          <a href="#privacy" onClick={(e) => handleLinkClick(e, { label: 'Do Not Sell', hash: 'privacy' })}>
            Do Not Sell My Info
          </a>
        </div>
      </div>

      {/* Layer 5: Functional - CTA & Back to Top */}
      <div className="footer-actions">
        <a
          href="#subscribe"
          onClick={(e) => handleLinkClick(e, { label: 'Support', hash: 'subscribe' })}
          className="footer-cta-button footer-support-cta"
        >
          Support Independent Journalism
        </a>
        {showBackToTop && (
          <button
            onClick={scrollToTop}
            className="footer-back-to-top"
            aria-label="Back to top"
          >
            <ArrowUp size={20} />
          </button>
        )}
      </div>
    </footer>
  );
};

export default Footer;
