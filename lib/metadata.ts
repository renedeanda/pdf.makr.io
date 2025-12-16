import { Metadata } from 'next';

interface ToolMetadata {
  title: string;
  description: string;
  keywords: string[];
  url: string;
  ogImage?: string;
}

export function generateToolMetadata({
  title,
  description,
  keywords,
  url,
  ogImage = '/og-image.png',
}: ToolMetadata): Metadata {
  const fullTitle = `${title} | pdf.makr.io`;
  const fullUrl = `https://pdf.makr.io${url}`;

  return {
    title,
    description,
    keywords: [
      ...keywords,
      'PDF tools',
      'free PDF editor',
      'online PDF',
      'browser-based',
      'privacy',
      'no upload',
    ],
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url: fullUrl,
      siteName: 'pdf.makr.io',
      title: fullTitle,
      description,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: fullTitle,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [ogImage],
    },
    alternates: {
      canonical: fullUrl,
    },
  };
}
