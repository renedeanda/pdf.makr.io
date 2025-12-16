import type { Metadata, Viewport } from 'next';
import { GoogleAnalytics } from '@next/third-parties/google';
import { Providers } from '@/components/providers';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'PDF Tools - Free Online PDF Editor | pdf.makr.io',
    template: '%s | pdf.makr.io',
  },
  description:
    'Free, browser-based PDF tools. Merge, split, compress, and convert PDFs locally. No uploads required, no limits.',
  keywords: [
    'PDF tools',
    'merge PDF',
    'split PDF',
    'compress PDF',
    'PDF to images',
    'images to PDF',
    'rotate PDF',
    'free PDF editor',
    'online PDF tools',
    'privacy PDF',
  ],
  authors: [{ name: 'pdf.makr.io' }],
  creator: 'pdf.makr.io',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://pdf.makr.io',
    siteName: 'pdf.makr.io',
    title: 'PDF Tools - Free Online PDF Editor',
    description:
      'Free, browser-based PDF tools. Merge, split, compress, and convert PDFs locally.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'pdf.makr.io - Free PDF Tools',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PDF Tools - Free Online PDF Editor',
    description:
      'Free, browser-based PDF tools. Merge, split, compress, and convert PDFs locally.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico' },
    ],
    apple: '/apple-touch-icon.svg',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fefcf7' },
    { media: '(prefers-color-scheme: dark)', color: '#1c1917' },
  ],
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className="font-sans antialiased min-h-screen flex flex-col"
      >
        <Providers>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
        {process.env.NEXT_PUBLIC_GA_ID && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
        )}
      </body>
    </html>
  );
}
