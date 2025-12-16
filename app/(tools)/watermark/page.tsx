import { Metadata } from 'next';
import WatermarkClient from './watermark-client';

export const metadata: Metadata = {
  title: 'Add Watermark to PDF',
  description: 'Free online PDF watermark tool. Add custom text watermarks to your PDF. Works in your browser, no uploads required.',
  keywords: ['add watermark PDF', 'PDF watermark', 'watermark PDF pages', 'PDF watermarking'],
  openGraph: {
    title: 'Add Watermark to PDF | pdf.makr.io',
    description: 'Free online PDF watermark tool. Add custom text watermarks to your PDF. Works in your browser, no uploads required.',
    url: 'https://pdf.makr.io/watermark',
    images: [{ url: '/og-watermark.png', width: 1200, height: 630 }],
  },
  alternates: {
    canonical: 'https://pdf.makr.io/watermark',
  },
};

export default function WatermarkPage() {
  return <WatermarkClient />;
}
