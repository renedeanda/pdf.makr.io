import { Metadata } from 'next';
import ProtectClient from './protect-client';

export const metadata: Metadata = {
  title: 'Protect PDF with Password - PDF.makr.io',
  description: 'Add password protection to PDF files. Set user and owner passwords with permission controls. Free online PDF password protection.',
  openGraph: {
    title: 'Protect PDF with Password - PDF.makr.io',
    description: 'Add password protection to PDF files. Set user and owner passwords with permission controls.',
    images: ['/og-image.png'],
  },
};

export default function ProtectPage() {
  return <ProtectClient />;
}
