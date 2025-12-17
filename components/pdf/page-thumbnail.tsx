'use client';

import { useState, useEffect } from 'react';
import { Check, RotateCw, Loader2 } from 'lucide-react';
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
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function generateThumbnail() {
      try {
        setLoading(true);

        // Fetch PDF file from URL
        const response = await fetch(pdfUrl);
        const blob = await response.blob();
        const file = new File([blob], 'temp.pdf', { type: 'application/pdf' });

        // Generate thumbnail
        const { generatePageThumbnail } = await import('@/lib/pdf/thumbnails');
        const thumbnail = await generatePageThumbnail(file, pageNumber, 150);

        if (!cancelled) {
          setThumbnailUrl(thumbnail.dataUrl);
          setLoading(false);
        }
      } catch (error) {
        console.error('Failed to generate thumbnail:', error);
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    generateThumbnail();

    return () => {
      cancelled = true;
    };
  }, [pdfUrl, pageNumber]);

  return (
    <div
      onClick={onClick}
      className={cn(
        'group relative aspect-[1/1.4] overflow-hidden rounded-lg border-2 shadow-sm transition-all cursor-pointer',
        selected
          ? 'border-accent-500 ring-2 ring-accent-500/20 bg-accent-50 dark:bg-accent-950/20'
          : 'border-border-medium hover:border-accent-500/50 bg-white dark:bg-gray-900 hover:bg-surface-100',
        className
      )}
    >
      {/* Thumbnail image or loading state */}
      {loading ? (
        <div className="absolute inset-0 flex items-center justify-center bg-surface-50 dark:bg-gray-900">
          <Loader2 className="h-8 w-8 text-text-tertiary animate-spin" />
        </div>
      ) : thumbnailUrl ? (
        <img
          src={thumbnailUrl}
          alt={`Page ${pageNumber}`}
          className="w-full h-full object-contain"
          style={{ transform: `rotate(${rotation}deg)` }}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-surface-50 dark:bg-gray-900">
          <div className="text-center text-xs text-text-tertiary">
            Page {pageNumber}
          </div>
        </div>
      )}

      {/* Page number label */}
      <div className={cn(
        'absolute bottom-0 left-0 right-0 bg-surface-50/95 dark:bg-gray-900/95 backdrop-blur-sm py-1 text-center text-xs font-medium border-t border-border-light',
        selected ? 'text-accent-700 dark:text-accent-500' : 'text-text-primary'
      )}>
        {pageNumber}
      </div>

      {/* Selection indicator */}
      {selected && (
        <div className="absolute top-3 right-3 flex h-7 w-7 items-center justify-center rounded-full bg-accent-500 text-white shadow-md">
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
          className="absolute top-3 left-3 flex h-8 w-8 items-center justify-center rounded-lg bg-background/95 text-text-secondary opacity-0 backdrop-blur-sm transition-opacity hover:text-accent-600 group-hover:opacity-100 shadow-sm"
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
