'use client';

import { useState, useCallback } from 'react';
import { Hash, Download, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button, UploadZone, ProgressBar, Alert } from '@/components/ui';
import { formatFileSize } from '@/lib/utils';

interface EnhanceProgress {
  current: number;
  total: number;
  percentage: number;
  status: string;
}

type Position = 'bottom-center' | 'bottom-right' | 'bottom-left' | 'top-center' | 'top-right' | 'top-left';
type Format = 'number' | 'page-x-of-y' | 'custom';

const positionOptions: { value: Position; label: string }[] = [
  { value: 'bottom-center', label: 'Bottom Center' },
  { value: 'bottom-right', label: 'Bottom Right' },
  { value: 'bottom-left', label: 'Bottom Left' },
  { value: 'top-center', label: 'Top Center' },
  { value: 'top-right', label: 'Top Right' },
  { value: 'top-left', label: 'Top Left' },
];

const formatOptions: { value: Format; label: string; example: string }[] = [
  { value: 'number', label: 'Number Only', example: '1, 2, 3...' },
  { value: 'page-x-of-y', label: 'Page X of Y', example: 'Page 1 of 10' },
  { value: 'custom', label: 'Custom Format', example: 'Use {n} and {total}' },
];

export default function PageNumbersPage() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [position, setPosition] = useState<Position>('bottom-center');
  const [format, setFormat] = useState<Format>('number');
  const [customFormat, setCustomFormat] = useState('- {n} -');
  const [fontSize, setFontSize] = useState(12);
  const [startPage, setStartPage] = useState(1);
  const [startNumber, setStartNumber] = useState(1);
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

  const handleAddNumbers = async () => {
    if (!file) return;

    setProcessing(true);
    setProgress(null);
    setError(null);

    try {
      const { addPageNumbers } = await import('@/lib/pdf/enhance');
      const { downloadPDF } = await import('@/lib/pdf/utils');

      const result = await addPageNumbers(
        file,
        {
          position,
          format,
          customFormat: format === 'custom' ? customFormat : undefined,
          fontSize,
          startPage,
          startNumber,
        },
        (p) => setProgress(p)
      );

      const filename = file.name.replace('.pdf', '_numbered.pdf');
      downloadPDF(result, filename);
      setComplete(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add page numbers');
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
            <Hash className="h-7 w-7 text-accent-600 dark:text-accent-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-text-primary">Add Page Numbers</h1>
            <p className="mt-1 text-text-secondary">
              Add page numbers to your PDF document
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
            Page Numbers Added!
          </h2>
          <p className="text-text-secondary mb-6">
            Your PDF has been downloaded with page numbers.
          </p>
          <Button variant="secondary" onClick={handleReset}>
            Number Another PDF
          </Button>
        </div>
      )}

      {/* Processing State */}
      {processing && (
        <div className="rounded-xl border border-border-medium bg-surface-50 p-8">
          <h2 className="text-lg font-semibold text-text-primary mb-4 text-center">
            Adding Page Numbers...
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
            <UploadZone
              onDrop={handleFileDrop}
              multiple={false}
              fileType="pdf"
            />
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

              {/* Position Selector */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-text-primary">Position</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {positionOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setPosition(opt.value)}
                      className={`p-3 rounded-xl border-2 text-center text-sm transition-all ${
                        position === opt.value
                          ? 'border-accent-500 bg-accent-50 dark:bg-accent-100/10'
                          : 'border-border-medium hover:border-accent-500/50'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Format Selector */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-text-primary">Format</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {formatOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setFormat(opt.value)}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${
                        format === opt.value
                          ? 'border-accent-500 bg-accent-50 dark:bg-accent-100/10'
                          : 'border-border-medium hover:border-accent-500/50'
                      }`}
                    >
                      <p className="font-medium text-text-primary text-sm">{opt.label}</p>
                      <p className="text-xs text-text-secondary">{opt.example}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Format Input */}
              {format === 'custom' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-primary">Custom Format</label>
                  <input
                    type="text"
                    value={customFormat}
                    onChange={(e) => setCustomFormat(e.target.value)}
                    placeholder="- {n} -"
                    className="w-full px-4 py-2 rounded-lg border border-border-medium bg-background text-text-primary"
                  />
                  <p className="text-xs text-text-secondary">
                    Use {'{n}'} for page number and {'{total}'} for total pages
                  </p>
                </div>
              )}

              {/* Additional Options */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-primary">Font Size</label>
                  <input
                    type="number"
                    min={8}
                    max={24}
                    value={fontSize}
                    onChange={(e) => setFontSize(Math.max(8, Math.min(24, parseInt(e.target.value) || 12)))}
                    className="w-full px-4 py-2 rounded-lg border border-border-medium bg-background text-text-primary"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-primary">Start from Page</label>
                  <input
                    type="number"
                    min={1}
                    max={pageCount}
                    value={startPage}
                    onChange={(e) => setStartPage(Math.max(1, Math.min(pageCount, parseInt(e.target.value) || 1)))}
                    className="w-full px-4 py-2 rounded-lg border border-border-medium bg-background text-text-primary"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-primary">Start Number</label>
                  <input
                    type="number"
                    min={1}
                    value={startNumber}
                    onChange={(e) => setStartNumber(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-4 py-2 rounded-lg border border-border-medium bg-background text-text-primary"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-border-light">
                <Button variant="ghost" onClick={handleReset} className="w-full sm:w-auto">
                  Cancel
                </Button>
                <Button onClick={handleAddNumbers} className="w-full sm:w-auto">
                  <Hash className="h-5 w-5 mr-2" />
                  Add Page Numbers
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
