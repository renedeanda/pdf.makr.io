'use client';

import { useState, useCallback } from 'react';
import { ShieldAlert, Download, ArrowLeft, AlertTriangle, Info, CheckCircle2, FileText, Shield } from 'lucide-react';
import Link from 'next/link';
import { Button, UploadZone, ProgressBar, Alert } from '@/components/ui';
import { formatFileSize } from '@/lib/utils';

interface RedactionProgress {
  current: number;
  total: number;
  percentage: number;
  status: string;
}

interface RedactionAnalysis {
  totalPages: number;
  annotationsFound: number;
  annotationsRemoved: number;
  redactionAnnotations: number;
  squareAnnotations: number;
  highlightAnnotations: number;
  inkAnnotations: number;
  otherAnnotations: number;
  blackShapesDetected: number;
  pagesWithRedactions: number[];
  hasProperRedactions: boolean;
  warningMessages: string[];
  detailedFindings: string[];
  textRevealed: boolean;
}

export default function RemoveRedactionsClient() {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState<RedactionProgress | null>(null);
  const [analysis, setAnalysis] = useState<RedactionAnalysis | null>(null);
  const [processedData, setProcessedData] = useState<Uint8Array | null>(null);
  const [textBefore, setTextBefore] = useState<string>('');
  const [textAfter, setTextAfter] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [complete, setComplete] = useState(false);

  const handleFileDrop = useCallback(async (files: File[]) => {
    const droppedFile = files[0];
    if (!droppedFile || droppedFile.type !== 'application/pdf') {
      setError('Please upload a PDF file');
      return;
    }

    setFile(droppedFile);
    setComplete(false);
    setError(null);
    setAnalysis(null);
    setProcessedData(null);
    setTextBefore('');
    setTextAfter('');

    // Automatically analyze the file
    await analyzeFile(droppedFile);
  }, []);

  const analyzeFile = async (fileToAnalyze: File) => {
    setAnalyzing(true);
    setProgress(null);
    setError(null);

    try {
      const { analyzeRedactions } = await import('@/lib/pdf/redact');

      const result = await analyzeRedactions(fileToAnalyze, (p) => setProgress(p));
      setAnalysis(result);
      setAnalyzing(false);
      setProgress(null);
    } catch (err) {
      setError('Failed to analyze the PDF file. It may be corrupted or use unsupported features.');
      setAnalyzing(false);
      setProgress(null);
    }
  };

  const handleRemoveRedactions = async () => {
    if (!file) return;

    setProcessing(true);
    setProgress(null);
    setError(null);

    try {
      const { removeRedactions } = await import('@/lib/pdf/redact');

      const result = await removeRedactions(file, (p) => setProgress(p));

      setProcessedData(result.data);
      setAnalysis(result.analysis);
      setTextBefore(result.textBefore);
      setTextAfter(result.textAfter);
      setComplete(true);
      setProcessing(false);
      setProgress(null);
    } catch (err) {
      setError('Failed to remove redactions. The PDF may be corrupted or use unsupported features.');
      setProcessing(false);
      setProgress(null);
    }
  };

  const handleDownload = () => {
    if (!processedData || !file) return;

    const { downloadPDF } = require('@/lib/pdf/utils');
    const originalName = file.name.replace('.pdf', '');
    downloadPDF(processedData, `${originalName}_unredacted.pdf`);
  };

  const handleReset = () => {
    setFile(null);
    setProcessing(false);
    setAnalyzing(false);
    setProgress(null);
    setAnalysis(null);
    setProcessedData(null);
    setTextBefore('');
    setTextAfter('');
    setError(null);
    setComplete(false);
  };

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-accent-600 dark:hover:text-accent-400 mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Tools
        </Link>

        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-900/20">
            <ShieldAlert className="h-7 w-7 text-amber-600 dark:text-amber-500" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-text-primary">
                Remove Redactions
              </h1>
              <span className="px-2 py-1 text-xs font-semibold rounded-md bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                EXPERIMENTAL
              </span>
            </div>
            <p className="text-text-secondary">
              Advanced detection and removal of cosmetic redactions. Analyzes annotation types, colors, and content streams.
            </p>
          </div>
        </div>
      </div>

      {/* Security Warning */}
      <Alert variant="warning" className="mb-6">
        <div className="flex gap-3">
          <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div>
            <strong className="block mb-1">Security Awareness Tool</strong>
            <p className="text-sm">
              This tool demonstrates the difference between <strong>cosmetic redactions</strong> (removable overlays)
              and <strong>proper redactions</strong> (permanent content removal). Use it to verify your redactions
              are truly secure before sharing sensitive documents.
            </p>
          </div>
        </div>
      </Alert>

      {/* How It Works */}
      <div className="bg-card border border-border-medium rounded-xl p-6 mb-8">
        <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
          <Info className="h-5 w-5 text-accent-600 dark:text-accent-500" />
          Detection Methods
        </h2>
        <div className="space-y-3 text-sm text-text-secondary">
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-accent-100 dark:bg-accent-900/30 text-accent-800 dark:text-accent-400 flex items-center justify-center text-xs font-semibold">
              1
            </div>
            <div>
              <strong className="text-text-primary">Annotation Analysis:</strong>
              <p className="mt-1">Identifies Redact, Square, Highlight, and Ink annotations with dark colors</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-accent-100 dark:bg-accent-900/30 text-accent-800 dark:text-accent-400 flex items-center justify-center text-xs font-semibold">
              2
            </div>
            <div>
              <strong className="text-text-primary">Color Detection:</strong>
              <p className="mt-1">Analyzes RGB, CMYK, and grayscale values to identify black/dark overlays</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-accent-100 dark:bg-accent-900/30 text-accent-800 dark:text-accent-400 flex items-center justify-center text-xs font-semibold">
              3
            </div>
            <div>
              <strong className="text-text-primary">Content Stream Inspection:</strong>
              <p className="mt-1">Detects black rectangles drawn directly in PDF content streams</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-accent-100 dark:bg-accent-900/30 text-accent-800 dark:text-accent-400 flex items-center justify-center text-xs font-semibold">
              4
            </div>
            <div>
              <strong className="text-text-primary">Text Extraction Comparison:</strong>
              <p className="mt-1">Compares text before and after to prove content was revealed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Zone */}
      {!file && (
        <UploadZone
          onDrop={handleFileDrop}
          accept={{ 'application/pdf': ['.pdf'] }}
          maxFiles={1}
          multiple={false}
          fileType="pdf"
        />
      )}

      {/* File Info */}
      {file && !complete && (
        <div className="bg-card border border-border-medium rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-medium text-text-primary">{file.name}</h3>
              <p className="text-sm text-text-secondary">{formatFileSize(file.size)}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={handleReset}>
              Remove
            </Button>
          </div>

          {/* Analysis Results */}
          {analysis && !processing && (
            <div className="space-y-4 mt-6">
              <div className="border-t border-border-light pt-4">
                <h4 className="font-semibold text-text-primary mb-3 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-accent-600 dark:text-accent-500" />
                  Analysis Results
                </h4>

                {/* Statistics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  <div className="bg-surface-secondary rounded-lg p-3">
                    <div className="text-2xl font-bold text-text-primary">{analysis.totalPages}</div>
                    <div className="text-xs text-text-secondary">Total Pages</div>
                  </div>
                  <div className="bg-surface-secondary rounded-lg p-3">
                    <div className="text-2xl font-bold text-amber-600 dark:text-amber-500">
                      {analysis.annotationsFound}
                    </div>
                    <div className="text-xs text-text-secondary">Annotations</div>
                  </div>
                  <div className="bg-surface-secondary rounded-lg p-3">
                    <div className="text-2xl font-bold text-red-600 dark:text-red-500">
                      {analysis.blackShapesDetected}
                    </div>
                    <div className="text-xs text-text-secondary">Likely Redactions</div>
                  </div>
                  <div className="bg-surface-secondary rounded-lg p-3">
                    <div className="text-2xl font-bold text-text-primary">
                      {analysis.pagesWithRedactions.length}
                    </div>
                    <div className="text-xs text-text-secondary">Affected Pages</div>
                  </div>
                </div>

                {/* Annotation Type Breakdown */}
                {(analysis.redactionAnnotations > 0 || analysis.squareAnnotations > 0 ||
                  analysis.highlightAnnotations > 0 || analysis.inkAnnotations > 0) && (
                  <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-4">
                    <div className="text-sm font-semibold text-amber-900 dark:text-amber-300 mb-2">
                      Annotation Types Detected:
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm text-amber-800 dark:text-amber-400">
                      {analysis.redactionAnnotations > 0 && (
                        <div>⚠️ Redact: {analysis.redactionAnnotations}</div>
                      )}
                      {analysis.squareAnnotations > 0 && (
                        <div>⬛ Rectangle: {analysis.squareAnnotations}</div>
                      )}
                      {analysis.highlightAnnotations > 0 && (
                        <div>🖍️ Highlight: {analysis.highlightAnnotations}</div>
                      )}
                      {analysis.inkAnnotations > 0 && (
                        <div>✏️ Ink: {analysis.inkAnnotations}</div>
                      )}
                      {analysis.otherAnnotations > 0 && (
                        <div>📝 Other: {analysis.otherAnnotations}</div>
                      )}
                    </div>
                  </div>
                )}

                {/* Detailed Findings */}
                {analysis.detailedFindings && analysis.detailedFindings.length > 0 && (
                  <div className="bg-surface-secondary rounded-lg p-4 mb-4">
                    <div className="text-sm font-semibold text-text-primary mb-2">
                      Detailed Findings:
                    </div>
                    <div className="space-y-1">
                      {analysis.detailedFindings.map((finding, idx) => (
                        <div key={idx} className="flex gap-2 text-sm text-text-secondary">
                          <span className="text-accent-600 dark:text-accent-500">•</span>
                          {finding}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pages with Redactions */}
                {analysis.pagesWithRedactions.length > 0 && (
                  <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4">
                    <div className="text-sm text-red-900 dark:text-red-300">
                      <strong>Pages with suspicious overlays:</strong> {analysis.pagesWithRedactions.join(', ')}
                    </div>
                  </div>
                )}

                {/* Warning Messages */}
                <div className="space-y-2 mb-4">
                  {analysis.warningMessages.map((msg, idx) => (
                    <div key={idx} className="flex gap-2 text-sm text-text-secondary">
                      <span className="text-accent-600 dark:text-accent-500">•</span>
                      {msg}
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              {analysis.blackShapesDetected > 0 ? (
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleRemoveRedactions}
                  disabled={processing}
                  className="w-full"
                >
                  <ShieldAlert className="h-5 w-5" />
                  Remove {analysis.blackShapesDetected} Suspicious Overlay{analysis.blackShapesDetected !== 1 ? 's' : ''}
                </Button>
              ) : analysis.annotationsFound > 0 ? (
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleRemoveRedactions}
                  disabled={processing}
                  className="w-full"
                >
                  <ShieldAlert className="h-5 w-5" />
                  Remove All {analysis.annotationsFound} Annotation{analysis.annotationsFound !== 1 ? 's' : ''}
                </Button>
              ) : (
                <Alert variant="success" className="mt-4">
                  <div className="flex gap-2">
                    <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                    <div>
                      <strong>No cosmetic redactions detected.</strong>
                      <p className="text-sm mt-1">
                        This PDF either has no redactions, or they are properly applied (permanent).
                        If you see redacted areas, they are likely secure.
                      </p>
                    </div>
                  </div>
                </Alert>
              )}
            </div>
          )}
        </div>
      )}

      {/* Progress */}
      {(analyzing || processing) && progress && (
        <div className="bg-card border border-border-medium rounded-xl p-6 mb-6">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-text-primary">
                {analyzing ? 'Analyzing PDF...' : 'Removing Redactions...'}
              </span>
              <span className="text-sm text-text-secondary">{progress.percentage}%</span>
            </div>
            <ProgressBar progress={progress.percentage} />
          </div>
          <p className="text-sm text-text-secondary">{progress.status}</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <Alert variant="error" className="mb-6">
          {error}
        </Alert>
      )}

      {/* Success */}
      {complete && processedData && analysis && (
        <div className="bg-card border border-border-medium rounded-xl p-6 mb-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-50 dark:bg-green-900/20">
              <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-500" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-text-primary mb-1">Processing Complete</h3>
              <p className="text-sm text-text-secondary">
                {analysis.annotationsRemoved > 0
                  ? `Removed ${analysis.annotationsRemoved} annotation(s) from your PDF.`
                  : 'No annotations were found to remove.'}
              </p>
            </div>
          </div>

          {/* Text Revelation Stats */}
          {analysis.textRevealed && textBefore && textAfter && (
            <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
              <div className="flex gap-2 mb-2">
                <FileText className="h-5 w-5 text-green-600 dark:text-green-500 flex-shrink-0" />
                <strong className="text-sm text-green-900 dark:text-green-300">
                  ✓ Text Successfully Revealed!
                </strong>
              </div>
              <div className="ml-7 space-y-1 text-sm text-green-800 dark:text-green-400">
                <p>Before: {textBefore.length} characters</p>
                <p>After: {textAfter.length} characters</p>
                <p className="font-semibold">
                  +{textAfter.length - textBefore.length} additional characters revealed
                </p>
              </div>
            </div>
          )}

          {/* Detailed Findings */}
          {analysis.detailedFindings && analysis.detailedFindings.length > 0 && (
            <div className="bg-surface-secondary rounded-lg p-4 mb-6">
              <div className="text-sm font-semibold text-text-primary mb-2">
                What Was Removed:
              </div>
              <div className="space-y-1">
                {analysis.detailedFindings.map((finding, idx) => (
                  <p key={idx} className="text-sm text-text-secondary">{finding}</p>
                ))}
              </div>
            </div>
          )}

          {/* Warning Messages */}
          {analysis.warningMessages.length > 0 && (
            <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-6">
              <div className="flex gap-2 mb-2">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500 flex-shrink-0" />
                <strong className="text-sm text-amber-900 dark:text-amber-300">Important:</strong>
              </div>
              <div className="space-y-1 ml-7">
                {analysis.warningMessages.map((msg, idx) => (
                  <p key={idx} className="text-sm text-amber-800 dark:text-amber-400">{msg}</p>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              variant="primary"
              size="lg"
              onClick={handleDownload}
              className="flex-1"
            >
              <Download className="h-5 w-5" />
              Download Unredacted PDF
            </Button>
            <Button variant="secondary" size="lg" onClick={handleReset}>
              Process Another
            </Button>
          </div>
        </div>
      )}

      {/* Privacy Notice */}
      <Alert variant="privacy" className="mt-8">
        <strong>Your files stay private.</strong> All processing happens in your browser.
        Your PDFs never leave your device.
      </Alert>
    </div>
  );
}
