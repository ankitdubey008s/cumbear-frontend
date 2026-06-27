// generate-sample.js - Generate sample video data for testing
const fs = require('fs');

const CATEGORIES = [
  'Amateur', 'Anal', 'Asian', 'BBW', 'Blonde', 'Blowjob', 'Brunette',
  'Creampie', 'Cum', 'Ebony', 'Gangbang', 'Hardcore', 'Japanese',
  'Latina', 'Lesbian', 'MILF', 'POV', 'Stepmom', 'Teen', 'Threesome'
];

const PROVIDERS = ['Eporner', 'Redtube', 'Pornhub', 'Xvideos', 'YouPorn'];

const TITLES = [
  'Hot amateur couple having passionate sex',
  'Stunning MILF takes it deep',
  'Teen first time anal experience',
  'Japanese schoolgirl gets creampied',
  'Latina bombshell rides hard cock',
  'Lesbian step sisters explore each other',
  'Interracial BBC destroys tight pussy',
  'POV blowjob from gorgeous blonde',
  'Threesome with two hot babes',
  'Stepmom catches stepson and joins in',
  'Asian massage turns into happy ending',
  'Anal destruction of tight asshole',
  'Gangbang party with multiple cocks',
  'Amateur wife shared with stranger',
  'Ebony goddess worshipped properly',
  'MILF next door seduces young stud',
  'College party orgy gets wild',
  'Japanese cosplay girl fucked hard',
  'Brunette beauty takes monster cock',
  'Public flashing and risky outdoor sex'
];

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function generateVideo(category, index) {
  const id = `sample_${category.toLowerCase()}_${index}_${Date.now()}`;
  const title = TITLES[randomInt(0, TITLES.length - 1)];
  const provider = PROVIDERS[randomInt(0, PROVIDERS.length - 1)];
  const views = randomInt(1000, 5000000);
  const duration = randomInt(120, 3600);
  
  return {
    id,
    title: `${title} - ${category} ${index}`,
    target_url: `https://example.com/video/${id}?affid=cumbear_network_root`,
    thumb: `https://picsum.photos/400/225?random=${Math.random()}`,
    thumbs_preview: [
      `https://picsum.photos/400/225?random=${Math.random()}`,
      `https://picsum.photos/400/225?random=${Math.random()}`
    ],
    duration,
    views,
    provider,
    isAd: false,
    category
  };
}

function generateSampleData(videosPerCategory = 50) {
  const allVideos = [];
  
  for (const category of CATEGORIES) {
    for (let i = 0; i < videosPerCategory; i++) {
      allVideos.push(generateVideo(category, i + 1));
    }
  }
  
  return allVideos;
}

// Generate 1000 sample videos (20 categories × 50)
const sampleData = generateSampleData(50);
const outputPath = './sample-videos.json';

fs.writeFileSync(outputPath, JSON.stringify(sampleData, null, 2));
console.log(`Generated ${sampleData.length} sample videos`);
console.log(`Saved to ${outputPath}`);
console.log(`Categories: ${CATEGORIES.length}`);
console.log(`File size: ${(fs.statSync(outputPath).size / 1024 / 1024).toFixed(2)} MB`);

