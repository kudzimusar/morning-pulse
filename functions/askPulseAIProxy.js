/**
 * Ask Pulse AI Proxy
 * Proxies requests to n8n AI Agent Webhook
 * 
 * Entry point: askPulseAIProxy
 * 
 * POST /askPulseAIProxy
 * Body (from frontend): {
 *   question: string, // Mapped to "chatInput" for n8n
 *   type: string, // 'summarize', 'explain', 'opposing_views'
 *   context: string // Article content
 * }
 * 
 * Upstream (n8n):
 * POST http://34.122.163.50:5678/webhook/morning-pulse-chat
 * Body: { "chatInput": "..." }
 * Response: { "output": "..." }
 */

const functions = require('firebase-functions');
const axios = require('axios');
const cors = require('cors')({ origin: true });

// n8n Webhook URL (Hardcoded per plan, or use process.env.N8N_WEBHOOK_URL)
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 'http://34.122.163.50:5678/webhook/morning-pulse-chat';

exports.askPulseAIProxy = functions
  .runWith({ timeoutSeconds: 60, memory: '256MB' })
  .https.onRequest(async (req, res) => {
    return cors(req, res, async () => {
      // Only allow POST requests
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed. Use POST.' });
      }

      try {
        const { question, type, context } = req.body;

        let prompt = question;

        // Construct prompt based on action type
        if (type === 'summarize' && context) {
          prompt = `Please provide a concise, 60-second summary of the following article text. Focus on the main points and why it matters:\n\n${context}`;
        } else if (type === 'opposing_views' && context) {
          prompt = `Please provide 2-3 strong opposing views or alternative perspectives to the arguments presented in this article text. Be balanced and objective:\n\n${context}`;
        } else if (type === 'explain' && context) {
          prompt = `Please explain the key concepts and background context of this article in simple, easy-to-understand terms (ELI5 style):\n\n${context}`;
        }

        if (!prompt) {
          return res.status(400).json({ error: 'Missing "question" or valid "type/context" in request body' });
        }

        console.log(`🤖 Proxying to n8n (Type: ${type || 'chat'}): "${prompt.substring(0, 50)}..."`);

        // Call n8n Webhook
        const n8nResponse = await axios.post(N8N_WEBHOOK_URL, {
          chatInput: prompt
        }, {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 50000 // 50s timeout
        });

        console.log('📦 n8n Response Data:', JSON.stringify(n8nResponse.data));

        // Extract output from n8n response
        // Expected format: { "output": "AI response text" }
        const aiResponseText = n8nResponse.data.output || "I'm sorry, I couldn't get a response from the newsroom.";

        // Return in format expected by frontend
        // The frontend likely expects { text: "..." } based on previous code
        return res.status(200).json({
          text: aiResponseText,
          sources: [] // n8n handles citations in text, or we can parse them if n8n returns them structured
        });

      } catch (error) {
        console.error('❌ n8n Proxy Error:', error.message);
        if (error.response) {
          console.error('n8n Response:', error.response.data);
        }

        return res.status(500).json({
          error: 'AI service unavailable',
          message: 'Failed to connect to the newsroom agent.'
        });
      }
    });
  });
