'use client';

import { useState, useCallback } from 'react';
import { Stamp, Download, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button, UploadZone, ProgressBar, Alert } from '@/components/ui';
import { formatFileSize } from '@/lib/utils';

interface EnhanceProgress {
  current: number;
  total: number;
  percentage: number;
  status: string;
}

interface PageThumbnail {
  pageNumber: number;
  dataUrl: string;
}

type Position = 'center' | 'diagonal' | 'tiled';

const positionOptions: { value: Position; label: string; description: string }[] = [
  { value: 'center', label: 'Center', description: 'Single watermark in center' },
  { value: 'diagonal', label: 'Diagonal', description: 'Diagonal across page' },
  { value: 'tiled', label: 'Tiled', description: 'Repeated across page' },
];

export default function WatermarkClient() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [thumbnails, setThumbnails] = useState<PageThumbnail[]>([]);
  const [loadingThumbnails, setLoadingThumbnails] = useState(false);
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [text, setText] = useState('CONFIDENTIAL');
  const [fontSize, setFontSize] = useState(48);
  const [opacity, setOpacity] = useState(0.3);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState<Position>('diagonal');
  const [color, setColor] = useState({ r: 0.5, g: 0.5, b: 0.5 });
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState<EnhanceProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [complete, setComplete] = useState(false);

  const handleFileDrop = useCallback(async (files: File[]) => {
    const droppedFile = files[0];
    if (!droppedFile || droppedFile.type !== 'application/pdf') {
      setError('Please upload a PDF file');
      return;
    }

    try {
      setLoadingThumbnails(true);
      const { getPDFPageCount } = await import('@/lib/pdf/utils');
      const { generateThumbnails } = await import('@/lib/pdf/thumbnails');

      const count = await getPDFPageCount(droppedFile);
      setFile(droppedFile);
      setPageCount(count);
      setComplete(false);
      setError(null);

      // Generate thumbnails
      const thumbs = await generateThumbnails(droppedFile, 150, (p) => setProgress(p));
      setThumbnails(thumbs);

      // Default to all pages selected
      setSelectedPages(Array.from({ length: count }, (_, i) => i + 1));

      setLoadingThumbnails(false);
      setProgress(null);
    } catch (err) {
      setError('Failed to read the PDF file. It may be corrupted or password-protected.');
      setLoadingThumbnails(false);
    }
  }, []);

  const handleAddWatermark = async () => {
    if (!file || !text.trim()) return;

    if (selectedPages.length === 0) {
      setError('Please select at least one page to watermark');
      return;
    }

    setProcessing(true);
    setProgress(null);
    setError(null);
    setWarning(null);

    try {
      const { addWatermark } = await import('@/lib/pdf/enhance');
      const { downloadPDF } = await import('@/lib/pdf/utils');

      const result = await addWatermark(
        file,
        {
          text: text.trim(),
          fontSize,
          opacity,
          rotation,
          position,
          color,
          pages: selectedPages.length === pageCount ? undefined : selectedPages, // Only pass if not all pages
        },
        (p) => setProgress(p)
      );

      const filename = file.name.replace('.pdf', '_watermarked.pdf');
      downloadPDF(result.data, filename);

      // Show warning if any special characters were detected
      if (result.warning) {
        setWarning(result.warning);
      }

      setComplete(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add watermark');
    } finally {
      setProcessing(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPageCount(0);
    setThumbnails([]);
    setSelectedPages([]);
    setProgress(null);
    setComplete(false);
    setError(null);
    setWarning(null);
    setLoadingThumbnails(false);
  };

  const colorPresets = [
    { name: 'Gray', value: { r: 0.5, g: 0.5, b: 0.5 } },
    { name: 'Red', value: { r: 0.8, g: 0.2, b: 0.2 } },
    { name: 'Blue', value: { r: 0.2, g: 0.2, b: 0.8 } },
    { name: 'Green', value: { r: 0.2, g: 0.6, b: 0.2 } },
  ];

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
            <Stamp className="h-7 w-7 text-accent-600 dark:text-accent-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-text-primary">Add Watermark</h1>
            <p className="mt-1 text-text-secondary">
              Add text watermarks to your PDF pages
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

      {/* Warning Alert */}
      {warning && !error && (
        <Alert variant="warning" className="mb-6" onDismiss={() => setWarning(null)}>
          {warning}
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
            Your PDF has been downloaded with the watermark.
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

      {/* Loading Thumbnails */}
      {loadingThumbnails && !processing && (
        <div className="rounded-xl border border-border-medium bg-surface-50 p-8">
          <h2 className="text-lg font-semibold text-text-primary mb-4 text-center">
            Loading Pages...
          </h2>
          <ProgressBar
            progress={progress?.percentage ?? 0}
            status={progress?.status ?? 'Starting...'}
          />
        </div>
      )}

      {/* Upload/Configure State */}
      {!complete && !processing && !loadingThumbnails && (
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

              {/* Watermark Text */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-primary">Watermark Text</label>
                <input
                  type="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="CONFIDENTIAL"
                  className="w-full px-4 py-3 rounded-lg border border-border-medium bg-background text-text-primary text-lg"
                />
              </div>

              {/* Position Selector */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-text-primary">Position Style</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {positionOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setPosition(opt.value)}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        position === opt.value
                          ? 'border-accent-500 bg-accent-50 dark:bg-accent-100/10'
                          : 'border-border-medium hover:border-accent-500/50'
                      }`}
                    >
                      <p className="font-medium text-text-primary">{opt.label}</p>
                      <p className="text-sm text-text-secondary">{opt.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Selector */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-text-primary">Color</label>
                <div className="flex flex-wrap gap-2">
                  {colorPresets.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => setColor(preset.value)}
                      className={`px-4 py-2 rounded-lg border-2 transition-all ${
                        color.r === preset.value.r && color.g === preset.value.g && color.b === preset.value.b
                          ? 'border-accent-500 bg-accent-50 dark:bg-accent-100/10'
                          : 'border-border-medium hover:border-accent-500/50'
                      }`}
                    >
                      <span
                        className="inline-block w-4 h-4 rounded mr-2"
                        style={{ backgroundColor: `rgb(${preset.value.r * 255}, ${preset.value.g * 255}, ${preset.value.b * 255})` }}
                      />
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sliders */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-primary">
                    Font Size: {fontSize}pt
                  </label>
                  <input
                    type="range"
                    min={24}
                    max={96}
                    value={fontSize}
                    onChange={(e) => setFontSize(parseInt(e.target.value))}
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
              </div>

              {/* Rotation for center position */}
              {position === 'center' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-primary">
                    Rotation: {rotation}°
                  </label>
                  <input
                    type="range"
                    min={-90}
                    max={90}
                    value={rotation}
                    onChange={(e) => setRotation(parseInt(e.target.value))}
                    className="w-full accent-accent-500"
                  />
                </div>
              )}

              {/* Page Selection */}
              <div className="space-y-3 pt-4 border-t border-border-light">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-text-primary">Apply to Pages</label>
                  <span className="text-sm text-text-secondary">
                    {selectedPages.length} of {pageCount} selected
                  </span>
                </div>

                {/* Quick Selectors */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedPages(Array.from({ length: pageCount }, (_, i) => i + 1))}
                  >
                    All
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedPages([])}
                  >
                    None
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedPages(Array.from({ length: pageCount }, (_, i) => i + 1).filter(p => p % 2 === 1))}
                  >
                    Odd
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedPages(Array.from({ length: pageCount }, (_, i) => i + 1).filter(p => p % 2 === 0))}
                  >
                    Even
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedPages([1])}
                  >
                    First
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedPages([pageCount])}
                  >
                    Last
                  </Button>
                </div>

                {/* Thumbnail Grid */}
                {thumbnails.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                    {thumbnails.map((thumb) => {
                      const isSelected = selectedPages.includes(thumb.pageNumber);
                      return (
                        <div
                          key={thumb.pageNumber}
                          className="relative"
                        >
                          <div
                            onClick={() => {
                              if (isSelected) {
                                setSelectedPages(selectedPages.filter(p => p !== thumb.pageNumber));
                              } else {
                                setSelectedPages([...selectedPages, thumb.pageNumber].sort((a, b) => a - b));
                              }
                            }}
                            className={`rounded-lg border-2 overflow-hidden shadow-sm transition-all cursor-pointer ${
                              isSelected
                                ? 'border-accent-500 ring-2 ring-accent-500/20'
                                : 'border-border-medium hover:border-accent-500/50'
                            }`}
                          >
                            <img
                              src={thumb.dataUrl}
                              alt={`Page ${thumb.pageNumber}`}
                              className="w-full h-auto bg-white dark:bg-gray-900"
                            />
                            <div
                              className={`p-2 text-center text-sm font-medium ${
                                isSelected
                                  ? 'text-accent-700 dark:text-accent-500 bg-accent-50 dark:bg-accent-900/50'
                                  : 'text-text-primary bg-surface-50 dark:bg-gray-800'
                              }`}
                            >
                              Page {thumb.pageNumber}
                            </div>
                          </div>
                          {isSelected && (
                            <div className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-accent-500 text-white shadow-md">
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                <p className="text-xs text-text-tertiary">
                  Tip: Click pages to select/deselect them for watermarking
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-border-light">
                <Button variant="ghost" onClick={handleReset} className="w-full sm:w-auto">
                  Cancel
                </Button>
                <Button onClick={handleAddWatermark} disabled={!text.trim()} className="w-full sm:w-auto">
                  <Stamp className="h-5 w-5 mr-2" />
                  Add Watermark
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
