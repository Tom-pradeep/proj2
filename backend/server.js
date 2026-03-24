const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY;
let ai;
if (apiKey && apiKey !== 'your_api_key_here') {
    ai = new GoogleGenAI({ apiKey });
}

app.post('/api/chat', async (req, res) => {
    try {
        const { message, history, language } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // We use gemini-2.5-flash as the default fast/free model
        // Format history for Gemini API
        const formattedHistory = (history || []).map(msg => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }]
        }));

        let finalMessage = message;
        if (language && language !== 'English') {
            finalMessage = `Please respond to the following entirely in ${language}:\n\n${message}`;
        }

        if (!ai) {
            // Mock response if API key is not configured
            setTimeout(() => {
                res.json({ 
                    response: "This is a **mock response** because the `GEMINI_API_KEY` in your `.env` file is missing or still set to the default.\n\nTo get real AI responses:\n1. Get a free API key from Google AI Studio.\n2. Add it to `c:\\Users\\Hiiii\\OneDrive\\Desktop\\anti\\free_ai_bot\\backend\\.env`.\n3. Restart the backend server." 
                });
            }, 1000); // Simulate network delay
            return;
        }

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
                ...formattedHistory,
                { role: 'user', parts: [{ text: finalMessage }] }
            ]
        });

        res.json({ response: response.text });
    } catch (error) {
        console.error('Error calling Gemini API:', error);
        res.status(500).json({ error: 'Failed to generate response' });
    }
});

app.listen(port, () => {
    console.log(`AI Bot Server running on http://localhost:${port}`);
});
