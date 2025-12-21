'use client';

import { useState, useCallback } from 'react';
import { ShieldAlert, Download, ArrowLeft, AlertTriangle, Info, CheckCircle2 } from 'lucide-react';
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
  pagesWithRedactions: number[];
  hasProperRedactions: boolean;
  warningMessages: string[];
}

export default function RemoveRedactionsClient() {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState<RedactionProgress | null>(null);
  const [analysis, setAnalysis] = useState<RedactionAnalysis | null>(null);
  const [processedData, setProcessedData] = useState<Uint8Array | null>(null);
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
              Detect and remove cosmetic redactions from PDFs. Check if redactions are properly applied or just visual overlays.
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
          How It Works
        </h2>
        <div className="space-y-3 text-sm text-text-secondary">
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 flex items-center justify-center text-xs font-semibold">
              ✗
            </div>
            <div>
              <strong className="text-text-primary">Cosmetic Redactions (Insecure):</strong>
              <p className="mt-1">Black boxes drawn over text using annotation tools. The underlying content still exists
              in the PDF and can be revealed by removing the overlay.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 flex items-center justify-center text-xs font-semibold">
              ✓
            </div>
            <div>
              <strong className="text-text-primary">Proper Redactions (Secure):</strong>
              <p className="mt-1">Content is permanently removed from the PDF structure using professional tools
              (Adobe Acrobat Pro, etc.). Cannot be recovered.</p>
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
                <h4 className="font-semibold text-text-primary mb-3">Analysis Results</h4>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-surface-secondary rounded-lg p-3">
                    <div className="text-2xl font-bold text-text-primary">{analysis.totalPages}</div>
                    <div className="text-xs text-text-secondary">Total Pages</div>
                  </div>
                  <div className="bg-surface-secondary rounded-lg p-3">
                    <div className="text-2xl font-bold text-amber-600 dark:text-amber-500">
                      {analysis.annotationsFound}
                    </div>
                    <div className="text-xs text-text-secondary">Annotations Found</div>
                  </div>
                </div>

                {analysis.pagesWithRedactions.length > 0 && (
                  <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mb-4">
                    <div className="text-sm text-amber-900 dark:text-amber-300">
                      <strong>Pages with annotations:</strong> {analysis.pagesWithRedactions.join(', ')}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  {analysis.warningMessages.map((msg, idx) => (
                    <div key={idx} className="flex gap-2 text-sm text-text-secondary">
                      <span className="text-accent-600 dark:text-accent-500">•</span>
                      {msg}
                    </div>
                  ))}
                </div>
              </div>

              {analysis.annotationsFound > 0 && (
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleRemoveRedactions}
                  disabled={processing}
                  className="w-full"
                >
                  <ShieldAlert className="h-5 w-5" />
                  Remove {analysis.annotationsFound} Annotation{analysis.annotationsFound !== 1 ? 's' : ''}
                </Button>
              )}

              {analysis.annotationsFound === 0 && (
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
                  ? `Removed ${analysis.annotationsRemoved} cosmetic redaction(s) from your PDF.`
                  : 'No cosmetic redactions were found to remove.'}
              </p>
            </div>
          </div>

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
