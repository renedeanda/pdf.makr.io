export interface PDFFile {
  id: string;
  file: File;
  name: string;
  size: number;
  pageCount: number;
  thumbnail?: string;
}

export interface PageRange {
  start: number;
  end: number;
}

export interface ProcessingProgress {
  progress: number;
  status: string;
}

export interface ProcessingResult {
  success: boolean;
  data?: Uint8Array;
  error?: string;
  filename?: string;
}

export interface CompressionLevel {
  level: 'low' | 'medium' | 'high';
  quality: number;
  label: string;
  description: string;
}

export interface ImageConversionOptions {
  format: 'png' | 'jpg';
  dpi: number;
  pageNumbers?: number[];
}

export interface ImageToPDFOptions {
  pageSize: 'A4' | 'Letter' | 'Fit';
  orientation: 'portrait' | 'landscape';
  margin: number;
}

export interface PageInfo {
  pageNumber: number;
  width: number;
  height: number;
  rotation: number;
  selected?: boolean;
}

export type RotationAngle = 0 | 90 | 180 | 270;

export interface ToolConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  href: string;
  category: 'organize' | 'convert' | 'edit' | 'security';
}
