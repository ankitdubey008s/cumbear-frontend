import express from 'express';
import cors from 'cors';
import { Redis } from '@upstash/redis';

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

const PORT = process.env.PORT || 10000;

const redis = new Redis({
  url: 'https://known-mole-104779.upstash.io',
  token: 'gQAAAAAAAZlLAAIgcDEwZTljNDFjN2MxYWE0NzA4OWQ4YjA3NjgzMTU4NWQxMg',
});

const CAMPAIGN_REVENUE_TOKEN = 'cumbear_network_root';

// DYNAMIC CATEGORY MATRIX GENERATOR (Generates ~1,000 categories)
const BASE_NICHES = [
  "Milf", "Amateur", "Stepmom", "Stepsis", "Anal", "Cum", "POV", "Asian", "Latina", "Teen", 
  "Caught", "Japanese", "Threesome", "Ebony", "BBW", "Busty", "MilfPOV", "Goth", "Emo", "College",
  "Office", "Nurse", "Gym", "Massage", "Cougar", "Housewife", "Fitness", "Teacher", "Secretary"
];
const MODIFIERS = [
  "HD", "Premium", "Raw", "Vintage", "Real", "Casting", "Audition", "Interviews", "Homemade", 
  "Uncut", "Creampie", "Facial", "Ganging", "Squirt", "Compilation", "Solo", "Outdoor", "Hotel"
];

let GENERATED_CATEGORIES = ["All"];
BASE_NICHES.forEach(niche => {
  GENERATED_CATEGORIES.push(niche);
  MODIFIERS.forEach(mod => {
    GENERATED_CATEGORIES.push(`${mod} ${niche}`);
    GENERATED_CATEGORIES.push(`${niche} ${mod}`);
  });
});

const MASTER_CATEGORIES = Array.from(new Set(GENERATED_CATEGORIES)).slice(0, 1050);

const TARGET_BRANDS = [
    'Pornhub', 'xHamster', 'Xvideos', 'Xnxx', 'Brazzers', 'Naughty america', 'Redtube', 'Eporner',
    'Youporn', 'Spankbang', 'Sexvid', 'Tube8', 'Faphouse', 'Bang bros', 'Youjizz', 'Beeg', 'DRtuber', 
    'Blacked', 'Stripchat', 'Jerkmate', 'Bellessa', 'Camsoda', 'VRporn', 'Tik', 'Sunporno'
];

let currentBatchCursor = 0;
const BATCH_SIZE = 10; // Slightly reduced batch size for safety on local execution paths

// Helper function to create a delay
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function normalizeAndFilterAdultNode(video, defaultSource) {
    let title = video.title ? video.title.replace(/&amp;/g, '&').trim() : 'Premium Ultra HD Video';
    let views = parseInt(video.views || video.view_count || video.views_count || 0);

    let seconds = 0;
    if (video.length_sec) seconds = parseInt(video.length_sec);
    else if (video.duration) {
        if (typeof video.duration === 'string' && video.duration.includes(':')) {
            const parts = video.duration.split(':');
            seconds = parts.length === 3 
                ? (parseInt(parts[0]) * 3600) + (parseInt(parts[1]) * 60) + parseInt(parts[2])
                : (parseInt(parts[0]) * 60) + parseInt(parts[1]);
        } else {
            seconds = parseInt(video.duration);
        }
    }

    if (seconds < 480) return null; // Strict 8+ Minute Rule

    const thumb = video.default_thumb?.src || video.default_thumb || video.thumb || video.preview_url || video.thumbnail_url || '';
    if (!thumb) return null;

    const hoverPreviews = video.thumbs?.map(t => typeof t === 'object' ? t.src : t) || [thumb];

    const rawLink = video.url || video.video_url || video.link || video.embedded_url || '';
    if (!rawLink) return null;
    const separator = rawLink.includes('?') ? '&' : '?';
    const monetizedLink = `${rawLink}${separator}affid=${CAMPAIGN_REVENUE_TOKEN}&subid=cumbear_mega_matrix`;

    let finalBrand = defaultSource;
    const lowerTitle = title.toLowerCase();
    for (const site of TARGET_BRANDS) {
        if (lowerTitle.includes(site.toLowerCase())) {
            finalBrand = site;
            break;
        }
    }
    if (finalBrand === defaultSource) {
        const matrixIndex = Math.abs(views ^ title.length) % TARGET_BRANDS.length;
        finalBrand = TARGET_BRANDS[matrixIndex];
    }

    return {
        id: video.id || video.video_id || `cb-${Math.random().toString(36).substr(2, 9)}`,
        title: title,
        target_url: monetizedLink,
        thumb: thumb,
        thumbs_preview: hoverPreviews,
        duration: seconds,
        views: views,
        provider: finalBrand,
        isAd: false
    };
}

/**
 * Fault-Tolerant Rotator Engine
 */
async function triggerSegmentedHarvestEngine() {
    const activeBatch = MASTER_CATEGORIES.slice(currentBatchCursor, currentBatchCursor + BATCH_SIZE);
    console.log(`⚡ BATCH INGESTION STARTING: Slots [${currentBatchCursor} to ${currentBatchCursor + activeBatch.length}] out of ${MASTER_CATEGORIES.length}...`);

    for (const category of activeBatch) {
        if (category === "All") continue;
        let categoryCollectionPool = [];
        const query = category.toLowerCase().replace(/\s+/g, '+');

        const endpoints = [
            { name: 'Pornhub', url: `https://api.redtube.com/?data=redtube.Videos.searchVideos&output=json&search=${query}&thumbsize=big` },
            { name: 'xHamster', url: `https://www.eporner.com/api/v2/video/search/?query=${query}&per_page=100&thumbsize=big&order=top-weekly` }
        ];

        // Wrap external scraper fetches in custom try/catch loops
        try {
            await Promise.all(endpoints.map(async (provider) => {
                try {
                    const response = await fetch(provider.url, { 
                        headers: { 'User-Agent': 'Mozilla/5.0 CumbearEngine/3.0' },
                        signal: AbortSignal.timeout(8000) // 8-second cutoff so blocked calls don't hang forever
                    });
                    const payload = await response.json();
                    const items = payload.videos || payload.data || [];
                    
                    items.forEach(rawItem => {
                        const cleanNode = normalizeAndFilterAdultNode(rawItem.video || rawItem, provider.name);
                        if (cleanNode && cleanNode.views >= 100000) {
                            categoryCollectionPool.push(cleanNode);
                        }
                    });
                } catch (e) {
                    // Endpoint failed or timed out; skip to keep moving
                }
            }));

            if (categoryCollectionPool.length > 0) {
                categoryCollectionPool.sort((alpha, beta) => beta.views - alpha.views);
                const dedupMap = new Map();
                categoryCollectionPool.forEach(node => dedupMap.set(node.title, node));
                const finalCategoryArray = Array.from(dedupMap.values());

                const storageKey = `cumbear:cat:${category.toLowerCase().replace(/\s+/g, '_')}`;
                
                // CRUCIAL: Protect write phase and pace requests to prevent connection drops
                await redis.set(storageKey, JSON.stringify(finalCategoryArray)).catch(err => {
                    console.error(`⚠️ Upstash network save bypassed for ${category}: Internal queue busy.`);
                });
                
                await sleep(150); // 150ms structural rest space to let Upstash sockets clear out safely
            }
        } catch (globalLoopErr) {
            console.log(`Skipping iteration slot: ${category}`);
        }
    }

    console.log(`✅ SLOT BUFFER COMPLETED.`);
    
    currentBatchCursor += BATCH_SIZE;
    if (currentBatchCursor >= MASTER_CATEGORIES.length) {
        currentBatchCursor = 0; 
    }

    try {
        await redis.set('cumbear:system:last_sync', new Date().toISOString());
    } catch(e) {}
}

/**
 * INSTANT DELIVERY CONSUMER ENDPOINT
 */
app.get('/api/videos', async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=30');
    
    const clientSelectedCategory = req.query.q || 'All';

    try {
        let aggregatedOutput = [];

        if (clientSelectedCategory === 'All') {
            const sampleSet = ["milf", "amateur", "stepmom", "stepsis", "anal", "pov"];
            const jobs = sampleSet.map(cat => redis.get(`cumbear:cat:${cat}`).catch(() => null));
            const buffers = await Promise.all(jobs);
            
            buffers.forEach(buf => {
                if (buf) {
                    const parsed = typeof buf === 'string' ? JSON.parse(buf) : buf;
                    aggregatedOutput = aggregatedOutput.concat(parsed);
                }
            });
            aggregatedOutput.sort((a, b) => b.views - a.views);
        } else {
            const sanitizedKey = clientSelectedCategory.toLowerCase().replace(/\s+/g, '_');
            const targetedBuffer = await redis.get(`cumbear:cat:${sanitizedKey}`).catch(() => null);
            if (targetedBuffer) {
                aggregatedOutput = typeof targetedBuffer === 'string' ? JSON.parse(targetedBuffer) : targetedBuffer;
            }
        }

        let finalStreamPayload = [];
        aggregatedOutput.forEach((videoObject, streamIndex) => {
            finalStreamPayload.push(videoObject);
            if ((streamIndex + 1) % 8 === 0) {
                finalStreamPayload.push({
                    id: `native-sponsored-card-${streamIndex}`,
                    title: "🔥 EXCLUSIVE ACCESS: Instant Live Verification Portals Open In Your Local Region. Meet Girls Tonight.",
                    target_url: "https://www.crackrevenue.com",
                    thumb: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600&auto=format&fit=crop",
                    duration: 0,
                    views: 89000000,
                    provider: "SPONSORED LINK",
                    isAd: true
                });
            }
        });

        const lastSyncTime = await redis.get('cumbear:system:last_sync').catch(() => null);

        return res.json({ 
            success: true, 
            count: finalStreamPayload.length, 
            synchronized: lastSyncTime,
            videos: finalStreamPayload 
        });

    } catch (err) {
        return res.status(500).json({ success: false, error: "Cloud pipeline breakdown." });
    }
});

app.get('/api/categories', (req, res) => {
    return res.json({ categories: MASTER_CATEGORIES });
});

// Explicit process protection wrapper to stop Node from ever executing a hard crash
process.on('uncaughtException', (error) => {
    console.error('🛡️ PROTECTOR LAYER: Intercepted potential crash event safely:', error.message);
});

app.listen(PORT, '0.0.0.0', async () => {
    console.log(`🚀 CUMBEAR ENTERPRISE BRAIN ACTIVE ON BIND PORT ${PORT}`);
    await triggerSegmentedHarvestEngine();
});

setInterval(triggerSegmentedHarvestEngine, 2 * 60 * 1000);

