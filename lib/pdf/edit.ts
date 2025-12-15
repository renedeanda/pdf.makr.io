import { PDFDocument, degrees } from 'pdf-lib';
import type { RotationAngle } from '@/types/pdf';

export interface EditProgress {
  current: number;
  total: number;
  percentage: number;
  status: string;
}

export async function rotatePages(
  file: File,
  rotations: Map<number, RotationAngle>,
  onProgress?: (progress: EditProgress) => void
): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const pages = pdfDoc.getPages();

  let processed = 0;
  const total = rotations.size;

  for (const [pageNum, angle] of rotations) {
    const pageIndex = pageNum - 1;
    if (pageIndex >= 0 && pageIndex < pages.length) {
      const page = pages[pageIndex];
      const currentRotation = page.getRotation().angle;
      page.setRotation(degrees(currentRotation + angle));

      processed++;
      onProgress?.({
        current: processed,
        total,
        percentage: Math.round((processed / total) * 100),
        status: `Rotating page ${pageNum}`,
      });
    }
  }

  return pdfDoc.save();
}

export async function rotateAllPages(
  file: File,
  angle: RotationAngle,
  onProgress?: (progress: EditProgress) => void
): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const pages = pdfDoc.getPages();

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const currentRotation = page.getRotation().angle;
    page.setRotation(degrees(currentRotation + angle));

    onProgress?.({
      current: i + 1,
      total: pages.length,
      percentage: Math.round(((i + 1) / pages.length) * 100),
      status: `Rotating page ${i + 1}`,
    });
  }

  return pdfDoc.save();
}

export async function deletePages(
  file: File,
  pageNumbersToDelete: number[],
  onProgress?: (progress: EditProgress) => void
): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });

  const totalPages = pdfDoc.getPageCount();

  // Validate that we're not deleting all pages
  if (pageNumbersToDelete.length >= totalPages) {
    throw new Error('Cannot delete all pages from a PDF');
  }

  // Sort in descending order to delete from end first (maintains indices)
  const sortedPageNumbers = [...pageNumbersToDelete]
    .filter(p => p >= 1 && p <= totalPages)
    .sort((a, b) => b - a);

  for (let i = 0; i < sortedPageNumbers.length; i++) {
    const pageNum = sortedPageNumbers[i];
    pdfDoc.removePage(pageNum - 1); // Convert to 0-indexed

    onProgress?.({
      current: i + 1,
      total: sortedPageNumbers.length,
      percentage: Math.round(((i + 1) / sortedPageNumbers.length) * 100),
      status: `Deleting page ${pageNum}`,
    });
  }

  return pdfDoc.save();
}

export async function reorderPages(
  file: File,
  newOrder: number[],
  onProgress?: (progress: EditProgress) => void
): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const originalPdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });

  const newPdf = await PDFDocument.create();

  for (let i = 0; i < newOrder.length; i++) {
    const pageNum = newOrder[i];
    const pageIndex = pageNum - 1; // Convert to 0-indexed

    const [copiedPage] = await newPdf.copyPages(originalPdf, [pageIndex]);
    newPdf.addPage(copiedPage);

    onProgress?.({
      current: i + 1,
      total: newOrder.length,
      percentage: Math.round(((i + 1) / newOrder.length) * 100),
      status: `Processing page ${i + 1}`,
    });
  }

  // Copy metadata
  const title = originalPdf.getTitle();
  const author = originalPdf.getAuthor();
  const subject = originalPdf.getSubject();

  if (title) newPdf.setTitle(title);
  if (author) newPdf.setAuthor(author);
  if (subject) newPdf.setSubject(subject);

  return newPdf.save();
}
