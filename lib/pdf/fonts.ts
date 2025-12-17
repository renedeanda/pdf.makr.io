import { PDFDocument, PDFFont, StandardFonts } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';

/**
 * Detects if text contains emoji characters
 */
export function containsEmojis(text: string): boolean {
  // Emoji ranges
  const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2300}-\u{23FF}\u{2B50}\u{2B55}\u{231A}\u{231B}\u{2328}\u{23CF}\u{23E9}-\u{23F3}\u{23F8}-\u{23FA}\u{FE0F}\u{200D}]/u;
  return emojiRegex.test(text);
}

/**
 * Detects if text contains special Unicode characters (non-Latin-1 but not emojis)
 */
export function containsExtendedUnicode(text: string): boolean {
  // Check for characters outside standard ASCII/Latin-1, excluding emojis
  const extendedUnicodeRegex = /[^\u0000-\u00FF]/;
  return extendedUnicodeRegex.test(text) && !containsEmojis(text);
}

export function containsEmojisOrSpecialChars(text: string): boolean {
  return containsEmojis(text) || containsExtendedUnicode(text);
}

/**
 * Strips emojis from text
 */
export function stripEmojis(text: string): string {
  return text.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2300}-\u{23FF}\u{2B50}\u{2B55}\u{231A}\u{231B}\u{2328}\u{23CF}\u{23E9}-\u{23F3}\u{23F8}-\u{23FA}\u{FE0F}\u{200D}]/gu, '').trim();
}

/**
 * Loads and embeds a Unicode-compatible font (Noto Sans)
 */
export async function embedUnicodeFont(pdfDoc: PDFDocument): Promise<PDFFont> {
  try {
    // Register fontkit
    pdfDoc.registerFontkit(fontkit);

    // Fetch the Noto Sans font
    const fontUrl = '/fonts/NotoSans-Regular.ttf';
    const fontBytes = await fetch(fontUrl).then(res => res.arrayBuffer());

    // Embed the custom font
    const customFont = await pdfDoc.embedFont(fontBytes);
    return customFont;
  } catch (error) {
    console.warn('Failed to load Unicode font, falling back to standard font:', error);
    // Fallback to standard font if custom font fails
    return pdfDoc.embedFont(StandardFonts.Helvetica);
  }
}

/**
 * Gets the appropriate font based on text content
 * Returns custom font for Unicode text, standard font otherwise
 */
export async function getAppropriateFont(
  pdfDoc: PDFDocument,
  text: string,
  bold: boolean = false
): Promise<{ font: PDFFont; hasUnsupportedChars: boolean; cleanedText: string }> {
  const hasEmojis = containsEmojis(text);
  const hasExtendedUnicode = containsExtendedUnicode(text);

  // Strip emojis - they're not supported in PDFs
  const cleanedText = hasEmojis ? stripEmojis(text) : text;

  // If text has extended Unicode (but not emojis), use custom font
  if (hasExtendedUnicode) {
    try {
      const font = await embedUnicodeFont(pdfDoc);
      return { font, hasUnsupportedChars: false, cleanedText };
    } catch (error) {
      // If Unicode font fails, use standard font
      const font = await pdfDoc.embedFont(
        bold ? StandardFonts.HelveticaBold : StandardFonts.Helvetica
      );
      return { font, hasUnsupportedChars: true, cleanedText };
    }
  } else {
    // Use standard fonts for regular text
    const font = await pdfDoc.embedFont(
      bold ? StandardFonts.HelveticaBold : StandardFonts.Helvetica
    );
    return { font, hasUnsupportedChars: hasEmojis, cleanedText };
  }
}
