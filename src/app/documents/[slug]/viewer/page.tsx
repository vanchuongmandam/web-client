import { getDocumentBySlug } from '@/lib/api';
import { notFound } from 'next/navigation';
import PDFViewerWrapper from '@/components/pdf-viewer/pdf-viewer-wrapper';

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function ViewerPage({ params }: Props) {
  const { slug } = await params;
  const doc = await getDocumentBySlug(slug);
  if (!doc) notFound();
  
  return <PDFViewerWrapper documentId={doc._id} title={doc.title} />;
}
