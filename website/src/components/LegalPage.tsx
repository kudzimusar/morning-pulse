import React from 'react';

interface LegalPageProps {
  onBack: () => void;
  legalType: 'privacy' | 'terms' | 'cookies';
}

const LegalPage: React.FC<LegalPageProps> = ({ onBack, legalType }) => {
  const getContent = () => {
    switch (legalType) {
      case 'privacy':
        return {
          title: 'Privacy Policy',
          lastUpdated: new Date().toLocaleDateString(),
          content: (
            <>
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
                exclusively to send daily news digests and subscription-related notifications.
              </p>

              <h3>Data Sharing</h3>
              <p>
                We do not sell, trade, or rent your personal information to third parties. 
                We may share aggregated, anonymized data for analytics purposes.
              </p>

              <h3>Your Rights</h3>
              <p>
                You have the right to access, update, or delete your personal information 
                at any time. Contact us at privacy@morningpulse.net to exercise these rights.
              </p>

              <h3>Data Security</h3>
              <p>
                We implement industry-standard security measures to protect your data from 
                unauthorized access, alteration, disclosure, or destruction.
              </p>

              <h3>Changes to This Policy</h3>
              <p>
                We may update this privacy policy from time to time. We will notify you of 
                any changes by posting the new policy on this page and updating the "Last updated" date.
              </p>
            </>
          ),
        };

      case 'terms':
        return {
          title: 'Terms of Service',
          lastUpdated: new Date().toLocaleDateString(),
          content: (
            <>
              <h2>Terms of Service</h2>
              <p className="lead-text">
                By accessing and using Morning Pulse, you agree to be bound by these Terms of Service.
              </p>

              <h3>Acceptable Use</h3>
              <p>You agree to use Morning Pulse only for lawful purposes and in a way that does not:</p>
              <ul>
                <li>Infringe on the rights of others</li>
                <li>Violate any applicable laws or regulations</li>
                <li>Transmit harmful or malicious code</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Interfere with or disrupt the service or servers</li>
              </ul>

              <h3>Content Ownership</h3>
              <p>
                All content on Morning Pulse, including articles, images, and logos, is protected 
                by copyright and other intellectual property laws. You may not reproduce, distribute, 
                or create derivative works without our express written permission.
              </p>

              <h3>User-Generated Content</h3>
              <p>
                When you submit content to Morning Pulse (including opinions, comments, or letters), 
                you grant us a non-exclusive, royalty-free license to use, modify, and publish that content.
              </p>

              <h3>Subscription Services</h3>
              <p>
                Premium subscriptions are billed monthly or annually. You may cancel your subscription 
                at any time. Refunds are provided according to our refund policy.
              </p>

              <h3>Limitation of Liability</h3>
              <p>
                Morning Pulse is provided "as is" without warranties of any kind. We are not liable 
                for any damages arising from your use of our service, including but not limited to 
                direct, indirect, incidental, or consequential damages.
              </p>

              <h3>Indemnification</h3>
              <p>
                You agree to indemnify and hold harmless Morning Pulse from any claims, damages, or 
                expenses arising from your use of the service or violation of these terms.
              </p>

              <h3>Changes to Terms</h3>
              <p>
                We reserve the right to modify these terms at any time. Continued use of the service 
                constitutes acceptance of the modified terms.
              </p>
            </>
          ),
        };

      case 'cookies':
        return {
          title: 'Cookie Policy',
          lastUpdated: new Date().toLocaleDateString(),
          content: (
            <>
              <h2>Cookie Policy</h2>
              <p className="lead-text">
                Morning Pulse uses cookies and similar technologies to enhance your browsing experience 
                and provide personalized content.
              </p>

              <h3>What Are Cookies?</h3>
              <p>
                Cookies are small text files stored on your device when you visit our website. 
                They help us remember your preferences and improve site functionality.
              </p>

              <h3>Types of Cookies We Use</h3>
              <ul>
                <li><strong>Essential Cookies:</strong> Required for the website to function properly. These cannot be disabled.</li>
                <li><strong>Analytics Cookies:</strong> Help us understand how visitors interact with our site (e.g., Google Analytics)</li>
                <li><strong>Preference Cookies:</strong> Remember your settings and preferences (e.g., country selection, category preferences)</li>
                <li><strong>Marketing Cookies:</strong> Used to deliver relevant advertisements and track campaign effectiveness</li>
              </ul>

              <h3>Managing Cookies</h3>
              <p>
                You can control cookies through your browser settings. However, disabling certain cookies 
                may limit your ability to use some features of our website. Most browsers allow you to:
              </p>
              <ul>
                <li>View and delete cookies</li>
                <li>Block cookies from specific sites</li>
                <li>Block all cookies</li>
                <li>Delete all cookies when you close your browser</li>
              </ul>

              <h3>Third-Party Cookies</h3>
              <p>
                We may use third-party services (such as Google Analytics, social media platforms) that 
                set their own cookies. These are governed by the respective third-party privacy policies.
              </p>

              <h3>Cookie Consent</h3>
              <p>
                By continuing to use our website, you consent to our use of cookies as described in this policy. 
                You can withdraw your consent at any time by adjusting your browser settings.
              </p>
            </>
          ),
        };

      default:
        return { title: 'Legal', lastUpdated: '', content: null };
    }
  };

  const { title, lastUpdated, content } = getContent();

  return (
    <div className="institutional-page">
      <div className="page-header">
        <button onClick={onBack} className="back-button">← Back to News</button>
        <h1 className="page-title">{title}</h1>
      </div>
      
      <div className="page-content">
        <div className="content-section">
          <p className="last-updated">Last updated: {lastUpdated}</p>
          {content}
        </div>
      </div>
    </div>
  );
};

export default LegalPage;
