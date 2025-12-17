'use client';

import { Lock, ArrowLeft, AlertCircle, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { Alert } from '@/components/ui';

export default function ProtectClient() {
  return (
    <div className="mx-auto max-w-4xl px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-accent-600 transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to tools
        </Link>
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-accent-50 dark:bg-accent-100/10">
            <Lock className="h-7 w-7 text-accent-600 dark:text-accent-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-text-primary">Protect PDF</h1>
            <p className="mt-1 text-text-secondary">
              Add password protection to your PDF files
            </p>
          </div>
        </div>
      </div>

      {/* Feature Not Available Notice */}
      <Alert variant="warning" className="mb-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">PDF Password Protection Not Yet Available</p>
            <p className="text-sm mt-2 opacity-90">
              While we strive to keep all PDF processing in your browser for privacy,
              password protection requires encryption capabilities that are not currently
              supported by browser-based PDF libraries.
            </p>
          </div>
        </div>
      </Alert>

      {/* Coming Soon Info */}
      <div className="rounded-xl border border-border-medium bg-surface-50 p-8">
        <h2 className="text-xl font-semibold text-text-primary mb-4">
          Why isn't this available?
        </h2>
        <div className="prose prose-sm max-w-none text-text-secondary space-y-4">
          <p>
            PDF password protection requires encryption algorithms that aren't yet
            available in browser-compatible PDF libraries. We're committed to keeping
            your files private by processing everything locally, which means we need
            to wait for these libraries to add encryption support.
          </p>

          <h3 className="text-lg font-semibold text-text-primary mt-6 mb-3">
            What features were planned?
          </h3>
          <ul className="list-disc list-inside space-y-2">
            <li>User password (required to open the PDF)</li>
            <li>Owner password (required to modify permissions)</li>
            <li>Permission controls for printing, copying, and editing</li>
            <li>128-bit AES encryption for security</li>
            <li>All processing in your browser for privacy</li>
          </ul>

          <h3 className="text-lg font-semibold text-text-primary mt-6 mb-3">
            Alternative Solutions
          </h3>
          <p>
            Until we can add this feature, we recommend using desktop PDF software for
            password protection:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <div className="border border-border-medium rounded-lg p-4">
              <h4 className="font-semibold text-text-primary mb-2">Adobe Acrobat</h4>
              <p className="text-sm">
                Industry-standard PDF software with full encryption support.
              </p>
              <a
                href="https://www.adobe.com/acrobat/online/password-protect-pdf.html"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-accent-600 hover:text-accent-700 mt-2"
              >
                Learn more <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <div className="border border-border-medium rounded-lg p-4">
              <h4 className="font-semibold text-text-primary mb-2">PDFtk (Free)</h4>
              <p className="text-sm">
                Free, open-source command-line tool for PDF encryption.
              </p>
              <a
                href="https://www.pdflabs.com/tools/pdftk-the-pdf-toolkit/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-accent-600 hover:text-accent-700 mt-2"
              >
                Download <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>

          <h3 className="text-lg font-semibold text-text-primary mt-6 mb-3">
            When will this be available?
          </h3>
          <p>
            We're actively monitoring PDF library developments and will add this feature
            as soon as browser-compatible encryption becomes available. Our commitment
            to privacy means we won't compromise by sending your files to a server.
          </p>
        </div>
      </div>

      {/* What You Can Do Now */}
      <div className="mt-6 rounded-xl border border-accent-200 bg-accent-50 dark:border-accent-500/30 dark:bg-accent-50/10 p-6">
        <h3 className="text-lg font-semibold text-text-primary mb-3">
          What you can do with pdf.makr.io right now:
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <Link href="/merge" className="text-accent-600 hover:text-accent-700 hover:underline">
            → Merge multiple PDFs
          </Link>
          <Link href="/split" className="text-accent-600 hover:text-accent-700 hover:underline">
            → Split PDF into pages
          </Link>
          <Link href="/compress" className="text-accent-600 hover:text-accent-700 hover:underline">
            → Compress PDF file size
          </Link>
          <Link href="/watermark" className="text-accent-600 hover:text-accent-700 hover:underline">
            → Add watermarks
          </Link>
          <Link href="/organize" className="text-accent-600 hover:text-accent-700 hover:underline">
            → Organize/reorder pages
          </Link>
          <Link href="/extract-text" className="text-accent-600 hover:text-accent-700 hover:underline">
            → Extract text to markdown
          </Link>
        </div>
      </div>
    </div>
  );
}
