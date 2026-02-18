# MCP Integration Guide for n8n

This guide explains how to integrate **Google AI Pro** (Gemini) with **n8n** using the **Model Context Protocol (MCP)**. This allows your n8n workflows to access external tools and data sources via the AI model.

## Prerequisites
- n8n instance running (version 1.0+ recommended).
- Google Cloud Project with Vertex AI API enabled.
- Service Account credentials (JSON key).

## Step 1: Install MCP N8N Community Node (If available)
*Note: Native MCP support in n8n is evolving. If a specific "MCP" node isn't available, we use the standard "AI Agent" node with custom tools.*

## Step 2: Configure the AI Agent Node
1.  Open your n8n workflow.
2.  Add an **AI Agent** node.
3.  **Model:** Select `Google Gemini` (or `Vertex AI`).
    -   **Credential:** Use your Google Cloud Service Account JSON.
    -   **Model:** `gemini-1.5-pro` or `gemini-1.5-flash`.

## Step 3: Define Tools (The "MCP" Part)
To give the AI "tools" (capabilities), you attach **Tool** nodes to the AI Agent.

### Example: Google Search Tool
1.  Add a **Google Search** tool node (or `SerpAPI`).
2.  Connect it to the **Tools** input of the AI Agent node.

### Example: Internal API Tool (Custom MCP)
If you have a custom MCP server:
1.  Use the **HTTP Request** tool node.
2.  Configure it to call your MCP server's endpoints.
3.  Describe the tool clearly in the description field so the AI knows when to use it.

## Step 4: Testing
1.  In the AI Agent node, enter a prompt that requires using a tool (e.g., "Search for the latest news on Zimbabwe").
2.  Execute the node.
3.  Verify that the AI calls the tool and incorporates the result into its answer.

## Recommended Tools for Morning Pulse
-   **Google Search:** For real-time news verification (already used in `newsAggregator.js`).
-   **Wikipedia:** For background context.
-   **Internal Database:** Create a workflow tool that allows the AI to query your Firestore `news` collection to answer questions about past articles.
