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

const token = '8385266015:AAHpN8EUWlEgoGtslfBoEoyqPycXD2gbPGw';
const adminChatId = '7863254073';
const bot = new TelegramBot(token, { polling: true });

// Serving index.html on the home route
app.get('/', (req, res) => { 
    console.log('Serving index.html...');
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Auth Route
app.get('/check-auth', (req, res) => { 
    const status = isAuthorized;
    if (isAuthorized) {
        isAuthorized = false; // Reset after successful check
    }
    res.json({ authorized: status }); 
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
        isAuthorized = false;
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
