'use client';

import { useState, useCallback, useRef } from 'react';
import { FileOutput, Download, ArrowLeft, TrendingDown } from 'lucide-react';
import Link from 'next/link';
import { Button, UploadZone, ProgressBar, Alert } from '@/components/ui';
import { formatFileSize } from '@/lib/utils';
import { useKeyboardShortcuts, commonShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { celebrateSuccess } from '@/lib/confetti';
import { validateFile } from '@/lib/file-validation';
import type { PDFAnalysis } from '@/lib/pdf/analyze';

type CompressionLevel = 'low' | 'medium' | 'high';

interface CompressionProgress {
  current: number;
  total: number;
  percentage: number;
  status: string;
}

interface CompressionResult {
  data: Uint8Array;
  originalSize: number;
  compressedSize: number;
  savings: number;
  savingsPercent: number;
}

const compressionLevels: { level: CompressionLevel; label: string; description: string }[] = [
  { level: 'low', label: 'Low', description: 'Best quality, minimal compression' },
  { level: 'medium', label: 'Medium', description: 'Balanced quality and size' },
  { level: 'high', label: 'High', description: 'Smallest size, reduced quality' },
];

export default function CompressClient() {
  const [file, setFile] = useState<File | null>(null);
  const [compressionLevel, setCompressionLevel] = useState<CompressionLevel>('medium');
  const [processing, setProcessing] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState<CompressionProgress | null>(null);
  const [result, setResult] = useState<CompressionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<PDFAnalysis | null>(null);
  const [levelPreviews, setLevelPreviews] = useState<Record<CompressionLevel, { willIncrease: boolean } | null>>({
    low: null,
    medium: null,
    high: null,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileDrop = useCallback(async (files: File[]) => {
    const droppedFile = files[0];
    if (!droppedFile) {
      setError('Please upload a PDF file');
      return;
    }

    // Validate file
    const validation = await validateFile(droppedFile, {
      allowedTypes: ['application/pdf'],
      checkIntegrity: true,
    });

    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      return;
    }

    setFile(droppedFile);
    setResult(null);
    setAnalysis(null);
    setLevelPreviews({ low: null, medium: null, high: null });

    // Analyze PDF for compression potential
    setAnalyzing(true);
    try {
      const { analyzePDF, previewCompression } = await import('@/lib/pdf/analyze');
      const pdfAnalysis = await analyzePDF(droppedFile);
      setAnalysis(pdfAnalysis);

      // Set recommended level if available
      if (pdfAnalysis.recommendation.recommendedLevel) {
        setCompressionLevel(pdfAnalysis.recommendation.recommendedLevel);
      }

      // Preview each compression level to check if it increases size
      const previews = await Promise.all([
        previewCompression(droppedFile, 'low'),
        previewCompression(droppedFile, 'medium'),
        previewCompression(droppedFile, 'high'),
      ]);

      setLevelPreviews({
        low: { willIncrease: previews[0].willIncrease },
        medium: { willIncrease: previews[1].willIncrease },
        high: { willIncrease: previews[2].willIncrease },
      });

      // Show recommendation message
      if (!pdfAnalysis.recommendation.shouldCompress) {
        setError(pdfAnalysis.recommendation.reason);
      } else if (validation.warning) {
        let warningMessage = validation.warning;
        if (validation.estimatedProcessingTime) {
          warningMessage += ` Estimated time: ${validation.estimatedProcessingTime}.`;
        }
        setError(warningMessage);
      } else {
        setError(null);
      }
    } catch (err) {
      console.error('PDF analysis failed:', err);
      // Continue without analysis
      if (validation.warning) {
        let warningMessage = validation.warning;
        if (validation.estimatedProcessingTime) {
          warningMessage += ` Estimated time: ${validation.estimatedProcessingTime}.`;
        }
        setError(warningMessage);
      } else {
        setError(null);
      }
    } finally {
      setAnalyzing(false);
    }
  }, []);

  const handleCompress = async () => {
    if (!file) return;

    setProcessing(true);
    setProgress(null);
    setError(null);

    try {
      // Dynamic import to avoid SSR issues
      const { compressPDF } = await import('@/lib/pdf/compress');
      const compressionResult = await compressPDF(file, compressionLevel, (p) => setProgress(p));
      setResult(compressionResult);

      // Celebrate success!
      if (compressionResult.savingsPercent > 0) {
        celebrateSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to compress PDF');
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = async () => {
    if (result && file) {
      const { downloadPDF } = await import('@/lib/pdf/utils');
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

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Keyboard shortcuts
  useKeyboardShortcuts([
    commonShortcuts.open(triggerFileInput),
    commonShortcuts.save(() => {
      if (result && !processing) {
        handleDownload();
      }
    }),
    commonShortcuts.delete(() => {
      if (file && !processing) {
        handleReset();
      }
    }),
    commonShortcuts.backspace(() => {
      if (file && !processing) {
        handleReset();
      }
    }),
    commonShortcuts.enter(() => {
      if (file && !processing && !result) {
        handleCompress();
      }
    }, true),
    commonShortcuts.escape(() => {
      if (processing || result) {
        handleReset();
      }
    }),
  ], true);

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

          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
            <Button onClick={handleDownload} size="lg" className="w-full sm:w-auto">
              <Download className="h-5 w-5 mr-2" />
              Download Compressed PDF
            </Button>
            <Button variant="secondary" onClick={handleReset} className="w-full sm:w-auto">
              Compress Another
            </Button>
          </div>
        </div>
      )}

      {/* Processing State */}
      {processing && (
        <div className="rounded-xl border border-border-medium bg-surface-50 p-8">
          <h2 className="text-lg font-semibold text-text-primary mb-4 text-center" role="status" aria-live="polite">
            Compressing PDF...
          </h2>
          <ProgressBar
            progress={progress?.percentage ?? 0}
            status={progress?.status ?? 'Starting compression...'}
          />
          <p className="text-sm text-text-secondary text-center mt-4" role="status" aria-live="polite">
            This may take a while for large files
          </p>
        </div>
      )}

      {/* Upload/Configure State */}
      {!result && !processing && (
        <>
          {!file ? (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                aria-label="Upload PDF file"
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  if (files.length > 0) {
                    handleFileDrop(files);
                  }
                }}
              />
              <UploadZone
                onDrop={handleFileDrop}
                multiple={false}
                fileType="pdf"
              />
            </>
          ) : analyzing ? (
            <div className="rounded-xl border border-border-medium bg-surface-50 p-8">
              <h2 className="text-lg font-semibold text-text-primary mb-4 text-center">
                Analyzing PDF...
              </h2>
              <div className="flex items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-500 border-t-transparent" />
              </div>
              <p className="text-sm text-text-secondary text-center mt-4">
                Checking compression potential
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* File Info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg border border-border-medium bg-surface-50">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-text-primary truncate">{file.name}</p>
                  <p className="text-sm text-text-secondary">
                    {formatFileSize(file.size)}
                    {analysis && (
                      <> • {analysis.pageCount} page{analysis.pageCount !== 1 ? 's' : ''}</>
                    )}
                  </p>
                </div>
                <Button variant="ghost" onClick={handleReset} className="shrink-0">
                  Change File
                </Button>
              </div>

              {/* Analysis Results */}
              {analysis && (
                <Alert
                  variant={analysis.recommendation.shouldCompress ? "info" : "warning"}
                  className="mb-4"
                >
                  <div className="space-y-1">
                    <p className="font-medium">
                      {analysis.recommendation.shouldCompress ? '✓ ' : '⚠️ '}
                      {analysis.recommendation.reason}
                    </p>
                    {analysis.recommendation.shouldCompress && analysis.recommendation.estimatedSavings && (
                      <p className="text-sm opacity-90">
                        Estimated savings: ~{analysis.recommendation.estimatedSavings}%
                        {analysis.recommendation.recommendedLevel && (
                          <> (using {analysis.recommendation.recommendedLevel} compression)</>
                        )}
                      </p>
                    )}
                  </div>
                </Alert>
              )}

              {/* Compression Level Selector */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-text-primary">
                  Compression Level
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {compressionLevels.map((level) => {
                    const preview = levelPreviews[level.level];
                    const willIncrease = preview?.willIncrease ?? false;
                    const isRecommended = analysis?.recommendation.recommendedLevel === level.level;
                    const isDisabled = willIncrease && !analysis?.recommendation.shouldCompress;

                    return (
                      <button
                        key={level.level}
                        onClick={() => !isDisabled && setCompressionLevel(level.level)}
                        disabled={isDisabled}
                        aria-label={`${level.label} compression: ${level.description}`}
                        aria-pressed={compressionLevel === level.level}
                        className={`p-4 rounded-xl border-2 text-left transition-all relative ${
                          isDisabled
                            ? 'opacity-50 cursor-not-allowed border-border-light'
                            : compressionLevel === level.level
                            ? 'border-accent-500 bg-accent-50 dark:bg-accent-100/10'
                            : 'border-border-medium hover:border-accent-500/50'
                        }`}
                      >
                        {isRecommended && !isDisabled && (
                          <span className="absolute -top-2 -right-2 bg-accent-600 text-white text-xs px-2 py-0.5 rounded-full">
                            Recommended
                          </span>
                        )}
                        <p className="font-medium text-text-primary">
                          {level.label}
                          {willIncrease && (
                            <span className="text-amber-600 ml-1" title="May increase file size">
                              ⚠️
                            </span>
                          )}
                        </p>
                        <p className="text-sm text-text-secondary mt-1">
                          {level.description}
                        </p>
                        {willIncrease && !isDisabled && (
                          <p className="text-xs text-amber-600 mt-1">
                            May increase size
                          </p>
                        )}
                        {isDisabled && (
                          <p className="text-xs text-text-tertiary mt-1">
                            Not recommended
                          </p>
                        )}
                      </button>
                    );
                  })}
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
