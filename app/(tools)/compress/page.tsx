'use client';

import { useState, useCallback } from 'react';
import { FileOutput, Download, ArrowLeft, TrendingDown } from 'lucide-react';
import Link from 'next/link';
import { Button, UploadZone, ProgressBar, Alert } from '@/components/ui';
import { compressPDF, CompressionLevel, CompressionProgress, CompressionResult } from '@/lib/pdf/compress';
import { downloadPDF } from '@/lib/pdf/utils';
import { formatFileSize } from '@/lib/utils';

const compressionLevels: { level: CompressionLevel; label: string; description: string }[] = [
  { level: 'low', label: 'Low', description: 'Best quality, minimal compression' },
  { level: 'medium', label: 'Medium', description: 'Balanced quality and size' },
  { level: 'high', label: 'High', description: 'Smallest size, reduced quality' },
];

export default function CompressPage() {
  const [file, setFile] = useState<File | null>(null);
  const [compressionLevel, setCompressionLevel] = useState<CompressionLevel>('medium');
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState<CompressionProgress | null>(null);
  const [result, setResult] = useState<CompressionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  const handleCompress = async () => {
    if (!file) return;

    setProcessing(true);
    setProgress(null);
    setError(null);

    try {
      const compressionResult = await compressPDF(file, compressionLevel, (p) => setProgress(p));
      setResult(compressionResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to compress PDF');
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = () => {
    if (result && file) {
      const filename = file.name.replace('.pdf', '_compressed.pdf');
      downloadPDF(result.data, filename);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    setProgress(null);
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
            <FileOutput className="h-7 w-7 text-accent-600 dark:text-accent-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-text-primary">Compress PDF</h1>
            <p className="mt-1 text-text-secondary">
              Reduce file size while maintaining quality
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
        <div className="rounded-xl border border-success/30 bg-green-50 dark:bg-green-950/20 p-8">
          <div className="text-center mb-6">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-success/10 mb-4">
              <TrendingDown className="h-8 w-8 text-success" />
            </div>
            <h2 className="text-xl font-semibold text-text-primary mb-2">
              Compression Complete!
            </h2>
          </div>

          {/* Comparison */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 rounded-lg bg-white dark:bg-surface-50">
              <p className="text-sm text-text-secondary mb-1">Original Size</p>
              <p className="text-lg font-semibold text-text-primary">
                {formatFileSize(result.originalSize)}
              </p>
            </div>
            <div className="text-center p-4 rounded-lg bg-white dark:bg-surface-50">
              <p className="text-sm text-text-secondary mb-1">New Size</p>
              <p className="text-lg font-semibold text-success">
                {formatFileSize(result.compressedSize)}
              </p>
            </div>
            <div className="text-center p-4 rounded-lg bg-white dark:bg-surface-50">
              <p className="text-sm text-text-secondary mb-1">Saved</p>
              <p className="text-lg font-semibold text-accent-600">
                {result.savingsPercent}%
              </p>
            </div>
          </div>

          <div className="flex justify-center gap-4">
            <Button onClick={handleDownload} size="lg">
              <Download className="h-5 w-5 mr-2" />
              Download Compressed PDF
            </Button>
            <Button variant="secondary" onClick={handleReset}>
              Compress Another
            </Button>
          </div>
        </div>
      )}

      {/* Processing State */}
      {processing && progress && (
        <div className="rounded-xl border border-border-medium bg-surface-50 p-8">
          <h2 className="text-lg font-semibold text-text-primary mb-4 text-center">
            Compressing PDF...
          </h2>
          <ProgressBar
            progress={progress.percentage}
            status={progress.status}
          />
          <p className="text-sm text-text-secondary text-center mt-4">
            This may take a while for large files
          </p>
        </div>
      )}

      {/* Upload/Configure State */}
      {!result && !processing && (
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
              <div className="flex items-center justify-between p-4 rounded-lg border border-border-medium bg-surface-50">
                <div>
                  <p className="font-medium text-text-primary">{file.name}</p>
                  <p className="text-sm text-text-secondary">
                    {formatFileSize(file.size)}
                  </p>
                </div>
                <Button variant="ghost" onClick={handleReset}>
                  Change File
                </Button>
              </div>

              {/* Compression Level Selector */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-text-primary">
                  Compression Level
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {compressionLevels.map((level) => (
                    <button
                      key={level.level}
                      onClick={() => setCompressionLevel(level.level)}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        compressionLevel === level.level
                          ? 'border-accent-500 bg-accent-50 dark:bg-accent-100/10'
                          : 'border-border-medium hover:border-accent-500/50'
                      }`}
                    >
                      <p className="font-medium text-text-primary">{level.label}</p>
                      <p className="text-sm text-text-secondary mt-1">{level.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-border-light">
                <Button variant="ghost" onClick={handleReset}>
                  Cancel
                </Button>
                <Button onClick={handleCompress}>
                  <FileOutput className="h-5 w-5 mr-2" />
                  Compress PDF
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Info */}
      {!file && !processing && !result && (
        <Alert variant="info" className="mt-8">
          <strong>How compression works:</strong> The PDF is re-rendered with optimized images.
          This works best for PDFs with large embedded images. Already-optimized PDFs may not compress much further.
        </Alert>
      )}
    </div>
  );
}
