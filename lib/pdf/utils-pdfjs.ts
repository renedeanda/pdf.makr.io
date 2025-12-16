// PDF.js configuration and utilities

/**
 * Detect iOS Safari browser
 */
function isIOSSafari(): boolean {
  if (typeof navigator === 'undefined') return false;

  const ua = navigator.userAgent;
  const iOS = /iPad|iPhone|iPod/.test(ua);
  const webkit = /WebKit/.test(ua);
  const notChrome = !/CriOS|Chrome/.test(ua);

  return iOS && webkit && notChrome;
}

/**
 * Get the appropriate PDF.js worker URL based on browser
 */
function getWorkerUrl(): string {
  // Use legacy worker for iOS Safari for better compatibility
  if (isIOSSafari()) {
    return '/pdf.worker.legacy.min.mjs';
  }

  // Use modern worker for other browsers
  return '/pdf.worker.min.mjs';
}

/**
 * Configure and return PDF.js library with worker
 */
export async function getPdfjsLib() {
  const pdfjsLib = await import('pdfjs-dist');

  // Only set worker if not already configured
  if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
    // Use local worker file instead of CDN to avoid COEP/COOP issues
    pdfjsLib.GlobalWorkerOptions.workerSrc = getWorkerUrl();

    console.log('[PDF.js] Using worker:', pdfjsLib.GlobalWorkerOptions.workerSrc);
  }

  return pdfjsLib;
}

/**
 * Check if browser supports required features for PDF processing
 */
export function checkBrowserSupport(): {
  supported: boolean;
  message?: string;
} {
  if (typeof window === 'undefined') {
    return { supported: false, message: 'Server-side rendering not supported' };
  }

  // Check for required APIs
  if (!window.Worker) {
    return { supported: false, message: 'Web Workers not supported in this browser' };
  }

  if (!window.OffscreenCanvas && !document.createElement('canvas').getContext) {
    return { supported: false, message: 'Canvas API not supported in this browser' };
  }

  return { supported: true };
}
