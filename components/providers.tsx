'use client';

import { ThemeProvider } from 'next-themes';
import { ReactNode } from 'react';
import { KeyboardShortcutsModal } from './ui/keyboard-shortcuts-modal';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
      <KeyboardShortcutsModal />
    </ThemeProvider>
  );
}
