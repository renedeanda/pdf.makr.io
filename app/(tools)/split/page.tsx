import { Metadata } from 'next';
import SplitClient from './split-client';

export const metadata: Metadata = {
  title: 'Split PDF - Extract Pages from PDF',
  description: 'Free online PDF splitter. Split PDF into multiple files or extract specific pages. Works in your browser, no uploads required.',
  keywords: ['split PDF', 'extract PDF pages', 'PDF splitter', 'divide PDF', 'separate PDF'],
  openGraph: {
    title: 'Split PDF - Extract Pages from PDF | pdf.makr.io',
    description: 'Free online PDF splitter. Split PDF into multiple files or extract specific pages. Works in your browser, no uploads required.',
    url: 'https://pdf.makr.io/split',
    images: [{ url: '/og-split.png', width: 1200, height: 630 }],
  },
  alternates: {
    canonical: 'https://pdf.makr.io/split',
  },
};

export default function SplitPage() {
  return <SplitClient />;
}
