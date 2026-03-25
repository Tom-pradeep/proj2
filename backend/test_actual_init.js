require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');
const apiKey = process.env.GEMINI_API_KEY;

console.log('Testing actual initialization with @google/genai SDK...');

async function test() {
    try {
        if (!apiKey || apiKey === 'your_api_key_here') {
            console.log('Error: GEMINI_API_KEY not set in .env');
            return;
        }

        const client = new GoogleGenAI({ apiKey });
        console.log('Client OK');

        const modelsToTry = ['gemini-2.0-flash', 'gemini-1.5-flash', 'models/gemini-1.5-flash'];
        let success = false;

        for (const model of modelsToTry) {
            console.log(`Attempting to generate content with model: ${model}...`);
            try {
                const response = await client.models.generateContent({
                    model: model,
                    contents: [{ role: 'user', parts: [{ text: 'Say "Hello, SDK is working!"' }] }]
                });
                console.log(`Success with ${model}:`, response.text);
                success = true;
                break;
            } catch (e) {
                console.log(`Failed with ${model}:`, e.message);
            }
        }

        if (!success) {
            console.log('All model attempts failed.');
        }
    } catch (e) {
        console.error('Error:', e.message);
        if (e.response) {
            console.error('Response error details:', JSON.stringify(e.response, null, 2));
        }
    }
}

test();
