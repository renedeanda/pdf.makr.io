import { Metadata } from 'next';
import HeadersFootersClient from './headers-footers-client';

export const metadata: Metadata = {
  title: 'Headers & Footers | pdf.makr.io',
  description: 'Add dynamic headers and footers to PDF pages with page numbers, dates, and custom text',
};

export default function HeadersFootersPage() {
  return <HeadersFootersClient />;
}
