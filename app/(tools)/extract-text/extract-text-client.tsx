'use client';

import { useState, useCallback } from 'react';
import { FileText, Download, ArrowLeft, Copy, Check } from 'lucide-react';
import Link from 'next/link';
import { Button, UploadZone, ProgressBar, Alert } from '@/components/ui';
import { formatFileSize } from '@/lib/utils';

interface ExtractProgress {
  current: number;
  total: number;
  percentage: number;
  status: string;
}

interface ExtractedPage {
  pageNumber: number;
  text: string;
  isEmpty: boolean;
}

interface ExtractResult {
  pages: ExtractedPage[];
  fullText: string;
  markdown: string;
  hasText: boolean;
  totalPages: number;
}

type ViewMode = 'plain' | 'markdown';

export default function ExtractTextClient() {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState<ExtractProgress | null>(null);
  const [result, setResult] = useState<ExtractResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('markdown');
  const [copied, setCopied] = useState(false);

  const handleFileDrop = useCallback(async (files: File[]) => {
    const droppedFile = files[0];
    if (!droppedFile || droppedFile.type !== 'application/pdf') {
      setError('Please upload a PDF file');
      return;
    }

    setFile(droppedFile);
    setResult(null);
    setError(null);
  }, []);

  const handleExtract = async () => {
    if (!file) return;

    setProcessing(true);
    setProgress(null);
    setError(null);

    try {
      const { extractTextFromPDF } = await import('@/lib/pdf/extract');

      const extractResult = await extractTextFromPDF(file, (p) => setProgress(p));

      if (!extractResult.hasText) {
        setError(
          'No text found in this PDF. It may be a scanned document or contain only images. Try using OCR software to extract text from scanned PDFs.'
        );
        setResult(extractResult); // Still show the result with empty page indicators
      } else {
        setResult(extractResult);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to extract text');
    } finally {
      setProcessing(false);
    }
  };

  const handleCopy = async () => {
    if (!result) return;

    try {
      const { copyToClipboard } = await import('@/lib/pdf/extract');
      const textToCopy = viewMode === 'markdown' ? result.markdown : result.fullText;
      await copyToClipboard(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      setError('Failed to copy to clipboard');
    }
  };

  const handleDownload = async () => {
    if (!result || !file) return;

    try {
      const { downloadMarkdown } = await import('@/lib/pdf/extract');
      const filename = file.name.replace('.pdf', '.md');
      const textToDownload = viewMode === 'markdown' ? result.markdown : result.fullText;
      downloadMarkdown(textToDownload, filename);
    } catch (err) {
      setError('Failed to download markdown file');
    }
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    setProgress(null);
    setError(null);
    setCopied(false);
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
            <FileText className="h-7 w-7 text-accent-600 dark:text-accent-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-text-primary">Extract Text to Markdown</h1>
            <p className="mt-1 text-text-secondary">
              Extract text from PDFs and convert to markdown format
            </p>
          </div>
        </div>
      </div>

      {/* Privacy Alert */}
      <Alert variant="privacy" className="mb-6">
        <p className="font-medium">Your files never leave your device</p>
        <p className="text-sm mt-1 opacity-90">
          All text extraction happens in your browser. No uploads, no servers.
        </p>
      </Alert>

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
            Extracting Text...
          </h2>
          <ProgressBar
            progress={progress?.percentage ?? 0}
            status={progress?.status ?? 'Starting...'}
          />
        </div>
      )}

      {/* Upload State */}
      {!result && !processing && (
        <>
          {!file ? (
            <UploadZone onDrop={handleFileDrop} multiple={false} fileType="pdf" />
          ) : (
            <div className="space-y-6">
              {/* File Info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg border border-border-medium bg-surface-50">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-text-primary truncate">{file.name}</p>
                  <p className="text-sm text-text-secondary">{formatFileSize(file.size)}</p>
                </div>
                <Button variant="ghost" onClick={handleReset} className="shrink-0">
                  Change File
                </Button>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-border-light">
                <Button variant="ghost" onClick={handleReset} className="w-full sm:w-auto">
                  Cancel
                </Button>
                <Button onClick={handleExtract} className="w-full sm:w-auto">
                  <FileText className="h-5 w-5 mr-2" />
                  Extract Text
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Result State */}
      {result && !processing && (
        <div className="space-y-6">
          {/* File Info */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg border border-border-medium bg-surface-50">
            <div className="min-w-0 flex-1">
              <p className="font-medium text-text-primary">
                {result.hasText
                  ? `Extracted text from ${result.totalPages} pages`
                  : 'No text found'}
              </p>
              {result.hasText && (
                <p className="text-sm text-text-secondary">
                  {result.pages.filter((p) => !p.isEmpty).length} pages with text,{' '}
                  {result.pages.filter((p) => p.isEmpty).length} empty
                </p>
              )}
            </div>
            <Button variant="ghost" onClick={handleReset} className="shrink-0">
              Extract Another PDF
            </Button>
          </div>

          {/* View Mode Toggle */}
          {result.hasText && (
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex gap-2 flex-1">
                <button
                  onClick={() => setViewMode('markdown')}
                  className={`flex-1 px-4 py-2 rounded-lg border-2 transition-all ${
                    viewMode === 'markdown'
                      ? 'border-accent-500 bg-accent-50 dark:bg-accent-100/10 text-accent-700 dark:text-accent-400'
                      : 'border-border-medium hover:border-accent-500/50 text-text-secondary'
                  }`}
                >
                  Markdown
                </button>
                <button
                  onClick={() => setViewMode('plain')}
                  className={`flex-1 px-4 py-2 rounded-lg border-2 transition-all ${
                    viewMode === 'plain'
                      ? 'border-accent-500 bg-accent-50 dark:bg-accent-100/10 text-accent-700 dark:text-accent-400'
                      : 'border-border-medium hover:border-accent-500/50 text-text-secondary'
                  }`}
                >
                  Plain Text
                </button>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleCopy} variant="secondary" className="flex-1 sm:flex-none">
                  {copied ? (
                    <>
                      <Check className="h-5 w-5 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-5 w-5 mr-2" />
                      Copy for AI
                    </>
                  )}
                </Button>
                <Button onClick={handleDownload} className="flex-1 sm:flex-none">
                  <Download className="h-5 w-5 mr-2" />
                  Download .md
                </Button>
              </div>
            </div>
          )}

          {/* Text Preview */}
          {result.hasText && (
            <div className="rounded-xl border border-border-medium bg-surface-50 p-6">
              <pre className="whitespace-pre-wrap font-mono text-sm text-text-primary overflow-x-auto max-h-[600px] overflow-y-auto">
                {viewMode === 'markdown' ? result.markdown : result.fullText}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
