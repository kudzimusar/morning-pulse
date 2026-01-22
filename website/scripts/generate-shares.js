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
 * Truncate text to a maximum length
 */
function truncate(text, maxLength = 200) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
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
 * Generate HTML redirect shell for a story
 */
function generateShareHTML(story) {
  const slug = story.slug || generateSlug(story.headline);
  const title = escapeHtml(story.headline || 'Morning Pulse Opinion');
  const description = escapeHtml(truncate(story.subHeadline || story.body || 'Read this opinion piece on Morning Pulse', 200));
  const category = getCategoryDisplayName(story.category);
  const author = escapeHtml(story.authorName || 'Morning Pulse');
  const imageUrl = story.finalImageUrl || story.suggestedImageUrl || story.imageUrl || `${BASE_URL}/og-default.jpg`;
  const storyUrl = `${BASE_URL}/#opinion/${slug}`;
  const siteUrl = BASE_URL;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  
  <!-- Primary Meta Tags -->
  <title>${title} | Morning Pulse</title>
  <meta name="title" content="${title} | Morning Pulse">
  <meta name="description" content="${description}">
  <meta name="author" content="${author}">
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="article">
  <meta property="og:url" content="${storyUrl}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${imageUrl}">
  <meta property="og:site_name" content="Morning Pulse">
  <meta property="article:author" content="${author}">
  <meta property="article:section" content="${category}">
  
  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${storyUrl}">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${imageUrl}">
  
  <!-- Redirect -->
  <meta http-equiv="refresh" content="0; url=${storyUrl}">
  
  <!-- Fallback JavaScript redirect -->
  <script>
    window.location.href = "${storyUrl}";
  </script>
  
  <!-- Fallback link for non-JS browsers -->
  <noscript>
    <meta http-equiv="refresh" content="0; url=${storyUrl}">
    <p>If you are not redirected automatically, <a href="${storyUrl}">click here</a>.</p>
  </noscript>
</head>
<body>
  <p>Redirecting to <a href="${storyUrl}">${title}</a>...</p>
</body>
</html>`;
}

/**
 * Main function to generate all share pages
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
      return;
    }

    console.log(`📰 Found ${snapshot.size} published opinions`);

    // Ensure dist/shares directory exists
    const distPath = path.join(__dirname, '..', 'dist');
    const sharesPath = path.join(distPath, 'shares');

    if (!fs.existsSync(distPath)) {
      fs.mkdirSync(distPath, { recursive: true });
      console.log('📁 Created dist directory');
    }

    if (!fs.existsSync(sharesPath)) {
      fs.mkdirSync(sharesPath, { recursive: true });
      console.log('📁 Created shares directory');
    }

    let generated = 0;
    let errors = 0;

    // Generate share page for each opinion
    for (const docSnap of snapshot.docs) {
      try {
        const data = docSnap.data();
        const slug = data.slug || generateSlug(data.headline || docSnap.id);

        // Create directory for this story
        const storyDir = path.join(sharesPath, slug);
        if (!fs.existsSync(storyDir)) {
          fs.mkdirSync(storyDir, { recursive: true });
        }

        // Generate HTML
        const html = generateShareHTML({
          ...data,
          slug,
          id: docSnap.id
        });

        // Write index.html
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

    console.log('');
    console.log('✅ Share page generation complete!');
    console.log(`   Generated: ${generated} pages`);
    if (errors > 0) {
      console.log(`   Errors: ${errors}`);
    }
    console.log(`   Output directory: ${sharesPath}`);

    // List a few examples
    if (generated > 0) {
      console.log('');
      console.log('📋 Sample generated pages:');
      const sampleDirs = fs.readdirSync(sharesPath).slice(0, 5);
      sampleDirs.forEach(dir => {
        const indexPath = path.join(sharesPath, dir, 'index.html');
        if (fs.existsSync(indexPath)) {
          console.log(`   - shares/${dir}/index.html`);
        }
      });
    }

  } catch (error) {
    console.error('❌ Fatal error generating share pages:', error);
    process.exit(1);
  }
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
