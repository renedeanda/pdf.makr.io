import { getPdfjsLib } from './utils-pdfjs';

export interface PageThumbnail {
  pageNumber: number;
  dataUrl: string;
  width: number;
  height: number;
}

export interface ThumbnailProgress {
  current: number;
  total: number;
  percentage: number;
  status: string;
}

/**
 * Generate thumbnails for all pages in a PDF
 */
export async function generateThumbnails(
  file: File,
  maxWidth: number = 200,
  onProgress?: (progress: ThumbnailProgress) => void
): Promise<PageThumbnail[]> {
  const pdfjsLib = await getPdfjsLib();
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;

  const totalPages = pdf.numPages;
  const thumbnails: PageThumbnail[] = [];

  for (let i = 1; i <= totalPages; i++) {
    onProgress?.({
      current: i,
      total: totalPages,
      percentage: Math.round((i / totalPages) * 100),
      status: `Generating thumbnail ${i} of ${totalPages}...`,
    });

    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 1 });

    // Calculate scale to fit maxWidth
    const scale = maxWidth / viewport.width;
    const scaledViewport = page.getViewport({ scale });

    // Create canvas
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('Failed to get canvas context');
    }

    canvas.width = scaledViewport.width;
    canvas.height = scaledViewport.height;

    // Render page to canvas
    await page.render({
      canvasContext: context,
      viewport: scaledViewport,
      canvas,
    }).promise;

    // Convert to data URL
    const dataUrl = canvas.toDataURL('image/png');

    thumbnails.push({
      pageNumber: i,
      dataUrl,
      width: scaledViewport.width,
      height: scaledViewport.height,
    });
  }

  return thumbnails;
}

/**
 * Generate a single page thumbnail
 */
export async function generatePageThumbnail(
  file: File,
  pageNumber: number,
  maxWidth: number = 200
): Promise<PageThumbnail> {
  const pdfjsLib = await getPdfjsLib();
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;

  const page = await pdf.getPage(pageNumber);
  const viewport = page.getViewport({ scale: 1 });

  // Calculate scale to fit maxWidth
  const scale = maxWidth / viewport.width;
  const scaledViewport = page.getViewport({ scale });

  // Create canvas
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Failed to get canvas context');
  }

  canvas.width = scaledViewport.width;
  canvas.height = scaledViewport.height;

  // Render page to canvas
  await page.render({
    canvasContext: context,
    viewport: scaledViewport,
    canvas,
  }).promise;

  // Convert to data URL
  const dataUrl = canvas.toDataURL('image/png');

  return {
    pageNumber,
    dataUrl,
    width: scaledViewport.width,
    height: scaledViewport.height,
  };
}
