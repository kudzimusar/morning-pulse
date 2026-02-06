/**
 * Ask The Pulse AI Service
 * RAG-based chatbot using Google Gemini API with Morning Pulse content retrieval
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
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
3. Be concise and factual - cite the article source for each claim
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

Provide a helpful answer based solely on the articles above. If relevant, mention which article(s) you're citing.`;

  return systemPrompt;
};

/**
 * Parse source citations from response text (e.g., [1], [2])
 * Returns text with citations replaced and citation map
 */
const parseSourceCitations = (
  text: string,
  sources: Array<{ title: string; url?: string; index: number }>
): { text: string; citations: Map<number, { title: string; url?: string }> } => {
  const citations = new Map<number, { title: string; url?: string }>();
  const citationPattern = /\[(\d+)\]/g;
  
  // Find all citations in text
  let match;
  while ((match = citationPattern.exec(text)) !== null) {
    const index = parseInt(match[1], 10);
    const source = sources.find(s => s.index === index);
    if (source) {
      citations.set(index, { title: source.title, url: source.url });
    }
  }
  
  return { text, citations };
};

/**
 * Generate AI response using Google Gemini with streaming support
 */
export const generateAskPulseAIResponseStream = async function* (
  userQuestion: string,
  newsData: { [category: string]: NewsStory[] },
  conversationHistory?: ChatMessage[]
): AsyncGenerator<StreamChunk, AskPulseAIResponse, unknown> {
  try {
    // Get API key from multiple sources
    const apiKey = 
      import.meta.env.VITE_GEMINI_API_KEY || 
      (typeof window !== 'undefined' && (window as any).__GEMINI_API_KEY) ||
      (typeof window !== 'undefined' && (window as any).__firebase_config?.geminiApiKey) ||
      '';
    
    if (!apiKey) {
      yield { text: "I'm having trouble connecting to the AI service. Please check the configuration. The API key is missing.", done: true };
      return {
        text: "I'm having trouble connecting to the AI service. Please check the configuration. The API key is missing.",
        sources: []
      };
    }

    // Retrieve relevant articles
    const relevantArticles = retrieveRelevantArticles(userQuestion, newsData, 5);
    
    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      }
    });

    let fullText = '';

    // Construct prompt with articles
    const constructedPrompt = constructPrompt(userQuestion, relevantArticles);

    // Use conversation history if available
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
      
      const result = await chat.sendMessageStream(constructedPrompt);
      
      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        fullText += chunkText;
        yield { text: chunkText, done: false };
      }
    } else {
      // First message - use generateContentStream
      const result = await model.generateContentStream(constructedPrompt);
      
      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        fullText += chunkText;
        yield { text: chunkText, done: false };
      }
    }

    // Extract sources with indices
    const sources = relevantArticles
      .filter(article => article.headline && article.url)
      .map((article, idx) => ({
        title: article.headline!,
        url: article.url,
        index: idx + 1
      }));

    // Return final response
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
 * Generate AI response using Google Gemini (non-streaming, for backward compatibility)
 */
export const generateAskPulseAIResponse = async (
  userQuestion: string,
  newsData: { [category: string]: NewsStory[] },
  conversationHistory?: ChatMessage[]
): Promise<AskPulseAIResponse> => {
  try {
    // Get API key from multiple sources (similar to Firebase config pattern)
    const apiKey = 
      import.meta.env.VITE_GEMINI_API_KEY || 
      (typeof window !== 'undefined' && (window as any).__GEMINI_API_KEY) ||
      (typeof window !== 'undefined' && (window as any).__firebase_config?.geminiApiKey) ||
      '';
    
    if (!apiKey) {
      console.error('Gemini API key not found. Checked:', {
        env: !!import.meta.env.VITE_GEMINI_API_KEY,
        window: !!(typeof window !== 'undefined' && (window as any).__GEMINI_API_KEY),
        firebaseConfig: !!(typeof window !== 'undefined' && (window as any).__firebase_config?.geminiApiKey)
      });
      return {
        text: "I'm having trouble connecting to the AI service. Please check the configuration. The API key is missing.",
        sources: []
      };
    }

    // Log request details
    console.log('🔍 Ask Pulse AI Request:', {
      question: userQuestion,
      articlesAvailable: Object.keys(newsData || {}).length,
      apiKeyPresent: !!apiKey
    });

    // Retrieve relevant articles
    const relevantArticles = retrieveRelevantArticles(userQuestion, newsData, 5);
    
    // Construct prompt
    const constructedPrompt = constructPrompt(userQuestion, relevantArticles);
    
    // Log API key status (first 10 chars only for security)
    console.log('🔑 Gemini API key found:', apiKey ? `${apiKey.substring(0, 10)}...` : 'NOT FOUND');
    
    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Generate response with current model (gemini-1.5-flash)
    try {
      console.log('🤖 Initializing Gemini model...');
      
      let model;
      let result;
      let response;
      let text: string;

      // Use conversation history if available
      if (conversationHistory && conversationHistory.length > 0) {
        model = genAI.getGenerativeModel({ 
          model: 'gemini-1.5-flash',
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          }
        });
        
        const chat = model.startChat({
          history: conversationHistory,
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          }
        });
        
        console.log('✅ Model initialized with conversation history, generating response...');
        result = await chat.sendMessage(constructedPrompt);
        response = await result.response;
        text = response.text();
      } else {
        // First message - use generateContent
        model = genAI.getGenerativeModel({ 
          model: 'gemini-1.5-flash',  // Free tier model, replaces deprecated gemini-pro
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          }
        });

        console.log('✅ Model initialized, generating response...');
        result = await model.generateContent(constructedPrompt);
        response = await result.response;
        text = response.text();
      }

      console.log('✅ Response received from Gemini');

      // Extract sources with indices for citation parsing
      const sources = relevantArticles
        .filter(article => article.headline && article.url)
        .map((article, idx) => ({
          title: article.headline!,
          url: article.url,
          index: idx + 1
        }));

      return {
        text,
        sources
      };

    } catch (error: any) {
      console.error('❌ Gemini API error:', error);
      
      // If gemini-1.5-flash fails, try gemini-1.5-flash-8b (even lighter model)
      if (error.message?.includes('not found') || error.status === 404) {
        console.log('⚠️ Trying alternative model: gemini-1.5-flash-8b...');
        
        try {
          const fallbackModel = genAI.getGenerativeModel({ 
            model: 'gemini-1.5-flash-8b',
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 1024,
            }
          });
          
          const result = await fallbackModel.generateContent(constructedPrompt);
          const response = await result.response;
          const text = response.text();
          
          console.log('✅ Fallback model response received');
          
          // Extract sources with indices for citation parsing
          const sources = relevantArticles
            .filter(article => article.headline && article.url)
            .map((article, idx) => ({
              title: article.headline!,
              url: article.url,
              index: idx + 1
            }));

          return {
            text,
            sources
          };
          
        } catch (fallbackError: any) {
          console.error('❌ Fallback model also failed:', fallbackError);
          throw new Error('AI model unavailable: ' + fallbackError.message);
        }
      }
      
      throw new Error('AI model unavailable: ' + error.message);
    }
  } catch (error: any) {
    console.error('Ask Pulse AI Error:', error);
    
    // Provide helpful error messages
    if (error.message?.includes('API_KEY')) {
      return {
        text: "I'm having trouble connecting to the AI service. Please check the API configuration.",
        sources: []
      };
    }
    
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
 * Test Gemini API connection and model availability
 * Useful for debugging API key and model access issues
 */
export async function testGeminiConnection(): Promise<boolean> {
  const apiKey = 
    import.meta.env.VITE_GEMINI_API_KEY || 
    (typeof window !== 'undefined' && (window as any).__GEMINI_API_KEY) ||
    (typeof window !== 'undefined' && (window as any).__firebase_config?.geminiApiKey) ||
    '';

  if (!apiKey) {
    console.error('❌ No Gemini API key found');
    return false;
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    // Simple test prompt
    const result = await model.generateContent('Say "OK" if you can read this.');
    const response = await result.response;
    const text = response.text();
    
    console.log('✅ Gemini API test successful:', text);
    return true;
  } catch (error) {
    console.error('❌ Gemini API test failed:', error);
    return false;
  }
}
