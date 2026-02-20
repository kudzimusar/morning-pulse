/**
 * Gemini Model Configuration - Single Source of Truth
 *
 * Update this file whenever Google releases new models.
 * All Cloud Functions import from here to stay in sync.
 *
 * Model support matrix (v1beta API):
 *   gemini-2.0-flash          → ✅ GA, supports googleSearch grounding, generateContent
 *   gemini-1.5-flash           → ❌ 404 on v1beta (not in this API version)
 *   gemini-1.5-pro             → ❌ 404 on v1beta
 *   gemini-2.5-flash           → ❌ Not yet GA / not available
 *
 * Check available models: https://ai.google.dev/gemini-api/docs/models
 */

const MODELS = {
    // Main generation model: supports googleSearch grounding
    DEFAULT: 'gemini-2.0-flash',

    // For chat / conversational AI (no search grounding needed)
    CHAT: 'gemini-2.0-flash',

    // For newsletter intro / lighter generation tasks
    NEWSLETTER: 'gemini-2.0-flash',
};

module.exports = { MODELS };
