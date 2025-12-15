'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, RotateCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PageThumbnailProps {
  pdfUrl: string;
  pageNumber: number;
  selected?: boolean;
  onClick?: () => void;
  rotation?: number;
  onRotate?: () => void;
  showRotateButton?: boolean;
  className?: string;
}

export function PageThumbnail({
  pdfUrl,
  pageNumber,
  selected = false,
  onClick,
  rotation = 0,
  onRotate,
  showRotateButton = false,
  className,
}: PageThumbnailProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function renderThumbnail() {
      if (!canvasRef.current) return;

      try {
        setLoading(true);
        setError(false);

        // Dynamic import to avoid SSR issues
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

        const pdf = await pdfjsLib.getDocument(pdfUrl).promise;
        if (cancelled) return;

        const page = await pdf.getPage(pageNumber);
        if (cancelled) return;

        const viewport = page.getViewport({ scale: 0.3, rotation });

        const canvas = canvasRef.current;
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const context = canvas.getContext('2d');
        if (!context) throw new Error('Could not get canvas context');

        await page.render({
          canvasContext: context,
          viewport,
          canvas,
        }).promise;

        setLoading(false);
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to render thumbnail:', err);
          setError(true);
          setLoading(false);
        }
      }
    }

    renderThumbnail();

    return () => {
      cancelled = true;
    };
  }, [pdfUrl, pageNumber, rotation]);

  return (
    <div
      onClick={onClick}
      className={cn(
        'group relative aspect-[1/1.4] overflow-hidden rounded-lg border-2 bg-white shadow-sm transition-all cursor-pointer',
        selected
          ? 'border-accent-500 ring-2 ring-accent-500/20'
          : 'border-border-medium hover:border-accent-500/50',
        className
      )}
    >
      {/* Canvas for PDF rendering */}
      <canvas
        ref={canvasRef}
        className={cn(
          'h-full w-full object-contain',
          loading && 'opacity-0',
          error && 'hidden'
        )}
      />

      {/* Loading state */}
      {loading && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-surface-100">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent-500 border-t-transparent" />
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-surface-100 text-text-tertiary text-xs">
          Preview failed
        </div>
      )}

      {/* Page number badge */}
      <div className="absolute bottom-2 right-2 rounded-md bg-background/90 px-2 py-1 text-xs font-medium text-text-primary backdrop-blur-sm">
        {pageNumber}
      </div>

      {/* Selection indicator */}
      {selected && (
        <div className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-accent-500 text-white">
          <Check className="h-4 w-4" />
        </div>
      )}

      {/* Rotate button */}
      {showRotateButton && onRotate && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRotate();
          }}
          className="absolute top-2 left-2 flex h-7 w-7 items-center justify-center rounded-lg bg-background/90 text-text-secondary opacity-0 backdrop-blur-sm transition-opacity hover:text-accent-600 group-hover:opacity-100"
          aria-label="Rotate page"
        >
          <RotateCw className="h-4 w-4" />
        </button>
      )}

      {/* Selection overlay */}
      {selected && (
        <div className="absolute inset-0 bg-accent-500/5 pointer-events-none" />
      )}
    </div>
  );
}
