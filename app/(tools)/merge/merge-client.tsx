'use client';

import { useState, useCallback, useEffect } from 'react';
import { Layers, Download, ArrowLeft, GripVertical, X } from 'lucide-react';
import Link from 'next/link';
import { Button, UploadZone, ProgressBar, Alert } from '@/components/ui';
import { formatFileSize, generateId } from '@/lib/utils';
import { subtleSuccess } from '@/lib/confetti';

interface MergeProgress {
  current: number;
  total: number;
  percentage: number;
}

interface PDFFileItem {
  id: string;
  file: File;
  name: string;
  size: number;
  pageCount: number;
}

export default function MergeClient() {
  const [files, setFiles] = useState<PDFFileItem[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState<MergeProgress | null>(null);
  const [result, setResult] = useState<Uint8Array | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileDrop = useCallback(async (droppedFiles: File[]) => {
    setError(null);

    const newFiles: PDFFileItem[] = [];

    for (const file of droppedFiles) {
      if (file.type !== 'application/pdf') {
        setError('Please upload only PDF files');
        continue;
      }

      try {
        // Dynamic import to avoid SSR issues
        const { getPDFPageCount } = await import('@/lib/pdf/utils');
        const pageCount = await getPDFPageCount(file);
        newFiles.push({
          id: generateId(),
          file,
          name: file.name,
          size: file.size,
          pageCount,
        });
      } catch (err) {
        setError(`Failed to read "${file.name}". The file may be corrupted.`);
      }
    }

    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const handleMerge = async () => {
    if (files.length < 2) {
      setError('Please add at least 2 PDF files to merge');
      return;
    }

    setProcessing(true);
    setProgress(null);
    setError(null);

    try {
      const { mergePDFs } = await import('@/lib/pdf/merge');
      const merged = await mergePDFs(
        files.map((f) => f.file),
        (p) => setProgress(p)
      );
      setResult(merged);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to merge PDFs');
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = async () => {
    if (result) {
      const { downloadPDF } = await import('@/lib/pdf/utils');
      const filename = files.length > 0
        ? `merged_${files[0].name.replace('.pdf', '')}.pdf`
        : 'merged.pdf';
      downloadPDF(result, filename);
    }
  };

  // Celebrate when merge completes
  useEffect(() => {
    if (result && !processing) {
      subtleSuccess();
    }
  }, [result, processing]);

  const handleReset = () => {
    setFiles([]);
    setResult(null);
    setProgress(null);
    setError(null);
  };

  const totalPages = files.reduce((sum, f) => sum + f.pageCount, 0);
  const totalSize = files.reduce((sum, f) => sum + f.size, 0);

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
            <Layers className="h-7 w-7 text-accent-600 dark:text-accent-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-text-primary">Merge PDFs</h1>
            <p className="mt-1 text-text-secondary">
              Combine multiple PDF files into a single document
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

      {/* Result State */}
      {result && !processing && (
        <div className="rounded-xl border border-success/30 bg-green-50 dark:bg-green-950/20 p-8 text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-success/10 mb-4">
            <Download className="h-8 w-8 text-success" />
          </div>
          <h2 className="text-xl font-semibold text-text-primary mb-2">
            PDF Merged Successfully!
          </h2>
          <p className="text-text-secondary mb-6">
            {files.length} files merged - {totalPages} pages - {formatFileSize(result.length)}
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
            <Button onClick={handleDownload} size="lg" className="w-full sm:w-auto">
              <Download className="h-5 w-5 mr-2" />
              Download PDF
            </Button>
            <Button variant="secondary" onClick={handleReset} className="w-full sm:w-auto">
              Merge More Files
            </Button>
          </div>
        </div>
      )}

      {/* Processing State */}
      {processing && (
        <div className="rounded-xl border border-border-medium bg-surface-50 p-8">
          <h2 className="text-lg font-semibold text-text-primary mb-4 text-center">
            Merging PDFs...
          </h2>
          <ProgressBar
            progress={progress?.percentage ?? 0}
            status={progress ? `Processing file ${progress.current} of ${progress.total}` : 'Starting merge...'}
          />
        </div>
      )}

      {/* Upload State */}
      {!result && !processing && (
        <>
          {files.length === 0 ? (
            <UploadZone
              onDrop={handleFileDrop}
              multiple
              fileType="pdf"
            />
          ) : (
            <div className="space-y-6">
              {/* File List */}
              <div className="space-y-3">
                {files.map((file, index) => (
                  <div
                    key={file.id}
                    className="flex items-center gap-4 rounded-lg border border-border-medium bg-white dark:bg-surface-50 p-4"
                  >
                    <div className="cursor-grab text-text-tertiary hover:text-text-secondary">
                      <GripVertical className="h-5 w-5" />
                    </div>
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-50 text-sm font-medium text-accent-600">
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-text-primary truncate">{file.name}</p>
                      <p className="text-sm text-text-secondary">
                        {file.pageCount} {file.pageCount === 1 ? 'page' : 'pages'} - {formatFileSize(file.size)}
                      </p>
                    </div>
                    <button
                      onClick={() => removeFile(file.id)}
                      className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-surface-100 text-text-tertiary hover:text-error transition-colors"
                      aria-label="Remove file"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add More Button */}
              <UploadZone
                onDrop={handleFileDrop}
                multiple
                fileType="pdf"
                className="p-6"
              />

              {/* Summary & Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-border-light">
                <div className="text-sm text-text-secondary">
                  {files.length} files - {totalPages} pages - {formatFileSize(totalSize)}
                </div>
                <div className="flex gap-3">
                  <Button variant="ghost" onClick={handleReset}>
                    Clear All
                  </Button>
                  <Button onClick={handleMerge} disabled={files.length < 2}>
                    <Layers className="h-5 w-5 mr-2" />
                    Merge {files.length} PDFs
                  </Button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Instructions */}
      {!result && !processing && files.length === 0 && (
        <div className="mt-8 text-center">
          <h3 className="font-medium text-text-primary mb-2">How it works</h3>
          <ol className="text-sm text-text-secondary space-y-1">
            <li>1. Upload two or more PDF files</li>
            <li>2. Drag to reorder if needed</li>
            <li>3. Click Merge to combine</li>
            <li>4. Download your merged PDF</li>
          </ol>
        </div>
      )}
    </div>
  );
}
