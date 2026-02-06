# Ask The Pulse AI Setup Guide

## Overview

Ask The Pulse AI is now a **real RAG-based chatbot** using Google Gemini API with Morning Pulse content retrieval. It provides grounded, editorial responses based on published articles.

## Architecture

- **RAG (Retrieval-Augmented Generation)**: Retrieves relevant articles from Morning Pulse newsData
- **Google Gemini API**: Uses `gemini-1.5-flash` for fast, editorial responses
- **Editorial System Prompt**: Ensures newsroom tone and factual accuracy
- **Source Citations**: Automatically includes article sources in responses

## Setup Instructions

### 1. Get Google Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the API key

### 2. Configure Environment Variable

Create a `.env` file in the `website/` directory (or add to existing `.env`):

```bash
VITE_GEMINI_API_KEY=your_api_key_here
```

**Important**: 
- Never commit the `.env` file to git
- The `.env` file should be in `.gitignore`
- For production, set this as an environment variable in your deployment platform

### 3. Alternative: Runtime Configuration

If you prefer to inject the API key at runtime (e.g., via `firebase-config.js`), you can set it in the window object:

```javascript
window.__GEMINI_API_KEY = 'your_api_key_here';
```

This should be done before the app loads, similar to how Firebase config is injected.

## How It Works

### 1. User Asks Question
User types a question in the Ask The Pulse AI interface.

### 2. Content Retrieval
The system:
- Searches all Morning Pulse articles in `newsData`
- Scores articles based on keyword matches (headline matches weighted higher)
- Boosts recent articles (within 24 hours get +2, within week get +1)
- Returns top 5 most relevant articles

### 3. Prompt Construction
The system builds a prompt with:
- **Editorial System Prompt**: Defines the AI's role and constraints
- **Context Section**: Top 5 relevant articles with title, description, category, URL
- **User Question**: The actual query

### 4. Gemini API Call
- Sends prompt to Google Gemini (`gemini-1.5-flash`)
- Receives editorial response grounded in Morning Pulse reporting

### 5. Response Display
- Shows AI response in chat bubble
- Includes source citations at the bottom
- Maintains conversation history

## Editorial System Prompt

The system prompt ensures:
- ✅ Only answers using Morning Pulse reporting
- ✅ Newsroom editorial tone (factual, concise, contextual)
- ✅ No speculation or invented sources
- ✅ Clear messaging when topics aren't covered
- ✅ References to "we" or "our newsroom" when appropriate

## Current Limitations

1. **Keyword-Based Retrieval**: Currently uses simple keyword matching. Can be enhanced with:
   - Vector embeddings (text-embedding-004)
   - Semantic search
   - Vector database (Pinecone, Supabase Vector, etc.)

2. **No Persistent Memory**: Each question is independent. Can be enhanced with:
   - Conversation history in prompt
   - Context window management

3. **Frontend API Key**: API key is exposed in frontend code. For production, consider:
   - Backend API route that proxies requests
   - Serverless function (Cloud Functions, Vercel Functions, etc.)

## Testing

### Test Questions

1. **"What are today's top stories?"**
   - Should return summary of recent articles
   - Should cite specific articles

2. **"Tell me about Zimbabwe business news"**
   - Should focus on Business (Zim) category
   - Should cite relevant business articles

3. **"What does this mean for Zimbabwe?"**
   - Should provide contextual analysis
   - Should reference relevant articles

4. **"What is Morning Pulse reporting about fuel prices?"**
   - Should either cite fuel-related articles OR
   - Should clearly state "Morning Pulse has not yet published reporting on this topic"

### Expected Behavior

✅ **Valid Responses:**
- Specific article references
- Contextual explanations
- Source citations
- Editorial tone

❌ **Invalid Responses:**
- Generic news summaries
- Repeated boilerplate
- "As an AI model" disclaimers
- Answers without article context

## Troubleshooting

### "I'm having trouble connecting to the AI service"

**Cause**: API key not configured

**Solution**:
1. Check `.env` file has `VITE_GEMINI_API_KEY`
2. Restart dev server after adding env var
3. Check browser console for API key errors

### "I'm currently experiencing high demand"

**Cause**: API quota exceeded or rate limited

**Solution**:
1. Check Google AI Studio dashboard for quota usage
2. Wait a few minutes and try again
3. Consider upgrading API tier if needed

### Same response for all questions

**Cause**: Hardcoded response still in code

**Solution**:
1. Verify `askPulseAIService.ts` is being imported
2. Check that `generateAskPulseAIResponse` is being called
3. Verify API key is valid and requests are reaching Gemini

### No sources in responses

**Cause**: No relevant articles found or articles missing URLs

**Solution**:
1. Check that `newsData` is being passed to component
2. Verify articles have `headline` and `url` fields
3. Test retrieval function with sample queries

## Next Steps (Optional Enhancements)

1. **Vector Embeddings**: Replace keyword search with semantic search
2. **Backend API Route**: Move API calls to server-side for security
3. **Conversation Memory**: Add context from previous messages
4. **Inline Citations**: Clickable article links in responses
5. **Related Stories**: Show related articles after response
6. **Editor Override**: Allow editors to review/approve responses

## Files Modified

- `website/src/services/askPulseAIService.ts` - New RAG service
- `website/src/components/AskPulseAI.tsx` - Updated to use real API
- `website/vite.config.ts` - Added VITE_GEMINI_API_KEY support
- `website/package.json` - Added @google/generative-ai dependency

## Support

For issues or questions:
1. Check browser console for errors
2. Verify API key is valid in Google AI Studio
3. Test with simple queries first
4. Check that `newsData` prop is being passed correctly
