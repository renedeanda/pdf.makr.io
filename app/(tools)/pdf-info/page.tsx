import { Metadata } from 'next';
import PDFInfoClient from './pdf-info-client';

export const metadata: Metadata = {
  title: 'PDF Info | pdf.makr.io',
  description: 'View PDF metadata, file properties, and security information',
  openGraph: {
    title: 'PDF Info | pdf.makr.io',
    description: 'View PDF metadata, file properties, and security information',
    images: ['/og-pdf-info.png'],
  },
};

export default function PDFInfoPage() {
  return <PDFInfoClient />;
}
