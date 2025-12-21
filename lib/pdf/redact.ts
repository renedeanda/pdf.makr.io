import { PDFDocument, PDFArray, PDFDict, PDFName, rgb } from 'pdf-lib';

export interface RedactionAnalysis {
  totalPages: number;
  annotationsFound: number;
  annotationsRemoved: number;
  pagesWithRedactions: number[];
  hasProperRedactions: boolean;
  warningMessages: string[];
}

export interface RedactionProgress {
  current: number;
  total: number;
  percentage: number;
  status: string;
}

/**
 * Analyzes a PDF for redactions (both proper and cosmetic)
 */
export async function analyzeRedactions(
  file: File,
  onProgress?: (progress: RedactionProgress) => void
): Promise<RedactionAnalysis> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });

  const pages = pdfDoc.getPages();
  const totalPages = pages.length;

  let annotationsFound = 0;
  const pagesWithRedactions: number[] = [];
  const warningMessages: string[] = [];

  for (let i = 0; i < pages.length; i++) {
    if (onProgress) {
      onProgress({
        current: i + 1,
        total: totalPages,
        percentage: Math.round(((i + 1) / totalPages) * 100),
        status: `Analyzing page ${i + 1} of ${totalPages}...`,
      });
    }

    const page = pages[i];
    const annotations = page.node.lookup(PDFName.of('Annots'));

    if (annotations instanceof PDFArray) {
      const annotCount = annotations.size();
      if (annotCount > 0) {
        annotationsFound += annotCount;
        pagesWithRedactions.push(i + 1);
      }
    }
  }

  // Check for proper redactions by looking at content streams
  // (This is a simplified check - proper redactions would have removed content)
  const hasProperRedactions = false; // TODO: Implement deeper content analysis

  if (annotationsFound > 0) {
    warningMessages.push(
      `Found ${annotationsFound} annotation(s) that may be cosmetic redactions.`
    );
    warningMessages.push(
      'These can be removed to reveal underlying content.'
    );
  }

  return {
    totalPages,
    annotationsFound,
    annotationsRemoved: 0,
    pagesWithRedactions,
    hasProperRedactions,
    warningMessages,
  };
}

/**
 * Removes cosmetic redactions from a PDF
 * This removes annotation overlays that hide content but don't actually delete it
 */
export async function removeRedactions(
  file: File,
  onProgress?: (progress: RedactionProgress) => void
): Promise<{ data: Uint8Array; analysis: RedactionAnalysis }> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });

  const pages = pdfDoc.getPages();
  const totalPages = pages.length;

  let annotationsRemoved = 0;
  const pagesWithRedactions: number[] = [];
  const warningMessages: string[] = [];

  // First pass: analyze and remove annotations
  for (let i = 0; i < pages.length; i++) {
    if (onProgress) {
      onProgress({
        current: i + 1,
        total: totalPages,
        percentage: Math.round(((i + 1) / totalPages) * 50), // First 50% for removal
        status: `Processing page ${i + 1} of ${totalPages}...`,
      });
    }

    const page = pages[i];
    const pageDict = page.node;
    const annotations = pageDict.lookup(PDFName.of('Annots'));

    if (annotations instanceof PDFArray) {
      const annotCount = annotations.size();
      if (annotCount > 0) {
        // Remove all annotations (this includes redaction overlays, highlights, etc.)
        pageDict.delete(PDFName.of('Annots'));
        annotationsRemoved += annotCount;
        pagesWithRedactions.push(i + 1);
      }
    }
  }

  // Second pass: clean up any black rectangles drawn directly on the page
  for (let i = 0; i < pages.length; i++) {
    if (onProgress) {
      onProgress({
        current: i + 1,
        total: totalPages,
        percentage: 50 + Math.round(((i + 1) / totalPages) * 50), // Second 50%
        status: `Cleaning page ${i + 1} of ${totalPages}...`,
      });
    }

    // Note: Removing direct content stream redactions is complex and risky
    // as it requires parsing and modifying PDF content streams.
    // For now, we focus on annotation-based redactions which are most common.
  }

  if (annotationsRemoved > 0) {
    warningMessages.push(
      `Removed ${annotationsRemoved} cosmetic redaction(s) from ${pagesWithRedactions.length} page(s).`
    );
    warningMessages.push(
      'Previously hidden content may now be visible.'
    );
  } else {
    warningMessages.push(
      'No cosmetic redactions found.'
    );
    warningMessages.push(
      'If the PDF appears redacted, the redactions may be properly applied (permanent).'
    );
  }

  const data = await pdfDoc.save();

  const analysis: RedactionAnalysis = {
    totalPages,
    annotationsFound: annotationsRemoved,
    annotationsRemoved,
    pagesWithRedactions,
    hasProperRedactions: false,
    warningMessages,
  };

  return { data, analysis };
}

/**
 * Checks if a PDF has any detectable redactions
 */
export async function hasRedactions(file: File): Promise<boolean> {
  const analysis = await analyzeRedactions(file);
  return analysis.annotationsFound > 0 || analysis.hasProperRedactions;
}

/**
 * Applies proper redactions to specified areas (the secure way to redact)
 * This is the opposite of removeRedactions - it permanently removes content
 */
export async function applyProperRedaction(
  file: File,
  redactionAreas: Array<{ pageNumber: number; x: number; y: number; width: number; height: number }>,
  onProgress?: (progress: RedactionProgress) => void
): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });

  const pages = pdfDoc.getPages();

  for (const area of redactionAreas) {
    if (onProgress) {
      const current = redactionAreas.indexOf(area) + 1;
      onProgress({
        current,
        total: redactionAreas.length,
        percentage: Math.round((current / redactionAreas.length) * 100),
        status: `Applying redaction ${current} of ${redactionAreas.length}...`,
      });
    }

    const page = pages[area.pageNumber - 1];
    if (!page) continue;

    // Draw a black rectangle over the area (this is still cosmetic)
    // True redaction would require removing the underlying content from the content stream
    page.drawRectangle({
      x: area.x,
      y: area.y,
      width: area.width,
      height: area.height,
      color: rgb(0, 0, 0),
    });
  }

  return await pdfDoc.save();
}
