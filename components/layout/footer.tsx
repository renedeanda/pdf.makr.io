'use client';

import Link from 'next/link';
import { Shield, Heart, Github } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-border-light bg-surface-50">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <h3 className="font-semibold text-text-primary">pdf.makr.io</h3>
            <p className="mt-2 text-sm text-text-secondary leading-relaxed max-w-md">
              Free, privacy-first PDF tools that work entirely in your browser.
              No uploads, no tracking, no limits.
            </p>
            <div className="mt-4 flex items-center gap-2 text-sm text-text-secondary">
              <Shield className="h-4 w-4 text-accent-500" />
              <span>Your files never leave your device</span>
            </div>
          </div>

          {/* Tools */}
          <div>
            <h4 className="font-medium text-text-primary mb-3">Popular Tools</h4>
            <ul className="space-y-2">
              {[
                { name: 'Merge PDFs', href: '/merge' },
                { name: 'Split PDF', href: '/split' },
                { name: 'Compress PDF', href: '/compress' },
                { name: 'PDF to Images', href: '/pdf-to-images' },
              ].map((tool) => (
                <li key={tool.href}>
                  <Link
                    href={tool.href}
                    className="text-sm text-text-secondary hover:text-accent-600 transition-colors"
                  >
                    {tool.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* More Tools */}
          <div>
            <h4 className="font-medium text-text-primary mb-3">More Tools</h4>
            <ul className="space-y-2">
              {[
                { name: 'Images to PDF', href: '/images-to-pdf' },
                { name: 'Rotate Pages', href: '/rotate' },
                { name: 'Delete Pages', href: '/delete' },
              ].map((tool) => (
                <li key={tool.href}>
                  <Link
                    href={tool.href}
                    className="text-sm text-text-secondary hover:text-accent-600 transition-colors"
                  >
                    {tool.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-6 border-t border-border-light flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
            <p className="text-sm text-text-tertiary">
              {new Date().getFullYear()} pdf.makr.io. All rights reserved.
            </p>
            <a
              href="https://makr.io?utm_source=pdf.makr.io&utm_medium=footer&utm_campaign=project_link"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-text-tertiary hover:text-accent-600 transition-colors"
            >
              A makr.io project.
            </a>
          </div>
          <div className="flex items-center gap-4">
            <p className="text-sm text-text-tertiary flex items-center gap-1">
              Made with <Heart className="h-4 w-4 text-accent-500" /> for everyone
            </p>
            <a
              href="https://github.com/renedeanda/pdf.makr.io"
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-tertiary hover:text-accent-600 transition-colors"
              aria-label="View source on GitHub"
            >
              <Github className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
