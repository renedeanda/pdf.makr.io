import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';
import { PageRange } from '@/types/pdf';

export interface SplitProgress {
  current: number;
  total: number;
  percentage: number;
}

export async function splitPDF(
  file: File,
  ranges: PageRange[],
  onProgress?: (progress: SplitProgress) => void
): Promise<{ data: Uint8Array; filename: string }[]> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const totalPages = pdf.getPageCount();

  const results: { data: Uint8Array; filename: string }[] = [];
  const baseName = file.name.replace('.pdf', '');

  for (let i = 0; i < ranges.length; i++) {
    const range = ranges[i];

    // Validate range
    const start = Math.max(1, Math.min(range.start, totalPages));
    const end = Math.max(start, Math.min(range.end, totalPages));

    const newPdf = await PDFDocument.create();

    // Copy pages in range (convert to 0-indexed)
    const pageIndices = Array.from(
      { length: end - start + 1 },
      (_, idx) => start + idx - 1
    );

    const pages = await newPdf.copyPages(pdf, pageIndices);
    pages.forEach((page) => newPdf.addPage(page));

    // Preserve metadata
    const title = pdf.getTitle();
    const author = pdf.getAuthor();
    if (title) newPdf.setTitle(`${title} (Pages ${start}-${end})`);
    if (author) newPdf.setAuthor(author);

    const filename = ranges.length === 1
      ? `${baseName}_pages_${start}-${end}.pdf`
      : `${baseName}_part_${i + 1}.pdf`;

    results.push({
      data: await newPdf.save(),
      filename,
    });

    onProgress?.({
      current: i + 1,
      total: ranges.length,
      percentage: Math.round(((i + 1) / ranges.length) * 100),
    });
  }

  return results;
}

export async function extractPages(
  file: File,
  pageNumbers: number[],
  onProgress?: (progress: SplitProgress) => void
): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });

  const newPdf = await PDFDocument.create();

  // Convert to 0-indexed and filter valid pages
  const totalPages = pdf.getPageCount();
  const validPageIndices = pageNumbers
    .filter(p => p >= 1 && p <= totalPages)
    .map(p => p - 1);

  const pages = await newPdf.copyPages(pdf, validPageIndices);
  pages.forEach((page, index) => {
    newPdf.addPage(page);
    onProgress?.({
      current: index + 1,
      total: validPageIndices.length,
      percentage: Math.round(((index + 1) / validPageIndices.length) * 100),
    });
  });

  // Preserve metadata
  const title = pdf.getTitle();
  const author = pdf.getAuthor();
  if (title) newPdf.setTitle(`${title} (Extracted pages)`);
  if (author) newPdf.setAuthor(author);

  return newPdf.save();
}

export async function createZipFromPDFs(
  pdfs: { data: Uint8Array; filename: string }[]
): Promise<Uint8Array> {
  const zip = new JSZip();

  pdfs.forEach(({ data, filename }) => {
    zip.file(filename, data);
  });

  const zipBlob = await zip.generateAsync({ type: 'uint8array' });
  return zipBlob;
}
