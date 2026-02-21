/**
 * Gemini Model Configuration - Single Source of Truth
 *
 * Uses @google-cloud/vertexai (Vertex AI SDK) — more reliable than @google/generative-ai.
 * Auth handled via Application Default Credentials (service account) — no GEMINI_API_KEY needed.
 *
 * Available models on Vertex AI (us-central1):
 *   gemini-2.0-flash-001   → ✅ GA, supports Google Search Grounding
 *   gemini-1.5-pro-001     → ✅ GA, higher quality, slower
 *   gemini-1.5-flash-001   → ✅ GA, fast, lightweight
 *
 * Check: https://cloud.google.com/vertex-ai/generative-ai/docs/model-reference/gemini
 */

const VERTEX_CONFIG = {
    project: 'gen-lang-client-0999441419',
    location: 'us-central1',
};

const MODELS = {
    // Main generation model: supports Google Search Grounding
    DEFAULT: 'gemini-2.0-flash-001',

    // For chat / conversational AI
    CHAT: 'gemini-2.0-flash-001',

    // For newsletter intro / lighter generation tasks
    NEWSLETTER: 'gemini-2.0-flash-001',
};

module.exports = { MODELS, VERTEX_CONFIG };
