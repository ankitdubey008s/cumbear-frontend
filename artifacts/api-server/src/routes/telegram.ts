import { Router } from "express";

const router = Router();

const BOT_TOKEN = process.env["TELEGRAM_BOT_TOKEN"] || "8094728254:AAEUBEduJSGLcTvRirwixpdVjqJ8VI5KY80";
const CHAT_ID = process.env["TELEGRAM_CHAT_ID"] || "";
const TG = `https://api.telegram.org/bot${BOT_TOKEN}`;

// In-memory video store (survives as long as server runs)
const videoCache: Record<string, any> = {};
let updateOffset = 0;

// Universal fetch tool designed to run directly on the native runtime safely
async function tgFetch(method: string, body?: object): Promise<any> {
  const res = await fetch(`${TG}/${method}`, {
    method: body ? "POST" : "GET",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json() as Promise<any>;
}

// Background scraper utility for pulling from the 10 specified target endpoint feeds
async function fetchProviderJSON(url: string): Promise<any> {
  try {
    const res = await fetch(url, {
      headers: { "Accept": "application/json" }
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// Maps third-party response arrays cleanly into your specified object schema
async function runMultiProviderScrape(query: string): Promise<any[]> {
  const encoded = encodeURIComponent(query);
  const standardizedItems: any[] = [];

  const providerUrls = [
    `https://www.eporner.com/api/v2/video/search/?query=${encoded}&per_page=30&format=json`,
    `https://www.pornhub.com/webmasters/search?search=${encoded}`,
    `https://api.redtube.com/?data=redtube.Videos.searchVideos&search=${encoded}&output=json`,
    `https://api.tube8.com/v1/v1.php?action=search_videos&search=${encoded}&output=json`,
    `https://spankbang.com/api/v3/videos/search?q=${encoded}`,
    `https://www.youporn.com/api/webmasters/search/?search=${encoded}`,
    `https://www.xvideos.com/api/v2/search?q=${encoded}`,
    `https://api.sunporno.com/v1/videos/search?keyword=${encoded}`,
    `https://www.thumbzilla.com/api/search?q=${encoded}`,
    `https://xhamster.com/api/v2/search/videos?q=${encoded}`
  ];

  for (const url of providerUrls) {
    const data = await fetchProviderJSON(url);
    if (!data) continue;

    let videoList: any[] = [];
    if (Array.isArray(data.videos)) videoList = data.videos;
    else if (Array.isArray(data.video)) videoList = data.video;
    else if (data.results && Array.isArray(data.results)) videoList = data.results;

    for (const item of videoList) {
      if (!item) continue;

      // Extract details according to the required parameters
      standardizedItems.push({
        title: item.title || "Video Title Text Here",
        duration: item.duration || "00:00",
        thumbnail: item.thumbnail || item.thumb || item.default_thumb || "URL string to the image file",
        embed_url: item.embed_url || item.embed || item.iframe_url || "URL string to the player iframe link"
      });
    }
  }

  return standardizedItems;
}

// Checks the Telegram storage channel or chat updates natively
async function pollUpdates() {
  try {
    const data = await tgFetch(`getUpdates?offset=${updateOffset}&limit=100&timeout=0&allowed_updates=${encodeURIComponent('["message","channel_post"]')}`);
    if (!data.ok) return;
    for (const update of data.result as any[]) {
      updateOffset = Math.max(updateOffset, update.update_id + 1);
      const msg = update.message || update.channel_post;
      if (!msg?.text) continue;
      try {
        const parsed = JSON.parse(msg.text);
        if (parsed._type === "cumbear_video" && parsed.id) {
          videoCache[parsed.id] = { 
            ...parsed, 
            telegramMsgId: msg.message_id,
            share_link: `/?v=${msg.message_id}`
          };
        }
      } catch { /* parse fallback */ }
    }
  } catch { /* fail silently */ }
}

// GET /api/telegram/videos — Returns storage log records parsed natively
router.get("/videos", async (req, res) => {
  await pollUpdates();
  res.json({ ok: true, videos: Object.values(videoCache) });
});

// POST /api/telegram/populate-feed — Automated background search sync worker loop
router.post("/populate-feed", async (req, res) => {
  const queryTerm = req.body.query || "Mom";
  
  // Triggers multi-endpoint stream processing
  const scrapedData = await runMultiProviderScrape(queryTerm);

  res.json({ 
    ok: true, 
    message: `Aggregation active. Found ${scrapedData.length} records matching search matrices.` 
  });

  // Iterates background pushing log queue with slight delay increments
  (async () => {
    let indexIdCounter = Date.now();
    for (const record of scrapedData) {
      const generatedId = `vid_${indexIdCounter++}`;
      const payload = { 
        _type: "cumbear_video", 
        id: generatedId,
        ...record 
      };

      videoCache[generatedId] = payload;

      if (CHAT_ID) {
        try {
          await tgFetch("sendMessage", {
            chat_id: CHAT_ID,
            text: JSON.stringify(payload),
          });
          // Non-blocking anti-flood gap delay to process sequentially
          await new Promise(r => setTimeout(r, 1200));
        } catch {
          // Keep background looping robust against active network connection drops
        }
      }
    }
  })();
});

// POST /api/telegram/save — Fallback component storage interface preservation point
router.post("/save", async (req, res) => {
  const video = req.body;
  if (!video?.id) {
    res.status(400).json({ ok: false, error: "Missing video id" });
    return;
  }

  const payload = { _type: "cumbear_video", ...video };
  videoCache[video.id] = payload;

  if (!CHAT_ID) {
    res.json({ ok: false, error: "TELEGRAM_CHAT_ID not configured — video saved in server memory only", video: payload });
    return;
  }

  try {
    const data = await tgFetch("sendMessage", {
      chat_id: CHAT_ID,
      text: JSON.stringify(payload),
    });
    res.json({ ok: data.ok, messageId: data.result?.message_id, video: payload });
  } catch (err) {
    res.json({ ok: false, error: "Telegram unreachable — video saved in server memory only", video: payload });
  }
});

// GET /api/telegram/discover — Displays detected active communication environments
router.get("/discover", async (req, res) => {
  try {
    const data = await tgFetch("getUpdates?limit=50&timeout=0");
    const chatMap: Record<number, any> = {};
    if (data.ok) {
      for (const update of data.result as any[]) {
        const msg = update.message || update.channel_post || update.edited_message;
        if (msg?.chat) {
          chatMap[msg.chat.id] = {
            id: msg.chat.id,
            type: msg.chat.type,
            title: msg.chat.title || msg.chat.first_name || `Chat ${msg.chat.id}`,
          };
        }
      }
    }
    const me = await tgFetch("getMe");
    res.json({
      ok: true,
      bot: me.result,
      discovered_chats: Object.values(chatMap),
      configured_chat_id: CHAT_ID || null,
      instructions: CHAT_ID
        ? "Telegram is configured. Videos will sync to your channel."
        : "To enable Telegram sync: add the bot to a Telegram group or channel as admin, send any message there, then set TELEGRAM_CHAT_ID environment variable to the chat ID shown in discovered_chats.",
    });
  } catch {
    res.status(500).json({ ok: false, error: "Cannot reach Telegram API" });
  }
});

// GET /api/telegram/status — Quick metrics dashboard status validation link
router.get("/status", async (_req, res) => {
  try {
    const data = await tgFetch("getMe");
    res.json({
      ok: data.ok,
      bot: data.result,
      chat_id_configured: !!CHAT_ID,
      videos_in_memory: Object.keys(videoCache).length,
    });
  } catch {
    res.status(500).json({ ok: false, error: "Cannot reach Telegram API" });
  }
});

export default router;
