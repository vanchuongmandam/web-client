import { getDocumentBySlug } from '@/lib/api';
import { notFound } from 'next/navigation';
import PDFViewerClient from './pdf-viewer-client';

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function ViewerPage({ params }: Props) {
  const { slug } = await params;
  const doc = await getDocumentBySlug(slug);
  if (!doc) notFound();
  
  return <PDFViewerClient documentId={doc._id} title={doc.title} />;
}
