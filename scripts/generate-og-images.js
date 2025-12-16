/**
 * Script to generate OG images for all pages
 * Run with: node scripts/generate-og-images.js
 *
 * This creates placeholder OG images. For production, consider using:
 * - @vercel/og for dynamic generation
 * - https://og-playground.vercel.app/ for design
 * - Figma/Canva for custom designs
 */

const fs = require('fs');
const path = require('path');

const tools = [
  { name: 'og-image', title: 'PDF Tools - Free Online PDF Editor' },
  { name: 'og-compress', title: 'Compress PDF - Reduce File Size' },
  { name: 'og-delete', title: 'Delete PDF Pages - Remove Unwanted Pages' },
  { name: 'og-images-to-pdf', title: 'Images to PDF - Convert JPG, PNG to PDF' },
  { name: 'og-merge', title: 'Merge PDF Files - Combine Multiple PDFs' },
  { name: 'og-page-numbers', title: 'Add Page Numbers to PDF' },
  { name: 'og-pdf-to-images', title: 'PDF to Images - Convert PDF to PNG/JPG' },
  { name: 'og-rotate', title: 'Rotate PDF Pages - Change Page Orientation' },
  { name: 'og-split', title: 'Split PDF - Extract Pages from PDF' },
  { name: 'og-watermark', title: 'Add Watermark to PDF' },
];

// Create SVG template for OG images (1200x630)
function createOGImageSVG(title) {
  return `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <!-- Background with gradient -->
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#fefcf7;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#f8f4ec;stop-opacity:1" />
    </linearGradient>

    <!-- Dot pattern -->
    <pattern id="dots" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
      <circle cx="1" cy="1" r="1" fill="#d97706" opacity="0.03"/>
    </pattern>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="630" fill="url(#dots)"/>

  <!-- Border -->
  <rect x="40" y="40" width="1120" height="550" fill="none" stroke="#d97706" stroke-width="2" rx="12"/>

  <!-- Logo/Brand area -->
  <text x="600" y="180" font-family="system-ui, -apple-system, sans-serif" font-size="72" font-weight="bold" fill="#292524" text-anchor="middle">
    pdf.makr.io
  </text>

  <!-- Title -->
  <text x="600" y="280" font-family="system-ui, -apple-system, sans-serif" font-size="48" font-weight="600" fill="#57534e" text-anchor="middle">
    ${escapeXml(title)}
  </text>

  <!-- Tagline -->
  <text x="600" y="380" font-family="system-ui, -apple-system, sans-serif" font-size="28" fill="#78716c" text-anchor="middle">
    100% Private • Browser-Based • Free Forever
  </text>

  <!-- Bottom accent -->
  <rect x="400" y="500" width="400" height="4" fill="#d97706" rx="2"/>
</svg>`;
}

function escapeXml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Generate all OG images
const publicDir = path.join(__dirname, '..', 'public');

console.log('Generating OG images...\n');

tools.forEach(({ name, title }) => {
  const svg = createOGImageSVG(title);
  const filename = `${name}.svg`;
  const filepath = path.join(publicDir, filename);

  fs.writeFileSync(filepath, svg);
  console.log(`✓ Created ${filename}`);
});

console.log('\n✨ All OG images generated!');
console.log('\nNote: These are SVG placeholders. For production:');
console.log('- Convert to PNG (1200x630) using: https://cloudconvert.com/svg-to-png');
console.log('- Or use @vercel/og for dynamic generation');
console.log('- Or create custom designs in Figma/Canva\n');
