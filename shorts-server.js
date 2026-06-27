const express = require('express');
const axios = require('axios');
const cors = require('cors');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const http = require('http');

const app = express();
const adapter = new FileSync('shorts_db.json');
const db = low(adapter);

const TOKEN = '8814300173:AAHZ-LZAjAQl61HmTC1Y2GwjJcFFyzb_r4g';

axios.defaults.httpAgent = new http.Agent({ keepAlive: true, maxSockets: 50 });

app.use(cors({ origin: '*' }));
app.use(express.json());

db.defaults({ shorts: [] }).write();
const fileCache = new Map();

// API: Get entire feed list
app.get('/api/shorts', (req, res) => {
    db.read();
    res.json(db.get('shorts').value() || []);
});

// API: Handle Double Tap Like Counter Synchronization
app.post('/api/shorts/like', (req, res) => {
    const { file_id } = req.body;
    db.read();
    
    let item = db.get('shorts').find({ file_id }).value();
    if (!item) {
        // Fallback generator to insert into database if file object is clean
        item = { file_id, title: "Vault Video Resource", likes: 1000, comments: [] };
        db.get('shorts').push(item).write();
    }
    
    const currentLikes = item.likes || 0;
    db.get('shorts').find({ file_id }).assign({ likes: currentLikes + 1 }).write();
    
    res.json(db.get('shorts').find({ file_id }).value());
});

// API: Handle Interactive Real-time Comments Updates
app.post('/api/shorts/comment', (req, res) => {
    const { file_id, username, text } = req.body;
    db.read();
    
    let item = db.get('shorts').find({ file_id }).value();
    if (!item) {
        item = { file_id, title: "Vault Video Resource", likes: 1000, comments: [] };
        db.get('shorts').push(item).write();
    }
    
    const commentsList = item.comments || [];
    const newComment = {
        id: "COM_" + Date.now() + "_" + Math.floor(Math.random() * 100),
        username,
        text,
        timestamp: new Date().toISOString()
    };
    
    commentsList.push(newComment);
    db.get('shorts').find({ file_id }).assign({ comments: commentsList }).write();
    
    res.json(db.get('shorts').find({ file_id }).value());
});

// API: Optimized Stream Proxy Layer with Headers Forward Passing
app.get('/video/:file_id', async (req, res) => {
    const { file_id } = req.params;
    try {
        let filePath = fileCache.get(file_id);
        if (!filePath) {
            const fileRes = await axios.get(`https://api.telegram.org/bot${TOKEN}/getFile?file_id=${file_id}`, { timeout: 4000 });
            if (fileRes.data?.result) {
                filePath = fileRes.data.result.file_path;
                fileCache.set(file_id, filePath);
            } else {
                return res.status(400).send("Invalid ID");
            }
        }

        const streamUrl = `https://api.telegram.org/file/bot${TOKEN}/${filePath}`;
        const headers = { 'User-Agent': 'Mozilla/5.0' };
        if (req.headers.range) headers['Range'] = req.headers.range;

        const telegramResponse = await axios({
            method: 'get',
            url: streamUrl,
            responseType: 'stream',
            headers: headers,
            timeout: 12000
        });

        res.status(telegramResponse.status);
        ['content-type', 'content-length', 'content-range', 'accept-ranges'].forEach(h => {
            if (telegramResponse.headers[h]) res.setHeader(h, telegramResponse.headers[h]);
        });

        telegramResponse.data.pipe(res);
        req.on('close', () => telegramResponse.data.destroy());
    } catch (err) {
        if (!res.headersSent) res.status(200).send(""); 
    }
});

app.listen(3002, () => console.log('✅ Custom Optimized Database Engine Running on Port 3002'));
