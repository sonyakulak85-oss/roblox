const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');
const TelegramBot = require('node-telegram-bot-api');

const app = express();
const port = 5000;

// Security Logic
let isAuthorized = false;

// Middleware
app.use(cors({
    origin: '*',
    credentials: true
}));
app.use(express.json());

// Using Replit Secrets for security
const token = process.env.TG_TOKEN;
const adminChatId = process.env.TG_CHAT_ID;

if (!token || !adminChatId) {
    console.error('ERROR: TG_TOKEN or TG_CHAT_ID is missing in environment variables!');
}

const bot = new TelegramBot(token, { polling: true });

// Serving index.html on the home route
app.get('/', (req, res) => { 
    console.log('Serving index.html...');
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Auth Route
app.get('/check-auth', (req, res) => { 
    let status = 'pending';
    if (isAuthorized === true) {
        status = 'approved';
        isAuthorized = false; // Reset after successful check
    } else if (isAuthorized === 'declined') {
        status = 'declined';
        isAuthorized = false; // Reset after check
    }
    res.json({ authorized: status === 'approved', status: status }); 
});

// Telegram Logic for Callback
bot.on('callback_query', (query) => {
    const action = query.data;
    if (action === 'approve') {
        isAuthorized = true;
        bot.answerCallbackQuery(query.id, { text: "Authorized!" });
        bot.editMessageText("🚨 ВХОД РАЗРЕШЕН ✅", {
            chat_id: adminChatId,
            message_id: query.message.message_id
        });
    } else {
        isAuthorized = 'declined';
        bot.answerCallbackQuery(query.id, { text: "Declined" });
        bot.editMessageText("🚨 ВХОД ОТКЛОНЕН ❌", {
            chat_id: adminChatId,
            message_id: query.message.message_id
        });
    }
});

// Логика для кнопки в Telegram 
app.post('/auth-attempt', (req, res) => { 
    console.log(`Received auth-attempt`);

    const options = {
        reply_markup: {
            inline_keyboard: [[ 
                { text: "✅ Разрешить", callback_data: 'approve' }, 
                { text: "❌ Отказать", callback_data: 'decline' } 
            ]] 
        }
    };

    bot.sendMessage(adminChatId, "🚨 ПОПЫТКА ВХОДА В АДМИНКУ!", options)
    .then(data => console.log('Telegram message sent'))
    .catch(err => console.error('Telegram error:', err));

    res.status(200).json({ status: "sent" }); 
});

app.listen(port, '0.0.0.0', () => { 
    console.log(`Server is ready on port ${port}`); 
});
