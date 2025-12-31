import React from 'react';

interface PrivacyPageProps {
  onBack: () => void;
}

const PrivacyPage: React.FC<PrivacyPageProps> = ({ onBack }) => {
  return (
    <div className="institutional-page">
      <div className="page-header">
        <button onClick={onBack} className="back-button">← Back to News</button>
        <h1 className="page-title">Privacy Policy</h1>
      </div>
      
      <div className="page-content">
        <div className="content-section">
          <p className="last-updated">Last updated: {new Date().toLocaleDateString()}</p>
          
          <h2>Data Protection Commitment</h2>
          <p className="lead-text">
            Morning Pulse is committed to protecting your privacy and personal information. 
            This policy outlines how we collect, use, and safeguard your data.
          </p>

          <h3>Information We Collect</h3>
          <p>We collect the following types of information:</p>
          <ul>
            <li><strong>Subscription Data:</strong> Email addresses and WhatsApp phone numbers for premium subscriptions and daily digests</li>
            <li><strong>Usage Data:</strong> Website interaction data, reading preferences, and navigation patterns</li>
            <li><strong>Device Information:</strong> Browser type, device type, and IP address for analytics and security</li>
          </ul>

          <h3>How We Use Your Information</h3>
          <ul>
            <li>To deliver news content and daily WhatsApp digests</li>
            <li>To provide personalized content recommendations</li>
            <li>To improve our services and user experience</li>
            <li>To communicate important updates and announcements</li>
            <li>To ensure platform security and prevent fraud</li>
          </ul>

          <h3>WhatsApp Phone Number Handling</h3>
          <p>
            When you subscribe to Morning Pulse Premium and opt-in to receive daily 
            WhatsApp digests, we collect your phone number. We use this information 
            exclusively to:
          </p>
          <ul>
            <li>Send daily news digests to your WhatsApp account</li>
            <li>Send subscription-related notifications</li>
            <li>Provide customer support via WhatsApp when requested</li>
          </ul>
          <p>
            <strong>We do not share your phone number with third parties</strong> for 
            marketing purposes. Your phone number is stored securely and is only accessible 
            to authorized personnel for the purposes stated above.
          </p>

          <h3>Data Security</h3>
          <p>
            We implement industry-standard security measures to protect your personal 
            information, including encryption, secure servers, and access controls. 
            However, no method of transmission over the internet is 100% secure.
          </p>

          <h3>Your Rights</h3>
          <p>You have the right to:</p>
          <ul>
            <li>Access your personal data</li>
            <li>Correct inaccurate information</li>
            <li>Request deletion of your data</li>
            <li>Opt-out of WhatsApp communications</li>
            <li>Cancel your subscription at any time</li>
          </ul>

          <h3>Cookies and Tracking</h3>
          <p>
            We use cookies and similar technologies to enhance your experience, analyze 
            usage patterns, and deliver personalized content. You can manage cookie 
            preferences through your browser settings.
          </p>

          <h3>Third-Party Services</h3>
          <p>
            Our platform may integrate with third-party services (such as Firebase for 
            data storage and WhatsApp for messaging). These services have their own 
            privacy policies, and we encourage you to review them.
          </p>

          <h3>Contact Us</h3>
          <p>
            For questions about this privacy policy or to exercise your rights, please 
            contact us at <a href="mailto:info@morningpulse.net">info@morningpulse.net</a>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPage;
