const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors({ origin: '*' }));
app.use(express.json());

app.get('/api/ping', (req, res) => {
    res.json({ status: "ok", timestamp: new Date() });
});

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY;
let ai;
if (apiKey && apiKey !== 'your_api_key_here') {
    ai = new GoogleGenAI({ apiKey });
}

const SYSTEM_INSTRUCTION = `You are Pradeep AI, a versatile and helpful assistant. 
Handle all types of questions and conversations professionally and knowledgeably.
Images: Use markdown ![Desc](https://pollinations.ai/p/[PROMPT]?width=1024&height=1024&seed=[SEED]&model=flux)
Language: Respond in the EXACT same language as the user.`;

app.post('/api/chat', async (req, res) => {
    try {
        const { message, history, language, model } = req.body;
        const selectedModel = model || 'openai';

        if (!message) return res.status(400).json({ error: 'Message is required' });

        // Cap history to last 10 messages for speed
        const recentHistory = (history || []).slice(-10);

        let finalMessage = message;
        if (language && language !== 'English') {
            finalMessage = `Respond in ${language}: ${message}`;
        }

        const messagesForAI = [
            { role: 'system', content: SYSTEM_INSTRUCTION },
            ...recentHistory.map(msg => ({
                role: msg.role === 'user' ? 'user' : 'assistant',
                content: msg.content
            })),
            { role: 'user', content: finalMessage }
        ];

        if (selectedModel === 'gemini') {
            if (!ai) {
                return res.json({ response: "Gemini is not configured. Please select ChatGPT or Claude from settings for a free experience." });
            }
            
            const formattedHistory = recentHistory.map(msg => ({
                role: msg.role === 'user' ? 'user' : 'model',
                parts: [{ text: msg.content }]
            }));

            const response = await ai.models.generateContent({
                model: 'gemini-1.5-flash',
                systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
                contents: [
                    ...formattedHistory,
                    { role: 'user', parts: [{ text: finalMessage }] }
                ],
                safetySettings: [
                    { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
                    { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
                    { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
                    { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
                ]
            });

            return res.json({ response: response.text });
        } else {
            // Use Pollinations for other models (ChatGPT, Claude, etc.)
            // model mapping for Pollinations
            const pollinationsModelMap = {
                'openai': 'openai',
                'claude': 'claude',
                'mistral': 'mistral'
            };
            const pModel = pollinationsModelMap[selectedModel] || 'openai';
            
            const response = await fetch('https://text.pollinations.ai/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    messages: messagesForAI,
                    model: pModel,
                    seed: Math.floor(Math.random() * 1000000),
                    jsonMode: true
                })
            });

            const data = await response.json();
            let aiResponse = "";
            
            if (data.choices && data.choices[0] && data.choices[0].message) {
                aiResponse = data.choices[0].message.content;
            } else if (typeof data === 'string') {
                aiResponse = data;
            } else {
                aiResponse = JSON.stringify(data);
            }

            return res.json({ response: aiResponse });
        }
    } catch (error) {
        console.error('Error in multi-model chat:', error);
        if (error.status === 429) {
            return res.status(429).json({ error: 'Rate limit exceeded. Try switching models in settings.' });
        }
        res.status(500).json({ error: 'Failed to generate response' });
    }
});

app.post('/api/generate-image', async (req, res) => {
    console.log('Received image generation request:', req.body.prompt);
    try {
        const { prompt } = req.body;
        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        // Use Pollinations.ai for free image generation
        const seed = Math.floor(Math.random() * 1000000);
        const imageUrl = `https://pollinations.ai/p/${encodeURIComponent(prompt)}?width=1024&height=1024&seed=${seed}&model=flux`;
        
        res.json({ imageUrl });
    } catch (error) {
        console.error('Error in image generation:', error);
        res.status(500).json({ error: 'Failed to generate image' });
    }
});

app.post('/api/weather', async (req, res) => {
    try {
        const { city } = req.body;
        if (!city) return res.status(400).json({ error: 'City is required' });

        // Step 1: Geocoding (City to Lat/Lon) using Nominatim
        const geoResponse = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city)}&limit=1`, {
            headers: { 'User-Agent': 'PradeepAI/1.0' }
        });
        const geoData = await geoResponse.json();

        if (!geoData || geoData.length === 0) {
            return res.status(404).json({ error: 'City not found' });
        }

        const { lat, lon, display_name } = geoData[0];

        // Step 2: Fetch Weather from Open-Meteo
        const weatherResponse = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m&timezone=auto`);
        const weatherData = await weatherResponse.json();

        const current = weatherData.current;
        
        // Map WMO weather codes to simple descriptions
        const weatherCodes = {
            0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
            45: 'Fog', 48: 'Depositing rime fog',
            51: 'Light drizzle', 53: 'Moderate drizzle', 55: 'Dense drizzle',
            61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain',
            71: 'Slight snow', 73: 'Moderate snow', 75: 'Heavy snow',
            80: 'Slight rain showers', 81: 'Moderate rain showers', 82: 'Violent rain showers',
            95: 'Thunderstorm', 96: 'Thunderstorm with slight hail', 99: 'Thunderstorm with heavy hail'
        };

        res.json({
            city: display_name.split(',')[0],
            temp: current.temperature_2m,
            feelsLike: current.apparent_temperature,
            humidity: current.relative_humidity_2m,
            wind: current.wind_speed_10m,
            description: weatherCodes[current.weather_code] || 'Cloudy',
            isDay: current.is_day
        });
    } catch (error) {
        console.error('Error in weather API:', error);
        res.status(500).json({ error: 'Failed to fetch weather' });
    }
});

app.listen(port, () => {
    console.log(`AI Bot Server running on http://localhost:${port}`);
});
