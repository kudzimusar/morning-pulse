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
  sources?: Array<{ title: string; url?: string }>;
}

/**
 * Retrieve relevant articles from newsData based on user query
 * Simple keyword-based retrieval (can be enhanced with embeddings later)
 */
const retrieveRelevantArticles = (
  query: string,
  newsData: { [category: string]: NewsStory[] },
  topK: number = 5
): NewsStory[] => {
  const queryLower = query.toLowerCase();
  const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2);
  
  const allArticles: NewsStory[] = [];
  Object.values(newsData).forEach(categoryArticles => {
    allArticles.push(...categoryArticles);
  });

  // Score articles based on keyword matches
  const scoredArticles = allArticles.map(article => {
    const headline = (article.headline || '').toLowerCase();
    const description = (article.description || '').toLowerCase();
    const category = (article.category || '').toLowerCase();
    const content = `${headline} ${description} ${category}`;
    
    let score = 0;
    queryWords.forEach(word => {
      if (content.includes(word)) {
        score += headline.includes(word) ? 3 : 1; // Headline matches are more important
      }
    });
    
    // Boost recent articles
    if (article.timestamp) {
      const ageInHours = (Date.now() - article.timestamp) / (1000 * 60 * 60);
      if (ageInHours < 24) score += 2;
      else if (ageInHours < 168) score += 1; // Within a week
    }
    
    return { article, score };
  });

  // Sort by score and return top K
  return scoredArticles
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map(item => item.article);
};

/**
 * Construct grounded prompt with retrieved articles
 */
const constructPrompt = (
  userQuestion: string,
  articles: NewsStory[]
): string => {
  const contextSection = articles.length > 0
    ? articles.map((article, index) => {
        const title = article.headline || 'Untitled';
        const description = article.description || '';
        const category = article.category || '';
        const url = article.url || '';
        const publishedAt = article.timestamp 
          ? new Date(article.timestamp).toLocaleDateString()
          : 'Recently';
        
        return `Article ${index + 1}:
Title: ${title}
Category: ${category}
Description: ${description}
Published: ${publishedAt}
URL: ${url}`;
      }).join('\n\n')
    : 'No relevant Morning Pulse articles found for this query.';

  return `${EDITORIAL_SYSTEM_PROMPT}

CONTEXT (Morning Pulse Reporting):
${contextSection}

USER QUESTION:
${userQuestion}

ANSWER (based only on the articles above):`;
};

/**
 * Generate AI response using Google Gemini
 */
export const generateAskPulseAIResponse = async (
  userQuestion: string,
  newsData: { [category: string]: NewsStory[] }
): Promise<AskPulseAIResponse> => {
  try {
    // Get API key from environment
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || 
                   (window as any).__GEMINI_API_KEY ||
                   '';
    
    if (!apiKey) {
      console.error('Gemini API key not found');
      return {
        text: "I'm having trouble connecting to the AI service. Please check the configuration.",
        sources: []
      };
    }

    // Retrieve relevant articles
    const relevantArticles = retrieveRelevantArticles(userQuestion, newsData, 5);
    
    // Construct prompt
    const prompt = constructPrompt(userQuestion, relevantArticles);
    
    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash' // Using Flash for faster responses
    });

    // Generate response
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Extract sources from relevant articles
    const sources = relevantArticles
      .filter(article => article.headline && article.url)
      .map(article => ({
        title: article.headline!,
        url: article.url
      }));

    return {
      text,
      sources
    };
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
