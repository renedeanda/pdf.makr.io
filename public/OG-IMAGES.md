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

## Needed for New Tools
- ⏳ og-image-watermark.png
- ⏳ og-extract-text.png
- ⏳ og-organize.png
- ⏳ og-pdf-info.png
- ⏳ og-edit-metadata.png
- ⏳ og-headers-footers.png

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

## Quick Generation Options

### Option 1: Use Figma/Canva
1. Create 1200x630 canvas
2. Use template from existing images
3. Change tool name, icon, and color
4. Export as PNG

### Option 2: Use HTML Generator
Open `/scripts/generate-og-images.html` in browser and click "Generate All"

### Option 3: Use Online Tool
Use https://www.opengraph.xyz/ or similar with these settings:
- Title: Tool name (e.g., "Image Watermark")
- Description: Short description
- Background: #fefcf7
- Add "pdf.makr.io" branding

## Temporary Fallback
Until tool-specific images are created, pages will use the main `/og-image.png` as fallback.
