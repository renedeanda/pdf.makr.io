'use client';

import { useState, useCallback } from 'react';
import { ArrowUpDown, Download, ArrowLeft, MoveUp, MoveDown, X } from 'lucide-react';
import Link from 'next/link';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button, UploadZone, ProgressBar, Alert } from '@/components/ui';
import { formatFileSize } from '@/lib/utils';

interface Progress {
  current: number;
  total: number;
  percentage: number;
  status: string;
}

interface PageThumbnail {
  pageNumber: number;
  dataUrl: string;
  width: number;
  height: number;
}

interface SortablePageProps {
  page: PageThumbnail;
  index: number;
  totalPages: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
}

function SortablePage({
  page,
  index,
  totalPages,
  onMoveUp,
  onMoveDown,
  onDelete,
}: SortablePageProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `page-${page.pageNumber}`,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      {/* Thumbnail - Entire area is draggable on mobile */}
      <div
        {...attributes}
        {...listeners}
        className="border-2 border-border-medium rounded-lg overflow-hidden bg-white dark:bg-gray-900 hover:border-accent-500 transition-colors cursor-grab active:cursor-grabbing touch-none"
      >
        {/* Drag Handle Indicator - Desktop only */}
        <div className="hidden md:block absolute top-2 left-2 z-10 p-2 rounded-lg bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <ArrowUpDown className="h-4 w-4" />
        </div>

        <img
          src={page.dataUrl}
          alt={`Page ${index + 1}`}
          className="w-full h-auto pointer-events-none"
        />
        <div className="p-2 text-center text-sm font-medium text-text-primary bg-surface-50 dark:bg-gray-800">
          Page {index + 1}
        </div>
      </div>

      {/* Delete Button - Fixed positioning outside drag area */}
      <button
        onClick={onDelete}
        className="absolute -top-2 -right-2 z-20 p-2 rounded-full bg-red-500 text-white shadow-lg hover:bg-red-600 active:bg-red-700"
        title="Delete page"
      >
        <X className="h-4 w-4" />
      </button>

      {/* Quick Move Buttons - Desktop only on hover */}
      <div className="hidden md:flex absolute bottom-2 left-2 z-10 gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {index > 0 && (
          <button
            onClick={onMoveUp}
            className="p-1.5 rounded bg-black/70 text-white hover:bg-black/80 active:bg-black"
            title="Move up"
          >
            <MoveUp className="h-3 w-3" />
          </button>
        )}
        {index < totalPages - 1 && (
          <button
            onClick={onMoveDown}
            className="p-1.5 rounded bg-black/70 text-white hover:bg-black/80 active:bg-black"
            title="Move down"
          >
            <MoveDown className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
}

export default function OrganizeClient() {
  const [file, setFile] = useState<File | null>(null);
  const [thumbnails, setThumbnails] = useState<PageThumbnail[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [complete, setComplete] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleFileDrop = useCallback(async (files: File[]) => {
    const droppedFile = files[0];
    if (!droppedFile || droppedFile.type !== 'application/pdf') {
      setError('Please upload a PDF file');
      return;
    }

    setFile(droppedFile);
    setLoading(true);
    setError(null);
    setComplete(false);

    try {
      const { generateThumbnails } = await import('@/lib/pdf/thumbnails');
      const thumbs = await generateThumbnails(droppedFile, 200, (p) => setProgress(p));
      setThumbnails(thumbs);
    } catch (err) {
      setError('Failed to load PDF thumbnails');
    } finally {
      setLoading(false);
      setProgress(null);
    }
  }, []);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setThumbnails((items) => {
        const oldIndex = items.findIndex((item) => `page-${item.pageNumber}` === active.id);
        const newIndex = items.findIndex((item) => `page-${item.pageNumber}` === over.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleMoveUp = (index: number) => {
    if (index > 0) {
      setThumbnails((items) => arrayMove(items, index, index - 1));
    }
  };

  const handleMoveDown = (index: number) => {
    if (index < thumbnails.length - 1) {
      setThumbnails((items) => arrayMove(items, index, index + 1));
    }
  };

  const handleDelete = (index: number) => {
    setThumbnails((items) => items.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!file || thumbnails.length === 0) return;

    setProcessing(true);
    setProgress(null);
    setError(null);

    try {
      const { reorderPages } = await import('@/lib/pdf/enhance');
      const { downloadPDF } = await import('@/lib/pdf/utils');

      // Create page order array (1-indexed)
      const pageOrder = thumbnails.map((t) => t.pageNumber);

      const result = await reorderPages(file, pageOrder, (p) => setProgress(p));

      const filename = file.name.replace('.pdf', '_organized.pdf');
      downloadPDF(result, filename);
      setComplete(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to organize pages');
    } finally {
      setProcessing(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setThumbnails([]);
    setProgress(null);
    setComplete(false);
    setError(null);
  };

  return (
    <div className="mx-auto max-w-6xl px-6 lg:px-8 py-12">
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
            <ArrowUpDown className="h-7 w-7 text-accent-600 dark:text-accent-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-text-primary">Organize Pages</h1>
            <p className="mt-1 text-text-secondary">
              Reorder and organize pages in your PDF with drag-and-drop
            </p>
          </div>
        </div>
      </div>

      {/* Privacy Alert */}
      <Alert variant="privacy" className="mb-6">
        <p className="font-medium">Your files never leave your device</p>
        <p className="text-sm mt-1 opacity-90">
          All page organization happens in your browser. No uploads, no servers.
        </p>
      </Alert>

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
          <h2 className="text-xl font-semibold text-text-primary mb-2">Pages Organized!</h2>
          <p className="text-text-secondary mb-6">
            Your PDF has been downloaded with the new page order.
          </p>
          <Button variant="secondary" onClick={handleReset}>
            Organize Another PDF
          </Button>
        </div>
      )}

      {/* Processing State */}
      {processing && (
        <div className="rounded-xl border border-border-medium bg-surface-50 p-8">
          <h2 className="text-lg font-semibold text-text-primary mb-4 text-center">
            Creating Organized PDF...
          </h2>
          <ProgressBar
            progress={progress?.percentage ?? 0}
            status={progress?.status ?? 'Starting...'}
          />
        </div>
      )}

      {/* Loading Thumbnails */}
      {loading && (
        <div className="rounded-xl border border-border-medium bg-surface-50 p-8">
          <h2 className="text-lg font-semibold text-text-primary mb-4 text-center">
            Loading Pages...
          </h2>
          <ProgressBar
            progress={progress?.percentage ?? 0}
            status={progress?.status ?? 'Starting...'}
          />
        </div>
      )}

      {/* Upload State */}
      {!file && !loading && !processing && !complete && (
        <UploadZone onDrop={handleFileDrop} multiple={false} fileType="pdf" />
      )}

      {/* Organize State */}
      {file && thumbnails.length > 0 && !loading && !processing && !complete && (
        <div className="space-y-6">
          {/* File Info & Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg border border-border-medium bg-surface-50">
            <div className="min-w-0 flex-1">
              <p className="font-medium text-text-primary truncate">{file.name}</p>
              <p className="text-sm text-text-secondary">
                {thumbnails.length} pages • {formatFileSize(file.size)}
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button variant="ghost" onClick={handleReset}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                <Download className="h-5 w-5 mr-2" />
                Save PDF
              </Button>
            </div>
          </div>

          {/* Instructions */}
          <Alert variant="info">
            <p className="font-medium">Drag pages to reorder them</p>
            <p className="text-sm mt-1 opacity-90">
              Touch and drag thumbnails on mobile, or use the delete button to remove pages. On desktop, hover for quick move actions.
            </p>
          </Alert>

          {/* Pages Grid */}
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext
              items={thumbnails.map((t) => `page-${t.pageNumber}`)}
              strategy={verticalListSortingStrategy}
            >
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {thumbnails.map((thumbnail, index) => (
                  <SortablePage
                    key={`page-${thumbnail.pageNumber}`}
                    page={thumbnail}
                    index={index}
                    totalPages={thumbnails.length}
                    onMoveUp={() => handleMoveUp(index)}
                    onMoveDown={() => handleMoveDown(index)}
                    onDelete={() => handleDelete(index)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}
    </div>
  );
}
