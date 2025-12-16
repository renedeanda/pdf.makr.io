const fs = require('fs');
const path = require('path');

const tools = [
  { name: 'merge', title: 'Merge PDF Files', subtitle: 'Combine Multiple PDFs', icon: 'M12 6l-6 6m0 0l6 6m-6-6h12' },
  { name: 'split', title: 'Split PDF', subtitle: 'Extract Pages or Split into Multiple Files', icon: 'M8 7h12M8 12h12m-12 5h12' },
  { name: 'compress', title: 'Compress PDF', subtitle: 'Reduce PDF File Size', icon: 'M19 14l-7 7m0 0l-7-7m7 7V3' },
  { name: 'delete', title: 'Delete PDF Pages', subtitle: 'Remove Unwanted Pages', icon: 'M19 7l-7 7-7-7' },
  { name: 'rotate', title: 'Rotate PDF Pages', subtitle: 'Change Page Orientation', icon: 'M4 4v5h5m10 6v5h-5M21 4a16 16 0 01-5 11M4 20a16 16 0 015-11' },
  { name: 'watermark', title: 'Add Watermark', subtitle: 'Protect Your PDFs', icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4' },
  { name: 'page-numbers', title: 'Add Page Numbers', subtitle: 'Number Your PDF Pages', icon: 'M7 20h10M7 16h10M7 12h10' },
  { name: 'pdf-to-images', title: 'PDF to Images', subtitle: 'Convert PDF Pages to PNG/JPG', icon: 'M4 16l4-4 4 4m-4-4v12M20 8v12' },
  { name: 'images-to-pdf', title: 'Images to PDF', subtitle: 'Convert Images to PDF', icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4' },
  { name: 'image', title: 'PDF Tools', subtitle: 'Free Online PDF Editor', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
];

function wrapText(text, maxLength) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (testLine.length > maxLength && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

function generateSVG(tool) {
  const titleLines = wrapText(tool.title, 25);
  const subtitleLines = wrapText(tool.subtitle, 40);

  // Calculate vertical positioning with more spacing
  const baseY = 280;
  const titleSpacing = 75;
  const subtitleSpacing = 60;
  const gapBetweenTitleSubtitle = 50;

  const totalTitleHeight = (titleLines.length - 1) * titleSpacing;
  const totalSubtitleHeight = (subtitleLines.length - 1) * subtitleSpacing;

  const titleStartY = baseY - (totalTitleHeight / 2);
  const subtitleStartY = titleStartY + totalTitleHeight + gapBetweenTitleSubtitle;

  // Generate title text elements
  const titleTexts = titleLines.map((line, i) =>
    `    <text x="600" y="${titleStartY + (i * titleSpacing)}" font-family="system-ui, -apple-system, sans-serif" font-size="52" font-weight="600" fill="#57534e" text-anchor="middle">
      ${line}
    </text>`
  ).join('\n');

  // Generate subtitle text elements
  const subtitleTexts = subtitleLines.map((line, i) =>
    `    <text x="600" y="${subtitleStartY + (i * subtitleSpacing)}" font-family="system-ui, -apple-system, sans-serif" font-size="32" fill="#78716c" text-anchor="middle">
      ${line}
    </text>`
  ).join('\n');

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

  <!-- Icon circle background -->
  <circle cx="600" cy="180" r="60" fill="#ea580c" opacity="0.1"/>

  <!-- Tool icon -->
  <g transform="translate(600, 180)" stroke="#ea580c" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round">
    <path d="${tool.icon}" transform="translate(-12, -12) scale(2)"/>
  </g>

  <!-- Title with text wrapping -->
${titleTexts}

  <!-- Subtitle with text wrapping -->
${subtitleTexts}

  <!-- Tagline -->
  <text x="600" y="540" font-family="system-ui, -apple-system, sans-serif" font-size="20" fill="#78716c" text-anchor="middle">
    100% Private • Browser-Based • Free Forever
  </text>

  <!-- Bottom accent -->
  <rect x="400" y="575" width="400" height="4" fill="#d97706" rx="2"/>
</svg>`;
}

const publicDir = path.join(__dirname, '..', 'public');

console.log('Generating OG image SVGs...\n');

tools.forEach(tool => {
  const svg = generateSVG(tool);
  const svgPath = path.join(publicDir, `og-${tool.name}.svg`);
  fs.writeFileSync(svgPath, svg);
  console.log(`✓ Generated og-${tool.name}.svg`);
});

console.log('\n✓ All OG image SVGs generated!');
console.log('Run: node scripts/convert-images.js to convert to PNG');
