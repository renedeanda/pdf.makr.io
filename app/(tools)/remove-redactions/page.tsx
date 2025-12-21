import { Metadata } from 'next';
import RemoveRedactionsClient from './remove-redactions-client';

export const metadata: Metadata = {
  title: 'Remove PDF Redactions',
  description: 'Experimental tool to detect and remove cosmetic redactions from PDFs. Check if your redactions are properly applied or just visual overlays.',
  keywords: ['remove redactions PDF', 'PDF redaction checker', 'redaction removal', 'PDF security check', 'cosmetic redactions'],
  openGraph: {
    title: 'Remove PDF Redactions | pdf.makr.io',
    description: 'Experimental tool to detect and remove cosmetic redactions from PDFs. Check if your redactions are properly applied or just visual overlays.',
    url: 'https://pdf.makr.io/remove-redactions',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  alternates: {
    canonical: 'https://pdf.makr.io/remove-redactions',
  },
};

export default function RemoveRedactionsPage() {
  return <RemoveRedactionsClient />;
}
