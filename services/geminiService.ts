import { GoogleGenAI } from "@google/genai";
import { SYSTEM_PROMPT } from "../constants";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface GeminiResponse {
  text: string;
  sources: { title: string; uri: string }[];
}

export const generateGeminiResponse = async (
  userMessage: string,
  contextHeadlines: string
): Promise<GeminiResponse> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-09-2025',
      contents: userMessage,
      config: {
        systemInstruction: `${SYSTEM_PROMPT}\n\nContextual Headlines:\n${contextHeadlines}`,
        tools: [{ googleSearch: {} }],
      },
    });

    let text = response.text || "I'm sorry, I couldn't generate a response.";
    let sources: { title: string; uri: string }[] = [];

    // Extract grounding metadata if available
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (groundingChunks) {
      sources = groundingChunks
        .map((chunk) => chunk.web)
        .filter((web): web is { title: string; uri: string } => !!web && !!web.uri && !!web.title);
    }

    return { text, sources };
  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
      text: "I'm having trouble connecting to the network right now. Please try again later.",
      sources: []
    };
  }
};
