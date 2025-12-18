import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import type { EnhanceProgress } from './enhance';

export interface HeaderFooterOptions {
  header?: {
    left?: string;
    center?: string;
    right?: string;
  };
  footer?: {
    left?: string;
    center?: string;
    right?: string;
  };
  fontSize: number;
  color: { r: number; g: number; b: number };
  differentFirstPage: boolean;
  pages?: number[]; // Optional: specific pages (1-indexed)
}

/**
 * Replace dynamic variables in header/footer text
 */
function replaceVariables(
  text: string,
  pageNum: number,
  totalPages: number,
  title?: string
): string {
  const date = new Date().toLocaleDateString();

  return text
    .replace(/{page}/g, String(pageNum))
    .replace(/{total}/g, String(totalPages))
    .replace(/{date}/g, date)
    .replace(/{title}/g, title || 'Untitled');
}

/**
 * Add headers and footers to PDF
 */
export async function addHeadersFooters(
  file: File,
  options: HeaderFooterOptions,
  onProgress?: (progress: EnhanceProgress) => void
): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const pages = pdfDoc.getPages();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // Get PDF title for variable replacement
  const title = pdfDoc.getTitle();

  // Determine which pages to apply headers/footers to
  const pagesToProcess = options.pages
    ? options.pages.map(p => p - 1) // Convert to 0-indexed
    : pages.map((_, i) => i); // All pages if not specified

  for (let i = 0; i < pagesToProcess.length; i++) {
    const pageIndex = pagesToProcess[i];
    const page = pages[pageIndex];
    const { width, height } = page.getSize();
    const pageNum = pageIndex + 1;
    const totalPages = pages.length;

    // Skip first page if "different first page" is enabled
    if (options.differentFirstPage && pageIndex === 0) {
      onProgress?.({
        current: i + 1,
        total: pagesToProcess.length,
        percentage: Math.round(((i + 1) / pagesToProcess.length) * 100),
        status: `Skipping first page (${pageNum})`,
      });
      continue;
    }

    onProgress?.({
      current: i + 1,
      total: pagesToProcess.length,
      percentage: Math.round(((i + 1) / pagesToProcess.length) * 100),
      status: `Adding headers/footers to page ${pageNum}`,
    });

    const color = rgb(options.color.r, options.color.g, options.color.b);
    const margin = 40;
    const headerY = height - margin;
    const footerY = margin;

    // Add Header
    if (options.header) {
      // Left header
      if (options.header.left) {
        const text = replaceVariables(options.header.left, pageNum, totalPages, title);
        page.drawText(text, {
          x: margin,
          y: headerY,
          size: options.fontSize,
          font,
          color,
        });
      }

      // Center header
      if (options.header.center) {
        const text = replaceVariables(options.header.center, pageNum, totalPages, title);
        const textWidth = font.widthOfTextAtSize(text, options.fontSize);
        page.drawText(text, {
          x: (width - textWidth) / 2,
          y: headerY,
          size: options.fontSize,
          font,
          color,
        });
      }

      // Right header
      if (options.header.right) {
        const text = replaceVariables(options.header.right, pageNum, totalPages, title);
        const textWidth = font.widthOfTextAtSize(text, options.fontSize);
        page.drawText(text, {
          x: width - textWidth - margin,
          y: headerY,
          size: options.fontSize,
          font,
          color,
        });
      }
    }

    // Add Footer
    if (options.footer) {
      // Left footer
      if (options.footer.left) {
        const text = replaceVariables(options.footer.left, pageNum, totalPages, title);
        page.drawText(text, {
          x: margin,
          y: footerY,
          size: options.fontSize,
          font,
          color,
        });
      }

      // Center footer
      if (options.footer.center) {
        const text = replaceVariables(options.footer.center, pageNum, totalPages, title);
        const textWidth = font.widthOfTextAtSize(text, options.fontSize);
        page.drawText(text, {
          x: (width - textWidth) / 2,
          y: footerY,
          size: options.fontSize,
          font,
          color,
        });
      }

      // Right footer
      if (options.footer.right) {
        const text = replaceVariables(options.footer.right, pageNum, totalPages, title);
        const textWidth = font.widthOfTextAtSize(text, options.fontSize);
        page.drawText(text, {
          x: width - textWidth - margin,
          y: footerY,
          size: options.fontSize,
          font,
          color,
        });
      }
    }
  }

  return pdfDoc.save();
}
