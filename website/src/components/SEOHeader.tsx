
import React from 'react';

/**
 * Part C: SEOHeader Component (React)
 * Manages metadata on the main site for better social sharing.
 * Note: Since we are not using react-helmet-async yet, this component 
 * will manually update the document head for basic functionality.
 */

interface StoryMetadata {
  id: string;
  title: string;
  summary: string;
  coverImage: string;
}

interface SEOHeaderProps {
  story: StoryMetadata;
}

const SEOHeader: React.FC<SEOHeaderProps> = ({ story }) => {
  const siteUrl = "https://kudzimusar.github.io/morning-pulse";
  const shareUrl = `${siteUrl}/#opinion/${story.id}`;

  React.useEffect(() => {
    // Update document title
    document.title = `${story.title} | Morning Pulse`;

    // Helper to update or create meta tags
    const updateMetaTag = (property: string, content: string, attr: 'name' | 'property' = 'property') => {
      let element = document.querySelector(`meta[${attr}="${property}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attr, property);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // Update standard meta tags
    updateMetaTag('description', story.summary, 'name');

    // Update Open Graph tags
    updateMetaTag('og:type', 'article');
    updateMetaTag('og:title', story.title);
    updateMetaTag('og:description', story.summary);
    updateMetaTag('og:image', story.coverImage);
    updateMetaTag('og:url', shareUrl);

    // Update Twitter tags
    updateMetaTag('twitter:card', 'summary_large_image', 'name');
    updateMetaTag('twitter:title', story.title, 'name');
    updateMetaTag('twitter:description', story.summary, 'name');
    updateMetaTag('twitter:image', story.coverImage, 'name');

    // Cleanup (optional: reset to defaults if needed)
  }, [story, shareUrl]);

  return null; // This component doesn't render anything visible
};

export default SEOHeader;
