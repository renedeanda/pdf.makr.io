import { PDFDocument, PDFArray, PDFDict, PDFName, PDFString, PDFNumber, rgb } from 'pdf-lib';

export interface AnnotationDetail {
  type: string;
  subtype?: string;
  color?: number[];
  opacity?: number;
  isLikelyRedaction: boolean;
  reason: string;
}

export interface PageAnalysis {
  pageNumber: number;
  annotationsFound: AnnotationDetail[];
  suspiciousShapes: number;
  textBefore?: string;
  textAfter?: string;
  hasChanges: boolean;
}

export interface RedactionAnalysis {
  totalPages: number;
  annotationsFound: number;
  annotationsRemoved: number;
  redactionAnnotations: number;
  squareAnnotations: number;
  highlightAnnotations: number;
  inkAnnotations: number;
  otherAnnotations: number;
  blackShapesDetected: number;
  pagesWithRedactions: number[];
  pageDetails: PageAnalysis[];
  hasProperRedactions: boolean;
  warningMessages: string[];
  detailedFindings: string[];
  textRevealed: boolean;
}

export interface RedactionProgress {
  current: number;
  total: number;
  percentage: number;
  status: string;
}

/**
 * Helper to safely get PDF object values
 */
function getPDFValue(obj: any, key: string): any {
  try {
    if (obj instanceof PDFDict) {
      return obj.lookup(PDFName.of(key));
    }
  } catch (e) {
    return undefined;
  }
  return undefined;
}

/**
 * Helper to extract color from annotation
 */
function extractColor(colorObj: any): number[] | undefined {
  try {
    if (colorObj instanceof PDFArray) {
      const components: number[] = [];
      for (let i = 0; i < colorObj.size(); i++) {
        const component = colorObj.lookup(i);
        if (component instanceof PDFNumber) {
          components.push(component.asNumber());
        }
      }
      return components.length > 0 ? components : undefined;
    }
  } catch (e) {
    return undefined;
  }
  return undefined;
}

/**
 * Determines if a color is dark (likely used for redaction)
 */
function isDarkColor(color?: number[]): boolean {
  if (!color || color.length === 0) return false;

  // Check if all components are below threshold (dark)
  // RGB or CMYK - if all values are low (close to 0), it's dark/black
  const threshold = 0.3;

  if (color.length === 3) {
    // RGB - all components should be low
    return color.every(c => c <= threshold);
  } else if (color.length === 4) {
    // CMYK - K (black) should be high, or all CMY should be high
    const k = color[3];
    return k >= 0.7 || color.slice(0, 3).every(c => c >= 0.7);
  } else if (color.length === 1) {
    // Grayscale - value should be low
    return color[0] <= threshold;
  }

  return false;
}

/**
 * Analyzes an annotation to determine if it's likely a redaction
 */
function analyzeAnnotation(annotDict: PDFDict): AnnotationDetail {
  const subtype = getPDFValue(annotDict, 'Subtype');
  const subtypeStr = subtype instanceof PDFName ? subtype.asString().replace('/','') : 'Unknown';

  const color = extractColor(getPDFValue(annotDict, 'C'));
  const interiorColor = extractColor(getPDFValue(annotDict, 'IC'));
  const opacity = getPDFValue(annotDict, 'CA');
  const opacityValue = opacity instanceof PDFNumber ? opacity.asNumber() : undefined;

  const detail: AnnotationDetail = {
    type: 'Annotation',
    subtype: subtypeStr,
    color,
    opacity: opacityValue,
    isLikelyRedaction: false,
    reason: '',
  };

  // Analyze if this is likely a redaction
  const reasons: string[] = [];

  // 1. Explicit Redact annotation type
  if (subtypeStr === 'Redact') {
    detail.isLikelyRedaction = true;
    reasons.push('Redact annotation type');
  }

  // 2. Square or rectangle with dark/black color
  if (subtypeStr === 'Square' && (isDarkColor(color) || isDarkColor(interiorColor))) {
    detail.isLikelyRedaction = true;
    reasons.push('Black/dark rectangle overlay');
  }

  // 3. Highlight with dark color (unusual - likely redaction)
  if (subtypeStr === 'Highlight' && isDarkColor(color)) {
    detail.isLikelyRedaction = true;
    reasons.push('Dark highlight (unusual)');
  }

  // 4. Ink annotation with dark color
  if (subtypeStr === 'Ink' && isDarkColor(color)) {
    detail.isLikelyRedaction = true;
    reasons.push('Dark ink overlay');
  }

  // 5. High opacity overlay (trying to hide content)
  if (opacityValue !== undefined && opacityValue >= 0.8 && isDarkColor(color)) {
    detail.isLikelyRedaction = true;
    reasons.push('High opacity dark overlay');
  }

  // 6. FreeText with black background
  if (subtypeStr === 'FreeText' && isDarkColor(color)) {
    detail.isLikelyRedaction = true;
    reasons.push('Text box with dark background');
  }

  detail.reason = reasons.length > 0 ? reasons.join(', ') : 'Standard annotation';

  return detail;
}

/**
 * Extract text from PDF using pdfjs
 */
async function extractTextFromPDF(file: File): Promise<Map<number, string>> {
  try {
    const pdfjsLib = await import('pdfjs-dist');
    if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
    }

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const textMap = new Map<number, string>();

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const text = textContent.items
        .map((item: any) => item.str || '')
        .join(' ')
        .trim();
      textMap.set(i, text);
    }

    return textMap;
  } catch (e) {
    console.error('Error extracting text:', e);
    return new Map();
  }
}

/**
 * Analyzes a PDF for redactions with comprehensive detection
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
  let redactionAnnotations = 0;
  let squareAnnotations = 0;
  let highlightAnnotations = 0;
  let inkAnnotations = 0;
  let otherAnnotations = 0;
  let blackShapesDetected = 0;

  const pagesWithRedactions: number[] = [];
  const pageDetails: PageAnalysis[] = [];
  const warningMessages: string[] = [];
  const detailedFindings: string[] = [];

  // Extract text before processing (optional but useful)
  if (onProgress) {
    onProgress({
      current: 0,
      total: totalPages,
      percentage: 0,
      status: 'Extracting text for comparison...',
    });
  }

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
    const pageNum = i + 1;
    const annotations = page.node.lookup(PDFName.of('Annots'));

    const pageAnalysis: PageAnalysis = {
      pageNumber: pageNum,
      annotationsFound: [],
      suspiciousShapes: 0,
      hasChanges: false,
    };

    if (annotations instanceof PDFArray) {
      for (let j = 0; j < annotations.size(); j++) {
        const annotRef = annotations.lookup(j);

        if (annotRef instanceof PDFDict) {
          annotationsFound++;
          const detail = analyzeAnnotation(annotRef);
          pageAnalysis.annotationsFound.push(detail);

          // Categorize
          const subtype = detail.subtype?.toLowerCase() || '';
          if (subtype === 'redact') {
            redactionAnnotations++;
          } else if (subtype === 'square') {
            squareAnnotations++;
          } else if (subtype === 'highlight') {
            highlightAnnotations++;
          } else if (subtype === 'ink') {
            inkAnnotations++;
          } else {
            otherAnnotations++;
          }

          if (detail.isLikelyRedaction) {
            pageAnalysis.hasChanges = true;
            blackShapesDetected++;
          }
        }
      }

      if (pageAnalysis.hasChanges) {
        pagesWithRedactions.push(pageNum);
      }
    }

    // Analyze content stream for suspicious black rectangles
    // This is a heuristic - we look for draw operations that might be redactions
    try {
      const contents = page.node.lookup(PDFName.of('Contents'));
      if (contents) {
        // This is simplified - full content stream parsing would be needed for accuracy
        const contentStr = contents.toString();

        // Look for common redaction patterns in content streams
        // "re" = rectangle, "f" = fill, "RG" or "rg" = color
        // Pattern: setting black color then drawing filled rectangle
        const blackRectPattern = /0\s+0\s+0\s+(rg|RG).*?re.*?f/g;
        const matches = contentStr.match(blackRectPattern);

        if (matches && matches.length > 0) {
          pageAnalysis.suspiciousShapes += matches.length;
          blackShapesDetected += matches.length;
          pageAnalysis.hasChanges = true;

          if (!pagesWithRedactions.includes(pageNum)) {
            pagesWithRedactions.push(pageNum);
          }
        }
      }
    } catch (e) {
      // Content stream analysis failed - not critical
    }

    pageDetails.push(pageAnalysis);
  }

  // Generate detailed findings
  if (redactionAnnotations > 0) {
    detailedFindings.push(`Found ${redactionAnnotations} explicit Redact annotation(s) - these are cosmetic and can be removed`);
  }
  if (squareAnnotations > 0) {
    const darkSquares = pageDetails.reduce((sum, p) =>
      sum + p.annotationsFound.filter(a => a.subtype === 'Square' && a.isLikelyRedaction).length, 0);
    if (darkSquares > 0) {
      detailedFindings.push(`Found ${darkSquares} dark rectangle(s) that appear to be redaction overlays`);
    }
  }
  if (highlightAnnotations > 0) {
    const darkHighlights = pageDetails.reduce((sum, p) =>
      sum + p.annotationsFound.filter(a => a.subtype === 'Highlight' && a.isLikelyRedaction).length, 0);
    if (darkHighlights > 0) {
      detailedFindings.push(`Found ${darkHighlights} dark highlight(s) used as redaction overlays`);
    }
  }
  if (blackShapesDetected > 0) {
    detailedFindings.push(`Detected ${blackShapesDetected} total suspicious dark overlay(s) across all pages`);
  }

  // Generate warning messages
  if (annotationsFound > 0) {
    const likelyRedactions = blackShapesDetected;
    if (likelyRedactions > 0) {
      warningMessages.push(
        `⚠️ Found ${likelyRedactions} likely cosmetic redaction(s) that can be removed to reveal content.`
      );
    }

    const otherAnnots = annotationsFound - likelyRedactions;
    if (otherAnnots > 0) {
      warningMessages.push(
        `Found ${otherAnnots} other annotation(s) (comments, highlights, etc.) - will also be removed.`
      );
    }
  } else {
    warningMessages.push('No annotations detected in this PDF.');
  }

  return {
    totalPages,
    annotationsFound,
    annotationsRemoved: 0,
    redactionAnnotations,
    squareAnnotations,
    highlightAnnotations,
    inkAnnotations,
    otherAnnotations,
    blackShapesDetected,
    pagesWithRedactions,
    pageDetails,
    hasProperRedactions: false,
    warningMessages,
    detailedFindings,
    textRevealed: false,
  };
}

/**
 * Removes cosmetic redactions from a PDF with advanced detection
 */
export async function removeRedactions(
  file: File,
  onProgress?: (progress: RedactionProgress) => void
): Promise<{ data: Uint8Array; analysis: RedactionAnalysis; textBefore: string; textAfter: string }> {
  // First, get text before removal
  if (onProgress) {
    onProgress({
      current: 0,
      total: 100,
      percentage: 0,
      status: 'Extracting text before removal...',
    });
  }

  const textBeforeMap = await extractTextFromPDF(file);
  const textBefore = Array.from(textBeforeMap.values()).join('\n').trim();

  if (onProgress) {
    onProgress({
      current: 10,
      total: 100,
      percentage: 10,
      status: 'Analyzing redactions...',
    });
  }

  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });

  const pages = pdfDoc.getPages();
  const totalPages = pages.length;

  let annotationsRemoved = 0;
  let redactionAnnotations = 0;
  let squareAnnotations = 0;
  let highlightAnnotations = 0;
  let inkAnnotations = 0;
  let otherAnnotations = 0;
  let blackShapesDetected = 0;

  const pagesWithRedactions: number[] = [];
  const pageDetails: PageAnalysis[] = [];
  const detailedFindings: string[] = [];

  // Remove annotations
  for (let i = 0; i < pages.length; i++) {
    if (onProgress) {
      onProgress({
        current: 10 + Math.round((i / totalPages) * 80),
        total: 100,
        percentage: 10 + Math.round((i / totalPages) * 80),
        status: `Removing redactions from page ${i + 1} of ${totalPages}...`,
      });
    }

    const page = pages[i];
    const pageNum = i + 1;
    const pageDict = page.node;
    const annotations = pageDict.lookup(PDFName.of('Annots'));

    const pageAnalysis: PageAnalysis = {
      pageNumber: pageNum,
      annotationsFound: [],
      suspiciousShapes: 0,
      hasChanges: false,
    };

    if (annotations instanceof PDFArray) {
      // Analyze each annotation before removing
      for (let j = 0; j < annotations.size(); j++) {
        const annotRef = annotations.lookup(j);
        if (annotRef instanceof PDFDict) {
          const detail = analyzeAnnotation(annotRef);
          pageAnalysis.annotationsFound.push(detail);

          const subtype = detail.subtype?.toLowerCase() || '';
          if (subtype === 'redact') {
            redactionAnnotations++;
          } else if (subtype === 'square') {
            squareAnnotations++;
          } else if (subtype === 'highlight') {
            highlightAnnotations++;
          } else if (subtype === 'ink') {
            inkAnnotations++;
          } else {
            otherAnnotations++;
          }

          if (detail.isLikelyRedaction) {
            blackShapesDetected++;
            pageAnalysis.hasChanges = true;
          }
        }
      }

      // Remove ALL annotations (safer approach - removes everything)
      const annotCount = annotations.size();
      if (annotCount > 0) {
        pageDict.delete(PDFName.of('Annots'));
        annotationsRemoved += annotCount;
        pagesWithRedactions.push(pageNum);
        pageAnalysis.hasChanges = true;
      }
    }

    pageDetails.push(pageAnalysis);
  }

  // Clean up metadata that might contain redacted info
  try {
    const infoDict = pdfDoc.context.lookup(pdfDoc.context.trailerInfo.Info);
    if (infoDict instanceof PDFDict) {
      // Don't remove all metadata, just note it exists
      detailedFindings.push('Metadata preserved (may contain original text)');
    }
  } catch (e) {
    // Metadata cleaning failed - not critical
  }

  if (onProgress) {
    onProgress({
      current: 90,
      total: 100,
      percentage: 90,
      status: 'Saving modified PDF...',
    });
  }

  const data = await pdfDoc.save();

  // Extract text after removal
  if (onProgress) {
    onProgress({
      current: 95,
      total: 100,
      percentage: 95,
      status: 'Extracting revealed text...',
    });
  }

  const blob = new Blob([new Uint8Array(data)], { type: 'application/pdf' });
  const modifiedFile = new File([blob], file.name, { type: 'application/pdf' });
  const textAfterMap = await extractTextFromPDF(modifiedFile);
  const textAfter = Array.from(textAfterMap.values()).join('\n').trim();

  const textRevealed = textAfter.length > textBefore.length;

  // Generate detailed findings
  if (redactionAnnotations > 0) {
    detailedFindings.push(`✓ Removed ${redactionAnnotations} explicit Redact annotation(s)`);
  }
  if (squareAnnotations > 0) {
    detailedFindings.push(`✓ Removed ${squareAnnotations} rectangle annotation(s)`);
  }
  if (highlightAnnotations > 0) {
    detailedFindings.push(`✓ Removed ${highlightAnnotations} highlight annotation(s)`);
  }
  if (inkAnnotations > 0) {
    detailedFindings.push(`✓ Removed ${inkAnnotations} ink annotation(s)`);
  }
  if (otherAnnotations > 0) {
    detailedFindings.push(`✓ Removed ${otherAnnotations} other annotation(s)`);
  }

  if (textRevealed) {
    const charsRevealed = textAfter.length - textBefore.length;
    detailedFindings.push(`📝 Revealed approximately ${charsRevealed} additional characters of text`);
  }

  const warningMessages: string[] = [];

  if (annotationsRemoved > 0) {
    warningMessages.push(
      `Removed ${annotationsRemoved} annotation(s) from ${pagesWithRedactions.length} page(s).`
    );
    if (blackShapesDetected > 0) {
      warningMessages.push(
        `${blackShapesDetected} of these were identified as likely redaction overlays.`
      );
    }
    if (textRevealed) {
      warningMessages.push(
        '✓ Additional text was revealed - redactions were cosmetic!'
      );
    } else {
      warningMessages.push(
        'No additional text revealed, but overlays were removed.'
      );
    }
  } else {
    warningMessages.push('No annotations found to remove.');
    warningMessages.push('If content appears redacted, it may be properly removed (permanent).');
  }

  const analysis: RedactionAnalysis = {
    totalPages,
    annotationsFound: annotationsRemoved,
    annotationsRemoved,
    redactionAnnotations,
    squareAnnotations,
    highlightAnnotations,
    inkAnnotations,
    otherAnnotations,
    blackShapesDetected,
    pagesWithRedactions,
    pageDetails,
    hasProperRedactions: false,
    warningMessages,
    detailedFindings,
    textRevealed,
  };

  return { data, analysis, textBefore, textAfter };
}

/**
 * Checks if a PDF has any detectable redactions
 */
export async function hasRedactions(file: File): Promise<boolean> {
  const analysis = await analyzeRedactions(file);
  return analysis.blackShapesDetected > 0 || analysis.hasProperRedactions;
}
