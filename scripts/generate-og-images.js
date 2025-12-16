const fs = require('fs');
const path = require('path');

const tools = [
  { name: 'merge', title: 'Merge PDF Files', subtitle: 'Combine Multiple PDFs' },
  { name: 'split', title: 'Split PDF', subtitle: 'Extract Pages or Split into Multiple Files' },
  { name: 'compress', title: 'Compress PDF', subtitle: 'Reduce PDF File Size' },
  { name: 'delete', title: 'Delete PDF Pages', subtitle: 'Remove Unwanted Pages' },
  { name: 'rotate', title: 'Rotate PDF Pages', subtitle: 'Change Page Orientation' },
  { name: 'watermark', title: 'Add Watermark', subtitle: 'Protect Your PDFs' },
  { name: 'page-numbers', title: 'Add Page Numbers', subtitle: 'Number Your PDF Pages' },
  { name: 'pdf-to-images', title: 'PDF to Images', subtitle: 'Convert PDF Pages to PNG/JPG' },
  { name: 'images-to-pdf', title: 'Images to PDF', subtitle: 'Convert Images to PDF' },
  { name: 'image', title: 'PDF Tools', subtitle: 'Free Online PDF Editor' },
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

  // Calculate vertical positioning
  const baseY = 260;
  const titleSpacing = 65;
  const subtitleSpacing = 50;
  const gapBetweenTitleSubtitle = 35;

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

  <!-- Logo/Brand area -->
  <text x="600" y="140" font-family="system-ui, -apple-system, sans-serif" font-size="56" font-weight="bold" fill="#292524" text-anchor="middle">
    pdf.makr.io
  </text>

  <!-- Title with text wrapping -->
${titleTexts}

  <!-- Subtitle with text wrapping -->
${subtitleTexts}

  <!-- Tagline -->
  <text x="600" y="520" font-family="system-ui, -apple-system, sans-serif" font-size="22" fill="#78716c" text-anchor="middle">
    100% Private • Browser-Based • Free Forever
  </text>

  <!-- Bottom accent -->
  <rect x="400" y="560" width="400" height="4" fill="#d97706" rx="2"/>
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
