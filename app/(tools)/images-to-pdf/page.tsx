import { Metadata } from 'next';
import ImagesToPDFClient from './images-to-pdf-client';

export const metadata: Metadata = {
  title: 'Images to PDF - Convert JPG, PNG to PDF',
  description: 'Free online image to PDF converter. Combine multiple images into a single PDF. Works in your browser, no uploads required.',
  keywords: ['images to PDF', 'JPG to PDF', 'PNG to PDF', 'convert images to PDF', 'photo to PDF'],
  openGraph: {
    title: 'Images to PDF - Convert JPG, PNG to PDF | pdf.makr.io',
    description: 'Free online image to PDF converter. Combine multiple images into a single PDF. Works in your browser, no uploads required.',
    url: 'https://pdf.makr.io/images-to-pdf',
    images: [{ url: '/og-images-to-pdf.png', width: 1200, height: 630 }],
  },
  alternates: {
    canonical: 'https://pdf.makr.io/images-to-pdf',
  },
};

export default function ImagesToPDFPage() {
  return <ImagesToPDFClient />;
}
