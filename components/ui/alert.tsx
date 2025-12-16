'use client';

import { ReactNode } from 'react';
import { Shield, CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AlertProps {
  variant?: 'info' | 'success' | 'warning' | 'error' | 'privacy';
  title?: string;
  children: ReactNode;
  className?: string;
  onDismiss?: () => void;
}

export function Alert({
  variant = 'info',
  title,
  children,
  className,
  onDismiss,
}: AlertProps) {
  const icons = {
    info: Info,
    success: CheckCircle,
    warning: AlertCircle,
    error: AlertCircle,
    privacy: Shield,
  };

  const styles = {
    info: 'border border-blue-200 bg-blue-50 dark:border-info/30 dark:bg-blue-950/20',
    success: 'border border-green-200 bg-green-50 dark:border-success/30 dark:bg-green-950/20',
    warning: 'border border-amber-200 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-950/20',
    error: 'border border-red-200 bg-red-50 dark:border-error/30 dark:bg-red-950/20',
    privacy: 'border border-accent-200 bg-accent-50 dark:border-accent-500/30 dark:bg-accent-50/10',
  };

  const iconStyles = {
    info: 'text-blue-600 dark:text-blue-400',
    success: 'text-green-600 dark:text-green-400',
    warning: 'text-amber-600 dark:text-amber-400',
    error: 'text-red-600 dark:text-red-400',
    privacy: 'text-accent-600 dark:text-accent-500',
  };

  const textStyles = {
    info: 'text-blue-900 dark:text-blue-100',
    success: 'text-green-900 dark:text-green-100',
    warning: 'text-amber-900 dark:text-amber-100',
    error: 'text-red-900 dark:text-red-100',
    privacy: 'text-accent-900 dark:text-accent-100',
  };

  const descStyles = {
    info: 'text-blue-800 dark:text-blue-300',
    success: 'text-green-800 dark:text-green-300',
    warning: 'text-amber-800 dark:text-amber-300',
    error: 'text-red-800 dark:text-red-300',
    privacy: 'text-accent-700 dark:text-accent-300',
  };

  const Icon = icons[variant];

  return (
    <div className={cn('rounded-xl border p-4', styles[variant], className)}>
      <div className="flex gap-3">
        <Icon className={cn('h-5 w-5 flex-shrink-0 mt-0.5', iconStyles[variant])} />
        <div className="flex-1 text-sm">
          {title && (
            <p className={cn('font-medium', textStyles[variant])}>{title}</p>
          )}
          <div className={cn(title ? 'mt-1' : '', descStyles[variant])}>
            {children}
          </div>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className={cn('h-5 w-5 flex-shrink-0 hover:opacity-70', iconStyles[variant])}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
