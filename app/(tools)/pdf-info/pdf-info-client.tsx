'use client';

import { useState, useCallback } from 'react';
import { FileText, Download, ArrowLeft, Info } from 'lucide-react';
import Link from 'next/link';
import { Button, UploadZone, Alert } from '@/components/ui';
import { formatFileSize } from '@/lib/utils';
import type { PDFInfo } from '@/lib/pdf/info';

export default function PDFInfoClient() {
  const [file, setFile] = useState<File | null>(null);
  const [pdfInfo, setPdfInfo] = useState<PDFInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      const info = await getPDFInfo(droppedFile);

      setFile(droppedFile);
      setPdfInfo(info);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to read PDF info');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleExportJSON = () => {
    if (!pdfInfo || !file) return;

    const { exportInfoAsJSON } = require('@/lib/pdf/info');
    exportInfoAsJSON(pdfInfo, file.name);
  };

  const handleReset = () => {
    setFile(null);
    setPdfInfo(null);
    setError(null);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set';
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return 'Invalid date';
    }
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
            <Info className="h-7 w-7 text-accent-600 dark:text-accent-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-text-primary">PDF Info</h1>
            <p className="mt-1 text-text-secondary">
              View PDF metadata, file properties, and security info
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

      {/* Loading State */}
      {loading && (
        <div className="rounded-xl border border-border-medium bg-surface-50 p-8 text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-accent-100 dark:bg-accent-900/20 mb-4">
            <Info className="h-8 w-8 text-accent-600 dark:text-accent-500 animate-pulse" />
          </div>
          <h2 className="text-xl font-semibold text-text-primary mb-2">
            Reading PDF Info...
          </h2>
          <p className="text-text-secondary">
            Extracting metadata and file properties
          </p>
        </div>
      )}

      {/* Upload State */}
      {!file && !loading && (
        <UploadZone
          onDrop={handleFileDrop}
          multiple={false}
          fileType="pdf"
        />
      )}

      {/* Info Display State */}
      {pdfInfo && file && !loading && (
        <div className="space-y-6">
          {/* File Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg border border-border-medium bg-surface-50">
            <div className="min-w-0 flex-1">
              <p className="font-medium text-text-primary truncate">{file.name}</p>
              <p className="text-sm text-text-secondary">
                {formatFileSize(file.size)} • {pdfInfo.fileInfo.pageCount} pages
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button variant="secondary" onClick={handleExportJSON}>
                <Download className="h-4 w-4 mr-2" />
                Export JSON
              </Button>
              <Button variant="ghost" onClick={handleReset}>
                New File
              </Button>
            </div>
          </div>

          {/* Document Metadata */}
          <div className="rounded-xl border border-border-medium bg-surface-50 p-6">
            <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-accent-600 dark:text-accent-500" />
              Document Metadata
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-text-secondary">Title</label>
                <p className="text-text-primary mt-1">
                  {pdfInfo.metadata.title || <span className="text-text-tertiary italic">Not set</span>}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-text-secondary">Author</label>
                <p className="text-text-primary mt-1">
                  {pdfInfo.metadata.author || <span className="text-text-tertiary italic">Not set</span>}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-text-secondary">Subject</label>
                <p className="text-text-primary mt-1">
                  {pdfInfo.metadata.subject || <span className="text-text-tertiary italic">Not set</span>}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-text-secondary">Keywords</label>
                <p className="text-text-primary mt-1">
                  {pdfInfo.metadata.keywords || <span className="text-text-tertiary italic">Not set</span>}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-text-secondary">Creator</label>
                <p className="text-text-primary mt-1">
                  {pdfInfo.metadata.creator || <span className="text-text-tertiary italic">Not set</span>}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-text-secondary">Producer</label>
                <p className="text-text-primary mt-1">
                  {pdfInfo.metadata.producer || <span className="text-text-tertiary italic">Not set</span>}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-text-secondary">Created</label>
                <p className="text-text-primary mt-1">
                  {formatDate(pdfInfo.metadata.creationDate)}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-text-secondary">Modified</label>
                <p className="text-text-primary mt-1">
                  {formatDate(pdfInfo.metadata.modificationDate)}
                </p>
              </div>
            </div>
          </div>

          {/* File Properties */}
          <div className="rounded-xl border border-border-medium bg-surface-50 p-6">
            <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-accent-600 dark:text-accent-500" />
              File Properties
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-text-secondary">File Size</label>
                <p className="text-text-primary mt-1">
                  {formatFileSize(pdfInfo.fileInfo.fileSize)}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-text-secondary">Page Count</label>
                <p className="text-text-primary mt-1">
                  {pdfInfo.fileInfo.pageCount} pages
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-text-secondary">PDF Version</label>
                <p className="text-text-primary mt-1">
                  {pdfInfo.fileInfo.pdfVersion || 'Unknown'}
                </p>
              </div>
            </div>
          </div>

          {/* Security Settings */}
          <div className="rounded-xl border border-border-medium bg-surface-50 p-6">
            <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-accent-600 dark:text-accent-500" />
              Security Settings
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-text-secondary">Encryption</label>
                <p className="text-text-primary mt-1">
                  {pdfInfo.security.isEncrypted ? (
                    <span className="inline-flex items-center gap-2 text-amber-600 dark:text-amber-500">
                      🔒 Password protected
                    </span>
                  ) : (
                    <span className="text-text-tertiary">Not encrypted</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
