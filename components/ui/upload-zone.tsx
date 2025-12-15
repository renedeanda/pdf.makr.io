'use client';

import { useCallback } from 'react';
import { useDropzone, Accept } from 'react-dropzone';
import { Upload, FileText, Image } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UploadZoneProps {
  accept?: Accept;
  multiple?: boolean;
  maxFiles?: number;
  maxSize?: number;
  onDrop: (files: File[]) => void;
  disabled?: boolean;
  className?: string;
  fileType?: 'pdf' | 'image' | 'any';
}

export function UploadZone({
  accept,
  multiple = true,
  maxFiles = 100,
  maxSize = 100 * 1024 * 1024, // 100MB
  onDrop,
  disabled = false,
  className,
  fileType = 'pdf',
}: UploadZoneProps) {
  const handleDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onDrop(acceptedFiles);
      }
    },
    [onDrop]
  );

  const defaultAccept: Accept = fileType === 'pdf'
    ? { 'application/pdf': ['.pdf'] }
    : fileType === 'image'
    ? { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] }
    : {};

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop: handleDrop,
    accept: accept || defaultAccept,
    multiple,
    maxFiles,
    maxSize,
    disabled,
  });

  const Icon = fileType === 'image' ? Image : FileText;

  return (
    <div
      {...getRootProps()}
      className={cn(
        'relative rounded-2xl border-2 border-dashed p-12 text-center transition-all cursor-pointer',
        isDragActive && !isDragReject && 'border-accent-500 bg-accent-50',
        isDragReject && 'border-error bg-red-50',
        !isDragActive && !isDragReject && 'border-border-medium bg-surface-50 hover:border-accent-500/50 hover:bg-accent-50/30',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <input {...getInputProps()} />

      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-xl bg-accent-50 dark:bg-accent-100/10">
        {isDragActive ? (
          <Upload className="h-8 w-8 text-accent-600 dark:text-accent-500 animate-bounce" />
        ) : (
          <Icon className="h-8 w-8 text-accent-600 dark:text-accent-500" />
        )}
      </div>

      <p className="mt-6 text-base font-medium text-text-primary">
        {isDragActive
          ? isDragReject
            ? 'Invalid file type'
            : 'Drop files here'
          : `Drop ${fileType === 'pdf' ? 'PDFs' : fileType === 'image' ? 'images' : 'files'} here or click to browse`}
      </p>

      <p className="mt-2 text-sm text-text-secondary">
        {multiple
          ? `Supports multiple files up to ${Math.round(maxSize / (1024 * 1024))}MB each`
          : `Maximum file size: ${Math.round(maxSize / (1024 * 1024))}MB`}
      </p>

      {fileType === 'pdf' && (
        <p className="mt-4 text-xs text-text-tertiary">
          Your files are processed locally and never uploaded to any server
        </p>
      )}
    </div>
  );
}
