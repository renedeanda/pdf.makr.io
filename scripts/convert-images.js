const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '..', 'public');

// Convert OG SVG images to PNG
const ogImages = [
  'og-compress',
  'og-delete',
  'og-image',
  'og-images-to-pdf',
  'og-merge',
  'og-page-numbers',
  'og-pdf-to-images',
  'og-rotate',
  'og-split',
  'og-watermark',
  'og-image-watermark',
  'og-extract-text',
  'og-organize',
  'og-pdf-info',
  'og-edit-metadata',
  'og-headers-footers',
];

async function convertOGImages() {
  console.log('Converting OG images to PNG...');

  for (const name of ogImages) {
    const svgPath = path.join(publicDir, `${name}.svg`);
    const pngPath = path.join(publicDir, `${name}.png`);

    if (fs.existsSync(svgPath)) {
      try {
        await sharp(svgPath)
          .resize(1200, 630)
          .png()
          .toFile(pngPath);
        console.log(`✓ Converted ${name}.svg -> ${name}.png`);

        // Remove the SVG file
        fs.unlinkSync(svgPath);
        console.log(`  Removed ${name}.svg`);
      } catch (error) {
        console.error(`✗ Failed to convert ${name}.svg:`, error.message);
      }
    }
  }
}

async function convertFavicon() {
  console.log('\nConverting favicon...');

  const faviconSvgPath = path.join(publicDir, 'favicon.svg');
  const appleTouchSvgPath = path.join(publicDir, 'apple-touch-icon.svg');

  if (fs.existsSync(faviconSvgPath)) {
    try {
      // Generate favicon.ico (32x32)
      await sharp(faviconSvgPath)
        .resize(32, 32)
        .png()
        .toFile(path.join(publicDir, 'favicon-32x32.png'));
      console.log('✓ Generated favicon-32x32.png');

      // Generate favicon-16x16.png
      await sharp(faviconSvgPath)
        .resize(16, 16)
        .png()
        .toFile(path.join(publicDir, 'favicon-16x16.png'));
      console.log('✓ Generated favicon-16x16.png');

      // Generate apple-touch-icon.png (180x180)
      const sourceForApple = fs.existsSync(appleTouchSvgPath) ? appleTouchSvgPath : faviconSvgPath;
      await sharp(sourceForApple)
        .resize(180, 180)
        .png()
        .toFile(path.join(publicDir, 'apple-touch-icon.png'));
      console.log('✓ Generated apple-touch-icon.png');

      // Remove SVG files
      fs.unlinkSync(faviconSvgPath);
      console.log('  Removed favicon.svg');

      if (fs.existsSync(appleTouchSvgPath)) {
        fs.unlinkSync(appleTouchSvgPath);
        console.log('  Removed apple-touch-icon.svg');
      }
    } catch (error) {
      console.error('✗ Failed to convert favicon:', error.message);
    }
  }
}

async function main() {
  console.log('Starting image conversion...\n');
  await convertOGImages();
  await convertFavicon();
  console.log('\n✓ Image conversion complete!');
}

main().catch(console.error);
