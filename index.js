const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const app = express();

app.use(cors({
    origin: '*',
    credentials: true
}));
app.use(express.json());

// Чтобы по ссылке открывалась проверка связи 
app.get('/', (req, res) => { 
    res.send('✅ Server is Running!'); 
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
    }); 
    res.status(200).json({ status: "sent" }); 
});

app.listen(5000, '0.0.0.0', () => { 
    console.log('Server is ready on port 5000'); 
});
