/**
 * Ask The Pulse AI Service
 * RAG-based chatbot using backend proxy for secure Gemini API access
 * 
 * CRITICAL: All API calls go through askPulseAIProxy Cloud Function
 * API key is never exposed in frontend code
 */

import { NewsStory } from '../../types';

// Editorial System Prompt (Non-negotiable)
const EDITORIAL_SYSTEM_PROMPT = `You are "Ask The Pulse AI," an editorial assistant for Morning Pulse.

Rules:
- You ONLY answer using Morning Pulse reporting provided below.
- If reporting does not exist, say: "Morning Pulse has not yet published reporting on this topic."
- Maintain a newsroom editorial tone: factual, concise, contextual.
- Do NOT speculate.
- Do NOT invent sources.
- Do NOT speak like a generic AI assistant.
- Refer to Morning Pulse as "we" or "our newsroom" when appropriate.
- Keep responses concise and focused on the user's question.
- If the user asks about topics not covered in the provided articles, clearly state that Morning Pulse has not yet published on that topic.`;

interface AskPulseAIResponse {
  text: string;
  sources?: Array<{ title: string; url?: string; index?: number }>;
}

interface ChatMessage {
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
}

interface StreamChunk {
  text: string;
  done: boolean;
}

/**
 * Retrieve relevant articles from newsData based on user query
 * Improved keyword-based retrieval with better scoring
 */
const retrieveRelevantArticles = (
  query: string,
  newsData: { [category: string]: NewsStory[] },
  topK: number = 5
): NewsStory[] => {
  const queryLower = query.toLowerCase();
  const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2);
  
  const allArticles: (NewsStory & { score: number })[] = [];
  
  Object.entries(newsData).forEach(([category, articles]) => {
    articles.forEach(article => {
      let score = 0;
      
      const headlineLower = (article.headline || '').toLowerCase();
      const detailLower = (article.detail || '').toLowerCase();
      const categoryLower = category.toLowerCase();
      
      // Exact phrase match in headline (very strong signal)
      if (headlineLower.includes(queryLower)) {
        score += 10;
      }
      
      // Word matches in headline
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
};

/**
 * Construct grounded prompt with retrieved articles
 */
const constructPrompt = (
  userQuestion: string,
  articles: NewsStory[]
): string => {
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
};

/**
 * Get the proxy URL from environment or use default
 */
const getProxyUrl = (): string => {
  return (
    import.meta.env.VITE_ASK_PULSE_AI_PROXY_URL ||
    'https://us-central1-gen-lang-client-0999441419.cloudfunctions.net/askPulseAIProxy'
  );
};

/**
 * Generate AI response using backend proxy (secure - no API key in frontend)
 * Streaming support via Server-Sent Events
 */
export const generateAskPulseAIResponseStream = async function* (
  userQuestion: string,
  newsData: { [category: string]: NewsStory[] },
  conversationHistory?: ChatMessage[]
): AsyncGenerator<StreamChunk, AskPulseAIResponse, unknown> {
  try {
    const proxyUrl = getProxyUrl();

    // Retrieve relevant articles (for sources)
    const relevantArticles = retrieveRelevantArticles(userQuestion, newsData, 5);

    // Call backend proxy
    const response = await fetch(proxyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question: userQuestion,
        newsData,
        conversationHistory,
        stream: true
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Proxy error: ${response.status} ${response.statusText}`);
    }

    // Handle streaming response (Server-Sent Events)
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let fullText = '';
    let finalResponse: AskPulseAIResponse | null = null;

    if (!reader) {
      throw new Error('No response body');
    }

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.substring(6));
            
            if (data.done) {
              finalResponse = {
                text: data.fullText || fullText,
                sources: data.sources || []
              };
            } else if (data.text) {
              fullText += data.text;
              yield { text: data.text, done: false };
            } else if (data.error) {
              throw new Error(data.error);
            }
          } catch (e) {
            // Skip invalid JSON lines
            if (e instanceof Error && e.message !== 'Unexpected end of JSON input') {
              console.warn('Error parsing SSE data:', e);
            }
          }
        }
      }
    }

    // Return final response
    if (finalResponse) {
      return finalResponse;
    }

    // Extract sources if not provided
    const sources = relevantArticles
      .filter(article => article.headline && article.url)
      .map((article, idx) => ({
        title: article.headline!,
        url: article.url,
        index: idx + 1
      }));

    return {
      text: fullText,
      sources
    };
  } catch (error: any) {
    console.error('Streaming error:', error);
    
    yield { text: "I encountered an error while processing your question. Please try again.", done: true };
    return {
      text: "I encountered an error while processing your question. Please try again.",
      sources: []
    };
  }
};

/**
 * Generate AI response using backend proxy (non-streaming, for backward compatibility)
 * Secure - no API key in frontend
 */
export const generateAskPulseAIResponse = async (
  userQuestion: string,
  newsData: { [category: string]: NewsStory[] },
  conversationHistory?: ChatMessage[]
): Promise<AskPulseAIResponse> => {
  try {
    const proxyUrl = getProxyUrl();

    // Log request details
    console.log('🔍 Ask Pulse AI Request:', {
      question: userQuestion,
      articlesAvailable: Object.keys(newsData || {}).length
    });

    // Call backend proxy
    const response = await fetch(proxyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question: userQuestion,
        newsData,
        conversationHistory,
        stream: false
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Proxy error: ${response.status}`);
    }

    const data = await response.json();

    return {
      text: data.text || "I'm sorry, I couldn't generate a response.",
      sources: data.sources || []
    };
  } catch (error: any) {
    console.error('Ask Pulse AI Error:', error);
    
    // Provide helpful error messages
    if (error.message?.includes('quota') || error.message?.includes('rate limit')) {
      return {
        text: "I'm currently experiencing high demand. Please try again in a moment.",
        sources: []
      };
    }
    
    return {
      text: "I encountered an error while processing your question. Please try again.",
      sources: []
    };
  }
};

/**
 * Convert component messages to Gemini chat history format
 */
export function convertToChatHistory(
  messages: Array<{ role: 'user' | 'ai'; content: string }>
): ChatMessage[] {
  return messages
    .filter(msg => msg.role === 'user' || msg.role === 'ai')
    .map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));
}

/**
 * Parse source citations from response text and return formatted text with clickable links
 */
export function formatResponseWithCitations(
  text: string,
  sources: Array<{ title: string; url?: string; index?: number }>
): { formattedText: string; citations: Map<number, { title: string; url?: string }> } {
  const citations = new Map<number, { title: string; url?: string }>();
  const citationPattern = /\[(\d+)\]/g;
  
  // Find all citations in text
  let match;
  while ((match = citationPattern.exec(text)) !== null) {
    const index = parseInt(match[1], 10);
    const source = sources.find(s => s.index === index);
    if (source && !citations.has(index)) {
      citations.set(index, { title: source.title, url: source.url });
    }
  }
  
  // Replace citations with formatted markers (will be handled in component)
  const formattedText = text.replace(citationPattern, (match, index) => {
    return `[CITATION:${index}]`;
  });
  
  return { formattedText, citations };
}

/**
 * Test Gemini API connection via proxy
 * Useful for debugging proxy and model access issues
 */
export async function testGeminiConnection(): Promise<boolean> {
  const proxyUrl = getProxyUrl();

  try {
    const response = await fetch(proxyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: 'Say "OK" if you can read this.',
        newsData: {},
        stream: false
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Gemini API test successful:', data.text);
      return true;
    }
    console.error('❌ Gemini API test failed:', response.status, response.statusText);
    return false;
  } catch (error) {
    console.error('❌ Gemini API test failed:', error);
    return false;
  }
}
