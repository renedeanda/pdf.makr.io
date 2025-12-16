'use client';

import { Check, RotateCw, FileText } from 'lucide-react';
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

  return (
    <div
      onClick={onClick}
      className={cn(
        'group relative aspect-[1/1.4] overflow-hidden rounded-lg border-2 shadow-sm transition-all cursor-pointer',
        selected
          ? 'border-accent-500 ring-2 ring-accent-500/20 bg-accent-50 dark:bg-accent-950/20'
          : 'border-border-medium hover:border-accent-500/50 bg-surface-50 hover:bg-surface-100',
        className
      )}
      style={{ transform: `rotate(${rotation}deg)` }}
    >
      {/* Simple page icon design */}
      <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
        <FileText
          className={cn(
            'h-12 w-12 transition-colors',
            selected ? 'text-accent-600' : 'text-text-tertiary group-hover:text-accent-500'
          )}
        />
        <div className={cn(
          'absolute bottom-3 left-0 right-0 text-center text-xs font-medium transition-colors',
          selected ? 'text-accent-700 dark:text-accent-500' : 'text-text-tertiary'
        )}>
          {pageNumber}
        </div>
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
