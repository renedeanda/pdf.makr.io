'use client';

import { useState, useCallback } from 'react';
import { Image as ImageIcon, Download, ArrowLeft, Upload } from 'lucide-react';
import Link from 'next/link';
import { Button, UploadZone, ProgressBar, Alert } from '@/components/ui';
import { formatFileSize } from '@/lib/utils';

interface EnhanceProgress {
  current: number;
  total: number;
  percentage: number;
  status: string;
}

type Position = 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'tiled';
type PageSelection = 'all' | 'odd' | 'even' | 'custom';

const positionOptions: { value: Position; label: string; description: string }[] = [
  { value: 'center', label: 'Center', description: 'Center of page' },
  { value: 'top-left', label: 'Top Left', description: 'Top left corner' },
  { value: 'top-right', label: 'Top Right', description: 'Top right corner' },
  { value: 'bottom-left', label: 'Bottom Left', description: 'Bottom left corner' },
  { value: 'bottom-right', label: 'Bottom Right', description: 'Bottom right corner' },
  { value: 'tiled', label: 'Tiled', description: 'Repeated pattern' },
];

const pageSelectionOptions: { value: PageSelection; label: string }[] = [
  { value: 'all', label: 'All Pages' },
  { value: 'odd', label: 'Odd Pages' },
  { value: 'even', label: 'Even Pages' },
  { value: 'custom', label: 'Custom Pages' },
];

export default function ImageWatermarkClient() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [scale, setScale] = useState(0.5);
  const [opacity, setOpacity] = useState(0.5);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState<Position>('bottom-right');
  const [pageSelection, setPageSelection] = useState<PageSelection>('all');
  const [customPages, setCustomPages] = useState('');
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState<EnhanceProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [complete, setComplete] = useState(false);

  const handlePdfDrop = useCallback(async (files: File[]) => {
    const droppedFile = files[0];
    if (!droppedFile || droppedFile.type !== 'application/pdf') {
      setError('Please upload a PDF file');
      return;
    }

    try {
      const { getPDFPageCount } = await import('@/lib/pdf/utils');
      const count = await getPDFPageCount(droppedFile);
      setPdfFile(droppedFile);
      setPageCount(count);
      setComplete(false);
      setError(null);
    } catch (err) {
      setError('Failed to read the PDF file. It may be corrupted or password-protected.');
    }
  }, []);

  const handleImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
      setError('Please select a PNG or JPG image');
      return;
    }

    setImageFile(file);
    setError(null);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleAddWatermark = async () => {
    if (!pdfFile || !imageFile) return;

    // Parse custom pages if needed
    let customPageNumbers: number[] | undefined;
    if (pageSelection === 'custom') {
      try {
        customPageNumbers = customPages
          .split(',')
          .map((p) => parseInt(p.trim()))
          .filter((p) => p > 0 && p <= pageCount);

        if (customPageNumbers.length === 0) {
          setError('Please enter valid page numbers (e.g., 1,3,5)');
          return;
        }
      } catch (err) {
        setError('Invalid page numbers format. Use commas to separate page numbers (e.g., 1,3,5)');
        return;
      }
    }

    setProcessing(true);
    setProgress(null);
    setError(null);

    try {
      const { addImageWatermark } = await import('@/lib/pdf/enhance');
      const { downloadPDF } = await import('@/lib/pdf/utils');

      const result = await addImageWatermark(
        pdfFile,
        imageFile,
        {
          opacity,
          scale,
          rotation,
          position,
          pageSelection,
          customPages: customPageNumbers,
        },
        (p) => setProgress(p)
      );

      const filename = pdfFile.name.replace('.pdf', '_watermarked.pdf');
      downloadPDF(result, filename);
      setComplete(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add watermark');
    } finally {
      setProcessing(false);
    }
  };

  const handleReset = () => {
    setPdfFile(null);
    setImageFile(null);
    setImagePreview(null);
    setPageCount(0);
    setProgress(null);
    setComplete(false);
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
            <h1 className="text-3xl font-bold text-text-primary">Add Image Watermark</h1>
            <p className="mt-1 text-text-secondary">
              Add image watermarks (PNG/JPG) to your PDF pages
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
            Watermark Added!
          </h2>
          <p className="text-text-secondary mb-6">
            Your PDF has been downloaded with the image watermark.
          </p>
          <Button variant="secondary" onClick={handleReset}>
            Watermark Another PDF
          </Button>
        </div>
      )}

      {/* Processing State */}
      {processing && (
        <div className="rounded-xl border border-border-medium bg-surface-50 p-8">
          <h2 className="text-lg font-semibold text-text-primary mb-4 text-center">
            Adding Watermark...
          </h2>
          <ProgressBar
            progress={progress?.percentage ?? 0}
            status={progress?.status ?? 'Starting...'}
          />
        </div>
      )}

      {/* Upload/Configure State */}
      {!complete && !processing && (
        <>
          {!pdfFile ? (
            <UploadZone
              onDrop={handlePdfDrop}
              multiple={false}
              fileType="pdf"
            />
          ) : (
            <div className="space-y-6">
              {/* PDF Info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg border border-border-medium bg-surface-50">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-text-primary truncate">{pdfFile.name}</p>
                  <p className="text-sm text-text-secondary">
                    {pageCount} pages • {formatFileSize(pdfFile.size)}
                  </p>
                </div>
                <Button variant="ghost" onClick={handleReset} className="shrink-0">
                  Change File
                </Button>
              </div>

              {/* Image Upload */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-primary">Watermark Image (PNG/JPG)</label>
                <div className="flex gap-3 items-start">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    onChange={handleImageSelect}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="flex-1 px-4 py-3 rounded-lg border-2 border-dashed border-border-medium hover:border-accent-500 cursor-pointer transition-colors flex items-center justify-center gap-2 text-text-secondary hover:text-text-primary"
                  >
                    <Upload className="h-5 w-5" />
                    {imageFile ? imageFile.name : 'Click to select image'}
                  </label>
                  {imagePreview && (
                    <div className="w-20 h-20 rounded-lg border border-border-medium overflow-hidden bg-white dark:bg-gray-900">
                      <img
                        src={imagePreview}
                        alt="Watermark preview"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}
                </div>
              </div>

              {imageFile && (
                <>
                  {/* Position Selector */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-text-primary">Position</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {positionOptions.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => setPosition(opt.value)}
                          className={`p-3 rounded-xl border-2 text-left transition-all ${
                            position === opt.value
                              ? 'border-accent-500 bg-accent-50 dark:bg-accent-100/10'
                              : 'border-border-medium hover:border-accent-500/50'
                          }`}
                        >
                          <p className="font-medium text-text-primary text-sm">{opt.label}</p>
                          <p className="text-xs text-text-secondary">{opt.description}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Page Selection */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-text-primary">Apply To</label>
                    <div className="flex flex-wrap gap-2">
                      {pageSelectionOptions.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => setPageSelection(opt.value)}
                          className={`px-4 py-2 rounded-lg border-2 transition-all ${
                            pageSelection === opt.value
                              ? 'border-accent-500 bg-accent-50 dark:bg-accent-100/10'
                              : 'border-border-medium hover:border-accent-500/50'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                    {pageSelection === 'custom' && (
                      <input
                        type="text"
                        value={customPages}
                        onChange={(e) => setCustomPages(e.target.value)}
                        placeholder="e.g., 1,3,5-8,10"
                        className="w-full px-4 py-2 rounded-lg border border-border-medium bg-background text-text-primary"
                      />
                    )}
                  </div>

                  {/* Sliders */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-text-primary">
                        Size: {Math.round(scale * 100)}%
                      </label>
                      <input
                        type="range"
                        min={10}
                        max={200}
                        value={scale * 100}
                        onChange={(e) => setScale(parseInt(e.target.value) / 100)}
                        className="w-full accent-accent-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-text-primary">
                        Opacity: {Math.round(opacity * 100)}%
                      </label>
                      <input
                        type="range"
                        min={10}
                        max={100}
                        value={opacity * 100}
                        onChange={(e) => setOpacity(parseInt(e.target.value) / 100)}
                        className="w-full accent-accent-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-text-primary">
                        Rotation: {rotation}°
                      </label>
                      <input
                        type="range"
                        min={-180}
                        max={180}
                        value={rotation}
                        onChange={(e) => setRotation(parseInt(e.target.value))}
                        className="w-full accent-accent-500"
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-border-light">
                    <Button variant="ghost" onClick={handleReset} className="w-full sm:w-auto">
                      Cancel
                    </Button>
                    <Button onClick={handleAddWatermark} className="w-full sm:w-auto">
                      <ImageIcon className="h-5 w-5 mr-2" />
                      Add Watermark
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
