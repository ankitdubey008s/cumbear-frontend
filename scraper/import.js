// import.js - Bulk import from JSON/CSV to Upstash
const fs = require('fs');
const path = require('path');

const UPSTASH_URL = 'https://known-mole-104779.upstash.io';
const UPSTASH_TOKEN = 'gQAAAAAAAZlLAAIgcDEwZTljNDFjN2MxYWE0NzA4OWQ4YjA3NjgzMTU4NWQxMg';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function pushToUpstash(key, value) {
  const url = `${UPSTASH_URL}/set/${encodeURIComponent(key)}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${UPSTASH_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ value })
  });
  
  if (!response.ok) {
    throw new Error(`Upstash error: ${response.status}`);
  }
  
  const data = await response.json();
  return data.result === 'OK';
}

// Import from JSON file
async function importFromJson(filePath) {
  console.log(`Reading ${filePath}...`);
  const raw = fs.readFileSync(filePath, 'utf8');
  const videos = JSON.parse(raw);
  
  console.log(`Found ${videos.length} videos`);
  
  // Group by category
  const byCategory = {};
  for (const v of videos) {
    const cat = v.category || 'Uncategorized';
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(v);
  }
  
  console.log(`Grouped into ${Object.keys(byCategory).length} categories`);
  
  // Push each category
  let totalPushed = 0;
  for (const [cat, vids] of Object.entries(byCategory)) {
    const key = `cumbear:cat:${cat}`;
    const value = JSON.stringify(vids);
    
    // Check size
    const sizeKB = new Blob([value]).size / 1024;
    console.log(`\n${cat}: ${vids.length} videos (${sizeKB.toFixed(1)} KB)`);
    
    if (sizeKB > 900) {
      // Split into chunks
      const chunkSize = Math.floor(vids.length * (900 / sizeKB));
      console.log(`  Splitting into chunks of ~${chunkSize} videos`);
      
      for (let i = 0; i < vids.length; i += chunkSize) {
        const chunk = vids.slice(i, i + chunkSize);
        const chunkKey = i === 0 ? key : `${key}:chunk${Math.floor(i / chunkSize) + 1}`;
        await pushToUpstash(chunkKey, JSON.stringify(chunk));
        await sleep(100);
      }
    } else {
      await pushToUpstash(key, value);
      await sleep(100);
    }
    
    totalPushed += vids.length;
    console.log(`  ✓ Pushed (${totalPushed} total)`);
  }
  
  console.log(`\n=== Import Complete ===`);
  console.log(`Total videos: ${totalPushed}`);
}

// Import from CSV
async function importFromCsv(filePath) {
  console.log(`Reading CSV ${filePath}...`);
  const lines = fs.readFileSync(filePath, 'utf8').split('\n').filter(l => l.trim());
  const headers = lines[0].split(',').map(h => h.trim());
  
  const videos = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    const video = {};
    headers.forEach((h, idx) => video[h] = values[idx]);
    videos.push(video);
  }
  
  // Save as JSON then import
  const jsonPath = filePath.replace('.csv', '.json');
  fs.writeFileSync(jsonPath, JSON.stringify(videos, null, 2));
  console.log(`Converted to ${jsonPath}`);
  
  await importFromJson(jsonPath);
}

// Main
async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.log('Usage:');
    console.log('  node import.js videos.json');
    console.log('  node import.js videos.csv');
    return;
  }
  
  const filePath = args[0];
  const ext = path.extname(filePath).toLowerCase();
  
  if (ext === '.json') {
    await importFromJson(filePath);
  } else if (ext === '.csv') {
    await importFromCsv(filePath);
  } else {
    console.log('Unsupported file type. Use .json or .csv');
  }
}

main().catch(console.error);

