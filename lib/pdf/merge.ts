import { PDFDocument } from 'pdf-lib';

export interface MergeProgress {
  current: number;
  total: number;
  percentage: number;
}

export async function mergePDFs(
  files: File[],
  onProgress?: (progress: MergeProgress) => void
): Promise<Uint8Array> {
  const mergedPdf = await PDFDocument.create();
  const total = files.length;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const arrayBuffer = await file.arrayBuffer();

    try {
      const pdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());

      pages.forEach((page) => {
        mergedPdf.addPage(page);
      });
    } catch (error) {
      console.error(`Error processing file ${file.name}:`, error);
      throw new Error(`Failed to process "${file.name}". The file may be corrupted or password-protected.`);
    }

    onProgress?.({
      current: i + 1,
      total,
      percentage: Math.round(((i + 1) / total) * 100),
    });
  }

  // Preserve metadata from first PDF
  if (files.length > 0) {
    try {
      const firstPdfBuffer = await files[0].arrayBuffer();
      const firstPdf = await PDFDocument.load(firstPdfBuffer, { ignoreEncryption: true });

      const title = firstPdf.getTitle();
      const author = firstPdf.getAuthor();
      const subject = firstPdf.getSubject();
      const keywords = firstPdf.getKeywords();

      if (title) mergedPdf.setTitle(title);
      if (author) mergedPdf.setAuthor(author);
      if (subject) mergedPdf.setSubject(subject);
      if (keywords) mergedPdf.setKeywords(keywords.split(',').map(k => k.trim()));
    } catch {
      // Ignore metadata errors
    }
  }

  return mergedPdf.save();
}
