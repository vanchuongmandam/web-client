// src/app/documents/[slug]/page.tsx

import { getDocumentBySlug } from '@/lib/api';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { DocumentDetailClient } from './document-detail-client';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const doc = await getDocumentBySlug(slug);
  if (!doc) return { title: 'Tài liệu không tồn tại' };
  return {
    title: `${doc.title} | Văn Chương Mạn Đàm`,
    description: doc.description,
  };
}

export default async function DocumentDetailPage({ params }: Props) {
  const { slug } = await params;
  const doc = await getDocumentBySlug(slug);
  if (!doc) notFound();
  return <DocumentDetailClient document={doc!} />;
}
