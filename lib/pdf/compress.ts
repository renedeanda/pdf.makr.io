import { PDFDocument } from 'pdf-lib';
import { PerformanceMonitor, MemoryManager } from '@/lib/performance';

export type CompressionLevel = 'low' | 'medium' | 'high';

export interface CompressionProgress {
  current: number;
  total: number;
  percentage: number;
  status: string;
}

export interface CompressionResult {
  data: Uint8Array;
  originalSize: number;
  compressedSize: number;
  savings: number;
  savingsPercent: number;
}

const qualitySettings: Record<CompressionLevel, number> = {
  low: 0.9,    // 90% quality - minimal compression
  medium: 0.7, // 70% quality - balanced
  high: 0.5,   // 50% quality - maximum compression
};

// Helper to detect mobile devices
function isMobileDevice() {
  if (typeof navigator === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Helper to get pdfjs with worker configured
async function getPdfjsLib() {
  const pdfjsLib = await import('pdfjs-dist');
  if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
  }
  return pdfjsLib;
}

export async function compressPDF(
  file: File,
  level: CompressionLevel = 'medium',
  onProgress?: (progress: CompressionProgress) => void
): Promise<CompressionResult> {
  const perfMonitor = new PerformanceMonitor();

  try {
    console.log('Starting PDF compression...', { fileSize: file.size, level });

    // Check memory availability
    if (!MemoryManager.checkMemoryAvailable()) {
      console.warn('Low memory detected, processing may be slow');
    }

    const pdfjsLib = await getPdfjsLib();
    const originalSize = file.size;
    const quality = qualitySettings[level];
    const isMobile = isMobileDevice();

    // Use lower scale on mobile to reduce memory usage
    const renderScale = isMobile ? 1.5 : 2;
    console.log('Device type:', isMobile ? 'mobile' : 'desktop', 'Scale:', renderScale);

    onProgress?.({
      current: 0,
      total: 1,
      percentage: 5,
      status: 'Loading PDF...',
    });

    const arrayBuffer = await file.arrayBuffer();
    console.log('PDF loaded into memory');

    const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });

    onProgress?.({
      current: 0,
      total: 1,
      percentage: 10,
      status: 'Preparing to compress...',
    });

    // Get the PDF.js document for rendering
    const pdfJsDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const totalPages = pdfJsDoc.numPages;
    console.log('PDF has', totalPages, 'pages');

    // Start performance monitoring
    perfMonitor.start(`compress-pdf-${level}`, originalSize, totalPages);

    // Create new optimized PDF
    const newPdf = await PDFDocument.create();

    for (let i = 1; i <= totalPages; i++) {
      const baseProgress = 10 + Math.round(((i - 1) / totalPages) * 85);

      onProgress?.({
        current: i,
        total: totalPages,
        percentage: baseProgress,
        status: `Processing page ${i} of ${totalPages}`,
      });

      console.log(`Processing page ${i}/${totalPages}`);

      // Get original page dimensions
      const originalPage = pdfDoc.getPages()[i - 1];
      const { width, height } = originalPage.getSize();

      // Render page to canvas
      const page = await pdfJsDoc.getPage(i);
      const viewport = page.getViewport({ scale: renderScale });

      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      const context = canvas.getContext('2d');
      if (!context) throw new Error('Could not get canvas context');

      // White background
      context.fillStyle = 'white';
      context.fillRect(0, 0, canvas.width, canvas.height);

      await page.render({
        canvasContext: context,
        viewport,
        canvas,
      }).promise;

      // Convert to compressed JPEG
      const imageDataUrl = canvas.toDataURL('image/jpeg', quality);
      const imageData = await fetch(imageDataUrl).then(r => r.arrayBuffer());

      // Embed image in new PDF
      const jpgImage = await newPdf.embedJpg(imageData);
      const newPage = newPdf.addPage([width, height]);

      newPage.drawImage(jpgImage, {
        x: 0,
        y: 0,
        width: width,
        height: height,
      });

      // Clean up
      canvas.remove();

      // Yield to main thread to allow UI updates (critical for mobile)
      await new Promise(resolve => setTimeout(resolve, 0));
    }

    onProgress?.({
      current: totalPages,
      total: totalPages,
      percentage: 95,
      status: 'Finalizing compressed PDF...',
    });

    console.log('Saving compressed PDF...');

    // Save with optimization
    const compressedData = await newPdf.save({
      useObjectStreams: true,
    });

    const compressedSize = compressedData.length;
    const savings = originalSize - compressedSize;
    const savingsPercent = Math.round((savings / originalSize) * 100);

    console.log('Compression complete!', {
      originalSize,
      compressedSize,
      savingsPercent: savingsPercent + '%'
    });

    onProgress?.({
      current: totalPages,
      total: totalPages,
      percentage: 100,
      status: 'Complete!',
    });

    // Log performance metrics
    perfMonitor.end(true);

    return {
      data: compressedData,
      originalSize,
      compressedSize,
      savings,
      savingsPercent: Math.max(0, savingsPercent),
    };
  } catch (error) {
    console.error('Compression error:', error);

    // Log failed performance metrics
    perfMonitor.end(false, error instanceof Error ? error.message : 'Unknown error');

    throw new Error(
      error instanceof Error
        ? `Compression failed: ${error.message}`
        : 'Failed to compress PDF. The file may be too large or corrupted.'
    );
  }
}
