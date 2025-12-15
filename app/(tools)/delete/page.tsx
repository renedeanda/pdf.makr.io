'use client';

import { useState, useCallback } from 'react';
import { Trash2, Download, ArrowLeft, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { Button, UploadZone, ProgressBar, Alert } from '@/components/ui';
import { PageSelector } from '@/components/pdf';
import { formatFileSize } from '@/lib/utils';

interface EditProgress {
  current: number;
  total: number;
  percentage: number;
  status: string;
}

export default function DeletePage() {
  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState<EditProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      setFileUrl(URL.createObjectURL(droppedFile));
      setPageCount(count);
      setSelectedPages([]);
      setError(null);
    } catch (err) {
      setError('Failed to read the PDF file. It may be corrupted or password-protected.');
    }
  }, []);

  const handleDelete = async () => {
    if (!file || selectedPages.length === 0) return;

    if (selectedPages.length >= pageCount) {
      setError('Cannot delete all pages. At least one page must remain.');
      return;
    }

    setProcessing(true);
    setProgress(null);
    setError(null);

    try {
      const { deletePages } = await import('@/lib/pdf/edit');
      const { downloadPDF } = await import('@/lib/pdf/utils');
      const result = await deletePages(file, selectedPages, (p) => setProgress(p));
      const filename = file.name.replace('.pdf', '_edited.pdf');
      downloadPDF(result, filename);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete pages');
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

  const remainingPages = pageCount - selectedPages.length;

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
            <Trash2 className="h-7 w-7 text-accent-600 dark:text-accent-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-text-primary">Delete Pages</h1>
            <p className="mt-1 text-text-secondary">
              Remove unwanted pages from your PDF
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
            Removing Pages...
          </h2>
          <ProgressBar
            progress={progress.percentage}
            status={progress.status}
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

          {/* Warning if many pages selected */}
          {selectedPages.length > 0 && selectedPages.length >= pageCount - 1 && (
            <Alert variant="warning">
              <AlertTriangle className="h-4 w-4 inline mr-2" />
              You can delete at most {pageCount - 1} pages. At least one page must remain.
            </Alert>
          )}

          {/* Instructions */}
          <Alert variant="info">
            Select the pages you want to <strong>delete</strong>. Selected pages will be removed from the PDF.
          </Alert>

          {/* Page Selection */}
          <PageSelector
            pdfUrl={fileUrl}
            totalPages={pageCount}
            selectedPages={selectedPages}
            onSelectionChange={setSelectedPages}
            mode="delete"
          />

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-border-light">
            <div className="text-sm text-text-secondary">
              {selectedPages.length > 0
                ? `${selectedPages.length} page${selectedPages.length > 1 ? 's' : ''} selected for deletion • ${remainingPages} pages will remain`
                : 'Select pages to delete'}
            </div>
            <div className="flex gap-3">
              <Button variant="ghost" onClick={handleReset}>
                Start Over
              </Button>
              <Button
                variant="danger"
                onClick={handleDelete}
                disabled={selectedPages.length === 0 || selectedPages.length >= pageCount}
              >
                <Trash2 className="h-5 w-5 mr-2" />
                Delete {selectedPages.length} Page{selectedPages.length !== 1 ? 's' : ''}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
