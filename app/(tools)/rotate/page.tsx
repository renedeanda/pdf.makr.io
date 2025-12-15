'use client';

import { useState, useCallback } from 'react';
import { RotateCw, Download, ArrowLeft, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import { Button, UploadZone, ProgressBar, Alert } from '@/components/ui';
import { PageSelector } from '@/components/pdf';
import { rotatePages, rotateAllPages, EditProgress } from '@/lib/pdf/edit';
import { getPDFPageCount, downloadPDF } from '@/lib/pdf/utils';
import { formatFileSize } from '@/lib/utils';
import type { RotationAngle } from '@/types/pdf';

export default function RotatePage() {
  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [rotations, setRotations] = useState<Map<number, number>>(new Map());
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState<EditProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileDrop = useCallback(async (files: File[]) => {
    const droppedFile = files[0];
    if (!droppedFile || droppedFile.type !== 'application/pdf') {
      setError('Please upload a PDF file');
      return;
    }

    try {
      const count = await getPDFPageCount(droppedFile);
      setFile(droppedFile);
      setFileUrl(URL.createObjectURL(droppedFile));
      setPageCount(count);
      setSelectedPages([]);
      setRotations(new Map());
      setError(null);
    } catch (err) {
      setError('Failed to read the PDF file. It may be corrupted or password-protected.');
    }
  }, []);

  const rotateSelected = (angle: RotationAngle) => {
    if (selectedPages.length === 0) return;

    setRotations(prev => {
      const newRotations = new Map(prev);
      selectedPages.forEach(pageNum => {
        const current = newRotations.get(pageNum) || 0;
        newRotations.set(pageNum, (current + angle) % 360);
      });
      return newRotations;
    });
  };

  const rotatePage = (pageNum: number) => {
    setRotations(prev => {
      const newRotations = new Map(prev);
      const current = newRotations.get(pageNum) || 0;
      newRotations.set(pageNum, (current + 90) % 360);
      return newRotations;
    });
  };

  const rotateAll = (angle: RotationAngle) => {
    setRotations(prev => {
      const newRotations = new Map(prev);
      for (let i = 1; i <= pageCount; i++) {
        const current = newRotations.get(i) || 0;
        newRotations.set(i, (current + angle) % 360);
      }
      return newRotations;
    });
  };

  const handleApply = async () => {
    if (!file || rotations.size === 0) return;

    setProcessing(true);
    setProgress(null);
    setError(null);

    try {
      const rotationMap = new Map<number, RotationAngle>();
      rotations.forEach((angle, page) => {
        if (angle !== 0) {
          rotationMap.set(page, angle as RotationAngle);
        }
      });

      if (rotationMap.size === 0) {
        setError('No rotations to apply');
        setProcessing(false);
        return;
      }

      const result = await rotatePages(file, rotationMap, (p) => setProgress(p));
      const filename = file.name.replace('.pdf', '_rotated.pdf');
      downloadPDF(result, filename);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to rotate pages');
    } finally {
      setProcessing(false);
    }
  };

  const handleReset = () => {
    if (fileUrl) URL.revokeObjectURL(fileUrl);
    setFile(null);
    setFileUrl(null);
    setPageCount(0);
    setSelectedPages([]);
    setRotations(new Map());
    setProgress(null);
    setError(null);
  };

  const changedPages = Array.from(rotations.entries()).filter(([_, angle]) => angle !== 0).length;

  return (
    <div className="mx-auto max-w-5xl px-6 lg:px-8 py-12">
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
            <RotateCw className="h-7 w-7 text-accent-600 dark:text-accent-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-text-primary">Rotate Pages</h1>
            <p className="mt-1 text-text-secondary">
              Rotate PDF pages to any orientation
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

      {/* Processing State */}
      {processing && progress && (
        <div className="rounded-xl border border-border-medium bg-surface-50 p-8">
          <h2 className="text-lg font-semibold text-text-primary mb-4 text-center">
            Rotating Pages...
          </h2>
          <ProgressBar
            progress={progress.percentage}
            status={progress.status}
          />
        </div>
      )}

      {/* Upload State */}
      {!file && !processing && (
        <UploadZone
          onDrop={handleFileDrop}
          multiple={false}
          fileType="pdf"
        />
      )}

      {/* Edit State */}
      {file && fileUrl && !processing && (
        <div className="space-y-6">
          {/* File Info */}
          <div className="flex items-center justify-between p-4 rounded-lg border border-border-medium bg-surface-50">
            <div>
              <p className="font-medium text-text-primary">{file.name}</p>
              <p className="text-sm text-text-secondary">
                {pageCount} pages • {formatFileSize(file.size)}
              </p>
            </div>
            <Button variant="ghost" onClick={handleReset}>
              Change File
            </Button>
          </div>

          {/* Rotation Controls */}
          <div className="flex flex-wrap items-center gap-4 p-4 rounded-lg border border-border-medium bg-surface-50">
            <span className="text-sm font-medium text-text-primary">Rotate:</span>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => rotateSelected(270)}
                disabled={selectedPages.length === 0}
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Left 90°
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => rotateSelected(90)}
                disabled={selectedPages.length === 0}
              >
                <RotateCw className="h-4 w-4 mr-1" />
                Right 90°
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => rotateSelected(180)}
                disabled={selectedPages.length === 0}
              >
                180°
              </Button>
            </div>
            <div className="border-l border-border-medium h-6" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => rotateAll(90)}
            >
              Rotate All Right
            </Button>
          </div>

          {/* Page Selection */}
          <PageSelector
            pdfUrl={fileUrl}
            totalPages={pageCount}
            selectedPages={selectedPages}
            onSelectionChange={setSelectedPages}
            mode="rotate"
            rotations={rotations}
            onRotate={rotatePage}
          />

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-border-light">
            <div className="text-sm text-text-secondary">
              {changedPages > 0
                ? `${changedPages} page${changedPages > 1 ? 's' : ''} will be rotated`
                : 'Click on pages or select and use buttons above to rotate'}
            </div>
            <div className="flex gap-3">
              <Button variant="ghost" onClick={handleReset}>
                Start Over
              </Button>
              <Button onClick={handleApply} disabled={changedPages === 0}>
                <Download className="h-5 w-5 mr-2" />
                Apply & Download
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
