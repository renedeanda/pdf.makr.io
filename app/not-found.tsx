'use client';

import Link from 'next/link';
import { Home, ArrowLeft, FileQuestion } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';

export default function NotFound() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6 py-24">
      <div className="text-center max-w-2xl mx-auto">
        {/* Animated 404 */}
        <div className="relative mb-8">
          <div className={`
            text-[120px] lg:text-[180px] font-bold text-accent-600/10 dark:text-accent-500/10
            transition-all duration-700 select-none
            ${mounted ? 'scale-100 opacity-100' : 'scale-75 opacity-0'}
          `}>
            404
          </div>

          {/* Floating PDF icon */}
          <div className={`
            absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
            transition-all duration-1000 delay-300
            ${mounted ? 'scale-100 rotate-0 opacity-100' : 'scale-50 rotate-45 opacity-0'}
          `}>
            <div className="relative">
              <div className="absolute inset-0 bg-accent-500/20 blur-2xl rounded-full" />
              <div className="relative bg-white dark:bg-surface-50 p-6 rounded-2xl shadow-xl border-2 border-accent-500/20">
                <FileQuestion className="h-16 w-16 text-accent-600 dark:text-accent-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Error message */}
        <h1 className={`
          text-3xl lg:text-4xl font-bold text-text-primary mb-4
          transition-all duration-700 delay-500
          ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}
        `}>
          Page Not Found
        </h1>

        <p className={`
          text-lg text-text-secondary mb-8 leading-relaxed
          transition-all duration-700 delay-700
          ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}
        `}>
          Oops! This page seems to have been split, merged, or deleted.{' '}
          <br className="hidden sm:block" />
          Let's get you back to our PDF tools.
        </p>

        {/* Action buttons */}
        <div className={`
          flex flex-col sm:flex-row gap-4 justify-center items-center
          transition-all duration-700 delay-1000
          ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}
        `}>
          <Link href="/">
            <Button size="lg" className="w-full sm:w-auto">
              <Home className="h-5 w-5 mr-2" />
              Back to Home
            </Button>
          </Link>

          <Button
            variant="ghost"
            size="lg"
            onClick={() => window.history.back()}
            className="w-full sm:w-auto"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Go Back
          </Button>
        </div>

        {/* Helpful links */}
        <div className={`
          mt-12 pt-8 border-t border-border-light
          transition-all duration-700 delay-1000
          ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}
        `}>
          <p className="text-sm text-text-tertiary mb-4">
            Looking for one of our tools?
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            {[
              { name: 'Merge PDF', href: '/merge' },
              { name: 'Split PDF', href: '/split' },
              { name: 'Compress', href: '/compress' },
              { name: 'Rotate', href: '/rotate' },
            ].map((tool) => (
              <Link
                key={tool.href}
                href={tool.href}
                className="text-sm text-accent-600 dark:text-accent-500 hover:underline"
              >
                {tool.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
