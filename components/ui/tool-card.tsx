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
}

export function ToolCard({
  icon: Icon,
  title,
  description,
  href,
  className,
}: ToolCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        'group relative overflow-hidden rounded-xl border border-border-medium bg-white dark:bg-surface-50 p-6 transition-all hover:shadow-lg hover:shadow-accent-500/10 hover:border-accent-500/30',
        className
      )}
    >
      {/* Icon with warm orange background */}
      <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-accent-50 dark:bg-accent-100/10 transition-colors group-hover:bg-accent-100 dark:group-hover:bg-accent-100/20">
        <Icon className="h-7 w-7 text-accent-600 dark:text-accent-500" />
      </div>

      {/* Content */}
      <div className="mt-4">
        <h3 className="text-lg font-semibold text-text-primary group-hover:text-accent-600 dark:group-hover:text-accent-500 transition-colors">
          {title}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-text-secondary">
          {description}
        </p>
      </div>

      {/* Arrow indicator on hover */}
      <div className="absolute right-6 top-6 opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-0 -translate-x-2">
        <ArrowRight className="h-5 w-5 text-accent-500" />
      </div>
    </Link>
  );
}
