'use client';

import { useState, useCallback, useMemo } from 'react';
import { Scissors, Download, ArrowLeft, FileDown } from 'lucide-react';
import Link from 'next/link';
import { Button, UploadZone, ProgressBar, Alert } from '@/components/ui';
import { PageSelector } from '@/components/pdf';
import { splitPDF, extractPages, createZipFromPDFs, SplitProgress } from '@/lib/pdf/split';
import { getPDFPageCount, downloadPDF, downloadZip } from '@/lib/pdf/utils';
import { formatFileSize } from '@/lib/utils';
import type { PageRange } from '@/types/pdf';

type SplitMode = 'range' | 'extract' | 'each';

export default function SplitPage() {
  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [pageCount, setPageCount] = useState(0);
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
      const count = await getPDFPageCount(droppedFile);
      setFile(droppedFile);
      setFileUrl(URL.createObjectURL(droppedFile));
      setPageCount(count);
      setRangeEnd(count);
      setSelectedPages([]);
      setError(null);
    } catch (err) {
      setError('Failed to read the PDF file. It may be corrupted or password-protected.');
    }
  }, []);

  const handleSplit = async () => {
    if (!file) return;

    setProcessing(true);
    setProgress(null);
    setError(null);

    try {
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
        // Split into individual pages
        const ranges: PageRange[] = Array.from(
          { length: pageCount },
          (_, i) => ({ start: i + 1, end: i + 1 })
        );
        const results = await splitPDF(file, ranges, (p) => setProgress(p));

        // Create ZIP file
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
    if (fileUrl) URL.revokeObjectURL(fileUrl);
    setFile(null);
    setFileUrl(null);
    setPageCount(0);
    setSelectedPages([]);
    setProgress(null);
    setError(null);
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
      {processing && progress && (
        <div className="rounded-xl border border-border-medium bg-surface-50 p-8">
          <h2 className="text-lg font-semibold text-text-primary mb-4 text-center">
            Splitting PDF...
          </h2>
          <ProgressBar
            progress={progress.percentage}
            status={`Processing ${progress.current} of ${progress.total}`}
          />
        </div>
      )}

      {/* Upload State */}
      {!file && !processing && (
        <UploadZone
          onDrop={handleFileDrop}
          multiple={false}
          fileType="pdf"
        />
      )}

      {/* Edit State */}
      {file && fileUrl && !processing && (
        <div className="space-y-6">
          {/* File Info */}
          <div className="flex items-center justify-between p-4 rounded-lg border border-border-medium bg-surface-50">
            <div>
              <p className="font-medium text-text-primary">{file.name}</p>
              <p className="text-sm text-text-secondary">
                {pageCount} pages • {formatFileSize(file.size)}
              </p>
            </div>
            <Button variant="ghost" onClick={handleReset}>
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

          {/* Page Selection */}
          {splitMode === 'extract' && (
            <PageSelector
              pdfUrl={fileUrl}
              totalPages={pageCount}
              selectedPages={selectedPages}
              onSelectionChange={setSelectedPages}
              mode="select"
            />
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
