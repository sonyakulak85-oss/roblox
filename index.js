const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');

const app = express();

// Middleware at the very top
app.use(cors({
    origin: '*',
    credentials: true
}));
app.use(express.json());

// Serving index.html on the home route
app.get('/', (req, res) => { 
    console.log('Serving index.html...');
    res.sendFile(path.join(__dirname, 'index.html'));
});

// GET route for testing auth status
app.get('/check-auth/:sessionId', (req, res) => {
    res.json({ status: 'approved' });
});

// Логика для кнопки в Telegram 
app.post('/auth-attempt', (req, res) => { 
    const { sessionId } = req.body; 
    const TG_TOKEN = "8385266015:AAHpN8EUWlEgoGtslfBoEoyqPycXD2gbPGw"; 
    const TG_CHAT_ID = "7863254073";

    console.log(`Received auth-attempt for session: ${sessionId}`);

    fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ 
            chat_id: TG_CHAT_ID, 
            text: "🚨 ПОПЫТКА ВХОДА В АДМИНКУ!", 
            reply_markup: { 
                inline_keyboard: [[ 
                    { text: "✅ Разрешить", callback_data: `approve_${sessionId}` }, 
                    { text: "❌ Отказать", callback_data: `decline_${sessionId}` } 
                ]] 
            } 
        }) 
    })
    .then(response => response.json())
    .then(data => console.log('Telegram response:', data))
    .catch(err => console.error('Telegram error:', err));

    res.status(200).json({ status: "sent" }); 
});

app.listen(5000, '0.0.0.0', () => { 
    console.log('Server is ready on port 5000'); 
});
