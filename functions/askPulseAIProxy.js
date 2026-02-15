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
 * Set CORS headers for the response
 * Allows requests from your GitHub Pages domain
 */
const setCorsHeaders = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*'); // Allow all origins (can restrict to specific domain in production)
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '3600');
};

/**
 * Retrieve relevant articles from newsData based on user query
 * Enhanced with category variety (2 per category) and question-based retrieval
 */
function retrieveRelevantArticles(query, newsData, topK = 10) {
  const queryLower = query.toLowerCase();
  const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2);

  // Step 1: Score all articles based on question relevance
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

      // Word matches (prioritize question intent over category)
      queryWords.forEach(word => {
        if (headlineLower.includes(word)) score += 3;
        if (detailLower.includes(word)) score += 1;
        // Category match is less important than content match
        if (categoryLower.includes(word)) score += 1;
      });

      // Recency boost
      if (article.timestamp) {
        const hoursSincePublished = (Date.now() - article.timestamp) / (1000 * 60 * 60);
        if (hoursSincePublished < 24) score += 2;
        else if (hoursSincePublished < 168) score += 1; // 1 week
      }

      if (score > 0) {
        allArticles.push({ ...article, score, category });
      }
    });
  });

  // Step 2: Group by category
  const articlesByCategory = {};
  allArticles.forEach(article => {
    const cat = article.category || 'Other';
    if (!articlesByCategory[cat]) {
      articlesByCategory[cat] = [];
    }
    articlesByCategory[cat].push(article);
  });

  // Step 3: Take top 2 from each category (ensuring variety)
  const diverseArticles = [];
  Object.keys(articlesByCategory).forEach(category => {
    // Sort by score within category
    const sorted = articlesByCategory[category].sort((a, b) => b.score - a.score);
    // Take top 2 from each category
    const topFromCategory = sorted.slice(0, 2);
    diverseArticles.push(...topFromCategory);
  });

  // Step 4: Sort by score and return top K
  return diverseArticles
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map(({ score, category, ...article }) => article);
}

/**
 * Comprehensive AI System Prompt (from aiPromptRules.ts)
 */
const AI_SYSTEM_PROMPT = `You are "Pulse AI", an intelligent news assistant for Morning Pulse. Your role is to help users understand news stories by answering questions about specific articles, people, events, and topics.

CRITICAL RULES:

1. ANSWER BASED ON USER INTENT, NOT JUST CATEGORIES
   - If user asks "Who is mentioned in the climate article?", identify people in that specific article
   - If user asks "What did the president say?", find quotes and statements from the president across all articles
   - If user asks about a specific event, focus on that event even if it spans multiple categories
   - If user asks "What happened in Nigeria?", focus on Nigeria-related news regardless of category
   - Understand context: "What else did he do?" requires you to track who "he" refers to from previous conversation

2. ANSWER SPECIFIC QUESTIONS ABOUT ARTICLES
   - WHO questions: Identify all people mentioned, their roles, and what they did
   - WHAT questions: Explain events, actions, decisions, and outcomes
   - WHERE questions: Identify locations, regions, and geographic context
   - WHEN questions: Provide timeline, dates, and temporal context
   - WHY questions: Explain causes, motivations, and reasons
   - HOW questions: Describe methods, processes, and mechanisms

3. HANDLE FOLLOW-UP QUESTIONS INTELLIGENTLY
   - Track conversation context
   - Understand pronouns (he, she, they, it) from previous messages
   - Connect related questions

4. CITE SOURCES PROPERLY
   - Use [1], [2], [3] notation for each claim
   - Reference the specific article where information came from
   - When combining information from multiple sources, cite each
   - For opinions, use [OPINION 1], [OPINION 2], etc.

5. EXTRACT SPECIFIC DETAILS FROM ARTICLES
   - Names of people and their titles/roles
   - Exact quotes (use quotation marks)
   - Numbers, statistics, percentages
   - Dates and times
   - Locations and places
   - Organizations and institutions

6. PROVIDE COMPREHENSIVE ANSWERS
   - For broad questions, summarize across multiple relevant articles
   - For specific questions, dive deep into the relevant article
   - Balance breadth and depth based on question type
   - Include context when helpful

7. LIMITATIONS AND BOUNDARIES
   - ONLY use information from the provided articles and opinions
   - DO NOT speculate or add external information
   - DO NOT make predictions beyond what articles state
   - DO NOT provide opinions - only report what sources say
   - If articles don't have the information: "I don't have information about that in Morning Pulse's recent reporting."

8. OPINION pieces:
   - Clearly identify as opinion
   - Attribute views to the author
   - Example: "In an opinion piece, columnist Sarah Jones argues that... [OPINION 1]"

Remember: Your goal is to help users deeply understand the news by providing accurate, detailed, contextual information from Morning Pulse articles. Be intelligent, helpful, and precise.`;

const AI_ARTICLE_ANALYSIS_PROMPT = `
ARTICLE ANALYSIS INSTRUCTIONS:

Before answering, analyze each article for:

1. PEOPLE mentioned: Extract all names, titles/roles, actions/statements, affiliations
2. ORGANIZATIONS mentioned: Extract names, role in story, statements/actions
3. LOCATIONS mentioned: Extract place names, geographic context, relevance
4. KEY FACTS: Numbers, statistics, dates, quotes, policy details, financial information
5. MAIN EVENTS: What, when, where, who, why, how
6. THEMES/TOPICS: Primary topic, secondary topics, related issues

Use this analysis to answer user questions accurately and comprehensively.
`;

/**
 * Build system instruction with comprehensive AI rules
 */
function buildSystemInstruction(articles, opinions, conversationHistory, previousEntities) {
  let systemInstruction = AI_SYSTEM_PROMPT;

  // Add article analysis prompt
  systemInstruction += `\n\n${AI_ARTICLE_ANALYSIS_PROMPT}`;

  // Add entity tracking if available
  if (previousEntities && previousEntities.length > 0) {
    systemInstruction += `\n\nENTITIES MENTIONED IN CONVERSATION: ${previousEntities.join(', ')}`;
    systemInstruction += `\nWhen user uses pronouns, these may refer to the above entities.`;
  }

  return systemInstruction;
}

/**
 * Build context with articles and opinions for the user message
 */
function buildContext(articles, opinions) {
  let context = `AVAILABLE ARTICLES (Use ONLY these for your answer):\n\n`;

  articles.forEach((article, index) => {
    const title = article.headline || 'Untitled';
    const detail = article.detail || '';
    const category = article.category || '';
    const source = article.source || '';
    const date = article.date || (article.timestamp
      ? new Date(article.timestamp).toLocaleDateString()
      : 'Recent');

    context += `[${index + 1}] ${title}\n`;
    context += `Category: ${category}\n`;
    if (source) context += `Source: ${source}\n`;
    context += `Content: ${detail}\n`;
    context += `Date: ${date}\n\n`;
  });

  // Add opinions section (top 3 most recent)
  if (opinions && opinions.length > 0) {
    const publishedOpinions = opinions
      .filter(op => op.isPublished && op.publishedAt)
      .sort((a, b) => {
        const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
        const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
        return dateB - dateA; // Newest first
      })
      .slice(0, 3); // Top 3 most recent

    if (publishedOpinions.length > 0) {
      context += `\n\nPUBLISHED OPINIONS & EDITORIALS:\n\n`;
      publishedOpinions.forEach((opinion, idx) => {
        context += `[OPINION ${idx + 1}] ${opinion.headline}\n`;
        context += `Category: ${opinion.category || 'Opinion'}\n`;
        context += `Summary: ${opinion.subHeadline || ''}\n`;
        context += `Author: ${opinion.authorName || 'Editorial Team'}\n`;
        if (opinion.authorTitle) context += `Author Title: ${opinion.authorTitle}\n`;
        const pubDate = opinion.publishedAt ? new Date(opinion.publishedAt).toLocaleDateString() : 'Recent';
        context += `Published: ${pubDate}\n`;
        const bodyPreview = opinion.body ? opinion.body.substring(0, 500) : '';
        context += `Content: ${bodyPreview}${opinion.body && opinion.body.length > 500 ? '...' : ''}\n\n`;
      });
      context += `\nNote: When citing opinions, use [OPINION 1], [OPINION 2], etc. to distinguish from news articles.\n`;
    }
  }

  return context;
}

/**
 * Build user message with question and context
 */
function buildUserMessage(userQuestion, articles, opinions, conversationHistory) {
  let userMessage = '';

  // Add conversation context if available
  if (conversationHistory && conversationHistory.length > 0) {
    const recentContext = conversationHistory.slice(-3);
    const contextText = recentContext.map(msg => {
      const role = msg.role === 'user' ? 'user' : 'assistant';
      const text = msg.parts && msg.parts[0] ? msg.parts[0].text : '';
      return `${role}: ${text}`;
    }).join('\n');
    userMessage += `RECENT CONVERSATION:\n${contextText}\n\n`;
  }

  // Add articles and opinions context
  userMessage += buildContext(articles, opinions);

  // Add the user's question
  userMessage += `\n\nUSER QUESTION: ${userQuestion}\n\n`;

  // Add response instructions
  userMessage += `INSTRUCTIONS FOR YOUR RESPONSE:
1. Analyze the question to understand what type of information is needed (who, what, where, when, why, how)
2. Search through ALL articles and opinions for relevant information
3. Extract specific details that answer the question
4. Cite sources using [1], [2], etc. for articles and [OPINION 1], [OPINION 2], etc. for opinions
5. If the question references previous conversation, use that context
6. If pronouns are used (he, she, they), determine who they refer to from context
7. Provide a comprehensive, accurate answer based on user intent, not just categories
8. If information is not available, say so clearly
9. When multiple categories are available, provide a balanced summary across categories

YOUR ANSWER:`;

  return userMessage;
}

/**
 * HTTP Cloud Function: Ask Pulse AI Proxy
 * Handles streaming and non-streaming requests
 */
exports.askPulseAIProxy = async (req, res) => {
  // Set CORS headers FIRST - before any other logic
  setCorsHeaders(res);

  // Handle CORS preflight - return immediately with 204
  if (req.method === 'OPTIONS') {
    res.status(204).end();
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
    const { question, newsData, conversationHistory, stream = false, opinions = [], previousEntities = [] } = req.body;

    if (!question || typeof question !== 'string') {
      res.status(400).json({ error: 'Missing or invalid "question" parameter' });
      return;
    }

    console.log(`🤖 Ask Pulse AI request: "${question.substring(0, 50)}..."`);
    console.log(`📰 Opinions available: ${opinions.length || 0}`);
    console.log(`💬 Conversation history: ${conversationHistory?.length || 0} messages`);

    // Retrieve relevant articles with category variety (2 per category)
    const relevantArticles = retrieveRelevantArticles(question, newsData || {}, 10);
    console.log(`📰 Found ${relevantArticles.length} relevant articles`);

    // Build system instruction and user message separately
    const systemInstruction = buildSystemInstruction(relevantArticles, opinions, conversationHistory, previousEntities);
    const userMessage = buildUserMessage(question, relevantArticles, opinions, conversationHistory);

    console.log(`📝 System instruction length: ${systemInstruction.length}`);
    console.log(`📝 User message length: ${userMessage.length}`);
    console.log(`📝 User question: "${question.substring(0, 100)}..."`);

    // Initialize Gemini with system instruction
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash-001',
      systemInstruction: systemInstruction,
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048, // Increased for more comprehensive responses
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
              maxOutputTokens: 2048,
            }
          });
          result = await chat.sendMessageStream(userMessage);
        } else {
          result = await model.generateContentStream(userMessage);
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
            maxOutputTokens: 2048,
          }
        });
        result = await chat.sendMessage(userMessage);
        response = await result.response;
        text = response.text();
      } else {
        result = await model.generateContent(userMessage);
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
