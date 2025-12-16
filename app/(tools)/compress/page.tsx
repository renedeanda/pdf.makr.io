import { Metadata } from 'next';
import CompressClient from './compress-client';

export const metadata: Metadata = {
  title: 'Compress PDF - Reduce File Size',
  description: 'Free online PDF compressor. Reduce PDF file size while maintaining quality. Works in your browser, no uploads required.',
  keywords: ['compress PDF', 'reduce PDF size', 'PDF compressor', 'shrink PDF', 'optimize PDF'],
  openGraph: {
    title: 'Compress PDF - Reduce File Size | pdf.makr.io',
    description: 'Free online PDF compressor. Reduce PDF file size while maintaining quality.',
    url: 'https://pdf.makr.io/compress',
    images: [{ url: '/og-compress.png', width: 1200, height: 630 }],
  },
  alternates: {
    canonical: 'https://pdf.makr.io/compress',
  },
};

export default function CompressPage() {
  return <CompressClient />;
}
