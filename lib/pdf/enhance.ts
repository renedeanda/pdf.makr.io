import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';

export interface EnhanceProgress {
  current: number;
  total: number;
  percentage: number;
  status: string;
}

export interface PageNumberOptions {
  position: 'bottom-center' | 'bottom-right' | 'bottom-left' | 'top-center' | 'top-right' | 'top-left';
  format: 'number' | 'page-x-of-y' | 'custom';
  customFormat?: string;
  fontSize: number;
  startPage: number;
  startNumber: number;
}

export interface WatermarkOptions {
  text: string;
  fontSize: number;
  opacity: number;
  rotation: number;
  position: 'center' | 'diagonal' | 'tiled';
  color: { r: number; g: number; b: number };
}

export async function addPageNumbers(
  file: File,
  options: PageNumberOptions,
  onProgress?: (progress: EnhanceProgress) => void
): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const pages = pdfDoc.getPages();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const totalPages = pages.length;
  const pagesToNumber = pages.slice(options.startPage - 1);

  for (let i = 0; i < pagesToNumber.length; i++) {
    const page = pagesToNumber[i];
    const pageNum = options.startNumber + i;
    const { width, height } = page.getSize();

    onProgress?.({
      current: i + 1,
      total: pagesToNumber.length,
      percentage: Math.round(((i + 1) / pagesToNumber.length) * 100),
      status: `Adding number to page ${options.startPage + i}`,
    });

    let text: string;
    switch (options.format) {
      case 'number':
        text = String(pageNum);
        break;
      case 'page-x-of-y':
        text = `Page ${pageNum} of ${totalPages}`;
        break;
      case 'custom':
        text = (options.customFormat || '{n}')
          .replace('{n}', String(pageNum))
          .replace('{total}', String(totalPages));
        break;
      default:
        text = String(pageNum);
    }

    const textWidth = font.widthOfTextAtSize(text, options.fontSize);
    const margin = 40;

    let x: number, y: number;

    switch (options.position) {
      case 'bottom-center':
        x = (width - textWidth) / 2;
        y = margin;
        break;
      case 'bottom-right':
        x = width - textWidth - margin;
        y = margin;
        break;
      case 'bottom-left':
        x = margin;
        y = margin;
        break;
      case 'top-center':
        x = (width - textWidth) / 2;
        y = height - margin;
        break;
      case 'top-right':
        x = width - textWidth - margin;
        y = height - margin;
        break;
      case 'top-left':
        x = margin;
        y = height - margin;
        break;
      default:
        x = (width - textWidth) / 2;
        y = margin;
    }

    page.drawText(text, {
      x,
      y,
      size: options.fontSize,
      font,
      color: rgb(0.3, 0.3, 0.3),
    });
  }

  return pdfDoc.save();
}

export async function addWatermark(
  file: File,
  options: WatermarkOptions,
  onProgress?: (progress: EnhanceProgress) => void
): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const pages = pdfDoc.getPages();
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const { width, height } = page.getSize();

    onProgress?.({
      current: i + 1,
      total: pages.length,
      percentage: Math.round(((i + 1) / pages.length) * 100),
      status: `Adding watermark to page ${i + 1}`,
    });

    const textWidth = font.widthOfTextAtSize(options.text, options.fontSize);
    const color = rgb(options.color.r, options.color.g, options.color.b);

    if (options.position === 'tiled') {
      // Create tiled watermarks
      const spacing = 200;
      for (let x = 0; x < width + textWidth; x += spacing) {
        for (let y = 0; y < height; y += spacing) {
          page.drawText(options.text, {
            x,
            y,
            size: options.fontSize,
            font,
            color,
            opacity: options.opacity,
            rotate: degrees(options.rotation),
          });
        }
      }
    } else if (options.position === 'diagonal') {
      // Single diagonal watermark
      const x = (width - textWidth) / 2;
      const y = height / 2;
      page.drawText(options.text, {
        x,
        y,
        size: options.fontSize,
        font,
        color,
        opacity: options.opacity,
        rotate: degrees(-45),
      });
    } else {
      // Center watermark
      const x = (width - textWidth) / 2;
      const y = height / 2;
      page.drawText(options.text, {
        x,
        y,
        size: options.fontSize,
        font,
        color,
        opacity: options.opacity,
        rotate: degrees(options.rotation),
      });
    }
  }

  return pdfDoc.save();
}

// Reorder pages in a PDF
export async function reorderPages(
  file: File,
  pageOrder: number[],
  onProgress?: (progress: EnhanceProgress) => void
): Promise<Uint8Array> {
  onProgress?.({
    current: 1,
    total: 2,
    percentage: 50,
    status: 'Loading PDF...',
  });

  const arrayBuffer = await file.arrayBuffer();
  const srcDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const newDoc = await PDFDocument.create();

  onProgress?.({
    current: 2,
    total: 2,
    percentage: 100,
    status: 'Reordering pages...',
  });

  // Copy pages in the new order
  const copiedPages = await newDoc.copyPages(srcDoc, pageOrder.map(p => p - 1));
  copiedPages.forEach(page => newDoc.addPage(page));

  return newDoc.save();
}
