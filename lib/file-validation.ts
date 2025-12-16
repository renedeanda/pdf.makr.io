import { getDeviceInfo } from './performance';

export interface ValidationResult {
  valid: boolean;
  error?: string;
  warning?: string;
  fileSize: number;
  estimatedProcessingTime?: string;
}

export interface ValidationOptions {
  maxSizeDesktop?: number;
  maxSizeMobile?: number;
  warningSizeDesktop?: number;
  warningSizeMobile?: number;
  allowedTypes?: string[];
  checkIntegrity?: boolean;
}

const DEFAULT_OPTIONS: Required<ValidationOptions> = {
  maxSizeDesktop: 200 * 1024 * 1024, // 200MB
  maxSizeMobile: 50 * 1024 * 1024,   // 50MB
  warningSizeDesktop: 50 * 1024 * 1024,  // 50MB
  warningSizeMobile: 10 * 1024 * 1024,   // 10MB
  allowedTypes: ['application/pdf'],
  checkIntegrity: true,
};

export async function validateFile(
  file: File,
  options: ValidationOptions = {}
): Promise<ValidationResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const deviceInfo = getDeviceInfo();
  const isMobile = deviceInfo.isMobile;

  // Check file type
  if (opts.allowedTypes.length > 0 && !opts.allowedTypes.includes(file.type)) {
    // Also check file extension as fallback
    const extension = file.name.split('.').pop()?.toLowerCase();
    const validExtension = extension === 'pdf';

    if (!validExtension) {
      return {
        valid: false,
        error: 'Invalid file type. Please upload a PDF file.',
        fileSize: file.size,
      };
    }
  }

  // Check file size limits
  const maxSize = isMobile ? opts.maxSizeMobile : opts.maxSizeDesktop;
  const warningSize = isMobile ? opts.warningSizeMobile : opts.warningSizeDesktop;

  if (file.size > maxSize) {
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(0);
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File is too large (${fileSizeMB}MB). Maximum size for ${isMobile ? 'mobile' : 'desktop'} is ${maxSizeMB}MB. Please try on ${isMobile ? 'a desktop computer' : 'splitting the PDF first'}.`,
      fileSize: file.size,
    };
  }

  let warning: string | undefined;
  let estimatedTime: string | undefined;

  // Warning for large files
  if (file.size > warningSize) {
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
    warning = `Large file detected (${fileSizeMB}MB). Processing may take a while${isMobile ? ' on mobile devices' : ''}.`;

    // Estimate processing time (very rough)
    const timePerMB = isMobile ? 3 : 1; // seconds per MB
    const estimatedSeconds = (file.size / (1024 * 1024)) * timePerMB;

    if (estimatedSeconds < 60) {
      estimatedTime = `~${Math.ceil(estimatedSeconds)}s`;
    } else {
      estimatedTime = `~${Math.ceil(estimatedSeconds / 60)}m`;
    }
  }

  // Basic PDF integrity check
  if (opts.checkIntegrity) {
    try {
      const arrayBuffer = await file.slice(0, 1024).arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);

      // Check PDF header
      const header = String.fromCharCode(...Array.from(bytes.slice(0, 5)));
      if (!header.startsWith('%PDF-')) {
        return {
          valid: false,
          error: 'Invalid PDF file. The file appears to be corrupted or is not a valid PDF.',
          fileSize: file.size,
        };
      }
    } catch (error) {
      console.error('Failed to check PDF integrity:', error);
      // Don't fail validation if we can't check - let the processing handle it
    }
  }

  return {
    valid: true,
    warning,
    fileSize: file.size,
    estimatedProcessingTime: estimatedTime,
  };
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export function getFileSizeCategory(bytes: number, isMobile: boolean): 'small' | 'medium' | 'large' | 'very-large' {
  const mbSize = bytes / (1024 * 1024);

  if (isMobile) {
    if (mbSize < 5) return 'small';
    if (mbSize < 10) return 'medium';
    if (mbSize < 25) return 'large';
    return 'very-large';
  } else {
    if (mbSize < 10) return 'small';
    if (mbSize < 50) return 'medium';
    if (mbSize < 100) return 'large';
    return 'very-large';
  }
}
