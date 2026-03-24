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
const logoutBtn = document.getElementById('logout-btn');
const micBtn = document.getElementById('mic-btn');
const settingsMenuBtn = document.getElementById('settings-menu-btn');
const settingsDropdown = document.getElementById('settings-dropdown');

let chatHistory = [];
const API_URL = 'http://localhost:3000/api/chat';

// Translations
const translations = {
    "English": {
        "newChat": "<i class=\"fas fa-plus\"></i> New Chat",
        "recent": "Recent",
        "currentConvo": "Current Conversation",
        "logout": "Logout",
        "welcomeHow": "How can I help you today?",
        "welcomeDesc": "Experience the power of Pradeep AI.",
        "footer": "Pradeep AI can make mistakes. Consider verifying important information."
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
        "footer": "பிரதீப் AI தவறுகளைச் செய்யலாம். முக்கியமான தகவல்களைச் சரிபார்க்கவும்."
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

function speakText(text) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        
        // Strip markdown code blocks for clearer speech
        let cleanText = text.replace(/```[\s\S]*?```/g, "Code block provided.");
        // Strip out other markdown symbols
        cleanText = cleanText.replace(/[*#_`]/g, "");
        
        const utterance = new SpeechSynthesisUtterance(cleanText);
        
        let langMap = {
            'English': 'en-US',
            'Spanish': 'es-ES',
            'Tamil': 'ta-IN',
            'French': 'fr-FR',
            'German': 'de-DE'
        };
        const selectedLang = languageSelect ? languageSelect.value : 'English';
        utterance.lang = langMap[selectedLang] || 'en-US';
        
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
            <div class="welcome-icon"><i class="fas fa-robot"></i></div>
            <h1>How can I help you today?</h1>
            <p>Experience the power of Pradeep AI.</p>
        </div>
    `;
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
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: text,
                history: chatHistory,
                language: languageSelect ? languageSelect.value : 'English'
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
