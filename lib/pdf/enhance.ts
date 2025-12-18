import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';
import { getAppropriateFont, containsEmojisOrSpecialChars } from './fonts';

export interface EnhanceProgress {
  current: number;
  total: number;
  percentage: number;
  status: string;
}

export interface WatermarkResult {
  data: Uint8Array;
  hasUnsupportedChars: boolean;
  warning?: string;
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
  pages?: number[]; // Optional: specific pages to watermark (1-indexed)
}

export interface ImageWatermarkOptions {
  opacity: number;
  scale: number; // 0.1 to 2.0
  rotation: number;
  position: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'tiled';
  pageSelection: 'all' | 'odd' | 'even' | 'custom';
  customPages?: number[];
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
): Promise<WatermarkResult> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const pages = pdfDoc.getPages();

  // Get appropriate font based on text content and clean text
  const { font, hasUnsupportedChars, cleanedText } = await getAppropriateFont(
    pdfDoc,
    options.text,
    true // bold
  );

  let warning: string | undefined;
  if (hasUnsupportedChars) {
    warning = 'Emojis have been removed from your watermark as they are not supported in PDFs. Only standard text will be displayed.';
  }

  // Determine which pages to watermark
  const pagesToWatermark = options.pages
    ? options.pages.map(p => p - 1) // Convert to 0-indexed
    : pages.map((_, i) => i); // All pages if not specified

  for (let i = 0; i < pagesToWatermark.length; i++) {
    const pageIndex = pagesToWatermark[i];
    const page = pages[pageIndex];
    const { width, height } = page.getSize();

    onProgress?.({
      current: i + 1,
      total: pagesToWatermark.length,
      percentage: Math.round(((i + 1) / pagesToWatermark.length) * 100),
      status: `Adding watermark to page ${pageIndex + 1}`,
    });

    const textWidth = font.widthOfTextAtSize(cleanedText, options.fontSize);
    const color = rgb(options.color.r, options.color.g, options.color.b);

    if (options.position === 'tiled') {
      // Create tiled watermarks
      const spacing = 200;
      for (let x = 0; x < width + textWidth; x += spacing) {
        for (let y = 0; y < height; y += spacing) {
          page.drawText(cleanedText, {
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
      page.drawText(cleanedText, {
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
      page.drawText(cleanedText, {
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

  const data = await pdfDoc.save();

  return {
    data,
    hasUnsupportedChars,
    warning,
  };
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

/**
 * Add image watermark to PDF
 */
export async function addImageWatermark(
  pdfFile: File,
  imageFile: File,
  options: ImageWatermarkOptions,
  onProgress?: (progress: EnhanceProgress) => void
): Promise<Uint8Array> {
  const arrayBuffer = await pdfFile.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const pages = pdfDoc.getPages();

  // Load and embed the image
  const imageArrayBuffer = await imageFile.arrayBuffer();
  const imageBytes = new Uint8Array(imageArrayBuffer);

  let image;
  if (imageFile.type === 'image/png') {
    image = await pdfDoc.embedPng(imageBytes);
  } else if (imageFile.type === 'image/jpeg' || imageFile.type === 'image/jpg') {
    image = await pdfDoc.embedJpg(imageBytes);
  } else {
    throw new Error('Unsupported image format. Please use PNG or JPG.');
  }

  const imgDims = image.scale(options.scale);

  // Determine which pages to watermark
  const pagesToWatermark = pages.filter((_, index) => {
    const pageNum = index + 1;

    if (options.pageSelection === 'all') return true;
    if (options.pageSelection === 'odd') return pageNum % 2 === 1;
    if (options.pageSelection === 'even') return pageNum % 2 === 0;
    if (options.pageSelection === 'custom' && options.customPages) {
      return options.customPages.includes(pageNum);
    }
    return false;
  });

  for (let i = 0; i < pagesToWatermark.length; i++) {
    const page = pagesToWatermark[i];
    const { width, height } = page.getSize();

    onProgress?.({
      current: i + 1,
      total: pagesToWatermark.length,
      percentage: Math.round(((i + 1) / pagesToWatermark.length) * 100),
      status: `Adding watermark to page ${i + 1} of ${pagesToWatermark.length}`,
    });

    if (options.position === 'tiled') {
      // Tiled watermarks
      const spacing = 50;
      for (let x = 0; x < width; x += imgDims.width + spacing) {
        for (let y = 0; y < height; y += imgDims.height + spacing) {
          page.drawImage(image, {
            x,
            y,
            width: imgDims.width,
            height: imgDims.height,
            opacity: options.opacity,
            rotate: degrees(options.rotation),
          });
        }
      }
    } else {
      // Calculate position
      let x: number, y: number;

      switch (options.position) {
        case 'center':
          x = (width - imgDims.width) / 2;
          y = (height - imgDims.height) / 2;
          break;
        case 'top-left':
          x = 20;
          y = height - imgDims.height - 20;
          break;
        case 'top-right':
          x = width - imgDims.width - 20;
          y = height - imgDims.height - 20;
          break;
        case 'bottom-left':
          x = 20;
          y = 20;
          break;
        case 'bottom-right':
          x = width - imgDims.width - 20;
          y = 20;
          break;
        default:
          x = (width - imgDims.width) / 2;
          y = (height - imgDims.height) / 2;
      }

      page.drawImage(image, {
        x,
        y,
        width: imgDims.width,
        height: imgDims.height,
        opacity: options.opacity,
        rotate: degrees(options.rotation),
      });
    }
  }

  return pdfDoc.save();
}
