# pdf.makr.io

A privacy-first, browser-based PDF toolkit that handles merge, split, compress, and convert operations entirely client-side. No uploads to servers, no tracking, just fast, secure PDF manipulation.

**Your PDFs never leave your browser. Fast, free, and actually works.**

## Features

### Phase 1 Tools (Implemented)
- **Merge PDFs** - Combine multiple PDF files into a single document
- **Split PDF** - Extract pages or split into multiple files
- **Compress PDF** - Reduce file size while maintaining quality
- **PDF to Images** - Convert PDF pages to PNG or JPG images
- **Images to PDF** - Create a PDF from multiple images
- **Rotate Pages** - Rotate PDF pages to any orientation
- **Delete Pages** - Remove unwanted pages from your PDF

### Key Principles
- 100% client-side processing (no server uploads)
- Files never touch our servers
- No file size limits (limited only by browser memory)
- Usage analytics only (Google Analytics for page views, no file data)

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **PDF Processing**: pdf-lib, pdfjs-dist
- **File Handling**: JSZip, FileSaver.js
- **UI**: Framer Motion, Lucide React, next-themes

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

Copy `.env.example` to `.env.local` and configure:

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
│   │   └── delete/
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
- We only track page views via Google Analytics (no file data)

## License

MIT
