import { Metadata } from 'next';
import OrganizeClient from './organize-client';

export const metadata: Metadata = {
  title: 'Organize PDF Pages - PDF.makr.io',
  description: 'Reorder PDF pages with drag-and-drop. Reorganize, rearrange, and sort pages in your PDF documents. Free online PDF page organizer.',
  openGraph: {
    title: 'Organize PDF Pages - PDF.makr.io',
    description: 'Reorder PDF pages with drag-and-drop. Reorganize, rearrange, and sort pages in your PDF documents.',
    images: ['/og-organize.png'],
  },
};

export default function OrganizePage() {
  return <OrganizeClient />;
}
