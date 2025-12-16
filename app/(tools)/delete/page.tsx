import { Metadata } from 'next';
import DeleteClient from './delete-client';

export const metadata: Metadata = {
  title: 'Delete PDF Pages - Remove Unwanted Pages',
  description: 'Free online PDF page remover. Delete unwanted pages from your PDF. Works in your browser, no uploads required.',
  keywords: ['delete PDF pages', 'remove PDF pages', 'PDF page remover', 'edit PDF'],
  openGraph: {
    title: 'Delete PDF Pages - Remove Unwanted Pages | pdf.makr.io',
    description: 'Free online PDF page remover. Delete unwanted pages from your PDF. Works in your browser, no uploads required.',
    url: 'https://pdf.makr.io/delete',
    images: [{ url: '/og-delete.png', width: 1200, height: 630 }],
  },
  alternates: {
    canonical: 'https://pdf.makr.io/delete',
  },
};

export default function DeletePage() {
  return <DeleteClient />;
}
