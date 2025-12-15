'use client';

import { useState, useEffect, useCallback } from 'react';
import { PageThumbnail } from './page-thumbnail';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PageSelectorProps {
  pdfUrl: string;
  totalPages: number;
  selectedPages: number[];
  onSelectionChange: (pages: number[]) => void;
  mode?: 'select' | 'rotate' | 'delete';
  rotations?: Map<number, number>;
  onRotate?: (pageNumber: number) => void;
  className?: string;
}

export function PageSelector({
  pdfUrl,
  totalPages,
  selectedPages,
  onSelectionChange,
  mode = 'select',
  rotations = new Map(),
  onRotate,
  className,
}: PageSelectorProps) {
  const [lastClicked, setLastClicked] = useState<number | null>(null);

  const handlePageClick = useCallback(
    (pageNumber: number, event?: React.MouseEvent) => {
      const isSelected = selectedPages.includes(pageNumber);

      if (event?.shiftKey && lastClicked !== null) {
        // Shift+click for range selection
        const start = Math.min(lastClicked, pageNumber);
        const end = Math.max(lastClicked, pageNumber);
        const range = Array.from({ length: end - start + 1 }, (_, i) => start + i);

        const newSelection = Array.from(new Set([...selectedPages, ...range]));
        onSelectionChange(newSelection);
      } else if (event?.ctrlKey || event?.metaKey) {
        // Ctrl/Cmd+click for multi-select
        if (isSelected) {
          onSelectionChange(selectedPages.filter((p) => p !== pageNumber));
        } else {
          onSelectionChange([...selectedPages, pageNumber]);
        }
      } else {
        // Regular click toggles selection
        if (isSelected) {
          onSelectionChange(selectedPages.filter((p) => p !== pageNumber));
        } else {
          onSelectionChange([...selectedPages, pageNumber]);
        }
      }

      setLastClicked(pageNumber);
    },
    [selectedPages, onSelectionChange, lastClicked]
  );

  const selectAll = () => {
    onSelectionChange(Array.from({ length: totalPages }, (_, i) => i + 1));
  };

  const selectNone = () => {
    onSelectionChange([]);
  };

  const selectOdd = () => {
    onSelectionChange(
      Array.from({ length: totalPages }, (_, i) => i + 1).filter((p) => p % 2 === 1)
    );
  };

  const selectEven = () => {
    onSelectionChange(
      Array.from({ length: totalPages }, (_, i) => i + 1).filter((p) => p % 2 === 0)
    );
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Selection controls */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-text-secondary mr-2">
          {selectedPages.length} of {totalPages} pages selected
        </span>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={selectAll}>
            All
          </Button>
          <Button variant="ghost" size="sm" onClick={selectNone}>
            None
          </Button>
          <Button variant="ghost" size="sm" onClick={selectOdd}>
            Odd
          </Button>
          <Button variant="ghost" size="sm" onClick={selectEven}>
            Even
          </Button>
        </div>
      </div>

      {/* Page grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => (
          <PageThumbnail
            key={pageNumber}
            pdfUrl={pdfUrl}
            pageNumber={pageNumber}
            selected={selectedPages.includes(pageNumber)}
            onClick={() => handlePageClick(pageNumber)}
            rotation={rotations.get(pageNumber) || 0}
            onRotate={mode === 'rotate' ? () => onRotate?.(pageNumber) : undefined}
            showRotateButton={mode === 'rotate'}
          />
        ))}
      </div>

      {/* Help text */}
      <p className="text-xs text-text-tertiary">
        Tip: Hold Shift to select a range, or Ctrl/Cmd to select multiple pages
      </p>
    </div>
  );
}
