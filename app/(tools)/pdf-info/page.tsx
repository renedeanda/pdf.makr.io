import { Metadata } from 'next';
import PDFInfoClient from './pdf-info-client';

export const metadata: Metadata = {
  title: 'PDF Info | pdf.makr.io',
  description: 'View PDF metadata, file properties, and security information',
};

export default function PDFInfoPage() {
  return <PDFInfoClient />;
}
