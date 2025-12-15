'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  progress: number;
  status?: string;
  className?: string;
  showPercentage?: boolean;
}

export function ProgressBar({
  progress,
  status,
  className,
  showPercentage = true,
}: ProgressBarProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {(status || showPercentage) && (
        <div className="flex justify-between text-sm">
          {status && (
            <span className="font-medium text-text-primary">{status}</span>
          )}
          {showPercentage && (
            <span className="text-text-secondary">{Math.round(progress)}%</span>
          )}
        </div>
      )}

      <div className="h-2 overflow-hidden rounded-full bg-surface-200">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-accent-500 to-accent-600"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}
