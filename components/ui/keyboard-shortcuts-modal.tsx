'use client';

import { useState, useEffect } from 'react';
import { X, Command, Keyboard } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Shortcut {
  keys: string[];
  description: string;
  category?: string;
}

const shortcuts: Shortcut[] = [
  { keys: ['?'], description: 'Show keyboard shortcuts', category: 'General' },
  { keys: ['Esc'], description: 'Close modal/cancel operation', category: 'General' },
  { keys: ['/', 'Ctrl', 'K'], description: 'Quick search (coming soon)', category: 'Navigation' },
  { keys: ['1-9'], description: 'Navigate to tool 1-9', category: 'Navigation' },
  { keys: ['H'], description: 'Go to homepage', category: 'Navigation' },
  { keys: ['Ctrl', 'O'], description: 'Open file picker', category: 'File Operations' },
  { keys: ['Ctrl', 'S'], description: 'Download/Save result', category: 'File Operations' },
  { keys: ['Delete'], description: 'Remove selected file', category: 'File Operations' },
  { keys: ['Backspace'], description: 'Remove selected file', category: 'File Operations' },
  { keys: ['Ctrl', 'V'], description: 'Paste file (when available)', category: 'Actions' },
  { keys: ['Ctrl', 'Enter'], description: 'Submit/Process', category: 'Actions' },
  { keys: ['Ctrl', 'A'], description: 'Select all pages', category: 'Selection' },
  { keys: ['Ctrl', 'D'], description: 'Deselect all', category: 'Selection' },
  { keys: ['Shift', 'Click'], description: 'Range select', category: 'Selection' },
  { keys: ['Ctrl', 'Click'], description: 'Multi-select', category: 'Selection' },
];

export function KeyboardShortcutsModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMac, setIsMac] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Detect Mac
    setIsMac(navigator.platform.toLowerCase().includes('mac'));

    // Detect mobile devices - keyboard shortcuts aren't useful on mobile
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    const isSmallScreen = window.innerWidth < 768;
    setIsMobile(isMobileDevice || isSmallScreen);

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === '?' && !event.ctrlKey && !event.metaKey && !event.altKey) {
        event.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Don't render on mobile devices
  if (isMobile) {
    return null;
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 flex h-12 w-12 items-center justify-center rounded-full bg-accent-600 text-white shadow-lg hover:bg-accent-700 transition-all hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2 z-40"
        aria-label="Show keyboard shortcuts"
        title="Keyboard shortcuts (?)"
      >
        <Keyboard className="h-5 w-5" />
      </button>
    );
  }

  const formatKey = (key: string) => {
    if (isMac) {
      if (key === 'Ctrl') return '⌘';
      if (key === 'Alt') return '⌥';
      if (key === 'Shift') return '⇧';
    }
    return key;
  };

  const categories = Array.from(new Set(shortcuts.map((s) => s.category || 'Other')));

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-in fade-in duration-200"
        onClick={() => setIsOpen(false)}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="relative w-full max-w-2xl max-h-[80vh] overflow-auto bg-white dark:bg-surface-50 rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="sticky top-0 bg-white dark:bg-surface-50 border-b border-border-light p-6 flex items-center justify-between z-10">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-50 dark:bg-accent-100/10">
                <Keyboard className="h-5 w-5 text-accent-600 dark:text-accent-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-text-primary">Keyboard Shortcuts</h2>
                <p className="text-sm text-text-secondary">Navigate faster with these shortcuts</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-surface-100 dark:hover:bg-surface-100 text-text-secondary hover:text-text-primary transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {categories.map((category) => (
              <div key={category}>
                <h3 className="text-sm font-semibold text-text-tertiary uppercase tracking-wider mb-3">
                  {category}
                </h3>
                <div className="space-y-2">
                  {shortcuts
                    .filter((s) => (s.category || 'Other') === category)
                    .map((shortcut, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between gap-4 p-3 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-100 transition-colors"
                      >
                        <span className="text-sm text-text-secondary flex-1">
                          {shortcut.description}
                        </span>
                        <div className="flex gap-1">
                          {shortcut.keys.map((key, keyIndex) => (
                            <kbd
                              key={keyIndex}
                              className="px-2 py-1 text-xs font-semibold text-text-primary bg-surface-100 dark:bg-surface-100 border border-border-medium rounded shadow-sm min-w-[2rem] text-center"
                            >
                              {formatKey(key)}
                            </kbd>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-surface-50 dark:bg-surface-100 border-t border-border-light p-4 text-center">
            <p className="text-xs text-text-tertiary">
              Press <kbd className="px-1.5 py-0.5 text-xs font-semibold text-text-primary bg-surface-100 dark:bg-surface-50 border border-border-medium rounded">?</kbd> to toggle this dialog
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
