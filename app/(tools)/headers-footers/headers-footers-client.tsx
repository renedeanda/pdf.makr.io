'use client';

import { useState, useCallback } from 'react';
import { FileType, Download, ArrowLeft, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import Link from 'next/link';
import { Button, UploadZone, ProgressBar, Alert } from '@/components/ui';
import { formatFileSize } from '@/lib/utils';
import type { EnhanceProgress } from '@/lib/pdf/enhance';

export default function HeadersFootersClient() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);

  // Header fields
  const [headerLeft, setHeaderLeft] = useState('');
  const [headerCenter, setHeaderCenter] = useState('');
  const [headerRight, setHeaderRight] = useState('');

  // Footer fields
  const [footerLeft, setFooterLeft] = useState('');
  const [footerCenter, setFooterCenter] = useState('Page {page} of {total}');
  const [footerRight, setFooterRight] = useState('{date}');

  // Styling
  const [fontSize, setFontSize] = useState(10);
  const [color, setColor] = useState({ r: 0.3, g: 0.3, b: 0.3 });
  const [differentFirstPage, setDifferentFirstPage] = useState(false);

  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState<EnhanceProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [complete, setComplete] = useState(false);

  const handleFileDrop = useCallback(async (files: File[]) => {
    const droppedFile = files[0];
    if (!droppedFile || droppedFile.type !== 'application/pdf') {
      setError('Please upload a PDF file');
      return;
    }

    try {
      const { getPDFPageCount } = await import('@/lib/pdf/utils');
      const count = await getPDFPageCount(droppedFile);
      setFile(droppedFile);
      setPageCount(count);
      setComplete(false);
      setError(null);
    } catch (err) {
      setError('Failed to read the PDF file. It may be corrupted or password-protected.');
    }
  }, []);

  const handleApply = async () => {
    if (!file) return;

    // Check if at least one field has content
    const hasContent =
      headerLeft || headerCenter || headerRight || footerLeft || footerCenter || footerRight;

    if (!hasContent) {
      setError('Please enter at least one header or footer text');
      return;
    }

    setProcessing(true);
    setProgress(null);
    setError(null);

    try {
      const { addHeadersFooters } = await import('@/lib/pdf/headers-footers');
      const { downloadPDF } = await import('@/lib/pdf/utils');

      const result = await addHeadersFooters(
        file,
        {
          header:
            headerLeft || headerCenter || headerRight
              ? {
                  left: headerLeft || undefined,
                  center: headerCenter || undefined,
                  right: headerRight || undefined,
                }
              : undefined,
          footer:
            footerLeft || footerCenter || footerRight
              ? {
                  left: footerLeft || undefined,
                  center: footerCenter || undefined,
                  right: footerRight || undefined,
                }
              : undefined,
          fontSize,
          color,
          differentFirstPage,
        },
        (p) => setProgress(p)
      );

      const filename = file.name.replace('.pdf', '_headers-footers.pdf');
      downloadPDF(result, filename);

      setComplete(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add headers/footers');
    } finally {
      setProcessing(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPageCount(0);
    setProgress(null);
    setComplete(false);
    setError(null);
  };

  const colorPresets = [
    { name: 'Dark Gray', value: { r: 0.3, g: 0.3, b: 0.3 } },
    { name: 'Black', value: { r: 0, g: 0, b: 0 } },
    { name: 'Blue', value: { r: 0.2, g: 0.2, b: 0.8 } },
    { name: 'Red', value: { r: 0.8, g: 0.2, b: 0.2 } },
  ];

  return (
    <div className="mx-auto max-w-5xl px-6 lg:px-8 py-12">
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
            <FileType className="h-7 w-7 text-accent-600 dark:text-accent-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-text-primary">Headers & Footers</h1>
            <p className="mt-1 text-text-secondary">
              Add dynamic headers and footers to your PDF pages
            </p>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="error" className="mb-6" onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Complete State */}
      {complete && !processing && (
        <div className="rounded-xl border border-success/30 bg-green-50 dark:bg-green-950/20 p-8 text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-success/10 mb-4">
            <Download className="h-8 w-8 text-success" />
          </div>
          <h2 className="text-xl font-semibold text-text-primary mb-2">
            Headers & Footers Added!
          </h2>
          <p className="text-text-secondary mb-6">
            Your PDF has been downloaded with headers and footers.
          </p>
          <Button variant="secondary" onClick={handleReset}>
            Process Another PDF
          </Button>
        </div>
      )}

      {/* Processing State */}
      {processing && (
        <div className="rounded-xl border border-border-medium bg-surface-50 p-8">
          <h2 className="text-lg font-semibold text-text-primary mb-4 text-center">
            Adding Headers & Footers...
          </h2>
          <ProgressBar
            progress={progress?.percentage ?? 0}
            status={progress?.status ?? 'Starting...'}
          />
        </div>
      )}

      {/* Upload/Configure State */}
      {!complete && !processing && (
        <>
          {!file ? (
            <UploadZone onDrop={handleFileDrop} multiple={false} fileType="pdf" />
          ) : (
            <div className="space-y-6">
              {/* File Info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg border border-border-medium bg-surface-50">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-text-primary truncate">{file.name}</p>
                  <p className="text-sm text-text-secondary">
                    {pageCount} pages • {formatFileSize(file.size)}
                  </p>
                </div>
                <Button variant="ghost" onClick={handleReset} className="shrink-0">
                  Change File
                </Button>
              </div>

              {/* Variables Info */}
              <Alert variant="info">
                <p className="font-medium mb-2">Available Variables:</p>
                <div className="text-sm grid grid-cols-2 gap-2">
                  <span><code className="bg-background px-1.5 py-0.5 rounded">{'{page}'}</code> - Current page number</span>
                  <span><code className="bg-background px-1.5 py-0.5 rounded">{'{total}'}</code> - Total pages</span>
                  <span><code className="bg-background px-1.5 py-0.5 rounded">{'{date}'}</code> - Current date</span>
                  <span><code className="bg-background px-1.5 py-0.5 rounded">{'{title}'}</code> - PDF title</span>
                </div>
              </Alert>

              {/* Header Configuration */}
              <div className="rounded-xl border border-border-medium bg-surface-50 p-6 space-y-4">
                <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                  <AlignCenter className="h-5 w-5 text-accent-600 dark:text-accent-500" />
                  Header
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-text-primary flex items-center gap-1">
                      <AlignLeft className="h-4 w-4" /> Left
                    </label>
                    <input
                      type="text"
                      value={headerLeft}
                      onChange={(e) => setHeaderLeft(e.target.value)}
                      placeholder="Left header text"
                      className="w-full px-3 py-2 rounded-lg border border-border-medium bg-background text-text-primary text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-text-primary flex items-center gap-1">
                      <AlignCenter className="h-4 w-4" /> Center
                    </label>
                    <input
                      type="text"
                      value={headerCenter}
                      onChange={(e) => setHeaderCenter(e.target.value)}
                      placeholder="Center header text"
                      className="w-full px-3 py-2 rounded-lg border border-border-medium bg-background text-text-primary text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-text-primary flex items-center gap-1">
                      <AlignRight className="h-4 w-4" /> Right
                    </label>
                    <input
                      type="text"
                      value={headerRight}
                      onChange={(e) => setHeaderRight(e.target.value)}
                      placeholder="Right header text"
                      className="w-full px-3 py-2 rounded-lg border border-border-medium bg-background text-text-primary text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Footer Configuration */}
              <div className="rounded-xl border border-border-medium bg-surface-50 p-6 space-y-4">
                <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                  <AlignCenter className="h-5 w-5 text-accent-600 dark:text-accent-500" />
                  Footer
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-text-primary flex items-center gap-1">
                      <AlignLeft className="h-4 w-4" /> Left
                    </label>
                    <input
                      type="text"
                      value={footerLeft}
                      onChange={(e) => setFooterLeft(e.target.value)}
                      placeholder="Left footer text"
                      className="w-full px-3 py-2 rounded-lg border border-border-medium bg-background text-text-primary text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-text-primary flex items-center gap-1">
                      <AlignCenter className="h-4 w-4" /> Center
                    </label>
                    <input
                      type="text"
                      value={footerCenter}
                      onChange={(e) => setFooterCenter(e.target.value)}
                      placeholder="Center footer text"
                      className="w-full px-3 py-2 rounded-lg border border-border-medium bg-background text-text-primary text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-text-primary flex items-center gap-1">
                      <AlignRight className="h-4 w-4" /> Right
                    </label>
                    <input
                      type="text"
                      value={footerRight}
                      onChange={(e) => setFooterRight(e.target.value)}
                      placeholder="Right footer text"
                      className="w-full px-3 py-2 rounded-lg border border-border-medium bg-background text-text-primary text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Styling Options */}
              <div className="rounded-xl border border-border-medium bg-surface-50 p-6 space-y-4">
                <h2 className="text-lg font-semibold text-text-primary">Styling</h2>

                {/* Font Size */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-primary">
                    Font Size: {fontSize}pt
                  </label>
                  <input
                    type="range"
                    min={8}
                    max={16}
                    value={fontSize}
                    onChange={(e) => setFontSize(parseInt(e.target.value))}
                    className="w-full accent-accent-500"
                  />
                </div>

                {/* Color Presets */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-primary">Color</label>
                  <div className="flex flex-wrap gap-2">
                    {colorPresets.map((preset) => (
                      <button
                        key={preset.name}
                        onClick={() => setColor(preset.value)}
                        className={`px-4 py-2 rounded-lg border-2 transition-all ${
                          color.r === preset.value.r &&
                          color.g === preset.value.g &&
                          color.b === preset.value.b
                            ? 'border-accent-500 bg-accent-50 dark:bg-accent-100/10'
                            : 'border-border-medium hover:border-accent-500/50'
                        }`}
                      >
                        <span
                          className="inline-block w-4 h-4 rounded mr-2"
                          style={{
                            backgroundColor: `rgb(${preset.value.r * 255}, ${preset.value.g * 255}, ${preset.value.b * 255})`,
                          }}
                        />
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Different First Page */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="differentFirstPage"
                    checked={differentFirstPage}
                    onChange={(e) => setDifferentFirstPage(e.target.checked)}
                    className="w-4 h-4 rounded border-border-medium text-accent-600 focus:ring-accent-500"
                  />
                  <label htmlFor="differentFirstPage" className="text-sm font-medium text-text-primary cursor-pointer">
                    Different first page (skip headers/footers on page 1)
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-border-light">
                <Button variant="ghost" onClick={handleReset} className="w-full sm:w-auto">
                  Cancel
                </Button>
                <Button onClick={handleApply} className="w-full sm:w-auto">
                  <Download className="h-5 w-5 mr-2" />
                  Apply & Download
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
