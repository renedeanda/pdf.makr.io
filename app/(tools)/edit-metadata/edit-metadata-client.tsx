'use client';

import { useState, useCallback } from 'react';
import { FileEdit, Download, ArrowLeft, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import { Button, UploadZone, ProgressBar, Alert } from '@/components/ui';
import { formatFileSize } from '@/lib/utils';
import type { PDFMetadata } from '@/lib/pdf/info';

export default function EditMetadataClient() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [originalMetadata, setOriginalMetadata] = useState<PDFMetadata | null>(null);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [subject, setSubject] = useState('');
  const [keywords, setKeywords] = useState('');
  const [creator, setCreator] = useState('');
  const [producer, setProducer] = useState('');
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [complete, setComplete] = useState(false);

  const handleFileDrop = useCallback(async (files: File[]) => {
    const droppedFile = files[0];
    if (!droppedFile || droppedFile.type !== 'application/pdf') {
      setError('Please upload a PDF file');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { getPDFInfo } = await import('@/lib/pdf/info');
      const { getPDFPageCount } = await import('@/lib/pdf/utils');

      const info = await getPDFInfo(droppedFile);
      const count = await getPDFPageCount(droppedFile);

      setFile(droppedFile);
      setPageCount(count);
      setOriginalMetadata(info.metadata);

      // Pre-populate form with current metadata
      setTitle(info.metadata.title || '');
      setAuthor(info.metadata.author || '');
      setSubject(info.metadata.subject || '');
      setKeywords(info.metadata.keywords || '');
      setCreator(info.metadata.creator || '');
      setProducer(info.metadata.producer || '');

      setComplete(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to read PDF metadata');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSaveMetadata = async () => {
    if (!file) return;

    setProcessing(true);
    setError(null);

    try {
      const { setMetadata } = await import('@/lib/pdf/info');
      const { downloadPDF } = await import('@/lib/pdf/utils');

      const updatedPdf = await setMetadata(file, {
        title,
        author,
        subject,
        keywords,
        creator,
        producer,
      });

      const filename = file.name.replace('.pdf', '_metadata.pdf');
      downloadPDF(updatedPdf, filename);

      setComplete(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update metadata');
    } finally {
      setProcessing(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPageCount(0);
    setOriginalMetadata(null);
    setTitle('');
    setAuthor('');
    setSubject('');
    setKeywords('');
    setCreator('');
    setProducer('');
    setComplete(false);
    setError(null);
  };

  const handleResetFields = () => {
    setTitle('');
    setAuthor('');
    setSubject('');
    setKeywords('');
    setCreator('');
    setProducer('');
  };

  const handleRestoreOriginal = () => {
    if (!originalMetadata) return;
    setTitle(originalMetadata.title || '');
    setAuthor(originalMetadata.author || '');
    setSubject(originalMetadata.subject || '');
    setKeywords(originalMetadata.keywords || '');
    setCreator(originalMetadata.creator || '');
    setProducer(originalMetadata.producer || '');
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
            <FileEdit className="h-7 w-7 text-accent-600 dark:text-accent-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-text-primary">Edit Metadata</h1>
            <p className="mt-1 text-text-secondary">
              Update PDF document metadata and properties
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
            Metadata Updated!
          </h2>
          <p className="text-text-secondary mb-6">
            Your PDF has been downloaded with updated metadata.
          </p>
          <Button variant="secondary" onClick={handleReset}>
            Edit Another PDF
          </Button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="rounded-xl border border-border-medium bg-surface-50 p-8 text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-accent-100 dark:bg-accent-900/20 mb-4">
            <FileEdit className="h-8 w-8 text-accent-600 dark:text-accent-500 animate-pulse" />
          </div>
          <h2 className="text-xl font-semibold text-text-primary mb-2">
            Loading Metadata...
          </h2>
          <p className="text-text-secondary">
            Reading current document properties
          </p>
        </div>
      )}

      {/* Processing State */}
      {processing && (
        <div className="rounded-xl border border-border-medium bg-surface-50 p-8">
          <h2 className="text-lg font-semibold text-text-primary mb-4 text-center">
            Updating Metadata...
          </h2>
          <ProgressBar progress={100} status="Saving changes..." />
        </div>
      )}

      {/* Upload State */}
      {!file && !loading && !processing && !complete && (
        <UploadZone
          onDrop={handleFileDrop}
          multiple={false}
          fileType="pdf"
        />
      )}

      {/* Edit State */}
      {file && !loading && !processing && !complete && (
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

          {/* Metadata Form */}
          <div className="space-y-4 rounded-xl border border-border-medium bg-surface-50 p-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold text-text-primary">Document Metadata</h2>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRestoreOriginal}
                  title="Restore original values"
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Restore
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetFields}
                  title="Clear all fields"
                >
                  Clear All
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Title */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-primary">
                  Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Document title"
                  className="w-full px-4 py-2 rounded-lg border border-border-medium bg-background text-text-primary"
                />
              </div>

              {/* Author */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-primary">
                  Author
                </label>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Author name"
                  className="w-full px-4 py-2 rounded-lg border border-border-medium bg-background text-text-primary"
                />
              </div>

              {/* Subject */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-primary">
                  Subject
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Document subject"
                  className="w-full px-4 py-2 rounded-lg border border-border-medium bg-background text-text-primary"
                />
              </div>

              {/* Keywords */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-primary">
                  Keywords
                </label>
                <input
                  type="text"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  placeholder="Comma-separated keywords"
                  className="w-full px-4 py-2 rounded-lg border border-border-medium bg-background text-text-primary"
                />
              </div>

              {/* Creator */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-primary">
                  Creator
                </label>
                <input
                  type="text"
                  value={creator}
                  onChange={(e) => setCreator(e.target.value)}
                  placeholder="Application that created the document"
                  className="w-full px-4 py-2 rounded-lg border border-border-medium bg-background text-text-primary"
                />
              </div>

              {/* Producer */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-primary">
                  Producer
                </label>
                <input
                  type="text"
                  value={producer}
                  onChange={(e) => setProducer(e.target.value)}
                  placeholder="Application that produced the PDF"
                  className="w-full px-4 py-2 rounded-lg border border-border-medium bg-background text-text-primary"
                />
              </div>
            </div>

            <p className="text-xs text-text-tertiary mt-4">
              Modification date will be automatically updated to the current time.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-border-light">
            <Button variant="ghost" onClick={handleReset} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button onClick={handleSaveMetadata} className="w-full sm:w-auto">
              <Download className="h-5 w-5 mr-2" />
              Save & Download
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
