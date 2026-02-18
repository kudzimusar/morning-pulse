/**
 * AI Newsletter Enhancements
 * Uses Google Gemini 1.5 Pro to generate content for newsletters
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const cors = require('cors')({ origin: true });

// Configuration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MODEL_NAME = 'gemini-1.5-pro'; // Upgrade to Pro model

// Initialize Gemini
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

/**
 * Cloud Function: Generate Newsletter Intro
 * Input: List of articles (headlines + summaries)
 * Output: Engaging introduction paragraph
 */
exports.generateNewsletterIntro = async (req, res) => {
    return cors(req, res, async () => {
        // Only allow POST
        if (req.method !== 'POST') {
            return res.status(405).json({ error: 'Method not allowed. Use POST.' });
        }

        try {
            const { articles, tone = 'professional' } = req.body;

            if (!articles || !Array.isArray(articles) || articles.length === 0) {
                return res.status(400).json({ error: 'Missing or invalid articles list' });
            }

            console.log(`✨ Generating AI intro for ${articles.length} articles using ${MODEL_NAME}...`);

            const model = genAI.getGenerativeModel({ model: MODEL_NAME });

            // Prepare context from articles
            const articlesContext = articles.map((a, i) =>
                `${i + 1}. ${a.headline}: ${a.subHeadline || a.summary || ''}`
            ).join('\n');

            const prompt = `
        You are the Editor-in-Chief of "Morning Pulse", a premium news briefing.
        
        Task: Write a short, engaging introduction (2-3 sentences max) for today's newsletter.
        
        The newsletter contains the following top stories:
        ${articlesContext}
        
        Guidelines:
        - Tone: ${tone} (Insightful, connecting the dots, premium).
        - Connect the themes if possible, or highlight the most significant story.
        - Encourage reading.
        - Do NOT list the stories again, just synthesize the mood/theme.
        - Do NOT add "Subject:" or any other headers. Just the paragraph.
      `;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const introText = response.text();

            console.log('✅ AI Intro generated successfully');

            return res.status(200).json({
                success: true,
                intro: introText.trim()
            });

        } catch (error) {
            console.error('❌ Error generating AI intro:', error);
            return res.status(500).json({
                success: false,
                error: error.message,
                details: 'Failed to access Google AI Pro features.'
            });
        }
    });
};
