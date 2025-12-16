import { Metadata } from 'next';
import PDFToImagesClient from './pdf-to-images-client';
import { MobileBlockedMessage } from '@/components/ui/mobile-blocked-message';

export const metadata: Metadata = {
  title: 'PDF to Images - Convert PDF to PNG/JPG',
  description: 'Free online PDF to image converter. Convert PDF pages to PNG or JPG images. Works in your browser, no uploads required.',
  keywords: ['PDF to images', 'PDF to PNG', 'PDF to JPG', 'convert PDF to images', 'PDF to picture'],
  openGraph: {
    title: 'PDF to Images - Convert PDF to PNG/JPG | pdf.makr.io',
    description: 'Free online PDF to image converter. Convert PDF pages to PNG or JPG images. Works in your browser, no uploads required.',
    url: 'https://pdf.makr.io/pdf-to-images',
    images: [{ url: '/og-pdf-to-images.png', width: 1200, height: 630 }],
  },
  alternates: {
    canonical: 'https://pdf.makr.io/pdf-to-images',
  },
};

export default function PDFToImagesPage() {
  return (
    <MobileBlockedMessage toolName="PDF to Images">
      <PDFToImagesClient />
    </MobileBlockedMessage>
  );
}
