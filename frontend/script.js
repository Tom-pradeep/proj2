const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const messagesContainer = document.getElementById('messages-container');
const newChatBtn = document.getElementById('new-chat-btn');

const loginOverlay = document.getElementById('login-overlay');
const emailInput = document.getElementById('email-input');
const passwordInput = document.getElementById('password-input');
const loginBtn = document.getElementById('login-btn');
const authError = document.getElementById('auth-error');
const languageSelect = document.getElementById('language-select');
const modelSelect = document.getElementById('model-select');
const logoutBtn = document.getElementById('logout-btn');
const micBtn = document.getElementById('mic-btn');
const settingsMenuBtn = document.getElementById('settings-menu-btn');
const settingsDropdown = document.getElementById('settings-dropdown');

let chatHistory = [];
let isAutoSpeak = false;
const autoSpeakBtn = document.getElementById('auto-speak-btn');
// ============================================================
// 🚀 DEPLOYMENT CONFIG
// For production: replace the BACKEND_URL with your Railway or
// Render backend URL, e.g.:
//   const BACKEND_URL = 'https://pradeep-ai.up.railway.app';
// For local dev: leave as-is (localhost:3001)
// ============================================================
const BACKEND_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3001'
    : 'https://YOUR-BACKEND-URL.up.railway.app'; // <-- Replace with your deployed backend URL

const API_URL = `${BACKEND_URL}/api/chat`;

// Translations
const translations = {
    "English": {
        "newChat": "<i class=\"fas fa-plus\"></i> New Chat",
        "recent": "Recent",
        "currentConvo": "Current Conversation",
        "logout": "Logout",
        "welcomeHow": "How can I help you today?",
        "welcomeDesc": "Experience the next generation of AI assistance.",
        "footer": "Pradeep AI can make mistakes. Consider verifying important information.",
        "about": "About",
        "aiModel": "AI Model",
        "aboutTitle": "About Pradeep AI",
        "aboutDesc": "Pradeep AI is a premium, multi-talented AI assistant designed for seamless communication and creativity.",
        "featuresTitle": "Core Features:",
        "featureVoice": "Voice Chat AI:",
        "featureImage": "Instant Image Generation:",
        "featureMultilang": "Multi-language Support:",
        "featureSecure": "Private & Secure:",
        "builtWith": "Built With: Node.js, Express, Gemini API, and Pollinations AI.",
        "clearChat": "Clear Chat"
    },
    "Spanish": {
        "newChat": "<i class=\"fas fa-plus\"></i> Nuevo Chat",
        "recent": "Reciente",
        "currentConvo": "Conversación actual",
        "logout": "Cerrar sesión",
        "welcomeHow": "¿Cómo puedo ayudarte hoy?",
        "welcomeDesc": "Experimenta el poder de Pradeep AI.",
        "footer": "Pradeep AI puede cometer errores. Considera verificar la información importante."
    },
    "Tamil": {
        "newChat": "<i class=\"fas fa-plus\"></i> புதிய அரட்டை",
        "recent": "சமீபத்திய",
        "currentConvo": "தற்போதைய உரையாடல்",
        "logout": "வெளியேறு",
        "welcomeHow": "இன்று நான் உங்களுக்கு எப்படி உதவ முடியும்?",
        "welcomeDesc": "பிரதீப் AI இன் சக்தியை அனுபவிக்கவும்.",
        "footer": "பிரதீப் AI தவறுகளைச் செய்யலாம். முக்கியமான தகவல்களைச் சரிபார்க்கவும்.",
        "about": "பற்றி",
        "aiModel": "AI மாதிரி",
        "aboutTitle": "பிரதீப் AI பற்றி",
        "aboutDesc": "பிரதீப் AI என்பது தடையற்ற தொடர்பு மற்றும் படைப்பாற்றலுக்காக வடிவமைக்கப்பட்ட ஒரு பிரீமியம் AI உதவியாளர்.",
        "featuresTitle": "முக்கிய அம்சங்கள்:",
        "featureVoice": "குரல் அரட்டை AI:",
        "featureImage": "உடனடி பட உருவாக்கம்:",
        "featureMultilang": "பல மொழி ஆதரவு:",
        "featureSecure": "தனிப்பட்ட மற்றும் பாதுகாப்பானது:",
        "builtWith": "உருவாக்கப்பட்டது: Node.js, Express, Gemini API மற்றும் Pollinations AI.",
        "clearChat": "அரட்டையை அழி"
    },
    "French": {
        "newChat": "<i class=\"fas fa-plus\"></i> Nouvelle disc.",
        "recent": "Récent",
        "currentConvo": "Conversation actuelle",
        "logout": "Déconnexion",
        "welcomeHow": "Comment puis-je vous aider aujourd'hui ?",
        "welcomeDesc": "Découvrez la puissance de Pradeep AI.",
        "footer": "Pradeep AI peut faire des erreurs. Pensez à vérifier les informations importantes."
    },
    "German": {
        "newChat": "<i class=\"fas fa-plus\"></i> Neuer Chat",
        "recent": "Kürzlich",
        "currentConvo": "Aktuelle Konversation",
        "logout": "Abmelden",
        "welcomeHow": "Wie kann ich Ihnen heute helfen?",
        "welcomeDesc": "Erleben Sie die Kraft von Pradeep AI.",
        "footer": "Pradeep AI kann Fehler machen. Bitte überprüfen Sie wichtige Informationen."
    }
};

const placeholders = {
    "English": "Message AI...",
    "Spanish": "Mensaje AI...",
    "Tamil": "AIக்கு செய்தி அனுப்பவும்...",
    "French": "Message à l'IA...",
    "German": "Nachricht an KI..."
};

function updateUIForLanguage(lang) {
    const t = translations[lang] || translations["English"];
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (t[key]) {
            el.innerHTML = t[key];
        }
    });
    
    const messageInput = document.getElementById('message-input');
    if(messageInput) {
        messageInput.placeholder = placeholders[lang] || placeholders["English"];
    }
}

if(languageSelect) {
    languageSelect.addEventListener('change', (e) => {
        updateUIForLanguage(e.target.value);
    });
}

// Auth Logic
function checkAuth() {
    const activeEmail = localStorage.getItem('pradeep_ai_active_user');
    if (!activeEmail) {
        loginOverlay.classList.remove('hidden');
    } else {
        loginOverlay.classList.add('hidden');
    }
}

loginBtn.addEventListener('click', () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    
    if (!email || !password) {
        authError.style.display = 'block';
        authError.innerText = 'Please enter both email and password.';
        return;
    }

    let users = JSON.parse(localStorage.getItem('pradeep_ai_users')) || {};

    if (users[email]) {
        // User exists, attempt login
        if (users[email] === password) {
            localStorage.setItem('pradeep_ai_active_user', email);
            authError.style.display = 'none';
            checkAuth();
        } else {
            authError.style.display = 'block';
            authError.innerText = 'Incorrect password.';
        }
    } else {
        // New user, sign up
        users[email] = password;
        localStorage.setItem('pradeep_ai_users', JSON.stringify(users));
        localStorage.setItem('pradeep_ai_active_user', email);
        authError.style.display = 'none';
        checkAuth();
    }
});

logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('pradeep_ai_active_user');
    passwordInput.value = '';
    checkAuth();
});

checkAuth();
updateUIForLanguage(languageSelect ? languageSelect.value : "English");
checkSystemStatus();
setInterval(checkSystemStatus, 30000); // Check every 30 seconds

if (autoSpeakBtn) {
    autoSpeakBtn.addEventListener('click', () => {
        isAutoSpeak = !isAutoSpeak;
        if (isAutoSpeak) {
            autoSpeakBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
            autoSpeakBtn.style.color = '#3b82f6';
        } else {
            autoSpeakBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
            autoSpeakBtn.style.color = 'var(--text-secondary)';
            window.speechSynthesis.cancel();
        }
    });
}

// Voice Chat Logic (STT & TTS)
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition;
if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    
    recognition.onstart = function() {
        micBtn.classList.add('listening');
    };
    
    recognition.onresult = function(event) {
        const transcript = event.results[0][0].transcript;
        messageInput.value = transcript;
        sendMessage(); // auto send transcribed text
    };
    
    recognition.onerror = function(event) {
        console.error('Speech recognition error:', event.error);
        micBtn.classList.remove('listening');
    };
    
    recognition.onend = function() {
        micBtn.classList.remove('listening');
    };
} else {
    micBtn.style.display = 'none'; // Hide mic if browser doesn't support it
}

micBtn.addEventListener('click', () => {
    if (recognition) {
        if (micBtn.classList.contains('listening')) {
            recognition.stop();
        } else {
            let langMap = {
                'English': 'en-US',
                'Spanish': 'es-ES',
                'Tamil': 'ta-IN',
                'French': 'fr-FR',
                'German': 'de-DE'
            };
            const selectedLang = languageSelect ? languageSelect.value : 'English';
            recognition.lang = langMap[selectedLang] || 'en-US';
            recognition.start();
        }
    }
});

function detectLanguage(text) {
    if (/[\u0B80-\u0BFF]/.test(text)) return 'ta-IN';
    if (/[áéíóúüñÁÉÍÓÚÜÑ]/.test(text)) return 'es-ES'; // Hint for Spanish
    if (/[àâäéèêëïîôöùûüÿçÀÂÄÉÈÊËÏÎÔÖÙÛÜŸÇ]/.test(text)) return 'fr-FR'; // Hint for French
    if (/[äöüßÄÖÜ]/.test(text)) return 'de-DE'; // Hint for German
    return 'en-US';
}

function speakText(text) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        
        // Strip markdown code blocks for clearer speech
        let cleanText = text.replace(/```[\s\S]*?```/g, "Code block provided.");
        // Strip out other markdown symbols
        cleanText = cleanText.replace(/[*#_`]/g, "");
        
        const utterance = new SpeechSynthesisUtterance(cleanText);
        
        // Auto-detect language for clarity
        const detectedLang = detectLanguage(cleanText);
        utterance.lang = detectedLang;
        
        window.speechSynthesis.speak(utterance);
    }
}

if (settingsMenuBtn && settingsDropdown) {
    settingsMenuBtn.addEventListener('click', () => {
        settingsDropdown.classList.toggle('hidden');
    });
    
    // Close when clicking outside
    document.addEventListener('click', (e) => {
        if (!settingsMenuBtn.contains(e.target) && !settingsDropdown.contains(e.target)) {
            settingsDropdown.classList.add('hidden');
        }
    });
}

// View Navigation Logic
const navItems = document.querySelectorAll('.nav-item[data-target]');
const appViews = document.querySelectorAll('.app-view');

navItems.forEach(item => {
    item.addEventListener('click', () => {
        // Remove active class from all navs and hide all views
        navItems.forEach(n => n.classList.remove('active'));
        appViews.forEach(v => v.classList.add('hidden'));
        
        // Activate current tab and unhide content
        item.classList.add('active');
        const targetId = item.getAttribute('data-target');
        document.getElementById(targetId).classList.remove('hidden');
        
        // Close sidebar on mobile
        if (window.innerWidth <= 768) {
            document.getElementById('sidebar').classList.remove('open');
        }
    });
});

// Auto-resize textarea
messageInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
    
    // Manage send button state
    if (this.value.trim().length > 0) {
        sendBtn.style.background = 'linear-gradient(135deg, #6366f1, #a855f7)';
        sendBtn.style.color = 'white';
    } else {
        sendBtn.style.background = 'var(--text-secondary)';
        sendBtn.style.color = 'var(--bg-main)';
    }
});

// Handle enter key to send
messageInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

sendBtn.addEventListener('click', sendMessage);

newChatBtn.addEventListener('click', () => {
    chatHistory = [];
    messagesContainer.innerHTML = `
        <div class="welcome-screen">
            <div class="welcome-icon"><i class="fas fa-bolt"></i></div>
            <h1 data-i18n="welcomeHow">How can I help you today?</h1>
            <p data-i18n="welcomeDesc">Experience the next generation of AI assistance.</p>
            <div class="suggestions-grid">
                <div class="suggestion-card" data-prompt="Summarize a long article or document for me.">
                    <i class="fas fa-file-alt"></i>
                    <h3>Summarize text</h3>
                    <p>Get the key points from any text</p>
                </div>
                <div class="suggestion-card" data-prompt="Help me write a professional email to my boss about a promotion.">
                    <i class="fas fa-pen-nib"></i>
                    <h3>Help me write</h3>
                    <p>Draft emails, essays, or stories</p>
                </div>
                <div class="suggestion-card" data-prompt="Explain quantum physics like I'm five years old.">
                    <i class="fas fa-lightbulb"></i>
                    <h3>Explain concepts</h3>
                    <p>Simple answers to complex questions</p>
                </div>
                <div class="suggestion-card" data-prompt="Generate a beautiful image of a cyberpunk city at night.">
                    <i class="fas fa-magic"></i>
                    <h3>Imagine images</h3>
                    <p>Turn your ideas into visuals</p>
                </div>
            </div>
        </div>
    `;
    updateUIForLanguage(languageSelect ? languageSelect.value : "English");
});

messagesContainer.addEventListener('click', (e) => {
    const card = e.target.closest('.suggestion-card');
    if (card) {
        const prompt = card.getAttribute('data-prompt');
        messageInput.value = prompt;
        messageInput.style.height = 'auto';
        messageInput.style.height = (messageInput.scrollHeight) + 'px';
        sendMessage();
    }
});

async function sendMessage() {
    const text = messageInput.value.trim();
    if (!text) return;

    // Remove welcome screen if present
    const welcomeScreen = document.querySelector('.welcome-screen');
    if (welcomeScreen) {
        welcomeScreen.remove();
    }

    // Add user message to UI
    appendMessage(text, 'user');
    
    // Clear input
    messageInput.value = '';
    messageInput.style.height = 'auto';
    sendBtn.style.background = 'var(--text-secondary)';

    // Add loading indicator
    const loadingId = appendLoading();

    try {
        // Send request to backend
        // Weather Detection
        const weatherMatch = text.match(/weather in ([\w\s,]+)/i) || text.match(/([\w\s,]+) weather/i);
        if (weatherMatch) {
            const city = weatherMatch[1].trim();
            handleWeatherQuery(city);
        }

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: text,
                history: chatHistory,
                language: languageSelect ? languageSelect.value : 'English',
                model: modelSelect ? modelSelect.value : 'gemini'
            })
        });

        const data = await response.json();

        // Remove loading state
        removeLoading(loadingId);

        if (response.ok) {
            // Update history
            chatHistory.push({ role: 'user', content: text });
            chatHistory.push({ role: 'model', content: data.response });
            
            // Render Bot response with markdown
            appendMessage(data.response, 'bot', true);
        } else if (response.status === 429) {
            appendMessage("Rate limit reached for the current AI (Gemini). **Tip:** Go to Settings and switch the 'AI Model' to **ChatGPT** or **Claude** to continue chatting instantly!", 'bot');
        } else {
            appendMessage(`Error: ${data.error || 'Failed to connect to AI server'}`, 'bot');
        }

    } catch (error) {
        console.error('Error:', error);
        removeLoading(loadingId);
        appendMessage('Error: Unable to reach the server. Make sure the backend is running.', 'bot');
    }
}

function appendMessage(content, sender, isMarkdown = false) {
    const row = document.createElement('div');
    row.classList.add('message-row', `${sender}-message`);

    const icon = sender === 'user' ? '<i class="fas fa-user"></i>' : '<i class="fas fa-robot"></i>';
    
    let displayContent = content;
    if (isMarkdown && sender === 'bot') {
        // Use marked.js configured optionally to support syntax highlighting
        displayContent = marked.parse(content);
    } else {
        // Escape HTML for user input
        displayContent = content.replace(/</g, "&lt;").replace(/>/g, "&gt;");
        displayContent = `<p>${displayContent}</p>`;
    }

    // Determine avatar and background classes based on sender
    let copyButtonHTML = '';
    let contentClasses = 'message-content';

    if (sender === 'bot') {
        copyButtonHTML = `
            <button class="copy-btn" onclick="speakTextFromDOM(this)" title="Read aloud" style="right: 95px;" type="button">
                <i class="fas fa-volume-up"></i>
            </button>
            <button class="copy-btn" onclick="copyToClipboard(this)" title="Copy message" type="button">
                <i class="far fa-copy"></i> Copy
            </button>
        `;
        contentClasses += ' colorful-text message-bot-container';
    }

    row.innerHTML = `
        <div class="${contentClasses}">
            <div class="actual-text">${displayContent}</div>
            ${copyButtonHTML}
        </div>
    `;

    messagesContainer.appendChild(row);
    scrollToBottom();

    // Auto-speak if enabled
    if (sender === 'bot' && isAutoSpeak) {
        speakText(content);
    }
}

function copyToClipboard(button) {
    const messageContent = button.parentElement;
    const actualTextContainer = messageContent.querySelector('.actual-text');
    const textToCopy = actualTextContainer ? (actualTextContainer.innerText || actualTextContainer.textContent) : '';

    if (!textToCopy) return;

    navigator.clipboard.writeText(textToCopy).then(() => {
    const originalText = button.innerHTML;
        button.innerHTML = '<i class="fas fa-check"></i> Copied';
        button.style.color = '#10b981';
        setTimeout(() => {
            button.innerHTML = originalText;
            button.style.color = '';
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy text: ', err);
    });
}

function speakTextFromDOM(button) {
    const messageContent = button.parentElement;
    const actualTextContainer = messageContent.querySelector('.actual-text');
    const textToSpeak = actualTextContainer ? (actualTextContainer.innerText || actualTextContainer.textContent) : '';
    if (textToSpeak) {
        speakText(textToSpeak);
        const originalIcon = button.innerHTML;
        button.innerHTML = '<i class="fas fa-volume-up" style="color: #10b981;"></i>';
        setTimeout(() => {
            button.innerHTML = originalIcon;
        }, 3000);
    }
}

function appendLoading() {
    const id = 'loading-' + Date.now();
    const row = document.createElement('div');
    row.classList.add('message-row', 'bot-message');
    row.id = id;

    row.innerHTML = `
        <div class="message-content message-bot-container">
            <div class="typing-indicator">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        </div>
    `;

    messagesContainer.appendChild(row);
    scrollToBottom();
    return id;
}

function removeLoading(id) {
    const el = document.getElementById(id);
    if (el) {
        el.remove();
    }
}

function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Mobile sidebar toggle
const menuBtn = document.getElementById('mobile-menu-btn');
const sidebar = document.getElementById('sidebar');

if(menuBtn) {
    menuBtn.addEventListener('click', () => {
        sidebar.classList.toggle('open');
    });
}

// Image Generation Logic
const imagePromptInput = document.getElementById('image-prompt');
const generateImageBtn = document.getElementById('generate-image-btn');
const imageResultContainer = document.getElementById('image-result-container');

if (generateImageBtn) {
    generateImageBtn.addEventListener('click', generateImage);
}

if (imagePromptInput) {
    imagePromptInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            generateImage();
        }
    });
}

async function generateImage() {
    const prompt = imagePromptInput.value.trim();
    if (!prompt) return;

    console.log('Generating image for:', prompt);
    // Show loading state
    generateImageBtn.disabled = true;
    generateImageBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
    imageResultContainer.innerHTML = `
        <div class="image-loading">
            <div class="image-loader"></div>
            <p>Creating your masterpiece...</p>
        </div>
    `;

    try {
        const response = await fetch(`${BACKEND_URL}/api/generate-image`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ prompt })
        });

        console.log('Image API response status:', response.status);
        const data = await response.json();

        if (response.ok) {
            console.log('Image URL received:', data.imageUrl);
            imageResultContainer.innerHTML = `<img src="${data.imageUrl}" alt="${prompt}" onload="this.parentElement.style.border='none'">`;
        } else {
            console.error('Image API error:', data.error);
            imageResultContainer.innerHTML = `<p style="color: #ef4444; padding: 20px;">Error: ${data.error || 'Failed to generate image'}</p>`;
        }
    } catch (error) {
        console.error('Error generating image (network error?):', error);
        imageResultContainer.innerHTML = `<p style="color: #ef4444; padding: 20px;">Error: Unable to connect to the AI server. Please try again.</p>`;
    } finally {
        generateImageBtn.disabled = false;
        generateImageBtn.innerHTML = '<i class="fas fa-magic"></i> Generate';
    }
}

const clearChatBtn = document.getElementById('clear-chat-btn');
if (clearChatBtn) {
    clearChatBtn.addEventListener('click', () => {
        if (confirm("Are you sure you want to clear the chat history?")) {
            chatHistory = [];
            const messagesContainer = document.getElementById('chat-messages');
            if (messagesContainer) {
                messagesContainer.innerHTML = `
                    <div class="welcome-screen">
                        <div class="welcome-logo">
                            <i class="fas fa-robot"></i>
                        </div>
                        <h1 data-i18n="welcomeHow">How can I help you today?</h1>
                        <p data-i18n="welcomeDesc">Experience the power of Pradeep AI.</p>
                    </div>
                `;
            }
            updateUIForLanguage(languageSelect ? languageSelect.value : "English");
        }
    });
}

async function checkSystemStatus() {
    const statusDot = document.getElementById('system-status-dot');
    const statusText = document.getElementById('system-status-text');
    if (!statusDot || !statusText) return;

    try {
        const response = await fetch(`${BACKEND_URL}/api/ping`);
        if (response.ok) {
            statusDot.style.background = '#10b981';
            statusText.innerText = 'System: Online';
            statusText.style.color = '#10b981';
        } else {
            statusDot.style.background = '#f59e0b';
            statusText.innerText = 'System: Error';
            statusText.style.color = '#f59e0b';
        }
    } catch (error) {
        statusDot.style.background = '#ef4444';
        statusText.innerText = 'System: Offline';
        statusText.style.color = '#ef4444';
    }
}

async function handleWeatherQuery(city) {
    try {
        const response = await fetch(`${BACKEND_URL}/api/weather`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ city })
        });
        const data = await response.json();
        if (response.ok) {
            appendWeatherCard(data);
        }
    } catch (error) {
        console.error('Weather error:', error);
    }
}

function appendWeatherCard(data) {
    const card = document.createElement('div');
    card.className = 'weather-card';
    card.innerHTML = `
        <div class="weather-header">
            <div class="weather-info">
                <span class="weather-city">${data.city}</span>
                <span class="weather-desc">${data.description}</span>
            </div>
            <i class="fas ${data.isDay ? 'fa-sun' : 'fa-moon'}" style="font-size: 1.5rem;"></i>
        </div>
        <div class="weather-temp">${Math.round(data.temp)}°C</div>
        <div class="weather-details">
            <span><i class="fas fa-droplet"></i> ${data.humidity}%</span>
            <span><i class="fas fa-wind"></i> ${data.wind} km/h</span>
            <span>Feels: ${Math.round(data.feelsLike)}°</span>
        </div>
    `;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message bot';
    messageDiv.appendChild(card);
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

checkSystemStatus();
setInterval(checkSystemStatus, 30000);

