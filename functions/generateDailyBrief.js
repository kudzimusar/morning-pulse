const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { VertexAI } = require("@google-cloud/vertexai");
const { MODELS, VERTEX_CONFIG } = require("./modelConfig");

exports.generateDailyBrief = functions
    .runWith({ timeoutSeconds: 60, memory: '512MB' })
    .https.onCall(async (data, context) => {
        // 1. Auth Check
        if (!context.auth) {
            throw new functions.https.HttpsError(
                'unauthenticated',
                'The function must be called while authenticated.'
            );
        }

        const uid = context.auth.uid;
        const today = new Date().toISOString().split('T')[0];

        console.log(`🚀 Generating brief for user: ${uid} (Date: ${today})`);

        try {
            const db = admin.firestore();

            // 2. Check if brief already exists for today
            const userRef = db.collection('users').doc(uid);
            const briefsRef = userRef.collection('briefs');
            const todayBriefSnapshot = await briefsRef.where('date', '==', today).limit(1).get();

            if (!todayBriefSnapshot.empty) {
                console.log("ℹ️ Brief already exists for today. Returning existing brief.");
                return {
                    success: true,
                    brief: todayBriefSnapshot.docs[0].data()
                };
            }

            // 3. Fetch User's Reading History (Limit 100)
            const historySnapshot = await userRef.collection('reading_history')
                .orderBy('timestamp', 'desc')
                .limit(100)
                .get();

            const readArticleIds = new Set();
            historySnapshot.forEach(doc => {
                const data = doc.data();
                if (data.articleId) readArticleIds.add(data.articleId);
            });

            console.log(`📚 Found ${readArticleIds.size} read articles in history.`);

            // 4. Fetch Today's News
            // Path from newsAggregator: news/v2/{appId}/daily/dates/{date}
            // Use a default appId if not in env, matching newsAggregator
            const appId = process.env.APP_ID || "morning-pulse-app";
            const newsDocPath = `news/v2/${appId}/daily/dates/${today}`;

            let newsDoc = await db.doc(newsDocPath).get();

            // Fallback to yesterday if today's news isn't ready
            if (!newsDoc.exists) {
                console.log("⚠️ Today's news not found. Trying yesterday...");
                const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
                const yesterdayDocPath = `news/v2/${appId}/daily/dates/${yesterday}`;
                newsDoc = await db.doc(yesterdayDocPath).get();

                if (!newsDoc.exists) {
                    throw new functions.https.HttpsError(
                        'unavailable',
                        'Daily news has not been generated yet. Please try again later.'
                    );
                }
            }

            const newsData = newsDoc.data();
            const allCategories = newsData.categories || {};

            // 5. Aggregate and Filter Candidates
            let candidateArticles = [];

            // Priorities: World, Politics, Tech, Finance
            const priorityCategories = ["World", "Politics", "Technology", "Finance & Economy"];

            // Collect from priority categories first
            for (const cat of priorityCategories) {
                if (allCategories[cat]) {
                    candidateArticles.push(...allCategories[cat]);
                }
            }

            // Add others if needed, but let's stick to high impact for the brief

            // Filter out read articles
            const unreadArticles = candidateArticles.filter(article => !readArticleIds.has(article.id || article.url));

            // Take top 5 unread
            const topStories = unreadArticles.slice(0, 5);

            if (topStories.length === 0) {
                return {
                    success: true,
                    brief: {
                        date: today,
                        content: "You're all caught up! No major new stories to report since your last visit.",
                        sections: []
                    }
                };
            }

            // 6. Generate Brief with Vertex AI
            const vertexAI = new VertexAI(VERTEX_CONFIG);
            const model = vertexAI.getGenerativeModel({ model: MODELS.DEFAULT });

            const storiesText = topStories.map((s, i) =>
                `${i + 1}. ${s.headline}: ${s.detail} (Source: ${s.source})`
            ).join('\n');

            const prompt = `
            You are an executive news assistant. Create a "Morning Pulse" daily briefing for me based on these top unread stories:

            ${storiesText}

            Format the output as a JSON object with this structure:
            {
                "greeting": "A short, friendly morning greeting.",
                "summary": "A 2-sentence executive summary of the world today.",
                "points": [
                    { "emoji": "🌍", "headline": "Short Headline", "text": "1-sentence summary of the story." },
                    { "emoji": "📈", "headline": "Short Headline", "text": "1-sentence summary..." },
                    { "emoji": "💻", "headline": "Short Headline", "text": "1-sentence summary..." }
                ],
                "closing": "A valid encouraging sign-off."
            }
            Do not include markdown formatting like \`\`\`json. Just return the raw JSON string.
            Keep it professional, concise, and engaging.
            `;

            const result = await model.generateContent({
                contents: [{ role: 'user', parts: [{ text: prompt }] }]
            });
            const response = result.response;
            let text = response.candidates[0].content.parts[0].text;

            // Cleanup
            text = text.replace(/```json/g, "").replace(/```/g, "").trim();

            let briefData;
            try {
                briefData = JSON.parse(text);
            } catch (e) {
                console.error("Failed to parse AI response:", text);
                // Fallback
                briefData = {
                    greeting: "Good morning!",
                    summary: "Here are your top stories for today.",
                    points: topStories.slice(0, 3).map(s => ({
                        emoji: "📰",
                        headline: s.headline,
                        text: s.detail
                    })),
                    closing: "Have a productive day!"
                };
            }

            const finalBrief = {
                id: today, // ID is the date for uniqueness
                date: today,
                generatedAt: Date.now(),
                content: briefData, // Store the structured object
                isRead: false
            };

            // 7. Save to Firestore
            await briefsRef.doc(today).set(finalBrief);

            return {
                success: true,
                brief: finalBrief
            };

        } catch (error) {
            console.error("Error generating brief:", error);
            throw new functions.https.HttpsError('internal', error.message);
        }
    });
