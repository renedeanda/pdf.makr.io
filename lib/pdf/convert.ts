import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';

// Helper to get pdfjs with worker configured
async function getPdfjsLib() {
  const pdfjsLib = await import('pdfjs-dist');
  if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
  }
  return pdfjsLib;
}

export interface ConversionProgress {
  current: number;
  total: number;
  percentage: number;
  status: string;
}

export interface ImageOutput {
  data: Blob;
  filename: string;
  pageNumber: number;
}

export async function pdfToImages(
  file: File,
  options: {
    format: 'png' | 'jpg';
    dpi: number;
    pageNumbers?: number[];
  },
  onProgress?: (progress: ConversionProgress) => void
): Promise<ImageOutput[]> {
  try {
    console.log('Starting PDF to images conversion...', { fileSize: file.size, format: options.format, dpi: options.dpi });

    onProgress?.({
      current: 0,
      total: 1,
      percentage: 5,
      status: 'Loading PDF...',
    });

    const pdfjsLib = await getPdfjsLib();
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    const totalPages = pdfDoc.numPages;
    const pages = options.pageNumbers || Array.from({ length: totalPages }, (_, i) => i + 1);
    const scale = options.dpi / 72; // PDF is 72 DPI by default

    console.log('PDF loaded, converting', pages.length, 'pages at', options.dpi, 'DPI');

    const images: ImageOutput[] = [];
    const baseName = file.name.replace('.pdf', '');

    for (let i = 0; i < pages.length; i++) {
      const pageNum = pages[i];
      const baseProgress = 5 + Math.round((i / pages.length) * 90);

      onProgress?.({
        current: i + 1,
        total: pages.length,
        percentage: baseProgress,
        status: `Converting page ${pageNum} of ${pages.length}`,
      });

      console.log(`Converting page ${pageNum}`);

    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not get canvas context');

    // White background for JPG
    if (options.format === 'jpg') {
      context.fillStyle = 'white';
      context.fillRect(0, 0, canvas.width, canvas.height);
    }

    await page.render({
      canvasContext: context,
      viewport,
      canvas,
    }).promise;

    const mimeType = options.format === 'png' ? 'image/png' : 'image/jpeg';
    const quality = options.format === 'jpg' ? 0.92 : undefined;

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => {
          if (b) resolve(b);
          else reject(new Error('Failed to create blob'));
        },
        mimeType,
        quality
      );
    });

    images.push({
      data: blob,
      filename: `${baseName}_page_${pageNum}.${options.format}`,
      pageNumber: pageNum,
    });

    canvas.remove();

    // Yield to main thread to allow UI updates (critical for mobile)
    await new Promise(resolve => setTimeout(resolve, 0));
  }

  onProgress?.({
    current: pages.length,
    total: pages.length,
    percentage: 100,
    status: 'Complete!',
  });

  console.log('Conversion complete!', images.length, 'images created');

  return images;
  } catch (error) {
    console.error('PDF to images conversion error:', error);
    throw new Error(
      error instanceof Error
        ? `Conversion failed: ${error.message}`
        : 'Failed to convert PDF to images. The file may be too large or corrupted.'
    );
  }
}

export async function imagesToPDF(
  files: File[],
  options: {
    pageSize: 'A4' | 'Letter' | 'Fit';
    orientation: 'portrait' | 'landscape';
    margin: number;
  },
  onProgress?: (progress: ConversionProgress) => void
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();

  const pageSizes = {
    A4: { width: 595, height: 842 },
    Letter: { width: 612, height: 792 },
  };

  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    onProgress?.({
      current: i + 1,
      total: files.length,
      percentage: Math.round(((i + 1) / files.length) * 100),
      status: `Processing ${file.name}`,
    });

    const arrayBuffer = await file.arrayBuffer();

    // Embed image based on type
    let image;
    const fileType = file.type.toLowerCase();

    if (fileType === 'image/png' || file.name.toLowerCase().endsWith('.png')) {
      image = await pdfDoc.embedPng(arrayBuffer);
    } else if (fileType === 'image/jpeg' || fileType === 'image/jpg' ||
               file.name.toLowerCase().endsWith('.jpg') || file.name.toLowerCase().endsWith('.jpeg')) {
      image = await pdfDoc.embedJpg(arrayBuffer);
    } else {
      // Try to convert other formats via canvas
      const img = await loadImageFromFile(file);
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');
      ctx.drawImage(img, 0, 0);

      const jpgData = await new Promise<ArrayBuffer>((resolve) => {
        canvas.toBlob(async (blob) => {
          if (blob) {
            resolve(await blob.arrayBuffer());
          }
        }, 'image/jpeg', 0.92);
      });

      image = await pdfDoc.embedJpg(jpgData);
      canvas.remove();
    }

    // Calculate page dimensions
    let pageWidth: number, pageHeight: number;

    if (options.pageSize === 'Fit') {
      pageWidth = image.width + options.margin * 2;
      pageHeight = image.height + options.margin * 2;
    } else {
      const size = pageSizes[options.pageSize];
      pageWidth = options.orientation === 'portrait' ? size.width : size.height;
      pageHeight = options.orientation === 'portrait' ? size.height : size.width;
    }

    const page = pdfDoc.addPage([pageWidth, pageHeight]);

    // Calculate image position (centered with margins)
    const availableWidth = pageWidth - 2 * options.margin;
    const availableHeight = pageHeight - 2 * options.margin;

    const scale = Math.min(
      availableWidth / image.width,
      availableHeight / image.height,
      1 // Don't scale up
    );

    const scaledWidth = image.width * scale;
    const scaledHeight = image.height * scale;

    const x = (pageWidth - scaledWidth) / 2;
    const y = (pageHeight - scaledHeight) / 2;

    page.drawImage(image, {
      x,
      y,
      width: scaledWidth,
      height: scaledHeight,
    });
  }

  return pdfDoc.save();
}

async function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

export async function createImagesZip(images: ImageOutput[]): Promise<Uint8Array> {
  const zip = new JSZip();

  for (const image of images) {
    zip.file(image.filename, image.data);
  }

  return zip.generateAsync({ type: 'uint8array' });
}
