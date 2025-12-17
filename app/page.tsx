'use client';

import {
  Layers,
  Scissors,
  FileOutput,
  Image,
  ImagePlus,
  RotateCw,
  Trash2,
  Shield,
  Zap,
  Hash,
  Stamp,
  FileText,
  ArrowUpDown,
  Lock,
  Image as ImageIcon,
} from 'lucide-react';
import { ToolCard } from '@/components/ui/tool-card';
import { Alert } from '@/components/ui/alert';

const tools = [
  {
    icon: Layers,
    title: 'Merge PDFs',
    description: 'Combine multiple PDF files into a single document',
    href: '/merge',
  },
  {
    icon: Scissors,
    title: 'Split PDF',
    description: 'Extract pages or split into multiple files',
    href: '/split',
  },
  {
    icon: FileOutput,
    title: 'Compress PDF',
    description: 'Reduce file size while maintaining quality',
    href: '/compress',
  },
  {
    icon: Image,
    title: 'PDF to Images',
    description: 'Convert PDF pages to PNG or JPG images',
    href: '/pdf-to-images',
  },
  {
    icon: ImagePlus,
    title: 'Images to PDF',
    description: 'Create a PDF from multiple images',
    href: '/images-to-pdf',
  },
  {
    icon: RotateCw,
    title: 'Rotate Pages',
    description: 'Rotate PDF pages to any orientation',
    href: '/rotate',
  },
  {
    icon: Trash2,
    title: 'Delete Pages',
    description: 'Remove unwanted pages from your PDF',
    href: '/delete',
  },
  {
    icon: Hash,
    title: 'Page Numbers',
    description: 'Add page numbers to your PDF document',
    href: '/page-numbers',
  },
  {
    icon: Stamp,
    title: 'Watermark',
    description: 'Add text watermarks to PDF pages',
    href: '/watermark',
  },
  {
    icon: FileText,
    title: 'Extract Text',
    description: 'Extract text from PDFs and convert to markdown',
    href: '/extract-text',
  },
  {
    icon: ArrowUpDown,
    title: 'Organize Pages',
    description: 'Reorder and reorganize pages with drag-and-drop',
    href: '/organize',
  },
  {
    icon: Lock,
    title: 'Protect PDF',
    description: 'Password protection (coming soon)',
    href: '/protect',
  },
  {
    icon: ImageIcon,
    title: 'Image Watermark',
    description: 'Add image watermarks (PNG/JPG) to PDFs',
    href: '/image-watermark',
  },
];

const features = [
  {
    icon: Shield,
    title: '100% Private',
    description: 'Files are processed locally in your browser. Nothing is uploaded to any server.',
  },
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'No waiting for uploads or downloads. Processing happens instantly on your device.',
  },
  {
    icon: Layers,
    title: 'No Limits',
    description: 'Process as many files as you want. No file size limits, no daily quotas.',
  },
];

export default function HomePage() {
  return (
    <>
      {/* Hero Section with full-width background */}
      <section className="relative text-center mb-16 lg:mb-24 overflow-hidden py-12 lg:py-20">
        {/* Decorative pattern background - full width */}
        <div className="absolute inset-0 -z-10 opacity-[0.03] dark:opacity-[0.02]">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
            backgroundSize: '32px 32px'
          }} />
        </div>

        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <h1 className="text-4xl lg:text-5xl font-bold text-text-primary tracking-tight">
            PDF Tools That Respect Your Privacy
          </h1>
          <p className="mt-6 text-lg lg:text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed">
            Merge, split, compress, and convert PDFs—all in your browser.{' '}
            No uploads required.{' '}
            Completely free.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-6 lg:px-8">

      {/* Privacy Alert */}
      <Alert variant="privacy" className="max-w-2xl mx-auto mb-12 lg:mb-16">
        <strong>Your files stay private.</strong> All processing happens in your browser.
        Your PDFs never leave your device.
      </Alert>

      {/* Tools Grid */}
      <section className="mb-20 lg:mb-28">
        <h2 className="text-2xl font-semibold text-text-primary mb-8 text-center">
          Choose a Tool
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {tools.map((tool) => (
            <ToolCard
              key={tool.href}
              icon={tool.icon}
              title={tool.title}
              description={tool.description}
              href={tool.href}
            />
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="mt-20 lg:mt-28 text-center pb-12">
        <p className="text-text-secondary">
          For 90% of PDF tasks, pdf.makr.io is all you need.
          <br />
          And unlike other tools, your files never leave your browser.
        </p>
      </section>
      </div>

      {/* Features Section with full-width background */}
      <section className="relative border-t border-border-light pt-16 lg:pt-20 pb-16 lg:pb-20 overflow-hidden">
        {/* Subtle gradient pattern background - full width */}
        <div className="absolute inset-0 -z-10 opacity-[0.02] dark:opacity-[0.015]">
          <div className="absolute inset-0" style={{
            backgroundImage: `linear-gradient(45deg, currentColor 25%, transparent 25%, transparent 75%, currentColor 75%, currentColor),
                             linear-gradient(45deg, currentColor 25%, transparent 25%, transparent 75%, currentColor 75%, currentColor)`,
            backgroundSize: '40px 40px',
            backgroundPosition: '0 0, 20px 20px'
          }} />
        </div>

        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <h2 className="text-2xl font-semibold text-text-primary mb-12 text-center">
            Why pdf.makr.io?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            {features.map((feature) => (
              <div key={feature.title} className="text-center">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-accent-50 dark:bg-accent-100/10 mb-4">
                  <feature.icon className="h-7 w-7 text-accent-600 dark:text-accent-500" />
                </div>
                <h3 className="text-lg font-semibold text-text-primary mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
