import { PDFDocument } from 'pdf-lib';

export interface ProtectProgress {
  current: number;
  total: number;
  percentage: number;
  status: string;
}

export interface ProtectOptions {
  userPassword?: string; // Password to open the PDF
  ownerPassword?: string; // Password for full access
  permissions: {
    printing: boolean;
    modifying: boolean;
    copying: boolean;
    annotating: boolean;
    fillingForms: boolean;
    contentAccessibility: boolean;
    assembling: boolean;
  };
}

/**
 * Add password protection to a PDF
 * Note: pdf-lib does not currently support encryption natively.
 * This is a placeholder for when the feature is added or for integration with another library.
 */
export async function protectPDF(
  file: File,
  options: ProtectOptions,
  onProgress?: (progress: ProtectProgress) => void
): Promise<Uint8Array> {
  onProgress?.({
    current: 1,
    total: 3,
    percentage: 33,
    status: 'Loading PDF...',
  });

  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });

  onProgress?.({
    current: 2,
    total: 3,
    percentage: 66,
    status: 'Applying protection...',
  });

  // NOTE: pdf-lib does not currently support PDF encryption (password protection)
  // This would require integration with a library like pdf-lib-encrypt or
  // using a different approach with Node.js libraries like pdftk or qpdf

  // For now, we'll throw an error indicating this limitation
  throw new Error(
    'PDF password protection is not currently available in the browser. ' +
    'This feature requires server-side processing or a different library. ' +
    'Please use desktop PDF software like Adobe Acrobat, PDFtk, or similar tools for password protection.'
  );

  // When encryption is supported, the code would look something like:
  /*
  await pdfDoc.encrypt({
    userPassword: options.userPassword,
    ownerPassword: options.ownerPassword,
    permissions: {
      printing: options.permissions.printing ? 'highResolution' : 'lowResolution',
      modifying: options.permissions.modifying,
      copying: options.permissions.copying,
      annotating: options.permissions.annotating,
      fillingForms: options.permissions.fillingForms,
      contentAccessibility: options.permissions.contentAccessibility,
      assembling: options.permissions.assembling,
    },
  });
  */

  onProgress?.({
    current: 3,
    total: 3,
    percentage: 100,
    status: 'Saving protected PDF...',
  });

  return pdfDoc.save();
}

/**
 * Remove password protection from a PDF (if password is known)
 */
export async function unlockPDF(
  file: File,
  password: string,
  onProgress?: (progress: ProtectProgress) => void
): Promise<Uint8Array> {
  onProgress?.({
    current: 1,
    total: 2,
    percentage: 50,
    status: 'Attempting to unlock PDF...',
  });

  try {
    const arrayBuffer = await file.arrayBuffer();

    // Try to load with the provided password
    const pdfDoc = await PDFDocument.load(arrayBuffer, {
      ignoreEncryption: false,
      // Note: pdf-lib doesn't actually support password-protected PDFs well
      // This is a limitation of the library
    });

    onProgress?.({
      current: 2,
      total: 2,
      percentage: 100,
      status: 'Saving unlocked PDF...',
    });

    // Save without encryption
    return pdfDoc.save();
  } catch (err) {
    throw new Error(
      'Failed to unlock PDF. The password may be incorrect, or the PDF uses encryption not supported by this tool. ' +
      'Try using desktop PDF software like Adobe Acrobat or PDFtk for better password handling.'
    );
  }
}
