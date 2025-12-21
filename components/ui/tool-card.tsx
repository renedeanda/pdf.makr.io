'use client';

import Link from 'next/link';
import { LucideIcon, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ToolCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  href: string;
  className?: string;
  experimental?: boolean;
}

export function ToolCard({
  icon: Icon,
  title,
  description,
  href,
  className,
  experimental = false,
}: ToolCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        'bg-card group relative overflow-hidden rounded-xl border border-border-medium p-6',
        'transition-all duration-300 ease-out',
        'hover:scale-[1.02] hover:shadow-xl hover:shadow-accent-500/10 hover:border-accent-500/50 hover:-translate-y-0.5',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2',
        'active:scale-[0.98]',
        className
      )}
    >
      {/* Subtle gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-accent-50/50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:from-accent-900/10" />

      {/* Icon with warm orange background and animation */}
      <div className="relative flex h-14 w-14 items-center justify-center rounded-lg bg-accent-50 dark:bg-accent-100/10 transition-all duration-300 group-hover:bg-accent-100 dark:group-hover:bg-accent-100/20 group-hover:scale-110 group-hover:rotate-3">
        <Icon className="h-7 w-7 text-accent-600 dark:text-accent-500 transition-transform duration-300 group-hover:scale-110" />
      </div>

      {/* Experimental Badge */}
      {experimental && (
        <div className="absolute top-3 right-3 px-2 py-1 text-xs font-semibold rounded-md bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
          EXPERIMENTAL
        </div>
      )}

      {/* Content */}
      <div className="relative mt-4">
        <h3 className="text-lg font-semibold text-text-primary group-hover:text-accent-600 dark:group-hover:text-accent-500 transition-colors duration-200 flex items-center gap-2">
          {title}
          <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0" />
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-text-secondary transition-colors duration-200 group-hover:text-text-primary/80">
          {description}
        </p>
      </div>

      {/* Shimmer effect on hover */}
      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
    </Link>
  );
}
