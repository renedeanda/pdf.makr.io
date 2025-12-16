import { Metadata } from 'next';
import PageNumbersClient from './page-numbers-client';

export const metadata: Metadata = {
  title: 'Add Page Numbers to PDF',
  description: 'Free online PDF page numbering tool. Add custom page numbers to your PDF. Works in your browser, no uploads required.',
  keywords: ['add page numbers PDF', 'PDF page numbers', 'number PDF pages', 'PDF numbering'],
  openGraph: {
    title: 'Add Page Numbers to PDF | pdf.makr.io',
    description: 'Free online PDF page numbering tool. Add custom page numbers to your PDF. Works in your browser, no uploads required.',
    url: 'https://pdf.makr.io/page-numbers',
    images: [{ url: '/og-page-numbers.png', width: 1200, height: 630 }],
  },
  alternates: {
    canonical: 'https://pdf.makr.io/page-numbers',
  },
};

export default function PageNumbersPage() {
  return <PageNumbersClient />;
}
