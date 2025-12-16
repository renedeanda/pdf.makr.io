import { Metadata } from 'next';
import MergeClient from './merge-client';

export const metadata: Metadata = {
  title: 'Merge PDF Files - Combine Multiple PDFs',
  description: 'Free online PDF merger. Combine multiple PDF files into one document. Works in your browser, no uploads required.',
  keywords: ['merge PDF', 'combine PDF', 'join PDF', 'PDF merger', 'merge PDF files'],
  openGraph: {
    title: 'Merge PDF Files - Combine Multiple PDFs | pdf.makr.io',
    description: 'Free online PDF merger. Combine multiple PDF files into one document. Works in your browser, no uploads required.',
    url: 'https://pdf.makr.io/merge',
    images: [{ url: '/og-merge.png', width: 1200, height: 630 }],
  },
  alternates: {
    canonical: 'https://pdf.makr.io/merge',
  },
};

export default function MergePage() {
  return <MergeClient />;
}
