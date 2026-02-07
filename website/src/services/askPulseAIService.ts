/**
 * Ask The Pulse AI Service
 * RAG-based chatbot using backend proxy for secure Gemini API access
 * Enhanced with comprehensive AI rules and conversation tracking
 * 
 * CRITICAL: All API calls go through askPulseAIProxy Cloud Function
 * API key is never exposed in frontend code
 */

import { NewsStory, Opinion } from '../../../types';
import { AI_SYSTEM_PROMPT, AI_ARTICLE_ANALYSIS_PROMPT, updateConversationContext, ConversationContext } from './aiPromptRules';

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

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

// Conversation state manager
class ConversationManager {
  private context: ConversationContext = {
    entities: new Set(),
    topics: new Set(),
    articles: new Set(),
  };

  private history: ConversationMessage[] = [];

  updateContext(userMessage: string, aiResponse: string): void {
    this.context = updateConversationContext(this.context, userMessage, aiResponse);
  }

  addToHistory(role: 'user' | 'assistant', content: string): void {
    this.history.push({ role, content });
    
    // Keep only last 10 messages (5 exchanges)
    if (this.history.length > 10) {
      this.history = this.history.slice(-10);
    }
  }

  getContext(): ConversationContext {
    return this.context;
  }

  getHistory(): ConversationMessage[] {
    return this.history;
  }

  getPreviousEntities(): string[] {
    return Array.from(this.context.entities);
  }

  reset(): void {
    this.context = {
      entities: new Set(),
      topics: new Set(),
      articles: new Set(),
    };
    this.history = [];
  }
}

// Global conversation manager (one per session)
const conversationManager = new ConversationManager();

/**
 * Retrieve relevant articles from newsData based on user query
 * Enhanced with question-based retrieval and category variety (2 per category)
 */
const retrieveRelevantArticles = (
  query: string,
  newsData: { [category: string]: NewsStory[] },
  topK: number = 10
): NewsStory[] => {
  const queryLower = query.toLowerCase();
  const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2);
  
  // Step 1: Score all articles based on question relevance
  const allArticles: (NewsStory & { score: number; category: string })[] = [];
  
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
      
      // Word matches in headline (prioritize question intent)
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
  const articlesByCategory = new Map<string, (NewsStory & { score: number })[]>();
  allArticles.forEach(article => {
    const cat = article.category || 'Other';
    if (!articlesByCategory.has(cat)) {
      articlesByCategory.set(cat, []);
    }
    articlesByCategory.get(cat)!.push(article);
  });
  
  // Step 3: Take top 2 from each category (ensuring variety)
  const diverseArticles: (NewsStory & { score: number })[] = [];
  articlesByCategory.forEach((categoryArticles, category) => {
    // Sort by score within category
    const sorted = categoryArticles.sort((a, b) => b.score - a.score);
    // Take top 2 from each category
    const topFromCategory = sorted.slice(0, 2);
    diverseArticles.push(...topFromCategory);
  });
  
  // Step 4: Sort by score and return top K
  return diverseArticles
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map(({ score, ...article }) => article);
};

/**
 * Construct grounded prompt with retrieved articles and opinions
 * Uses comprehensive AI rules for intelligent, contextual responses
 */
const constructPrompt = (
  userQuestion: string,
  articles: NewsStory[],
  opinions?: Opinion[],
  conversationHistory?: ConversationMessage[],
  previousEntities?: string[]
): string => {
  let prompt = AI_SYSTEM_PROMPT;

  // Add conversation context if available
  if (conversationHistory && conversationHistory.length > 0) {
    const recentContext = conversationHistory.slice(-3); // Last 3 exchanges
    prompt += `\n\nRECENT CONVERSATION:\n${recentContext.map(msg => 
      `${msg.role}: ${msg.content}`
    ).join('\n')}`;
  }

  // Add entity tracking
  if (previousEntities && previousEntities.length > 0) {
    prompt += `\n\nENTITIES MENTIONED IN CONVERSATION: ${previousEntities.join(', ')}`;
    prompt += `\nWhen user uses pronouns, these may refer to the above entities.`;
  }

  // Add article analysis prompt
  prompt += `\n\n${AI_ARTICLE_ANALYSIS_PROMPT}`;

  // Add articles
  prompt += `\n\nAVAILABLE ARTICLES (Use ONLY these for your answer):\n\n`;
  
  articles.forEach((article, index) => {
    const title = article.headline || 'Untitled';
    const detail = article.detail || '';
    const category = article.category || '';
    const source = article.source || '';
    const date = article.date || (article.timestamp 
      ? new Date(article.timestamp).toLocaleDateString()
      : 'Recent');
    
    prompt += `[${index + 1}] ${title}\n`;
    prompt += `Category: ${category}\n`;
    if (source) prompt += `Source: ${source}\n`;
    prompt += `Content: ${detail}\n`;
    prompt += `Date: ${date}\n\n`;
  });

  // Add opinions section (top 3 most recent)
  if (opinions && opinions.length > 0) {
    const publishedOpinions = opinions
      .filter(op => op.isPublished && op.publishedAt)
      .sort((a, b) => {
        const dateA = a.publishedAt?.getTime() || 0;
        const dateB = b.publishedAt?.getTime() || 0;
        return dateB - dateA; // Newest first
      })
      .slice(0, 3); // Top 3 most recent

    if (publishedOpinions.length > 0) {
      prompt += `\n\nPUBLISHED OPINIONS & EDITORIALS:\n\n`;
      publishedOpinions.forEach((opinion, idx) => {
        const articleIndex = articles.length + idx + 1;
        prompt += `[OPINION ${idx + 1}] ${opinion.headline}\n`;
        prompt += `Category: ${opinion.category || 'Opinion'}\n`;
        prompt += `Summary: ${opinion.subHeadline || ''}\n`;
        prompt += `Author: ${opinion.authorName || 'Editorial Team'}\n`;
        if (opinion.authorTitle) prompt += `Author Title: ${opinion.authorTitle}\n`;
        prompt += `Published: ${opinion.publishedAt?.toLocaleDateString() || 'Recent'}\n`;
        prompt += `Content: ${opinion.body.substring(0, 500)}${opinion.body.length > 500 ? '...' : ''}\n\n`;
      });
      prompt += `\nNote: When citing opinions, use [OPINION 1], [OPINION 2], etc. to distinguish from news articles.\n`;
    }
  }

  // Add the user's question
  prompt += `\n\nUSER QUESTION: ${userQuestion}\n\n`;
  
  // Add response instructions
  prompt += `INSTRUCTIONS FOR YOUR RESPONSE:
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

  return prompt;
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
 * Enhanced with conversation tracking and opinions support
 */
export const generateAskPulseAIResponseStream = async function* (
  userQuestion: string,
  newsData: { [category: string]: NewsStory[] },
  conversationHistory?: ChatMessage[],
  opinions?: Opinion[]
): AsyncGenerator<StreamChunk, AskPulseAIResponse, unknown> {
  try {
    const proxyUrl = getProxyUrl();

    // Retrieve relevant articles with category variety (2 per category)
    const relevantArticles = retrieveRelevantArticles(userQuestion, newsData, 10);

    // Get conversation context
    const convHistory = conversationManager.getHistory();
    const previousEntities = conversationManager.getPreviousEntities();

    // Call backend proxy
    const response = await fetch(proxyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question: userQuestion,
        newsData,
        conversationHistory: conversationHistory || convertToChatHistory(convHistory.map(msg => ({
          role: msg.role === 'assistant' ? 'ai' : 'user',
          content: msg.content
        }))),
        opinions: opinions || [],
        previousEntities,
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
              // Update conversation context after response
              conversationManager.addToHistory('user', userQuestion);
              conversationManager.addToHistory('assistant', data.fullText || fullText);
              conversationManager.updateContext(userQuestion, data.fullText || fullText);
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
 * Enhanced with conversation tracking and opinions support
 */
export const generateAskPulseAIResponse = async (
  userQuestion: string,
  newsData: { [category: string]: NewsStory[] },
  conversationHistory?: ChatMessage[],
  opinions?: Opinion[]
): Promise<AskPulseAIResponse> => {
  try {
    const proxyUrl = getProxyUrl();

    // Retrieve relevant articles with category variety
    const relevantArticles = retrieveRelevantArticles(userQuestion, newsData, 10);

    // Get conversation context
    const convHistory = conversationManager.getHistory();
    const previousEntities = conversationManager.getPreviousEntities();

    // Log request details
    console.log('🔍 Ask Pulse AI Request:', {
      question: userQuestion,
      articlesAvailable: Object.keys(newsData || {}).length,
      relevantArticles: relevantArticles.length,
      opinionsAvailable: opinions?.length || 0,
      conversationHistory: convHistory.length
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
        conversationHistory: conversationHistory || convertToChatHistory(convHistory.map(msg => ({
          role: msg.role === 'assistant' ? 'ai' : 'user',
          content: msg.content
        }))),
        opinions: opinions || [],
        previousEntities,
        stream: false
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Proxy error: ${response.status}`);
    }

    const data = await response.json();

    const responseText = data.text || "I'm sorry, I couldn't generate a response.";
    
    // Update conversation context
    conversationManager.addToHistory('user', userQuestion);
    conversationManager.addToHistory('assistant', responseText);
    conversationManager.updateContext(userQuestion, responseText);

    return {
      text: responseText,
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
 * Reset conversation context
 */
export const resetConversation = (): void => {
  conversationManager.reset();
  console.log('🔄 [resetConversation] Conversation context cleared');
};

/**
 * Get current conversation context
 */
export const getConversationContext = (): ConversationContext => {
  return conversationManager.getContext();
};

/**
 * Get conversation history
 */
export const getConversationHistory = (): ConversationMessage[] => {
  return conversationManager.getHistory();
};

/**
 * Get entities mentioned in conversation
 */
export const getEntitiesMentioned = (): string[] => {
  return conversationManager.getPreviousEntities();
};

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
