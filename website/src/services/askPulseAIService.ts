/**
 * Ask The Pulse AI Service
 * Connects to n8n AI Agent via Backend Proxy
 */

import { NewsStory, Opinion } from '../../../types';

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

// Conversation state manager (Local only, for UI availability)
// n8n manages the actual agent context
class ConversationManager {
  private history: { role: 'user' | 'assistant', content: string }[] = [];

  addToHistory(role: 'user' | 'assistant', content: string): void {
    this.history.push({ role, content });
  }

  getHistory() {
    return this.history;
  }

  reset(): void {
    this.history = [];
  }
}

const conversationManager = new ConversationManager();

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
 * Generate AI response using backend proxy (Streaming)
 */
export const generateAskPulseAIResponseStream = async function* (
  userQuestion: string,
  newsData: { [category: string]: NewsStory[] }, // Kept for interface compatibility
  conversationHistory?: ChatMessage[], // Kept for interface compatibility
  opinions?: Opinion[] // Kept for interface compatibility
): AsyncGenerator<StreamChunk, AskPulseAIResponse, unknown> {
  try {
    const proxyUrl = getProxyUrl();

    // Call backend proxy
    // We only send 'question' as per the new contract
    const response = await fetch(proxyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question: userQuestion
      })
    });

    if (!response.ok) {
      throw new Error(`Proxy error: ${response.status} ${response.statusText}`);
    }

    // New n8n proxy returns JSON { text: "...", sources: [] }
    // It does NOT support streaming yet (as per my proxy refactor using axios await)
    // So we simulate streaming for the UI
    const data = await response.json();
    const fullText = data.text || "I'm sorry, I couldn't get a response.";

    // Simulate streaming by yielding chunks
    const chunkSize = 20;
    for (let i = 0; i < fullText.length; i += chunkSize) {
      yield {
        text: fullText.substring(i, i + chunkSize),
        done: false
      };
      // Tiny delay to simulate typing
      await new Promise(r => setTimeout(r, 10));
    }

    conversationManager.addToHistory('user', userQuestion);
    conversationManager.addToHistory('assistant', fullText);

    return {
      text: fullText,
      sources: data.sources || []
    };

  } catch (error: any) {
    console.error('AI Service Error:', error);
    yield { text: "I encountered an error connecting to the newsroom. Please try again.", done: true };
    return {
      text: "I encountered an error connecting to the newsroom. Please try again.",
      sources: []
    };
  }
};

// Keep other exports for compatibility
export const generateAskPulseAIResponse = async (
  userQuestion: string,
  newsData: any,
  conversationHistory?: any,
  opinions?: any
): Promise<AskPulseAIResponse> => {
  const iterator = generateAskPulseAIResponseStream(userQuestion, newsData);
  let finalResponse: AskPulseAIResponse = { text: '', sources: [] };

  let result = await iterator.next();
  while (!result.done) {
    result = await iterator.next();
  }
  if (result.value) finalResponse = result.value;
  return finalResponse;
};

export const resetConversation = () => conversationManager.reset();
export const convertToChatHistory = (messages: any) => []; // No longer needed
export const formatResponseWithCitations = (text: string, sources: any[]) => ({ formattedText: text, citations: new Map() }); // Simple pass-through
