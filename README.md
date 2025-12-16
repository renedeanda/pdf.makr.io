# pdf.makr.io

A privacy-first, browser-based PDF toolkit. All processing happens locally in your browser - your files never leave your device.

## Features

### PDF Tools (9 Tools)
- **Merge PDFs** - Combine multiple PDF files into a single document
- **Split PDF** - Extract pages or split into multiple files
- **Compress PDF** - Reduce file size while maintaining quality
- **PDF to Images** - Convert PDF pages to PNG or JPG images
- **Images to PDF** - Create a PDF from multiple images
- **Rotate Pages** - Rotate PDF pages to any orientation
- **Delete Pages** - Remove unwanted pages from your PDF
- **Page Numbers** - Add page numbers to your PDF document
- **Watermark** - Add text watermarks to PDF pages

### Key Benefits
- **100% Private** - Files are processed locally in your browser. Nothing is uploaded to any server.
- **Lightning Fast** - No waiting for uploads or downloads. Processing happens instantly on your device.
- **No Limits** - Process as many files as you want. No file size limits, no daily quotas.
- **Free Forever** - No subscriptions, no hidden fees.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **PDF Processing**: pdf-lib, pdfjs-dist
- **File Handling**: JSZip
- **UI**: Lucide React, next-themes

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Environment Variables

Create a `.env.local` file:

```bash
# Google Analytics (optional)
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

## Project Structure

```
pdf.makr.io/
├── app/
│   ├── (tools)/          # Tool pages
│   │   ├── merge/
│   │   ├── split/
│   │   ├── compress/
│   │   ├── pdf-to-images/
│   │   ├── images-to-pdf/
│   │   ├── rotate/
│   │   ├── delete/
│   │   ├── page-numbers/
│   │   └── watermark/
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── ui/               # Shared UI components
│   ├── pdf/              # PDF-specific components
│   └── layout/           # Layout components
├── lib/
│   ├── pdf/              # PDF processing utilities
│   └── utils.ts
└── types/
    └── pdf.ts
```

## Privacy

All PDF processing happens entirely in your browser:
- Files are never uploaded to any server
- All operations use client-side JavaScript libraries
- Google Analytics tracks page views only (optional)

## License

MIT
