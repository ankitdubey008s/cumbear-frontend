const axios = require('axios');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

const adapter = new FileSync('shorts_db.json');
const db = low(adapter);
const TOKEN = '8814300173:AAHZ-LZAjAQl61HmTC1Y2GwjJcFFyzb_r4g';

db.defaults({ shorts: [] }).write();

async function sync() {
    try {
        console.log("Contacting Telegram Vault safely...");
        
        const res = await axios.get(`https://api.telegram.org/bot${TOKEN}/getUpdates`, {
            params: {
                timeout: 0,
                allowed_updates: JSON.stringify(["channel_post", "message"])
            },
            timeout: 15000, // Kill request after 15 seconds instead of hanging forever
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        
        const messages = res.data.result || [];
        
        if (messages.length === 0) {
            console.log("\n⚠️ No new bot updates found in the queue.");
            console.log("👉 Go to your Telegram Channel, post/forward a video now, then run this script again.");
            return;
        }

        let counter = 0;
        messages.forEach(m => {
            const msgData = m.message || m.channel_post;
            if (msgData && msgData.video) {
                const fileId = msgData.video.file_id;
                const exists = db.get('shorts').find({ file_id: fileId }).value();
                if (!exists) {
                    db.get('shorts').push({
                        id: msgData.message_id,
                        file_id: fileId,
                        title: msgData.caption || "Official Cumbear Short"
                    }).write();
                    counter++;
                }
            }
        });
        console.log(`\n✅ Sync complete! Added ${counter} new videos.`);
    } catch (error) {
        console.error("\n❌ Sync Failed.");
        if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
            console.error("Reason: Your network connection to Telegram timed out.");
            console.error("👉 Quick Fix: Turn on a VPN on your phone, or switch from Mobile Data to Wi-Fi, then try again!");
        } else {
            console.error("Error Message:", error.message);
        }
    }
}
sync();
