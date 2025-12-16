import { Metadata } from 'next';
import RotateClient from './rotate-client';

export const metadata: Metadata = {
  title: 'Rotate PDF Pages - Change Page Orientation',
  description: 'Free online PDF rotation tool. Rotate PDF pages to any orientation. Works in your browser, no uploads required.',
  keywords: ['rotate PDF', 'rotate PDF pages', 'PDF rotation', 'change PDF orientation'],
  openGraph: {
    title: 'Rotate PDF Pages - Change Page Orientation | pdf.makr.io',
    description: 'Free online PDF rotation tool. Rotate PDF pages to any orientation. Works in your browser, no uploads required.',
    url: 'https://pdf.makr.io/rotate',
    images: [{ url: '/og-rotate.png', width: 1200, height: 630 }],
  },
  alternates: {
    canonical: 'https://pdf.makr.io/rotate',
  },
};

export default function RotatePage() {
  return <RotateClient />;
}
