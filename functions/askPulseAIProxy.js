/**
 * Ask Pulse AI Proxy
 * Securely proxies Gemini API calls from frontend to avoid exposing API key
 * 
 * Entry point: askPulseAIProxy
 * 
 * POST /askPulseAIProxy
 * Body: {
 *   question: string,
 *   newsData: { [category: string]: NewsStory[] },
 *   conversationHistory?: Array<{ role: 'user' | 'model', parts: Array<{ text: string }> }>,
 *   stream?: boolean
 * }
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const APP_ID = process.env.APP_ID || 'morning-pulse-app';

/**
 * Retrieve relevant articles from newsData based on user query
 */
function retrieveRelevantArticles(query, newsData, topK = 5) {
  const queryLower = query.toLowerCase();
  const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2);
  
  const allArticles = [];
  
  Object.entries(newsData || {}).forEach(([category, articles]) => {
    articles.forEach(article => {
      let score = 0;
      
      const headlineLower = (article.headline || '').toLowerCase();
      const detailLower = (article.detail || '').toLowerCase();
      const categoryLower = category.toLowerCase();
      
      // Exact phrase match in headline (very strong signal)
      if (headlineLower.includes(queryLower)) {
        score += 10;
      }
      
      // Word matches
      queryWords.forEach(word => {
        if (headlineLower.includes(word)) score += 3;
        if (detailLower.includes(word)) score += 1;
        if (categoryLower.includes(word)) score += 2;
      });
      
      // Recency boost
      if (article.timestamp) {
        const hoursSincePublished = (Date.now() - article.timestamp) / (1000 * 60 * 60);
        if (hoursSincePublished < 24) score += 2;
        else if (hoursSincePublished < 168) score += 1; // 1 week
      }
      
      if (score > 0) {
        allArticles.push({ ...article, score });
      }
    });
  });
  
  // Sort by score and return top K
  return allArticles
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map(({ score, ...article }) => article);
}

/**
 * Construct grounded prompt with retrieved articles
 */
function constructPrompt(userQuestion, articles) {
  const systemPrompt = `You are Ask The Pulse AI, an editorial assistant for Morning Pulse news.

CRITICAL RULES:
1. Answer ONLY using the provided articles below
2. If the articles don't contain relevant information, say: "I don't have information about that in Morning Pulse's recent reporting."
3. Be concise and factual - cite the article source for each claim using [1], [2], etc.
4. Format responses in clean paragraphs (no markdown unless asked)
5. If asked for sources, list the article headlines
6. Do not speculate or add external information

AVAILABLE ARTICLES:
${articles.length > 0
  ? articles.map((article, idx) => {
      const title = article.headline || 'Untitled';
      const detail = article.detail || '';
      const category = article.category || '';
      const source = article.source || '';
      const date = article.date || (article.timestamp 
        ? new Date(article.timestamp).toLocaleDateString()
        : 'Recent');
      
      return `[${idx + 1}] ${title}
   Category: ${category}
   Details: ${detail}
   Source: ${source}
   Date: ${date}
   ---`;
    }).join('\n')
  : 'No relevant Morning Pulse articles found for this query.'}

USER QUESTION: ${userQuestion}

Provide a helpful answer based solely on the articles above. If relevant, mention which article(s) you're citing using [1], [2], etc.`;

  return systemPrompt;
}

/**
 * HTTP Cloud Function: Ask Pulse AI Proxy
 * Handles streaming and non-streaming requests
 */
exports.askPulseAIProxy = async (req, res) => {
  // Enable CORS for all origins
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.set('Access-Control-Max-Age', '3600');

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed. Use POST.' });
    return;
  }

  try {
    // Validate API key
    if (!GEMINI_API_KEY) {
      console.error('❌ GEMINI_API_KEY not configured');
      res.status(500).json({ 
        error: 'Server configuration error',
        message: 'AI service is not properly configured'
      });
      return;
    }

    // Parse request body
    const { question, newsData, conversationHistory, stream = false } = req.body;

    if (!question || typeof question !== 'string') {
      res.status(400).json({ error: 'Missing or invalid "question" parameter' });
      return;
    }

    console.log(`🤖 Ask Pulse AI request: "${question.substring(0, 50)}..."`);

    // Retrieve relevant articles
    const relevantArticles = retrieveRelevantArticles(question, newsData || {}, 5);
    console.log(`📰 Found ${relevantArticles.length} relevant articles`);

    // Construct prompt
    const constructedPrompt = constructPrompt(question, relevantArticles);

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      }
    });

    // Handle streaming vs non-streaming
    if (stream) {
      // Streaming response
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      let fullText = '';

      try {
        let result;
        if (conversationHistory && conversationHistory.length > 0) {
          const chat = model.startChat({
            history: conversationHistory,
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 1024,
            }
          });
          result = await chat.sendMessageStream(constructedPrompt);
        } else {
          result = await model.generateContentStream(constructedPrompt);
        }

        for await (const chunk of result.stream) {
          const chunkText = chunk.text();
          fullText += chunkText;
          res.write(`data: ${JSON.stringify({ text: chunkText, done: false })}\n\n`);
        }

        // Send final response with sources
        const sources = relevantArticles
          .filter(article => article.headline && article.url)
          .map((article, idx) => ({
            title: article.headline,
            url: article.url,
            index: idx + 1
          }));

        res.write(`data: ${JSON.stringify({ text: '', done: true, fullText, sources })}\n\n`);
        res.end();
      } catch (streamError) {
        console.error('❌ Streaming error:', streamError);
        res.write(`data: ${JSON.stringify({ error: 'Streaming failed', done: true })}\n\n`);
        res.end();
      }
    } else {
      // Non-streaming response
      let result;
      let response;
      let text;

      if (conversationHistory && conversationHistory.length > 0) {
        const chat = model.startChat({
          history: conversationHistory,
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          }
        });
        result = await chat.sendMessage(constructedPrompt);
        response = await result.response;
        text = response.text();
      } else {
        result = await model.generateContent(constructedPrompt);
        response = await result.response;
        text = response.text();
      }

      // Extract sources
      const sources = relevantArticles
        .filter(article => article.headline && article.url)
        .map((article, idx) => ({
          title: article.headline,
          url: article.url,
          index: idx + 1
        }));

      res.status(200).json({
        text,
        sources
      });
    }
  } catch (error) {
    console.error('❌ Ask Pulse AI Proxy error:', error);
    
    res.status(500).json({
      error: 'AI service error',
      message: error.message || 'Failed to generate response'
    });
  }
};
