import { Metadata } from 'next';
import EditMetadataClient from './edit-metadata-client';

export const metadata: Metadata = {
  title: 'Edit PDF Metadata | pdf.makr.io',
  description: 'Update PDF document metadata including title, author, subject, and keywords',
};

export default function EditMetadataPage() {
  return <EditMetadataClient />;
}
