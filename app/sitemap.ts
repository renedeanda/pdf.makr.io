import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://pdf.makr.io';
  const currentDate = new Date().toISOString();

  const tools = [
    // Core Tools
    'merge',
    'split',
    'compress',
    'pdf-to-images',
    'images-to-pdf',
    'rotate',
    'delete',
    'page-numbers',
    // Enhancement Tools
    'watermark',
    'image-watermark',
    'extract-text',
    'organize',
    // Professional Tools
    'pdf-info',
    'edit-metadata',
    'headers-footers',
  ];

  const toolPages = tools.map((tool) => ({
    url: `${baseUrl}/${tool}`,
    lastModified: currentDate,
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  return [
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 1,
    },
    ...toolPages,
  ];
}
