const express = require('express');
const path = require('path');
const fs = require('fs');
const zlib = require('zlib');
const { promisify } = require('util');

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const IS_DEV = NODE_ENV === 'development';

// Security headers for production
const securityHeaders = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()'
};

// Cache configuration
const CACHE_MAX_AGE = IS_DEV ? 0 : 31536000; // 1 year for static assets
const HTML_MAX_AGE = IS_DEV ? 0 : 3600; // 1 hour for HTML

// Gzip compression for dynamic content
const gzip = promisify(zlib.gzip);

// Middleware: Security headers
app.use((req, res, next) => {
    Object.entries(securityHeaders).forEach(([key, value]) => {
        res.setHeader(key, value);
    });
    next();
});

// Middleware: CORS for API
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept-Encoding');
    next();
});

// Static files with aggressive caching
app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: CACHE_MAX_AGE,
    etag: true,
    lastModified: true,
    setHeaders: (res, filePath) => {
        // Brotli/gzip precompressed files
        if (filePath.endsWith('.br')) {
            res.setHeader('Content-Encoding', 'br');
            res.setHeader('Content-Type', getContentType(filePath.replace('.br', '')));
        } else if (filePath.endsWith('.gz')) {
            res.setHeader('Content-Encoding', 'gzip');
            res.setHeader('Content-Type', getContentType(filePath.replace('.gz', '')));
        }
        
        // Immutable assets (hashed filenames)
        if (filePath.match(/\.[a-f0-9]{16,}\./)) {
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
        
        // Service worker needs no-cache
        if (filePath.includes('sw.js')) {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        }
    }
}));

// Precompressed static serving helper
function getContentType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const types = {
        '.html': 'text/html; charset=utf-8',
        '.css': 'text/css; charset=utf-8',
        '.js': 'application/javascript; charset=utf-8',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.webp': 'image/webp',
        '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon',
        '.woff2': 'font/woff2'
    };
    return types[ext] || 'application/octet-stream';
}

// Critical CSS inline injection for faster FCP
const CRITICAL_CSS = fs.readFileSync(path.join(__dirname, 'public', 'style.css'), 'utf8')
    .split('/* ---')[0] // Only root variables and base styles
    .substring(0, 5000); // Limit size

// SPA catch-all with optimized HTML delivery
app.get(/.*/, async (req, res) => {
    const acceptEncoding = req.headers['accept-encoding'] || '';
    const supportsBrotli = acceptEncoding.includes('br');
    const supportsGzip = acceptEncoding.includes('gzip');
    
    try {
        let html = fs.readFileSync(path.join(__dirname, 'public', 'index.html'), 'utf8');
        
        // Inject critical CSS
        html = html.replace(
            '<link rel="stylesheet" href="/style.css">',
            `<style>${CRITICAL_CSS}</style><link rel="preload" href="/style.css" as="style" onload="this.onload=null;this.rel='stylesheet'"><noscript><link rel="stylesheet" href="/style.css"></noscript>`
        );
        
        // Preconnect to critical origins
        const preconnect = `
            <link rel="preconnect" href="https://cumbear-backend.vercel.app">
            <link rel="dns-prefetch" href="https://cumbear-backend.vercel.app">
            <link rel="preconnect" href="https://fonts.googleapis.com" crossorigin>
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        `;
        html = html.replace('<link rel="preconnect', `${preconnect}<link rel="preconnect`);
        
        // Compress if supported
        if (!IS_DEV && (supportsBrotli || supportsGzip)) {
            const compressed = await gzip(html);
            res.setHeader('Content-Encoding', 'gzip');
            res.setHeader('Content-Length', compressed.length);
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.setHeader('Cache-Control', `public, max-age=${HTML_MAX_AGE}`);
            return res.send(compressed);
        }
        
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', `public, max-age=${HTML_MAX_AGE}`);
        res.send(html);
        
    } catch (err) {
        console.error('HTML delivery error:', err);
        res.status(500).send('Server Error');
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: Date.now(), env: NODE_ENV });
});

app.listen(PORT, () => {
    console.log(`🚀 CumBear Frontend [${NODE_ENV}] running at http://localhost:${PORT}`);
    console.log(`📦 Static cache: ${CACHE_MAX_AGE}s, HTML cache: ${HTML_MAX_AGE}s`);
});

