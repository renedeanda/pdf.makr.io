'use client';

import { useState, useCallback } from 'react';
import { ImagePlus, Download, ArrowLeft, X } from 'lucide-react';
import Link from 'next/link';
import { Button, UploadZone, ProgressBar, Alert } from '@/components/ui';
import { formatFileSize, generateId } from '@/lib/utils';

interface ConversionProgress {
  current: number;
  total: number;
  percentage: number;
  status: string;
}

interface ImageFile {
  id: string;
  file: File;
  preview: string;
}

type PageSize = 'A4' | 'Letter' | 'Fit';
type Orientation = 'portrait' | 'landscape';

export default function ImagesToPDFPage() {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [pageSize, setPageSize] = useState<PageSize>('A4');
  const [orientation, setOrientation] = useState<Orientation>('portrait');
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState<ConversionProgress | null>(null);
  const [result, setResult] = useState<Uint8Array | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileDrop = useCallback((files: File[]) => {
    const imageFiles = files.filter(f => f.type.startsWith('image/'));

    if (imageFiles.length === 0) {
      setError('Please upload image files (PNG, JPG, WEBP)');
      return;
    }

    const newImages: ImageFile[] = imageFiles.map(file => ({
      id: generateId(),
      file,
      preview: URL.createObjectURL(file),
    }));

    setImages(prev => [...prev, ...newImages]);
    setError(null);
  }, []);

  const removeImage = (id: string) => {
    setImages(prev => {
      const image = prev.find(img => img.id === id);
      if (image) URL.revokeObjectURL(image.preview);
      return prev.filter(img => img.id !== id);
    });
  };

  const handleConvert = async () => {
    if (images.length === 0) {
      setError('Please add at least one image');
      return;
    }

    setProcessing(true);
    setProgress(null);
    setError(null);

    try {
      const { imagesToPDF } = await import('@/lib/pdf/convert');
      const pdfData = await imagesToPDF(
        images.map(img => img.file),
        { pageSize, orientation, margin: 20 },
        (p) => setProgress(p)
      );
      setResult(pdfData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create PDF');
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = async () => {
    if (result) {
      const { downloadPDF } = await import('@/lib/pdf/utils');
      downloadPDF(result, 'images.pdf');
    }
  };

  const handleReset = () => {
    images.forEach(img => URL.revokeObjectURL(img.preview));
    setImages([]);
    setResult(null);
    setProgress(null);
    setError(null);
  };

  const totalSize = images.reduce((sum, img) => sum + img.file.size, 0);

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
            <ImagePlus className="h-7 w-7 text-accent-600 dark:text-accent-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-text-primary">Images to PDF</h1>
            <p className="mt-1 text-text-secondary">
              Create a PDF from multiple images
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
            PDF Created Successfully!
          </h2>
          <p className="text-text-secondary mb-6">
            {images.length} images - {formatFileSize(result.length)}
          </p>
          <div className="flex justify-center gap-4">
            <Button onClick={handleDownload} size="lg">
              <Download className="h-5 w-5 mr-2" />
              Download PDF
            </Button>
            <Button variant="secondary" onClick={handleReset}>
              Create Another
            </Button>
          </div>
        </div>
      )}

      {/* Processing State */}
      {processing && progress && (
        <div className="rounded-xl border border-border-medium bg-surface-50 p-8">
          <h2 className="text-lg font-semibold text-text-primary mb-4 text-center">
            Creating PDF...
          </h2>
          <ProgressBar
            progress={progress.percentage}
            status={progress.status}
          />
        </div>
      )}

      {/* Upload/Configure State */}
      {!result && !processing && (
        <>
          {images.length === 0 ? (
            <UploadZone
              onDrop={handleFileDrop}
              multiple
              fileType="image"
            />
          ) : (
            <div className="space-y-6">
              {/* Image Grid */}
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                {images.map((image, index) => (
                  <div
                    key={image.id}
                    className="group relative aspect-square rounded-lg border border-border-medium overflow-hidden bg-surface-100"
                  >
                    <img
                      src={image.preview}
                      alt={image.file.name}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        onClick={() => removeImage(image.id)}
                        className="h-8 w-8 rounded-full bg-white flex items-center justify-center text-error hover:bg-red-50"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                    <div className="absolute bottom-1 right-1 bg-background/90 text-xs font-medium px-1.5 py-0.5 rounded">
                      {index + 1}
                    </div>
                  </div>
                ))}
              </div>

              {/* Add More */}
              <UploadZone
                onDrop={handleFileDrop}
                multiple
                fileType="image"
                className="p-6"
              />

              {/* Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Page Size */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-text-primary">
                    Page Size
                  </label>
                  <div className="flex gap-2">
                    {(['A4', 'Letter', 'Fit'] as PageSize[]).map((size) => (
                      <button
                        key={size}
                        onClick={() => setPageSize(size)}
                        className={`flex-1 py-2 px-3 rounded-lg border-2 text-sm font-medium transition-all ${
                          pageSize === size
                            ? 'border-accent-500 bg-accent-50 text-accent-700'
                            : 'border-border-medium hover:border-accent-500/50'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Orientation */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-text-primary">
                    Orientation
                  </label>
                  <div className="flex gap-2">
                    {(['portrait', 'landscape'] as Orientation[]).map((orient) => (
                      <button
                        key={orient}
                        onClick={() => setOrientation(orient)}
                        disabled={pageSize === 'Fit'}
                        className={`flex-1 py-2 px-3 rounded-lg border-2 text-sm font-medium capitalize transition-all ${
                          orientation === orient && pageSize !== 'Fit'
                            ? 'border-accent-500 bg-accent-50 text-accent-700'
                            : 'border-border-medium hover:border-accent-500/50'
                        } ${pageSize === 'Fit' ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {orient}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Summary & Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-border-light">
                <div className="text-sm text-text-secondary">
                  {images.length} images - {formatFileSize(totalSize)}
                </div>
                <div className="flex gap-3">
                  <Button variant="ghost" onClick={handleReset}>
                    Clear All
                  </Button>
                  <Button onClick={handleConvert}>
                    <ImagePlus className="h-5 w-5 mr-2" />
                    Create PDF
                  </Button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
