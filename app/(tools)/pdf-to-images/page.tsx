'use client';

import { useState, useCallback } from 'react';
import { Image as ImageIcon, Download, ArrowLeft, FileArchive } from 'lucide-react';
import Link from 'next/link';
import { Button, UploadZone, ProgressBar, Alert } from '@/components/ui';
import { formatFileSize, downloadBlob } from '@/lib/utils';

interface ConversionProgress {
  current: number;
  total: number;
  percentage: number;
  status: string;
}

interface ImageOutput {
  data: Blob;
  filename: string;
  pageNumber: number;
}

type ImageFormat = 'png' | 'jpg';

const dpiOptions = [
  { value: 72, label: '72 DPI', description: 'Screen quality' },
  { value: 150, label: '150 DPI', description: 'Good quality' },
  { value: 300, label: '300 DPI', description: 'Print quality' },
];

export default function PDFToImagesPage() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [format, setFormat] = useState<ImageFormat>('png');
  const [dpi, setDpi] = useState(150);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState<ConversionProgress | null>(null);
  const [results, setResults] = useState<ImageOutput[] | null>(null);
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
      setPageCount(count);
      setResults(null);
      setError(null);
    } catch (err) {
      setError('Failed to read the PDF file. It may be corrupted or password-protected.');
    }
  }, []);

  const handleConvert = async () => {
    if (!file) return;

    setProcessing(true);
    setProgress(null);
    setError(null);

    try {
      const { pdfToImages } = await import('@/lib/pdf/convert');
      const images = await pdfToImages(file, { format, dpi }, (p) => setProgress(p));
      setResults(images);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to convert PDF');
    } finally {
      setProcessing(false);
    }
  };

  const handleDownloadAll = async () => {
    if (!results || !file) return;

    if (results.length === 1) {
      downloadBlob(results[0].data, results[0].filename);
    } else {
      const { createImagesZip } = await import('@/lib/pdf/convert');
      const zipData = await createImagesZip(results);
      const blob = new Blob([new Uint8Array(zipData)], { type: 'application/zip' });
      downloadBlob(blob, `${file.name.replace('.pdf', '')}_images.zip`);
    }
  };

  const handleDownloadSingle = (image: ImageOutput) => {
    downloadBlob(image.data, image.filename);
  };

  const handleReset = () => {
    setFile(null);
    setPageCount(0);
    setResults(null);
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
            <ImageIcon className="h-7 w-7 text-accent-600 dark:text-accent-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-text-primary">PDF to Images</h1>
            <p className="mt-1 text-text-secondary">
              Convert PDF pages to PNG or JPG images
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
      {results && !processing && (
        <div className="space-y-6">
          <div className="rounded-xl border border-success/30 bg-green-50 dark:bg-green-950/20 p-6 text-center">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-success/10 mb-3">
              <FileArchive className="h-6 w-6 text-success" />
            </div>
            <h2 className="text-lg font-semibold text-text-primary mb-2">
              Converted {results.length} {results.length === 1 ? 'page' : 'pages'}
            </h2>
            <Button onClick={handleDownloadAll}>
              <Download className="h-5 w-5 mr-2" />
              Download {results.length === 1 ? 'Image' : 'All as ZIP'}
            </Button>
          </div>

          {/* Preview Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {results.map((image) => (
              <div
                key={image.pageNumber}
                className="group relative aspect-[1/1.4] rounded-lg border border-border-medium overflow-hidden bg-white"
              >
                <img
                  src={URL.createObjectURL(image.data)}
                  alt={`Page ${image.pageNumber}`}
                  className="h-full w-full object-contain"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button
                    size="sm"
                    onClick={() => handleDownloadSingle(image)}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Page {image.pageNumber}
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center">
            <Button variant="secondary" onClick={handleReset}>
              Convert Another PDF
            </Button>
          </div>
        </div>
      )}

      {/* Processing State */}
      {processing && (
        <div className="rounded-xl border border-border-medium bg-surface-50 p-8">
          <h2 className="text-lg font-semibold text-text-primary mb-4 text-center">
            Converting to Images...
          </h2>
          <ProgressBar
            progress={progress?.percentage ?? 0}
            status={progress?.status ?? 'Starting conversion...'}
          />
        </div>
      )}

      {/* Upload/Configure State */}
      {!results && !processing && (
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

              {/* Format Selector */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-text-primary">
                  Image Format
                </label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setFormat('png')}
                    className={`flex-1 p-4 rounded-xl border-2 text-center transition-all ${
                      format === 'png'
                        ? 'border-accent-500 bg-accent-50 dark:bg-accent-100/10'
                        : 'border-border-medium hover:border-accent-500/50'
                    }`}
                  >
                    <p className="font-medium text-text-primary">PNG</p>
                    <p className="text-sm text-text-secondary">Lossless, transparent</p>
                  </button>
                  <button
                    onClick={() => setFormat('jpg')}
                    className={`flex-1 p-4 rounded-xl border-2 text-center transition-all ${
                      format === 'jpg'
                        ? 'border-accent-500 bg-accent-50 dark:bg-accent-100/10'
                        : 'border-border-medium hover:border-accent-500/50'
                    }`}
                  >
                    <p className="font-medium text-text-primary">JPG</p>
                    <p className="text-sm text-text-secondary">Smaller files</p>
                  </button>
                </div>
              </div>

              {/* DPI Selector */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-text-primary">
                  Image Quality (DPI)
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {dpiOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setDpi(option.value)}
                      className={`p-4 rounded-xl border-2 text-center transition-all ${
                        dpi === option.value
                          ? 'border-accent-500 bg-accent-50 dark:bg-accent-100/10'
                          : 'border-border-medium hover:border-accent-500/50'
                      }`}
                    >
                      <p className="font-medium text-text-primary">{option.label}</p>
                      <p className="text-sm text-text-secondary">{option.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-border-light">
                <Button variant="ghost" onClick={handleReset}>
                  Cancel
                </Button>
                <Button onClick={handleConvert}>
                  <ImageIcon className="h-5 w-5 mr-2" />
                  Convert {pageCount} Pages
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
