import { Metadata } from 'next';
import ImageWatermarkClient from './image-watermark-client';

export const metadata: Metadata = {
  title: 'Add Image Watermark to PDF - PDF.makr.io',
  description: 'Add image watermarks (PNG/JPG) to PDF files. Configure opacity, size, position, and rotation. Apply to all, odd, even, or specific pages. Free online tool.',
  openGraph: {
    title: 'Add Image Watermark to PDF - PDF.makr.io',
    description: 'Add image watermarks to PDF files with full control over opacity, size, position, and rotation.',
    images: ['/og-image.png'],
  },
};

export default function ImageWatermarkPage() {
  return <ImageWatermarkClient />;
}
