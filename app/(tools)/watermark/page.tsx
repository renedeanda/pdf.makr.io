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

type Position = 'center' | 'diagonal' | 'tiled';

const positionOptions: { value: Position; label: string; description: string }[] = [
  { value: 'center', label: 'Center', description: 'Single watermark in center' },
  { value: 'diagonal', label: 'Diagonal', description: 'Diagonal across page' },
  { value: 'tiled', label: 'Tiled', description: 'Repeated across page' },
];

export default function WatermarkPage() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [text, setText] = useState('CONFIDENTIAL');
  const [fontSize, setFontSize] = useState(48);
  const [opacity, setOpacity] = useState(0.3);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState<Position>('diagonal');
  const [color, setColor] = useState({ r: 0.5, g: 0.5, b: 0.5 });
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState<EnhanceProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [complete, setComplete] = useState(false);

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
      setComplete(false);
      setError(null);
    } catch (err) {
      setError('Failed to read the PDF file. It may be corrupted or password-protected.');
    }
  }, []);

  const handleAddWatermark = async () => {
    if (!file || !text.trim()) return;

    setProcessing(true);
    setProgress(null);
    setError(null);

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
        },
        (p) => setProgress(p)
      );

      const filename = file.name.replace('.pdf', '_watermarked.pdf');
      downloadPDF(result, filename);
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
    setProgress(null);
    setComplete(false);
    setError(null);
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

      {/* Upload/Configure State */}
      {!complete && !processing && (
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
