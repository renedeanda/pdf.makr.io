'use client';

import { useState, useEffect } from 'react';
import { Monitor, Smartphone, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { Button } from './button';
import { Alert } from './alert';

interface MobileBlockedMessageProps {
  toolName: string;
  children: React.ReactNode;
}

export function MobileBlockedMessage({ toolName, children }: MobileBlockedMessageProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const checkMobile = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
      const isSmallScreen = window.innerWidth < 768;
      setIsMobile(isMobileDevice || isSmallScreen);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!mounted) {
    return <div className="min-h-[400px] flex items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-500 border-t-transparent" />
    </div>;
  }

  if (isMobile) {
    return (
      <div className="mx-auto max-w-2xl px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-900/20 mb-4">
            <Monitor className="h-10 w-10 text-amber-600 dark:text-amber-500" />
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-text-primary mb-2">
            Desktop Required
          </h1>
          <p className="text-text-secondary">
            {toolName} requires a desktop computer
          </p>
        </div>

        <Alert variant="warning" className="mb-6">
          <strong>Why this tool isn't available on mobile:</strong>{' '}
          {toolName} uses advanced PDF processing that requires significant memory and processing power.
          Mobile browsers have limitations that prevent these operations from working reliably.
        </Alert>

        <div className="bg-surface-100 dark:bg-surface-100 rounded-xl p-6 space-y-4 border border-border-medium">
          <h2 className="font-semibold text-text-primary flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-accent-600 dark:text-accent-500" />
            Try These Mobile-Friendly Tools Instead:
          </h2>
          <div className="grid gap-3">
            {[
              { name: 'Merge PDFs', href: '/merge' },
              { name: 'Split PDF', href: '/split' },
              { name: 'Rotate Pages', href: '/rotate' },
              { name: 'Delete Pages', href: '/delete' },
              { name: 'Add Watermark', href: '/watermark' },
            ].map((tool) => (
              <Link
                key={tool.href}
                href={tool.href}
                className="block p-3 rounded-lg border border-border-medium bg-white dark:bg-surface-50 hover:border-accent-500 hover:bg-accent-50 dark:hover:bg-accent-900/10 transition-all"
              >
                <span className="text-sm font-medium text-text-primary">{tool.name}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link href="/">
            <Button variant="secondary">
              View All Tools
            </Button>
          </Link>
        </div>

        <div className="mt-8 p-4 bg-blue-300 dark:bg-blue-950/20 rounded-lg border-2 border-blue-700 dark:border-blue-900/30">
          <p className="text-sm text-gray-900 dark:text-blue-100">
            <strong>Tip:</strong> You can access {toolName} from any desktop computer or laptop.
            Your files are processed locally in the browser, so your data stays private even on public computers.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
