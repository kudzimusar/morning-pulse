/**
 * Generate Share Pages for Social Media Previews
 * Creates static HTML redirect shells with OG tags for each published opinion
 * This allows social media bots to read meta tags even though the site is a SPA
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Get environment variables
const APP_ID = process.env.APP_ID || 'morning-pulse-app';
const GITHUB_PAGES_URL = process.env.GITHUB_PAGES_URL || 'https://kudzimusar.github.io';
const BASE_URL = `${GITHUB_PAGES_URL}/morning-pulse`;

// Initialize Firebase Admin
let db;
try {
  const serviceAccountJson = process.env.FIREBASE_ADMIN_CONFIG;
  if (!serviceAccountJson) {
    throw new Error('FIREBASE_ADMIN_CONFIG environment variable is required');
  }

  const serviceAccount = JSON.parse(serviceAccountJson);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  db = admin.firestore();
  console.log('✅ Firebase Admin initialized');
} catch (error) {
  console.error('❌ Failed to initialize Firebase Admin:', error.message);
  process.exit(1);
}

/**
 * Generate a slug from a headline
 */
function generateSlug(headline) {
  return headline
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 100); // Limit length
}

/**
 * Escape HTML entities
 */
function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Truncate text to a maximum length, ensuring no mid-word cutoff
 * Optimized for WhatsApp/Telegram (195 chars + '...' = 198 total)
 */
function truncateDescription(text, maxLength = 195) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  
  // Find the last space before maxLength to avoid mid-word cutoff
  const truncated = text.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  
  // If we found a space near the end, use it; otherwise just truncate
  if (lastSpace > maxLength - 30) {
    return truncated.substring(0, lastSpace) + '...';
  }
  
  return truncated + '...';
}

/**
 * Get category display name
 */
function getCategoryDisplayName(category) {
  const categoryMap = {
    'the-board': 'The Board',
    'guest-essays': 'Guest Essays',
    'letters': 'Letters',
    'culture': 'Culture',
    'latest': 'Latest'
  };
  return categoryMap[category] || category || 'Opinion';
}

/**
 * Format date for JSON-LD (ISO 8601 format)
 */
function formatDateForJSONLD(timestamp) {
  if (!timestamp) return new Date().toISOString();
  
  // Handle Firestore Timestamp
  if (timestamp.toDate) {
    return timestamp.toDate().toISOString();
  }
  
  // Handle Date object
  if (timestamp instanceof Date) {
    return timestamp.toISOString();
  }
  
  // Handle Unix timestamp (seconds or milliseconds)
  if (typeof timestamp === 'number') {
    const date = timestamp > 1e12 ? new Date(timestamp) : new Date(timestamp * 1000);
    return date.toISOString();
  }
  
  // Fallback to current date
  return new Date().toISOString();
}

/**
 * Generate HTML redirect shell for a story
 */
function generateShareHTML(story) {
  const slug = story.slug || generateSlug(story.headline);
  const title = escapeHtml(story.headline || 'Morning Pulse Opinion');
  const description = escapeHtml(truncateDescription(story.subHeadline || story.body || 'Read this opinion piece on Morning Pulse'));
  const category = getCategoryDisplayName(story.category);
  const author = escapeHtml(story.authorName || 'Morning Pulse');
  
  // Ensure image URL is always absolute (WhatsApp requires full https:// URLs)
  // Priority: finalImageUrl > suggestedImageUrl > imageUrl > brand fallback
  let imageUrl = story.finalImageUrl || story.suggestedImageUrl || story.imageUrl;
  
  // If no image, use Morning Pulse brand hero image (1200x630)
  if (!imageUrl) {
    imageUrl = `${BASE_URL}/og-default.jpg`;
  }
  
  // If image URL is relative, make it absolute
  if (imageUrl && !imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
    // Handle relative paths
    if (imageUrl.startsWith('/')) {
      imageUrl = `${GITHUB_PAGES_URL}${imageUrl}`;
    } else {
      imageUrl = `${BASE_URL}/${imageUrl}`;
    }
  }
  
  // Filter out deprecated Unsplash URLs - use brand image instead
  if (imageUrl && (imageUrl.includes('unsplash.com') || imageUrl.includes('source.unsplash.com'))) {
    imageUrl = `${BASE_URL}/og-default.jpg`;
  }
  
  // Share page URL (what bots see - static HTML page)
  const sharePageUrl = `${BASE_URL}/shares/${slug}/`;
  
  // Story URL (where users are redirected - SPA hash route)
  const storyUrl = `${BASE_URL}/#opinion/${slug}`;
  
  // Published date for structured data
  const publishedDate = formatDateForJSONLD(story.publishedAt || story.submittedAt);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  
  <!-- Open Graph / Facebook (Moved to top for bot priority) -->
  <meta property="og:type" content="article">
  <meta property="og:url" content="${sharePageUrl}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${imageUrl}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${title}">
  <meta property="og:site_name" content="Morning Pulse">
  <meta property="og:locale" content="en_US">
  <meta property="article:author" content="${author}">
  <meta property="article:section" content="${category}">
  <meta property="article:published_time" content="${publishedDate}">
  
  <!-- Twitter Card (Moved to top for bot priority) -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${sharePageUrl}">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${imageUrl}">
  
  <!-- Primary Meta Tags -->
  <title>${title} | Morning Pulse</title>
  <meta name="title" content="${title} | Morning Pulse">
  <meta name="description" content="${description}">
  <meta name="author" content="${author}">
  
  <!-- Canonical URL (points to share page, not SPA) -->
  <link rel="canonical" href="${sharePageUrl}">
  
  <!-- Structured Data (JSON-LD) -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": ${JSON.stringify(title)},
    "description": ${JSON.stringify(description)},
    "image": ${JSON.stringify(imageUrl)},
    "author": {
      "@type": "Person",
      "name": ${JSON.stringify(author)}
    },
    "publisher": {
      "@type": "Organization",
      "name": "Morning Pulse",
      "logo": {
        "@type": "ImageObject",
        "url": "${BASE_URL}/logo.png"
      }
    },
    "datePublished": ${JSON.stringify(publishedDate)},
    "dateModified": ${JSON.stringify(publishedDate)},
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": ${JSON.stringify(sharePageUrl)}
    },
    "articleSection": ${JSON.stringify(category)}
  }
  </script>
  
  <!-- Meta refresh redirect (delayed for bot scraping) -->
  <meta http-equiv="refresh" content="3; url=${storyUrl}">
  
  <!-- Fallback link for non-JS browsers -->
  <noscript>
    <meta http-equiv="refresh" content="0; url=${storyUrl}">
    <p>If you are not redirected automatically, <a href="${storyUrl}">click here</a>.</p>
  </noscript>
</head>
<body>
  <div style="font-family: system-ui, -apple-system, sans-serif; text-align: center; padding: 60px 20px;">
    <h1 style="font-size: 24px; margin-bottom: 16px;">${title}</h1>
    <p style="color: #666; margin-bottom: 24px;">${description}</p>
    <p style="font-size: 14px; color: #999;">
      <a href="${storyUrl}" style="color: #007bff; text-decoration: none;">Click here if you are not redirected</a>
    </p>
  </div>
  
  <!-- Bot-friendly JavaScript redirect (delayed to allow meta tag scraping) -->
  <script>
    // Give social media bots time to scrape meta tags before redirecting
    setTimeout(function() {
      window.location.href = ${JSON.stringify(storyUrl)};
    }, 2000);
  </script>
</body>
</html>`;
}

/**
 * Generate a single share.html file that handles all stories via query params
 * Also generates individual folder structure for better bot compatibility
 */
async function generateSharePages() {
  try {
    console.log('🚀 Starting share page generation...');
    console.log(`📂 APP_ID: ${APP_ID}`);
    console.log(`🌐 Base URL: ${BASE_URL}`);

    // Fetch all published opinions
    const opinionsRef = db.collection('artifacts').doc(APP_ID).collection('public').doc('data').collection('opinions');
    const snapshot = await opinionsRef.where('status', '==', 'published').get();

    if (snapshot.empty) {
      console.log('⚠️  No published opinions found');
      // Still create share.html with empty data
      await createSingleShareHTML({});
      return;
    }

    console.log(`📰 Found ${snapshot.size} published opinions`);

    // Ensure dist directory exists
    const distPath = path.join(__dirname, '..', 'dist');
    if (!fs.existsSync(distPath)) {
      fs.mkdirSync(distPath, { recursive: true });
      console.log('📁 Created dist directory');
    }

    // Create .nojekyll file to ensure GitHub Pages serves all files
    const nojekyllPath = path.join(distPath, '.nojekyll');
    fs.writeFileSync(nojekyllPath, '', 'utf8');
    console.log('✅ Created .nojekyll file');

    // Prepare stories data for share.html
    const storiesData = {};
    let generated = 0;
    let errors = 0;

    // Also keep folder structure for better bot compatibility
    const sharesPath = path.join(distPath, 'shares');
    if (!fs.existsSync(sharesPath)) {
      fs.mkdirSync(sharesPath, { recursive: true });
      console.log('📁 Created shares directory');
    }

    // Process each opinion
    for (const docSnap of snapshot.docs) {
      try {
        const data = docSnap.data();
        const slug = data.slug || generateSlug(data.headline || docSnap.id);

        // Store story data for share.html
        storiesData[slug] = {
          id: docSnap.id,
          headline: data.headline || '',
          subHeadline: data.subHeadline || '',
          body: data.body || '',
          authorName: data.authorName || 'Morning Pulse',
          category: data.category || 'general',
          finalImageUrl: data.finalImageUrl || null,
          suggestedImageUrl: data.suggestedImageUrl || null,
          imageUrl: data.imageUrl || null,
          publishedAt: data.publishedAt ? formatDateForJSONLD(data.publishedAt) : null,
          submittedAt: data.submittedAt ? formatDateForJSONLD(data.submittedAt) : null
        };

        // Also generate individual folder structure (for better bot compatibility)
        const storyDir = path.join(sharesPath, slug);
        if (!fs.existsSync(storyDir)) {
          fs.mkdirSync(storyDir, { recursive: true });
        }

        const html = generateShareHTML({
          ...data,
          slug,
          id: docSnap.id
        });

        const indexPath = path.join(storyDir, 'index.html');
        fs.writeFileSync(indexPath, html, 'utf8');

        generated++;
        if (generated % 10 === 0) {
          console.log(`  ✅ Generated ${generated} share pages...`);
        }
      } catch (error) {
        console.error(`❌ Error generating share page for ${docSnap.id}:`, error.message);
        errors++;
      }
    }

    // Generate single share.html file
    await createSingleShareHTML(storiesData);

    console.log('');
    console.log('✅ Share page generation complete!');
    console.log(`   Generated: ${generated} individual pages`);
    console.log(`   Generated: 1 universal share.html`);
    if (errors > 0) {
      console.log(`   Errors: ${errors}`);
    }
    console.log(`   Output: ${distPath}/share.html`);
    console.log(`   Output: ${sharesPath}/[slug]/index.html`);

  } catch (error) {
    console.error('❌ Fatal error generating share pages:', error);
    process.exit(1);
  }
}

/**
 * Create a single share.html file that handles all stories via query params
 */
async function createSingleShareHTML(storiesData) {
  const distPath = path.join(__dirname, '..', 'dist');
  const shareHtmlPath = path.join(distPath, 'share.html');
  
  // Default brand image (1200x630)
  const defaultBrandImage = `${BASE_URL}/og-default.jpg`;
  
  // Create JavaScript object with all stories
  const storiesJson = JSON.stringify(storiesData, null, 2);
  
  const shareHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  
  <!-- Default meta tags (will be updated by JavaScript) -->
  <title>Morning Pulse | Share Article</title>
  <meta name="description" content="Read this article on Morning Pulse">
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="article">
  <meta property="og:title" content="Morning Pulse">
  <meta property="og:description" content="Read this article on Morning Pulse">
  <meta property="og:image" content="${defaultBrandImage}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="Morning Pulse">
  <meta property="og:site_name" content="Morning Pulse">
  <meta property="og:locale" content="en_US">
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Morning Pulse">
  <meta name="twitter:description" content="Read this article on Morning Pulse">
  <meta name="twitter:image" content="${defaultBrandImage}">
  
  <!-- Canonical URL -->
  <link rel="canonical" href="${BASE_URL}/share.html">
  
  <!-- Stories data (embedded for client-side access) -->
  <script type="application/json" id="stories-data">${storiesJson}</script>
  
  <script>
    (function() {
      // Get slug from query parameter
      const urlParams = new URLSearchParams(window.location.search);
      const slug = urlParams.get('id') || urlParams.get('slug');
      
      if (!slug) {
        // No slug provided, redirect to main site
        window.location.href = '${BASE_URL}/';
        return;
      }
      
      // Get stories data
      const storiesDataEl = document.getElementById('stories-data');
      if (!storiesDataEl) {
        window.location.href = '${BASE_URL}/#opinion/' + slug;
        return;
      }
      
      const storiesData = JSON.parse(storiesDataEl.textContent);
      const story = storiesData[slug];
      
      if (!story) {
        // Story not found, redirect to main site
        window.location.href = '${BASE_URL}/#opinion/' + slug;
        return;
      }
      
      // Update meta tags with story data
      const title = story.headline || 'Morning Pulse Opinion';
      const description = story.subHeadline || story.body || 'Read this article on Morning Pulse';
      const author = story.authorName || 'Morning Pulse';
      const category = story.category || 'general';
      
      // Get image URL (ensure absolute)
      let imageUrl = story.finalImageUrl || story.suggestedImageUrl || story.imageUrl || '${defaultBrandImage}';
      if (imageUrl && !imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
        if (imageUrl.startsWith('/')) {
          imageUrl = '${GITHUB_PAGES_URL}' + imageUrl;
        } else {
          imageUrl = '${BASE_URL}/' + imageUrl;
        }
      }
      
      const sharePageUrl = '${BASE_URL}/share.html?id=' + slug;
      const storyUrl = '${BASE_URL}/#opinion/' + slug;
      const publishedDate = story.publishedAt || story.submittedAt || new Date().toISOString();
      
      // Update all meta tags
      document.title = title + ' | Morning Pulse';
      document.querySelector('meta[name="description"]').setAttribute('content', description);
      document.querySelector('meta[property="og:url"]').setAttribute('content', sharePageUrl);
      document.querySelector('meta[property="og:title"]').setAttribute('content', title);
      document.querySelector('meta[property="og:description"]').setAttribute('content', description);
      document.querySelector('meta[property="og:image"]').setAttribute('content', imageUrl);
      document.querySelector('meta[property="og:image:alt"]').setAttribute('content', title);
      document.querySelector('meta[property="article:author"]').setAttribute('content', author);
      document.querySelector('meta[property="article:section"]').setAttribute('content', category);
      document.querySelector('meta[property="article:published_time"]').setAttribute('content', publishedDate);
      
      document.querySelector('meta[name="twitter:url"]').setAttribute('content', sharePageUrl);
      document.querySelector('meta[name="twitter:title"]').setAttribute('content', title);
      document.querySelector('meta[name="twitter:description"]').setAttribute('content', description);
      document.querySelector('meta[name="twitter:image"]').setAttribute('content', imageUrl);
      
      document.querySelector('link[rel="canonical"]').setAttribute('href', sharePageUrl);
      
      // Update structured data
      const structuredData = {
        "@context": "https://schema.org",
        "@type": "NewsArticle",
        "headline": title,
        "description": description,
        "image": imageUrl,
        "author": {
          "@type": "Person",
          "name": author
        },
        "publisher": {
          "@type": "Organization",
          "name": "Morning Pulse",
          "logo": {
            "@type": "ImageObject",
            "url": "${BASE_URL}/logo.png"
          }
        },
        "datePublished": publishedDate,
        "dateModified": publishedDate,
        "mainEntityOfPage": {
          "@type": "WebPage",
          "@id": sharePageUrl
        },
        "articleSection": category
      };
      
      // Remove old structured data if exists
      const oldScript = document.querySelector('script[type="application/ld+json"]');
      if (oldScript) oldScript.remove();
      
      // Add new structured data
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(structuredData);
      document.head.appendChild(script);
      
      // Redirect after a delay (give bots time to scrape)
      setTimeout(function() {
        window.location.href = storyUrl;
      }, 2000);
    })();
  </script>
</head>
<body>
  <div style="font-family: system-ui, -apple-system, sans-serif; text-align: center; padding: 60px 20px;">
    <h1 style="font-size: 24px; margin-bottom: 16px;">Loading article...</h1>
    <p style="color: #666; margin-bottom: 24px;">Redirecting to article...</p>
    <p style="font-size: 14px; color: #999;">
      <a href="${BASE_URL}/" style="color: #007bff; text-decoration: none;">Click here if you are not redirected</a>
    </p>
  </div>
</body>
</html>`;

  fs.writeFileSync(shareHtmlPath, shareHtml, 'utf8');
  console.log('✅ Created universal share.html file');
}

// Run the generator
generateSharePages()
  .then(() => {
    console.log('🎉 Share page generation completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Share page generation failed:', error);
    process.exit(1);
  });
