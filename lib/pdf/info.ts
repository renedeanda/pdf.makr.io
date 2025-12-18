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

  // Get file info using pdfjs for version
  const pdfjsLib = await import('pdfjs-dist');
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdfjs = await loadingTask.promise;

  const fileInfo: PDFFileInfo = {
    pageCount: pdfDoc.getPageCount(),
    fileSize: file.size,
    pdfVersion: pdfjs.pdfInfo.version || undefined,
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
