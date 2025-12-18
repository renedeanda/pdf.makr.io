import { Metadata } from 'next';
import ExtractTextClient from './extract-text-client';

export const metadata: Metadata = {
  title: 'Extract Text to Markdown - PDF.makr.io',
  description: 'Extract text from PDF files and convert to markdown format. Copy for AI processing or download as .md file. Free online PDF text extraction tool.',
  openGraph: {
    title: 'Extract Text to Markdown - PDF.makr.io',
    description: 'Extract text from PDF files and convert to markdown format. Copy for AI processing or download as .md file.',
    images: ['/og-extract-text.png'],
  },
};

export default function ExtractTextPage() {
  return <ExtractTextClient />;
}
