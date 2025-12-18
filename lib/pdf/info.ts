import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';

export interface PDFMetadata {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string;
  creator?: string;
  producer?: string;
  creationDate?: string;
  modificationDate?: string;
}

export interface PDFFileInfo {
  pageCount: number;
  fileSize: number;
  pdfVersion?: string;
}

export interface PDFSecurityInfo {
  isEncrypted: boolean;
  permissions?: {
    printing: boolean;
    modifying: boolean;
    copying: boolean;
    annotating: boolean;
  };
}

export interface PDFInfo {
  metadata: PDFMetadata;
  fileInfo: PDFFileInfo;
  security: PDFSecurityInfo;
}

/**
 * Get complete PDF information including metadata, file info, and security
 */
export async function getPDFInfo(file: File): Promise<PDFInfo> {
  const arrayBuffer = await file.arrayBuffer();

  // Use pdf-lib for metadata and security
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });

  // Extract metadata
  const metadata: PDFMetadata = {
    title: pdfDoc.getTitle() || undefined,
    author: pdfDoc.getAuthor() || undefined,
    subject: pdfDoc.getSubject() || undefined,
    keywords: pdfDoc.getKeywords() || undefined,
    creator: pdfDoc.getCreator() || undefined,
    producer: pdfDoc.getProducer() || undefined,
  };

  // Add dates if available
  const creationDate = pdfDoc.getCreationDate();
  const modDate = pdfDoc.getModificationDate();

  if (creationDate) {
    metadata.creationDate = creationDate.toISOString();
  }
  if (modDate) {
    metadata.modificationDate = modDate.toISOString();
  }

  // Get file info
  const fileInfo: PDFFileInfo = {
    pageCount: pdfDoc.getPageCount(),
    fileSize: file.size,
    // PDF version would require accessing private _pdfInfo, so we'll skip it
    pdfVersion: undefined,
  };

  // Get security info
  const isEncrypted = pdfDoc.isEncrypted;

  const security: PDFSecurityInfo = {
    isEncrypted,
  };

  // Note: pdf-lib doesn't provide granular permission info easily
  // We can expand this later if needed with raw PDF parsing

  return {
    metadata,
    fileInfo,
    security,
  };
}

/**
 * Export PDF info as JSON
 */
export function exportInfoAsJSON(info: PDFInfo, filename: string): void {
  const jsonString = JSON.stringify(info, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename.replace('.pdf', '')}_info.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Update PDF metadata
 */
export async function setMetadata(file: File, metadata: Partial<PDFMetadata>): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });

  // Set metadata fields (undefined values will clear the field)
  if (metadata.title !== undefined) {
    if (metadata.title) {
      pdfDoc.setTitle(metadata.title);
    }
  }

  if (metadata.author !== undefined) {
    if (metadata.author) {
      pdfDoc.setAuthor(metadata.author);
    }
  }

  if (metadata.subject !== undefined) {
    if (metadata.subject) {
      pdfDoc.setSubject(metadata.subject);
    }
  }

  if (metadata.keywords !== undefined) {
    if (metadata.keywords) {
      // setKeywords expects an array, so split comma-separated keywords
      const keywordsArray = metadata.keywords.split(',').map(k => k.trim()).filter(k => k.length > 0);
      pdfDoc.setKeywords(keywordsArray);
    }
  }

  if (metadata.creator !== undefined) {
    if (metadata.creator) {
      pdfDoc.setCreator(metadata.creator);
    }
  }

  if (metadata.producer !== undefined) {
    if (metadata.producer) {
      pdfDoc.setProducer(metadata.producer);
    }
  }

  // Update modification date to now
  pdfDoc.setModificationDate(new Date());

  return pdfDoc.save();
}
