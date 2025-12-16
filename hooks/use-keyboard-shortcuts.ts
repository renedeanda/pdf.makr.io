import { useEffect, useCallback } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  meta?: boolean;
  action: () => void;
  description: string;
  preventDefault?: boolean;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[], enabled = true) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Don't trigger shortcuts when typing in input fields
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      for (const shortcut of shortcuts) {
        const ctrlMatch = shortcut.ctrl ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey;
        const altMatch = shortcut.alt ? event.altKey : !event.altKey;
        const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();

        if (ctrlMatch && altMatch && shiftMatch && keyMatch) {
          if (shortcut.preventDefault !== false) {
            event.preventDefault();
          }
          shortcut.action();
          break;
        }
      }
    },
    [shortcuts, enabled]
  );

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown, enabled]);
}

// Common shortcuts helpers
export const commonShortcuts = {
  escape: (handler: () => void): KeyboardShortcut => ({
    key: 'Escape',
    action: handler,
    description: 'Close modal/cancel',
  }),

  save: (handler: () => void): KeyboardShortcut => ({
    key: 's',
    ctrl: true,
    action: handler,
    description: 'Download/Save',
  }),

  open: (handler: () => void): KeyboardShortcut => ({
    key: 'o',
    ctrl: true,
    action: handler,
    description: 'Open file picker',
  }),

  delete: (handler: () => void): KeyboardShortcut => ({
    key: 'Delete',
    action: handler,
    description: 'Remove/Delete',
  }),

  backspace: (handler: () => void): KeyboardShortcut => ({
    key: 'Backspace',
    action: handler,
    description: 'Remove/Delete',
  }),

  enter: (handler: () => void, withCtrl = true): KeyboardShortcut => ({
    key: 'Enter',
    ctrl: withCtrl,
    action: handler,
    description: withCtrl ? 'Submit/Process' : 'Confirm',
  }),

  selectAll: (handler: () => void): KeyboardShortcut => ({
    key: 'a',
    ctrl: true,
    action: handler,
    description: 'Select all',
  }),

  deselectAll: (handler: () => void): KeyboardShortcut => ({
    key: 'd',
    ctrl: true,
    action: handler,
    description: 'Deselect all',
  }),
};
