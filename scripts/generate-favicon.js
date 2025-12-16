const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const publicDir = path.join(__dirname, '..', 'public');

// Simple SVG icon for favicon - just a clean PDF document icon
const faviconSVG = `<svg width="180" height="180" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#ea580c;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#fb923c;stop-opacity:1" />
    </linearGradient>
  </defs>

  <!-- Background circle -->
  <circle cx="90" cy="90" r="85" fill="url(#gradient)"/>

  <!-- PDF document icon -->
  <g transform="translate(90, 90)" stroke="#ffffff" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round">
    <!-- Document shape -->
    <path d="M-25,-35 L15,-35 L25,-25 L25,35 L-25,35 Z" fill="#ffffff" stroke="none"/>
    <path d="M-25,-35 L15,-35 L25,-25 L25,35 L-25,35 Z" fill="none" stroke="#ea580c" stroke-width="3"/>

    <!-- Corner fold -->
    <path d="M15,-35 L15,-25 L25,-25" fill="none" stroke="#ea580c" stroke-width="3"/>

    <!-- Lines representing text -->
    <line x1="-15" y1="-10" x2="15" y2="-10" stroke="#ea580c" stroke-width="2"/>
    <line x1="-15" y1="0" x2="15" y2="0" stroke="#ea580c" stroke-width="2"/>
    <line x1="-15" y1="10" x2="10" y2="10" stroke="#ea580c" stroke-width="2"/>
    <line x1="-15" y1="20" x2="15" y2="20" stroke="#ea580c" stroke-width="2"/>
  </g>
</svg>`;

console.log('Generating favicon images...\n');

// Write SVG
const svgPath = path.join(publicDir, 'favicon-temp.svg');
fs.writeFileSync(svgPath, faviconSVG);

async function generateFavicons() {
  // Generate apple-touch-icon (180x180)
  await sharp(svgPath)
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('✓ Generated apple-touch-icon.png (180x180)');

  // Generate favicon-32x32.png
  await sharp(svgPath)
    .resize(32, 32)
    .png()
    .toFile(path.join(publicDir, 'favicon-32x32.png'));
  console.log('✓ Generated favicon-32x32.png');

  // Generate favicon-16x16.png
  await sharp(svgPath)
    .resize(16, 16)
    .png()
    .toFile(path.join(publicDir, 'favicon-16x16.png'));
  console.log('✓ Generated favicon-16x16.png');

  // Clean up temp file
  fs.unlinkSync(svgPath);

  console.log('\n✓ All favicon images generated!');
}

generateFavicons().catch(console.error);
