import { getPdfjsLib } from './utils-pdfjs';

export interface ExtractProgress {
  current: number;
  total: number;
  percentage: number;
  status: string;
}

export interface ExtractedPage {
  pageNumber: number;
  text: string;
  isEmpty: boolean;
}

export interface ExtractResult {
  pages: ExtractedPage[];
  fullText: string;
  markdown: string;
  hasText: boolean;
  totalPages: number;
}

/**
 * Extract text from a PDF file
 */
export async function extractTextFromPDF(
  file: File,
  onProgress?: (progress: ExtractProgress) => void
): Promise<ExtractResult> {
  const pdfjsLib = await getPdfjsLib();
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;

  const totalPages = pdf.numPages;
  const pages: ExtractedPage[] = [];
  let fullText = '';

  for (let i = 1; i <= totalPages; i++) {
    onProgress?.({
      current: i,
      total: totalPages,
      percentage: Math.round((i / totalPages) * 100),
      status: `Extracting text from page ${i} of ${totalPages}...`,
    });

    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();

    // Extract text items and join them
    const pageText = textContent.items
      .map((item: any) => ('str' in item ? item.str : ''))
      .join(' ')
      .trim();

    pages.push({
      pageNumber: i,
      text: pageText,
      isEmpty: pageText.length === 0,
    });

    fullText += pageText + '\n\n';
  }

  // Convert to markdown
  const markdown = convertToMarkdown(pages);

  // Check if PDF has any text
  const hasText = pages.some((p) => !p.isEmpty);

  return {
    pages,
    fullText: fullText.trim(),
    markdown,
    hasText,
    totalPages,
  };
}

/**
 * Convert extracted text to markdown format
 * Attempts to detect headings, paragraphs, and lists
 */
function convertToMarkdown(pages: ExtractedPage[]): string {
  let markdown = '';

  for (const page of pages) {
    if (page.isEmpty) {
      markdown += `\n---\n*Page ${page.pageNumber} appears to be empty or contains only images*\n\n`;
      continue;
    }

    // Split text into lines
    const lines = page.text.split('\n').filter((line) => line.trim());

    // Process each line
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (!line) continue;

      // Detect headings (short lines with all caps or title case)
      if (isLikelyHeading(line)) {
        const level = detectHeadingLevel(line, i === 0);
        markdown += `\n${'#'.repeat(level)} ${line}\n\n`;
      }
      // Detect list items (lines starting with bullets, numbers, or dashes)
      else if (isLikelyListItem(line)) {
        markdown += `- ${line.replace(/^[\-•·\*\d+\.]\s*/, '')}\n`;
      }
      // Regular paragraph
      else {
        markdown += `${line}\n`;
      }
    }

    // Add page separator (except for last page)
    if (page.pageNumber < pages.length) {
      markdown += `\n---\n*Page ${page.pageNumber + 1}*\n\n`;
    }
  }

  return markdown.trim();
}

/**
 * Detect if a line is likely a heading
 */
function isLikelyHeading(line: string): boolean {
  // Short lines (< 80 chars) that are:
  // - All uppercase
  // - Title case
  // - End without punctuation
  if (line.length > 80) return false;

  const isAllCaps = line === line.toUpperCase() && /[A-Z]/.test(line);
  const isTitleCase = /^[A-Z][a-z]/.test(line);
  const endsWithoutPunctuation = !/[.,:;!?]$/.test(line);

  return (isAllCaps || isTitleCase) && endsWithoutPunctuation;
}

/**
 * Detect heading level (1-3)
 */
function detectHeadingLevel(line: string, isFirstLine: boolean): number {
  // First line of page is likely H1
  if (isFirstLine) return 1;

  // All caps is likely H2
  if (line === line.toUpperCase()) return 2;

  // Otherwise H3
  return 3;
}

/**
 * Detect if a line is likely a list item
 */
function isLikelyListItem(line: string): boolean {
  // Starts with bullet, number, or dash
  return /^[\-•·\*]\s+/.test(line) || /^\d+\.\s+/.test(line);
}

/**
 * Download text as markdown file
 */
export function downloadMarkdown(markdown: string, filename: string) {
  const blob = new Blob([markdown], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
  } else {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    document.execCommand('copy');
    textArea.remove();
  }
}
