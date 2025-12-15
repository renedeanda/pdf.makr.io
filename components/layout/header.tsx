'use client';

import Link from 'next/link';
import { FileText, Moon, Sun, Github } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export function Header() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-border-light bg-background/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-500 transition-transform group-hover:scale-105">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-semibold text-text-primary">
              pdf.makr.io
            </span>
          </Link>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* GitHub link */}
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-text-secondary hover:bg-surface-100 hover:text-text-primary transition-colors"
              aria-label="GitHub"
            >
              <Github className="h-5 w-5" />
            </a>

            {/* Theme toggle */}
            {mounted && (
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-text-secondary hover:bg-surface-100 hover:text-text-primary transition-colors"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
