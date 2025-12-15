'use client';

import { FileText, X, GripVertical } from 'lucide-react';
import { cn, formatFileSize } from '@/lib/utils';

interface FileCardProps {
  name: string;
  size: number;
  pageCount?: number;
  thumbnail?: string;
  onRemove?: () => void;
  draggable?: boolean;
  className?: string;
}

export function FileCard({
  name,
  size,
  pageCount,
  thumbnail,
  onRemove,
  draggable = false,
  className,
}: FileCardProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-4 rounded-lg border border-border-medium bg-white dark:bg-surface-50 p-4 transition-all hover:border-accent-500/30',
        draggable && 'cursor-grab active:cursor-grabbing',
        className
      )}
    >
      {draggable && (
        <GripVertical className="h-5 w-5 text-text-tertiary flex-shrink-0" />
      )}

      {/* Thumbnail or icon */}
      <div className="h-12 w-10 flex-shrink-0 rounded bg-surface-100 flex items-center justify-center overflow-hidden">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={name}
            className="h-full w-full object-cover"
          />
        ) : (
          <FileText className="h-6 w-6 text-accent-600 dark:text-accent-500" />
        )}
      </div>

      {/* File info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-text-primary truncate">{name}</p>
        <p className="text-sm text-text-secondary">
          {pageCount !== undefined && `${pageCount} ${pageCount === 1 ? 'page' : 'pages'} • `}
          {formatFileSize(size)}
        </p>
      </div>

      {/* Remove button */}
      {onRemove && (
        <button
          onClick={onRemove}
          className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-surface-100 text-text-tertiary hover:text-error transition-colors"
          aria-label="Remove file"
        >
          <X className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
