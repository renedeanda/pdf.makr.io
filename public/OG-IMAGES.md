# OG Images for Social Sharing

This directory contains Open Graph images (1200x630 px) for social media sharing.

## Existing Images
- ✅ og-image.png (main/home)
- ✅ og-merge.png
- ✅ og-split.png
- ✅ og-compress.png
- ✅ og-pdf-to-images.png
- ✅ og-images-to-pdf.png
- ✅ og-rotate.png
- ✅ og-delete.png
- ✅ og-page-numbers.png
- ✅ og-watermark.png

## New Tools (Phase 2 & 3)
- ✅ og-image-watermark.png
- ✅ og-extract-text.png
- ✅ og-organize.png
- ✅ og-pdf-info.png
- ✅ og-edit-metadata.png
- ✅ og-headers-footers.png

## Design Specifications

All OG images should be:
- **Size**: 1200 x 630 pixels
- **Format**: PNG
- **Background**: #fefcf7 (light cream - matches site)
- **Accent colors**: Tool-specific (from design system)
- **Text**: Tool name + short description
- **Branding**: "pdf.makr.io" + "100% Private" badge

### Color Scheme Per Tool
- **image-watermark**: Blue (#3b82f6)
- **extract-text**: Purple (#8b5cf6)
- **organize**: Cyan (#06b6d4)
- **pdf-info**: Teal (#14b8a6)
- **edit-metadata**: Amber (#f59e0b)
- **headers-footers**: Emerald (#10b981)

## How to Generate OG Images

To generate OG images for new tools:

1. **Add tool to the list** in `scripts/generate-og-images.js`
2. **Run the generator**: `node scripts/generate-og-images.js` (creates SVG files)
3. **Convert to PNG**: `node scripts/convert-images.js` (converts SVG to PNG and cleans up)
4. **Update metadata**: Add OpenGraph images to the tool's `page.tsx`

All images are automatically generated with consistent branding, styling, and dimensions.
