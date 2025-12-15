import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';

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

// Configure PDF.js worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

export async function compressPDF(
  file: File,
  level: CompressionLevel = 'medium',
  onProgress?: (progress: CompressionProgress) => void
): Promise<CompressionResult> {
  const originalSize = file.size;
  const quality = qualitySettings[level];

  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });

  // Get the PDF.js document for rendering
  const pdfJsDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const totalPages = pdfJsDoc.numPages;

  // Create new optimized PDF
  const newPdf = await PDFDocument.create();

  for (let i = 1; i <= totalPages; i++) {
    onProgress?.({
      current: i,
      total: totalPages,
      percentage: Math.round((i / totalPages) * 100),
      status: `Processing page ${i} of ${totalPages}`,
    });

    // Get original page dimensions
    const originalPage = pdfDoc.getPages()[i - 1];
    const { width, height } = originalPage.getSize();

    // Render page to canvas
    const page = await pdfJsDoc.getPage(i);
    const viewport = page.getViewport({ scale: 2 }); // Higher scale for better quality

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
  }

  // Save with optimization
  const compressedData = await newPdf.save({
    useObjectStreams: true,
  });

  const compressedSize = compressedData.length;
  const savings = originalSize - compressedSize;
  const savingsPercent = Math.round((savings / originalSize) * 100);

  return {
    data: compressedData,
    originalSize,
    compressedSize,
    savings,
    savingsPercent: Math.max(0, savingsPercent),
  };
}
