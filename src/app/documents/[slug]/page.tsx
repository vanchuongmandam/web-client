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
  
  let descriptionText = '';
  if (typeof doc.description === 'string') {
    descriptionText = doc.description;
  } else if (doc.description && typeof doc.description === 'object') {
    // Basic extraction for TipTap JSON
    try {
      const extractText = (node: any): string => {
        if (node.type === 'text') return node.text || '';
        if (node.content && Array.isArray(node.content)) {
          return node.content.map(extractText).join(' ');
        }
        return '';
      };
      descriptionText = extractText(doc.description);
    } catch (e) {
      descriptionText = 'Tài liệu tham khảo trên Văn Chương Mạn Đàm';
    }
  }

  return {
    title: `${doc.title} | Văn Chương Mạn Đàm`,
    description: descriptionText.substring(0, 160) || 'Tài liệu tham khảo trên Văn Chương Mạn Đàm',
  };
}

export default async function DocumentDetailPage({ params }: Props) {
  const { slug } = await params;
  const doc = await getDocumentBySlug(slug);
  if (!doc) notFound();
  return <DocumentDetailClient document={doc!} />;
}
