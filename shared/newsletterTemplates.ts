/**
 * Shared Newsletter Templates
 * Single source of truth for all Morning Pulse newsletter HTML generation
 * Inspired by Wrestlenomics / Bloomberg Intelligence
 */

export interface NewsletterArticle {
  id: string;
  headline: string;
  subHeadline: string;
  authorName: string;
  slug?: string;
  publishedAt: Date;
  imageUrl?: string;
  category?: string;
}

export interface NewsletterAd {
  id: string;
  advertiserName: string;
  headline: string;
  body: string;
  imageUrl?: string;
  destinationUrl: string;
}

export interface NewsletterPayload {
  title: string;
  currentDate: string;
  articles: NewsletterArticle[];
  ads?: {
    top?: NewsletterAd;
    inline?: NewsletterAd[];
    footer?: NewsletterAd;
  };
  type?: 'daily' | 'weekly';
  baseUrl?: string;
}

/**
 * Generate the full HTML for a newsletter
 */
export function generateNewsletterHTML(payload: NewsletterPayload): string {
  const { 
    title, 
    currentDate, 
    articles, 
    ads = {},
    type = 'weekly', 
    baseUrl = 'https://kudzimusar.github.io/morning-pulse/' 
  } = payload;

  const topStory = articles[0];
  const otherStories = articles.slice(1);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    @media only screen and (max-width: 600px) {
      .container { width: 100% !important; }
      .content { padding: 20px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f4; color: #1a1a1a;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f4f4f4;">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table class="container" role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border: 1px solid #e0e0e0;">
          
          <!-- Header -->
          <tr>
            <td style="padding: 40px 30px; background-color: #000000; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase;">MORNING PULSE</h1>
              <div style="margin-top: 10px; height: 2px; background-color: #ffffff; width: 40px; margin-left: auto; margin-right: auto;"></div>
              <p style="margin: 15px 0 0 0; color: #cccccc; font-size: 12px; letter-spacing: 1px; text-transform: uppercase;">${title} &bull; ${currentDate}</p>
            </td>
          </tr>

          <!-- Top Ad (Optional) -->
          ${ads.top ? renderAdBlock(ads.top, 'top') : ''}

          <!-- Content Section -->
          <tr>
            <td class="content" style="padding: 40px 30px;">
              
              <!-- Top Story -->
              ${topStory ? renderTopStory(topStory, baseUrl) : ''}

              <!-- Inline Ad 1 (Optional) -->
              ${ads.inline && ads.inline[0] ? renderAdBlock(ads.inline[0], 'inline') : ''}

              <!-- Key Headlines Section -->
              ${otherStories.length > 0 ? `
                <table role="presentation" style="width: 100%; border-collapse: collapse; margin-top: 40px;">
                  <tr>
                    <td style="padding-bottom: 15px; border-bottom: 2px solid #000000;">
                      <h3 style="margin: 0; font-size: 18px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">Key Headlines</h3>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding-top: 20px;">
                      <ul style="margin: 0; padding: 0; list-style-type: none;">
                        ${otherStories.slice(0, 3).map(s => renderBulletStory(s, baseUrl)).join('')}
                      </ul>
                    </td>
                  </tr>
                </table>
              ` : ''}

              <!-- Inline Ad 2 (Optional) -->
              ${ads.inline && ads.inline[1] ? renderAdBlock(ads.inline[1], 'inline') : ''}

              <!-- More Stories Section -->
              ${otherStories.length > 3 ? `
                <table role="presentation" style="width: 100%; border-collapse: collapse; margin-top: 40px;">
                  <tr>
                    <td style="padding-bottom: 15px; border-bottom: 1px solid #e0e0e0;">
                      <h3 style="margin: 0; font-size: 16px; font-weight: 700; color: #666666; text-transform: uppercase; letter-spacing: 1px;">More Analysis</h3>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding-top: 10px;">
                      ${otherStories.slice(3).map(s => renderStandardStory(s, baseUrl)).join('')}
                    </td>
                  </tr>
                </table>
              ` : ''}

            </td>
          </tr>

          <!-- Footer Ad (Optional) -->
          ${ads.footer ? renderAdBlock(ads.footer, 'footer') : ''}

          <!-- Footer Compliance Section -->
          <tr>
            <td style="padding: 40px 30px; background-color: #f9f9f9; border-top: 1px solid #e0e0e0; text-align: center;">
              <p style="margin: 0 0 10px 0; font-size: 14px; font-weight: 700;">MORNING PULSE</p>
              <p style="margin: 0 0 20px 0; font-size: 12px; color: #666666; line-height: 1.6;">
                The daily briefing for the global professional.<br>
                123 Business District, Harare, Zimbabwe
              </p>
              <p style="margin: 0 0 20px 0; font-size: 12px; color: #666666;">
                You are receiving this because you subscribed at <a href="${baseUrl}" style="color: #000000; text-decoration: underline;">morningpulse.net</a>
              </p>
              <table role="presentation" style="margin: 0 auto;">
                <tr>
                  <td style="font-size: 12px; color: #666666;">
                    <a href="${baseUrl}#subscribe" style="color: #000000; text-decoration: underline;">Manage Preferences</a>
                    <span style="padding: 0 10px;">&bull;</span>
                    <a href="${baseUrl}#unsubscribe" style="color: #000000; text-decoration: underline;">Unsubscribe</a>
                    <span style="padding: 0 10px;">&bull;</span>
                    <a href="${baseUrl}#privacy" style="color: #000000; text-decoration: underline;">Privacy Policy</a>
                  </td>
                </tr>
              </table>
              <p style="margin: 20px 0 0 0; font-size: 11px; color: #999999; text-transform: uppercase; letter-spacing: 1px;">
                &copy; ${new Date().getFullYear()} Morning Pulse Media. All rights reserved.
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
}

function renderTopStory(article: NewsletterArticle, baseUrl: string): string {
  const url = `${baseUrl}#opinion/${article.slug || article.id}`;
  return `
    <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
      ${article.imageUrl ? `
        <tr>
          <td style="padding-bottom: 20px;">
            <a href="${url}"><img src="${article.imageUrl}" alt="${article.headline}" style="width: 100%; height: auto; display: block; border-radius: 4px;" /></a>
          </td>
        </tr>
      ` : ''}
      <tr>
        <td>
          <span style="display: inline-block; padding: 4px 8px; background-color: #000000; color: #ffffff; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; border-radius: 2px;">Top Story</span>
          <h2 style="margin: 0 0 12px 0; font-size: 28px; font-weight: 800; line-height: 1.2; letter-spacing: -0.5px;">
            <a href="${url}" style="color: #000000; text-decoration: none;">${article.headline}</a>
          </h2>
          <p style="margin: 0 0 20px 0; font-family: Georgia, serif; font-size: 18px; line-height: 1.5; color: #333333;">${article.subHeadline}</p>
          <p style="margin: 0; font-size: 13px; color: #666666;">By <strong>${article.authorName}</strong></p>
        </td>
      </tr>
    </table>
  `;
}

function renderBulletStory(article: NewsletterArticle, baseUrl: string): string {
  const url = `${baseUrl}#opinion/${article.slug || article.id}`;
  return `
    <li style="margin-bottom: 20px; padding-left: 0;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="vertical-align: top; width: 20px; font-size: 18px; line-height: 1.2; font-weight: 800;">&bull;</td>
          <td>
            <h4 style="margin: 0 0 5px 0; font-size: 17px; font-weight: 700; line-height: 1.4;">
              <a href="${url}" style="color: #000000; text-decoration: none;">${article.headline}</a>
            </h4>
            <p style="margin: 0; font-size: 14px; color: #666666;">${article.subHeadline.substring(0, 100)}...</p>
          </td>
        </tr>
      </table>
    </li>
  `;
}

function renderStandardStory(article: NewsletterArticle, baseUrl: string): string {
  const url = `${baseUrl}#opinion/${article.slug || article.id}`;
  return `
    <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 25px; padding-bottom: 25px; border-bottom: 1px solid #f0f0f0;">
      <tr>
        <td style="vertical-align: top;">
          <h4 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 700; line-height: 1.3;">
            <a href="${url}" style="color: #000000; text-decoration: none;">${article.headline}</a>
          </h4>
          <p style="margin: 0 0 10px 0; font-size: 14px; color: #444444; line-height: 1.5;">${article.subHeadline}</p>
          <p style="margin: 0; font-size: 12px; color: #888888;">By ${article.authorName}</p>
        </td>
        ${article.imageUrl ? `
          <td style="vertical-align: top; width: 100px; padding-left: 20px;">
            <a href="${url}"><img src="${article.imageUrl}" alt="" style="width: 100px; height: 70px; object-fit: cover; border-radius: 4px;" /></a>
          </td>
        ` : ''}
      </tr>
    </table>
  `;
}

function renderAdBlock(ad: NewsletterAd, placement: 'top' | 'inline' | 'footer'): string {
  const isInline = placement === 'inline';
  const bgColor = isInline ? '#f9f9f9' : '#ffffff';
  const padding = isInline ? '25px' : '20px 30px';
  
  return `
    <tr>
      <td style="padding: ${padding}; background-color: ${bgColor}; border-bottom: 1px solid #e0e0e0;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td>
              <p style="margin: 0 0 10px 0; font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #999999;">Sponsored &bull; Presented by ${ad.advertiserName}</p>
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="vertical-align: top;">
                    <h4 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 700; line-height: 1.3;">
                      <a href="${ad.destinationUrl}" style="color: #000000; text-decoration: none;">${ad.headline}</a>
                    </h4>
                    <p style="margin: 0; font-size: 13px; color: #666666; line-height: 1.4;">${ad.body}</p>
                  </td>
                  ${ad.imageUrl ? `
                    <td style="vertical-align: top; width: 80px; padding-left: 15px;">
                      <a href="${ad.destinationUrl}"><img src="${ad.imageUrl}" alt="" style="width: 80px; height: 60px; object-fit: cover; border-radius: 4px;" /></a>
                    </td>
                  ` : ''}
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `;
}
