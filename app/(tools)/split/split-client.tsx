'use client';

import { useState, useCallback } from 'react';
import { Scissors, Download, ArrowLeft, FileDown } from 'lucide-react';
import Link from 'next/link';
import { Button, UploadZone, ProgressBar, Alert } from '@/components/ui';
import { formatFileSize } from '@/lib/utils';
import type { PageRange } from '@/types/pdf';

interface SplitProgress {
  current: number;
  total: number;
  percentage: number;
  status?: string;
}

interface PageThumbnail {
  pageNumber: number;
  dataUrl: string;
}

type SplitMode = 'range' | 'extract' | 'each';

export default function SplitClient() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [thumbnails, setThumbnails] = useState<PageThumbnail[]>([]);
  const [loadingThumbnails, setLoadingThumbnails] = useState(false);
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [splitMode, setSplitMode] = useState<SplitMode>('extract');
  const [rangeStart, setRangeStart] = useState(1);
  const [rangeEnd, setRangeEnd] = useState(1);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState<SplitProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileDrop = useCallback(async (files: File[]) => {
    const droppedFile = files[0];
    if (!droppedFile || droppedFile.type !== 'application/pdf') {
      setError('Please upload a PDF file');
      return;
    }

    try {
      setLoadingThumbnails(true);
      const { getPDFPageCount } = await import('@/lib/pdf/utils');
      const { generateThumbnails } = await import('@/lib/pdf/thumbnails');

      const count = await getPDFPageCount(droppedFile);
      setFile(droppedFile);
      setPageCount(count);
      setRangeEnd(count);
      setSelectedPages([]);
      setError(null);

      // Generate thumbnails
      const thumbs = await generateThumbnails(droppedFile, 150, (p) => setProgress(p));
      setThumbnails(thumbs);
      setLoadingThumbnails(false);
      setProgress(null);
    } catch (err) {
      setError('Failed to read the PDF file. It may be corrupted or password-protected.');
      setLoadingThumbnails(false);
    }
  }, []);

  const handleLoadSample = async () => {
    try {
      const response = await fetch('/sample.pdf');
      const blob = await response.blob();
      const sampleFile = new File([blob], 'sample.pdf', { type: 'application/pdf' });
      await handleFileDrop([sampleFile]);
    } catch (err) {
      setError('Failed to load sample file');
    }
  };

  const handleSplit = async () => {
    if (!file) return;

    setProcessing(true);
    setProgress(null);
    setError(null);

    try {
      const { splitPDF, extractPages, createZipFromPDFs } = await import('@/lib/pdf/split');
      const { downloadPDF, downloadZip } = await import('@/lib/pdf/utils');

      if (splitMode === 'extract') {
        if (selectedPages.length === 0) {
          setError('Please select at least one page to extract');
          setProcessing(false);
          return;
        }

        const result = await extractPages(file, selectedPages, (p) => setProgress(p));
        const filename = `${file.name.replace('.pdf', '')}_extracted.pdf`;
        downloadPDF(result, filename);
      } else if (splitMode === 'range') {
        const ranges: PageRange[] = [{ start: rangeStart, end: rangeEnd }];
        const results = await splitPDF(file, ranges, (p) => setProgress(p));

        if (results.length === 1) {
          downloadPDF(results[0].data, results[0].filename);
        }
      } else if (splitMode === 'each') {
        const ranges: PageRange[] = Array.from(
          { length: pageCount },
          (_, i) => ({ start: i + 1, end: i + 1 })
        );
        const results = await splitPDF(file, ranges, (p) => setProgress(p));
        const zipData = await createZipFromPDFs(results);
        downloadZip(zipData, `${file.name.replace('.pdf', '')}_split.zip`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to split PDF');
    } finally {
      setProcessing(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setThumbnails([]);
    setPageCount(0);
    setSelectedPages([]);
    setProgress(null);
    setError(null);
    setLoadingThumbnails(false);
  };

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
            <Scissors className="h-7 w-7 text-accent-600 dark:text-accent-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-text-primary">Split PDF</h1>
            <p className="mt-1 text-text-secondary">
              Extract pages or split into multiple files
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

      {/* Processing State */}
      {processing && (
        <div className="rounded-xl border border-border-medium bg-surface-50 p-8">
          <h2 className="text-lg font-semibold text-text-primary mb-4 text-center">
            Splitting PDF...
          </h2>
          <ProgressBar
            progress={progress?.percentage ?? 0}
            status={progress ? `Processing ${progress.current} of ${progress.total}` : 'Starting split...'}
          />
        </div>
      )}

      {/* Upload State */}
      {!file && !processing && (
        <>
          <UploadZone
            onDrop={handleFileDrop}
            multiple={false}
            fileType="pdf"
          />
          <div className="mt-6 text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLoadSample}
              className="text-accent-600 hover:text-accent-700"
            >
              Try with sample file
            </Button>
          </div>
        </>
      )}

      {/* Loading Thumbnails */}
      {loadingThumbnails && !processing && (
        <div className="rounded-xl border border-border-medium bg-surface-50 p-8">
          <h2 className="text-lg font-semibold text-text-primary mb-4 text-center">
            Loading Pages...
          </h2>
          <ProgressBar
            progress={progress?.percentage ?? 0}
            status={progress?.status ?? 'Starting...'}
          />
        </div>
      )}

      {/* Edit State */}
      {file && !loadingThumbnails && !processing && thumbnails.length > 0 && (
        <div className="space-y-4">
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

          {/* Split Mode Selector */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={splitMode === 'extract' ? 'primary' : 'secondary'}
              onClick={() => setSplitMode('extract')}
            >
              Extract Selected Pages
            </Button>
            <Button
              variant={splitMode === 'range' ? 'primary' : 'secondary'}
              onClick={() => setSplitMode('range')}
            >
              Extract Range
            </Button>
            <Button
              variant={splitMode === 'each' ? 'primary' : 'secondary'}
              onClick={() => setSplitMode('each')}
            >
              Split Each Page
            </Button>
          </div>

          {/* Page selection UI */}
          {splitMode === 'extract' && (
            <div className="space-y-3">
              {/* Selection controls */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-text-secondary mr-2">
                  {selectedPages.length} of {pageCount} pages selected
                </span>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedPages(Array.from({ length: pageCount }, (_, i) => i + 1))}
                  >
                    All
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedPages([])}>
                    None
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setSelectedPages(
                        Array.from({ length: pageCount }, (_, i) => i + 1).filter((p) => p % 2 === 1)
                      )
                    }
                  >
                    Odd
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setSelectedPages(
                        Array.from({ length: pageCount }, (_, i) => i + 1).filter((p) => p % 2 === 0)
                      )
                    }
                  >
                    Even
                  </Button>
                </div>
              </div>

              {/* Page thumbnails grid */}
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
                {thumbnails.map((thumb) => {
                  const isSelected = selectedPages.includes(thumb.pageNumber);
                  return (
                    <div
                      key={thumb.pageNumber}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedPages(selectedPages.filter((p) => p !== thumb.pageNumber));
                        } else {
                          setSelectedPages([...selectedPages, thumb.pageNumber]);
                        }
                      }}
                      className={`relative aspect-[1/1.4] overflow-hidden rounded-lg border-2 shadow-sm transition-all cursor-pointer ${
                        isSelected
                          ? 'border-accent-500 ring-2 ring-accent-500/20'
                          : 'border-border-medium hover:border-accent-500/50'
                      }`}
                    >
                      <img
                        src={thumb.dataUrl}
                        alt={`Page ${thumb.pageNumber}`}
                        className="w-full h-full object-contain bg-white dark:bg-gray-900"
                      />
                      <div
                        className={`absolute bottom-0 left-0 right-0 bg-surface-50/95 dark:bg-gray-900/95 backdrop-blur-sm py-1 text-center text-xs font-medium border-t border-border-light ${
                          isSelected ? 'text-accent-700 dark:text-accent-500' : 'text-text-primary'
                        }`}
                      >
                        {thumb.pageNumber}
                      </div>
                      {isSelected && (
                        <div className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-accent-500 text-white shadow-md">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <p className="text-xs text-text-tertiary">
                Tip: Click pages to select them for extraction
              </p>
            </div>
          )}

          {/* Range Input */}
          {splitMode === 'range' && (
            <div className="flex items-center gap-4 p-6 rounded-xl border border-border-medium bg-surface-50">
              <label className="text-sm font-medium text-text-primary">From page</label>
              <input
                type="number"
                min={1}
                max={pageCount}
                value={rangeStart}
                onChange={(e) => setRangeStart(Math.max(1, Math.min(pageCount, parseInt(e.target.value) || 1)))}
                className="w-20 px-3 py-2 rounded-lg border border-border-medium bg-background text-text-primary text-center"
              />
              <span className="text-text-secondary">to</span>
              <input
                type="number"
                min={1}
                max={pageCount}
                value={rangeEnd}
                onChange={(e) => setRangeEnd(Math.max(rangeStart, Math.min(pageCount, parseInt(e.target.value) || 1)))}
                className="w-20 px-3 py-2 rounded-lg border border-border-medium bg-background text-text-primary text-center"
              />
              <span className="text-sm text-text-secondary">
                ({rangeEnd - rangeStart + 1} pages)
              </span>
            </div>
          )}

          {/* Each Page Info */}
          {splitMode === 'each' && (
            <div className="p-6 rounded-xl border border-border-medium bg-surface-50 text-center">
              <FileDown className="h-12 w-12 text-accent-500 mx-auto mb-4" />
              <h3 className="font-medium text-text-primary mb-2">Split into {pageCount} separate files</h3>
              <p className="text-sm text-text-secondary">
                Each page will be saved as a separate PDF. All files will be downloaded as a ZIP archive.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border-light">
            <Button variant="ghost" onClick={handleReset}>
              Start Over
            </Button>
            <Button onClick={handleSplit}>
              <Download className="h-5 w-5 mr-2" />
              {splitMode === 'extract' && `Extract ${selectedPages.length} Pages`}
              {splitMode === 'range' && `Extract Pages ${rangeStart}-${rangeEnd}`}
              {splitMode === 'each' && `Split into ${pageCount} Files`}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
