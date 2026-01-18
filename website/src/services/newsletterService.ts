/**
 * Newsletter Service
 * Auto-generates HTML email newsletters from published content
 * Perfect for sending weekly/daily digest to subscribers
 */

import { Opinion } from '../../../types';
import { getPublishedOpinions } from './opinionsService';

export interface NewsletterOptions {
  title: string;
  dateRange: 'today' | 'week' | 'month';
  maxArticles?: number;
  includeImages?: boolean;
}

/**
 * Generate HTML newsletter from published opinions
 * Creates beautiful, responsive HTML email template
 */
export const generateNewsletter = async (options: NewsletterOptions): Promise<string> => {
  const { title, dateRange, maxArticles = 10, includeImages = true } = options;
  
  // Get published opinions
  const allOpinions = await getPublishedOpinions();
  
  // Filter by date range
  const now = new Date();
  const cutoffDate = new Date();
  
  switch (dateRange) {
    case 'today':
      cutoffDate.setHours(0, 0, 0, 0);
      break;
    case 'week':
      cutoffDate.setDate(cutoffDate.getDate() - 7);
      break;
    case 'month':
      cutoffDate.setMonth(cutoffDate.getMonth() - 1);
      break;
  }
  
  const filteredOpinions = allOpinions
    .filter(op => {
      const pubDate = op.publishedAt;
      return pubDate && pubDate >= cutoffDate;
    })
    .slice(0, maxArticles);
  
  if (filteredOpinions.length === 0) {
    return generateEmptyNewsletter(title);
  }
  
  // Generate HTML
  return generateNewsletterHTML(title, filteredOpinions, includeImages);
};

/**
 * Generate HTML template for newsletter
 */
const generateNewsletterHTML = (title: string, opinions: Opinion[], includeImages: boolean): string => {
  const articleHTML = opinions.map((opinion, index) => {
    const imageUrl = opinion.finalImageUrl || opinion.imageUrl;
    const slug = opinion.slug || opinion.id;
    const url = `https://kudzimusar.github.io/morning-pulse/#opinion/${slug}`;
    
    // Strip HTML tags from body for preview
    const bodyPreview = opinion.body
      .replace(/<[^>]*>/g, '')
      .substring(0, 200) + '...';
    
    return `
      <tr>
        <td style="padding: 20px 0; border-bottom: 1px solid #e5e5e5;">
          ${includeImages && imageUrl ? `
            <a href="${url}" style="display: block; margin-bottom: 16px;">
              <img src="${imageUrl}" alt="${opinion.headline}" style="width: 100%; max-width: 600px; height: auto; border-radius: 8px;" />
            </a>
          ` : ''}
          
          <h2 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 700; line-height: 1.3;">
            <a href="${url}" style="color: #000; text-decoration: none;">${opinion.headline}</a>
          </h2>
          
          <p style="margin: 0 0 12px 0; font-size: 16px; color: #666; font-style: italic;">
            ${opinion.subHeadline}
          </p>
          
          <p style="margin: 0 0 12px 0; font-size: 14px; color: #444; line-height: 1.6;">
            ${bodyPreview}
          </p>
          
          <div style="margin-bottom: 12px;">
            <span style="font-size: 12px; color: #999;">
              By <strong style="color: #666;">${opinion.authorName}</strong>
              ${opinion.publishedAt ? ` • ${opinion.publishedAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` : ''}
            </span>
          </div>
          
          <a href="${url}" style="display: inline-block; padding: 10px 20px; background-color: #000; color: #fff; text-decoration: none; border-radius: 4px; font-size: 14px; font-weight: 600;">
            Read Full Article →
          </a>
        </td>
      </tr>
    `;
  }).join('');
  
  const currentDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: Georgia, serif; background-color: #f9fafb;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
          
          <!-- Header -->
          <tr>
            <td style="padding: 40px 30px; background-color: #000; text-align: center;">
              <h1 style="margin: 0; color: #fff; font-size: 32px; font-weight: 900; letter-spacing: 0.05em;">
                MORNING PULSE
              </h1>
              <p style="margin: 12px 0 0 0; color: #fff; font-size: 14px; letter-spacing: 0.1em; text-transform: uppercase;">
                ${title}
              </p>
            </td>
          </tr>
          
          <!-- Date -->
          <tr>
            <td style="padding: 20px 30px; background-color: #f9fafb; border-bottom: 2px solid #000;">
              <p style="margin: 0; font-size: 14px; color: #666; text-align: center;">
                ${currentDate}
              </p>
            </td>
          </tr>
          
          <!-- Articles -->
          <tr>
            <td style="padding: 0 30px;">
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                ${articleHTML}
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px; background-color: #f9fafb; text-align: center; border-top: 1px solid #e5e5e5;">
              <p style="margin: 0 0 12px 0; font-size: 12px; color: #999;">
                You're receiving this because you subscribed to Morning Pulse newsletters.
              </p>
              <p style="margin: 0; font-size: 12px;">
                <a href="https://kudzimusar.github.io/morning-pulse/" style="color: #000; text-decoration: underline;">Visit Website</a>
                •
                <a href="https://kudzimusar.github.io/morning-pulse/#subscribe" style="color: #000; text-decoration: underline;">Manage Subscription</a>
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
};

/**
 * Generate empty newsletter (no content available)
 */
const generateEmptyNewsletter = (title: string): string => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: Georgia, serif; background-color: #f9fafb;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
          <tr>
            <td style="padding: 40px 30px; background-color: #000; text-align: center;">
              <h1 style="margin: 0; color: #fff; font-size: 32px; font-weight: 900;">MORNING PULSE</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 60px 30px; text-align: center;">
              <p style="font-size: 18px; color: #666;">No new content for this period.</p>
              <p style="font-size: 14px; color: #999;">Check back soon for fresh journalism!</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
};

/**
 * NEW: Download newsletter as HTML file
 * Allows editors to save and send via email platform
 */
export const downloadNewsletter = (html: string, filename: string = 'morning-pulse-newsletter.html'): void => {
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * NEW: Preview newsletter in new window
 */
export const previewNewsletter = (html: string): void => {
  const previewWindow = window.open('', '_blank');
  if (previewWindow) {
    previewWindow.document.write(html);
    previewWindow.document.close();
  }
};