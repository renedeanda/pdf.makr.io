import { PDFDocument } from 'pdf-lib';
import { getPdfjsLib } from './utils-pdfjs';

export interface PDFAnalysis {
  pageCount: number;
  hasImages: boolean;
  estimatedImageRatio: number;
  isAlreadyOptimized: boolean;
  fileSize: number;
  averagePageSize: number;
  recommendation: {
    shouldCompress: boolean;
    reason: string;
    recommendedLevel?: 'low' | 'medium' | 'high';
    estimatedSavings?: number; // percentage
  };
}

/**
 * Analyze a PDF to determine if compression will help
 */
export async function analyzePDF(file: File): Promise<PDFAnalysis> {
  try {
    const arrayBuffer = await file.arrayBuffer();

    // Load with pdf-lib for structure analysis
    const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    const pageCount = pdfDoc.getPageCount();
    const fileSize = file.size;
    const averagePageSize = fileSize / pageCount;

    // Load with PDF.js for detailed analysis
    const pdfjsLib = await getPdfjsLib();
    const pdfJsDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    // Analyze first few pages to estimate compression potential
    const samplesToAnalyze = Math.min(3, pageCount);
    let totalImageData = 0;
    let hasImages = false;

    for (let i = 1; i <= samplesToAnalyze; i++) {
      const page = await pdfJsDoc.getPage(i);
      const viewport = page.getViewport({ scale: 1 });

      // Estimate image data size based on page dimensions
      const estimatedImageSize = viewport.width * viewport.height * 3; // RGB
      totalImageData += estimatedImageSize;

      // Check if page has images by looking at page size relative to dimensions
      const pageSize = fileSize / pageCount;
      const imageDensity = pageSize / estimatedImageSize;

      if (imageDensity > 0.01) { // Threshold for having significant image content
        hasImages = true;
      }
    }

    const estimatedImageRatio = totalImageData / (fileSize / samplesToAnalyze);

    // Heuristics to determine if PDF is already optimized
    const bytesPerPage = fileSize / pageCount;
    const isAlreadyOptimized = bytesPerPage < 100000; // Less than 100KB per page suggests optimization

    // Generate recommendation
    const recommendation = generateRecommendation(
      fileSize,
      pageCount,
      hasImages,
      isAlreadyOptimized,
      estimatedImageRatio
    );

    return {
      pageCount,
      hasImages,
      estimatedImageRatio,
      isAlreadyOptimized,
      fileSize,
      averagePageSize,
      recommendation,
    };
  } catch (error) {
    console.error('PDF analysis error:', error);

    // Return conservative default
    return {
      pageCount: 0,
      hasImages: false,
      estimatedImageRatio: 0,
      isAlreadyOptimized: false,
      fileSize: file.size,
      averagePageSize: file.size,
      recommendation: {
        shouldCompress: true,
        reason: 'Unable to analyze PDF. Compression may or may not help.',
        recommendedLevel: 'medium',
      },
    };
  }
}

function generateRecommendation(
  fileSize: number,
  pageCount: number,
  hasImages: boolean,
  isAlreadyOptimized: boolean,
  estimatedImageRatio: number
): PDFAnalysis['recommendation'] {
  const fileSizeMB = fileSize / (1024 * 1024);
  const bytesPerPage = fileSize / pageCount;

  // Very small files (< 500KB)
  if (fileSize < 500 * 1024) {
    return {
      shouldCompress: false,
      reason: 'File is already very small. Compression may increase file size due to re-encoding overhead.',
    };
  }

  // Already optimized PDFs
  if (isAlreadyOptimized && bytesPerPage < 50000) {
    return {
      shouldCompress: false,
      reason: 'PDF appears to be already optimized. Compression unlikely to reduce size significantly.',
    };
  }

  // Text-heavy PDFs (low image ratio)
  if (!hasImages || estimatedImageRatio < 0.1) {
    return {
      shouldCompress: false,
      reason: 'PDF is mostly text with few images. Compression works best on image-heavy PDFs.',
    };
  }

  // Large files with images - best candidates for compression
  if (fileSizeMB > 2 && hasImages) {
    let recommendedLevel: 'low' | 'medium' | 'high' = 'high';
    let estimatedSavings = 50;

    if (bytesPerPage > 500000) {
      // Very large pages with lots of image data, high compression will help most
      recommendedLevel = 'high';
      estimatedSavings = 70;
    } else if (bytesPerPage < 100000) {
      // Already compressed pages, need high compression to make a difference
      recommendedLevel = 'high';
      estimatedSavings = 40;
    } else {
      // Medium-sized pages, medium to high compression recommended
      recommendedLevel = 'medium';
      estimatedSavings = 50;
    }

    return {
      shouldCompress: true,
      reason: 'PDF has images that can be compressed.',
      recommendedLevel,
      estimatedSavings,
    };
  }

  // Medium files with images
  if (fileSizeMB > 0.5 && hasImages) {
    return {
      shouldCompress: true,
      reason: 'PDF contains images. Compression may help reduce file size.',
      recommendedLevel: 'high',
      estimatedSavings: 35,
    };
  }

  // Default case
  return {
    shouldCompress: true,
    reason: 'Compression may help, but results vary by PDF content.',
    recommendedLevel: 'medium',
    estimatedSavings: 20,
  };
}

/**
 * Quick test compression on a single page to estimate results
 */
export async function previewCompression(
  file: File,
  level: 'low' | 'medium' | 'high'
): Promise<{ willIncrease: boolean; estimatedRatio: number }> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });

    if (pdfDoc.getPageCount() === 0) {
      return { willIncrease: false, estimatedRatio: 1 };
    }

    const pdfjsLib = await getPdfjsLib();
    const pdfJsDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    // Test compress first page only
    const page = await pdfJsDoc.getPage(1);
    const viewport = page.getViewport({ scale: 1.5 });

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    const context = canvas.getContext('2d');
    if (!context) {
      return { willIncrease: false, estimatedRatio: 1 };
    }

    context.fillStyle = 'white';
    context.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({
      canvasContext: context,
      viewport,
      canvas,
    }).promise;

    const quality = level === 'low' ? 0.9 : level === 'medium' ? 0.7 : 0.5;
    const imageDataUrl = canvas.toDataURL('image/jpeg', quality);
    const imageData = await fetch(imageDataUrl).then(r => r.arrayBuffer());

    canvas.remove();

    // Estimate based on first page
    const originalPageSize = file.size / pdfDoc.getPageCount();
    const compressedPageSize = imageData.byteLength + 1000; // Add overhead estimate

    const ratio = compressedPageSize / originalPageSize;
    const willIncrease = ratio > 1.05; // 5% threshold

    return { willIncrease, estimatedRatio: ratio };
  } catch (error) {
    console.error('Preview compression error:', error);
    return { willIncrease: false, estimatedRatio: 1 };
  }
}
