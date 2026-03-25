const express = require('express');
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

const cors = require('cors');
require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

const app = express();
const port = process.env.PORT || 3001;

app.use(cors({ origin: '*' }));
app.use(express.json());

app.get('/api/ping', (req, res) => {
    res.json({ status: "ok", timestamp: new Date() });
});

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY;
let ai;
if (apiKey && apiKey !== 'your_api_key_here') {
    try {
        ai = new GoogleGenAI({ apiKey });
        console.log('Gemini AI Client initialized successfully');
    } catch (e) {
        console.error('Gemini init error:', e.message);
    }
}

const getSystemInstruction = () => {
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    
    return `You are Pradeep AI, a highly advanced, empathetic, and versatile AI assistant. 
Current Date: ${dateStr}
Current Time: ${timeStr}

CORE CAPABILITIES:
1.  **Versatility**: Handle all types of questions professionally.
2.  **Coding**: You are an expert programmer. When writing code:
    -   Use proper markdown formatting (e.g., \`\`\`javascript).
    -   Provide clean, well-commented, and modern code.
    -   Explain the code simply but accurately.
3.  **Weather**: If the user asks about weather, provide helpful general information or suggest checking a reliable source if precise real-time data is needed (though you can fetch it if integrate tool call).
4.  **Visuals**: Use markdown for images: ![Desc](https://pollinations.ai/p/[PROMPT]?width=1024&height=1024&seed=[SEED]&model=flux)
5.  **Tone**: Professional, friendly, and helpful.
6.  **Language**: Respond in the EXACT same language as the user (e.g., Tamil if they ask in Tamil).

AESTHETICS:
- Your interface is premium, colorful, and glowy. Mention this subtlely if asked about your "look".`;
};

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

        // --- Weather Detection & Tooling (Simplified) ---
        let weatherInfo = "";
        const weatherKeywords = ['weather', 'temperature', 'climate', 'forecast', 'வானிலை'];
        if (weatherKeywords.some(kw => message.toLowerCase().includes(kw))) {
            try {
                // Extract city - very basic extraction for this example
                const cityMatch = message.match(/(?:in|at|for)\s+([a-zA-Z\s]+)/i);
                const city = cityMatch ? cityMatch[1].trim() : 'Chennai'; // Default or extracted
                
                // Call internal weather logic (refactored for reuse)
                const weatherData = await getWeatherData(city);
                if (weatherData && !weatherData.error) {
                    weatherInfo = `\n[Real-time Weather info for ${weatherData.city}: ${weatherData.temp}°C, ${weatherData.description}, Humidity: ${weatherData.humidity}%]`;
                }
            } catch (e) {
                console.warn('Weather auto-fetch failed:', e.message);
            }
        }
        // ------------------------------------------------

        const currentSystemInstruction = getSystemInstruction();

        const messagesForAI = [
            { role: 'system', content: currentSystemInstruction },
            ...recentHistory.map(msg => ({
                role: msg.role === 'user' ? 'user' : 'assistant',
                content: msg.content
            })),
            { role: 'user', content: finalMessage + (weatherInfo ? `\n\nNote for AI: Here is the actual weather data to use in your response: ${weatherInfo}` : "") }
        ];

        if (selectedModel === 'gemini') {
            if (!ai) {
                return res.json({ response: "Gemini is not configured. Please select ChatGPT or Claude from settings for a free experience." });
            }
            
            const formattedHistory = recentHistory.map(msg => ({
                role: msg.role === 'user' ? 'user' : 'model',
                parts: [{ text: msg.content }]
            }));

            let textResponse;
            try {
                const response = await ai.models.generateContent({
                    model: 'gemini-1.5-flash',
                    contents: [
                        ...formattedHistory,
                        { role: 'user', parts: [{ text: finalMessage }] }
                    ],
                    systemInstruction: { parts: [{ text: currentSystemInstruction }] },
                    safetySettings: [
                        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
                        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
                        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
                        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
                    ]
                });
                textResponse = response.text;
                console.log('Gemini native response success');
            } catch (geminiError) {
                console.warn('Gemini Native API Error (falling back to Pollinations):', geminiError.message);
                if (geminiError.message.includes('NOT_FOUND')) {
                    console.info('Tip: Verify your API key has access to the gemini-1.5-flash model in Google AI Studio.');
                }
                const pollResponse = await fetch('https://text.pollinations.ai/', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        messages: [
                            { role: 'system', content: currentSystemInstruction },
                            ...recentHistory.map(msg => ({
                                role: msg.role === 'user' ? 'user' : 'assistant',
                                content: msg.content
                            }))
                        ],
                        model: 'openai',
                        private: true
                    })
                });
                if (!pollResponse.ok) throw new Error('Pollinations Gemini fallback failed');
                const pollData = await pollResponse.text();
                try {
                    const parsed = JSON.parse(pollData);
                    textResponse = parsed.choices ? parsed.choices[0].message.content : (parsed.response || pollData);
                } catch (e) {
                    textResponse = pollData;
                }
            }

            return res.json({ response: textResponse });
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

async function getWeatherData(city) {
    // Step 1: Geocoding (City to Lat/Lon) using Nominatim
    const geoResponse = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city)}&limit=1`, {
        headers: { 'User-Agent': 'PradeepAI/1.0' }
    });
    const geoData = await geoResponse.json();

    if (!geoData || geoData.length === 0) return { error: 'City not found' };

    const { lat, lon, display_name } = geoData[0];

    // Step 2: Fetch Weather from Open-Meteo
    const weatherResponse = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m&timezone=auto`);
    const weatherData = await weatherResponse.json();

    const current = weatherData.current;
    const weatherCodes = {
        0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
        45: 'Fog', 48: 'Depositing rime fog',
        51: 'Light drizzle', 53: 'Moderate drizzle', 55: 'Dense drizzle',
        61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain',
        71: 'Slight snow', 73: 'Moderate snow', 75: 'Heavy snow',
        80: 'Slight rain showers', 81: 'Moderate rain showers', 82: 'Violent rain showers',
        95: 'Thunderstorm', 96: 'Thunderstorm with slight hail', 99: 'Thunderstorm with heavy hail'
    };

    return {
        city: display_name.split(',')[0],
        temp: current.temperature_2m,
        feelsLike: current.apparent_temperature,
        humidity: current.relative_humidity_2m,
        wind: current.wind_speed_10m,
        description: weatherCodes[current.weather_code] || 'Cloudy',
        isDay: current.is_day
    };
}

app.post('/api/weather', async (req, res) => {
    try {
        const { city } = req.body;
        if (!city) return res.status(400).json({ error: 'City is required' });
        const data = await getWeatherData(city);
        if (data.error) return res.status(404).json({ error: data.error });
        res.json(data);
    } catch (error) {
        console.error('Error in weather API:', error);
        res.status(500).json({ error: 'Failed to fetch weather' });
    }
});

app.listen(port, () => {
    console.log(`AI Bot Server running on http://localhost:${port}`);
});
