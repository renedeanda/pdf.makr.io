/**
 * Script to generate favicon files
 * Run with: node scripts/generate-favicons.js
 *
 * This creates SVG favicons. For production, use:
 * - https://realfavicongenerator.net/
 * - https://favicon.io/
 */

const fs = require('fs');
const path = require('path');

// Create simple PDF icon favicon
const faviconSVG = `<svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
  <rect width="32" height="32" rx="6" fill="#d97706"/>
  <path d="M8 6h12l4 4v16H8V6z" fill="#ffffff" opacity="0.9"/>
  <path d="M20 6v4h4" fill="none" stroke="#ffffff" stroke-width="1.5" opacity="0.7"/>
  <text x="16" y="22" font-family="system-ui" font-size="10" font-weight="bold" fill="#d97706" text-anchor="middle">
    PDF
  </text>
</svg>`;

const appleTouchIcon = `<svg width="180" height="180" viewBox="0 0 180 180" xmlns="http://www.w3.org/2000/svg">
  <rect width="180" height="180" rx="40" fill="#d97706"/>
  <rect x="40" y="28" width="100" height="124" rx="8" fill="#ffffff" opacity="0.95"/>
  <path d="M115 28v25h25" fill="none" stroke="#d97706" stroke-width="6" stroke-linecap="round"/>
  <text x="90" y="120" font-family="system-ui" font-size="36" font-weight="bold" fill="#d97706" text-anchor="middle">
    PDF
  </text>
  <text x="90" y="145" font-family="system-ui" font-size="16" font-weight="600" fill="#78716c" text-anchor="middle">
    makr.io
  </text>
</svg>`;

const publicDir = path.join(__dirname, '..', 'public');
const appDir = path.join(__dirname, '..', 'app');

console.log('Generating favicon files...\n');

// Create favicon.svg
fs.writeFileSync(path.join(publicDir, 'favicon.svg'), faviconSVG);
console.log('✓ Created favicon.svg');

// Create apple-touch-icon.svg
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.svg'), appleTouchIcon);
console.log('✓ Created apple-touch-icon.svg');

// Create icon.svg for Next.js metadata
fs.writeFileSync(path.join(appDir, 'icon.svg'), faviconSVG);
console.log('✓ Created app/icon.svg');

console.log('\n✨ All favicon files generated!');
console.log('\nNote: These are SVG favicons. For best compatibility:');
console.log('- Generate .ico and .png versions using: https://realfavicongenerator.net/');
console.log('- Modern browsers support SVG favicons natively\n');
