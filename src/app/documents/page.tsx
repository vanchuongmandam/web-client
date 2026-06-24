// src/app/documents/page.tsx

import { getDocuments } from '@/lib/api';
import { getCategories } from '@/lib/api';
import type { Metadata } from 'next';
import { DocumentListClient } from './document-list-client';

export const metadata: Metadata = {
  title: 'Tài liệu | Văn Chương Mạn Đàm',
  description: 'Kho tài liệu văn học chất lượng cao - phân tích, bình giảng, đề thi và tài liệu ôn tập.',
};

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const page = typeof params.page === 'string' ? parseInt(params.page) : 1;
  const category = typeof params.category === 'string' ? params.category : undefined;
  const search = typeof params.search === 'string' ? params.search : undefined;
  const sort = typeof params.sort === 'string' ? params.sort : undefined;
  const grade = typeof params.grade === 'string' ? params.grade : undefined;
  const tag = typeof params.tag === 'string' ? params.tag : undefined;

  const [documentsRes, categories] = await Promise.all([
    getDocuments({ page, limit: 12, category, search, sort, grade, tag }),
    getCategories(),
  ]);

  return (
    <DocumentListClient
      initialDocuments={documentsRes.data}
      initialPagination={documentsRes.pagination}
      categories={categories}
      currentCategory={category}
      currentSearch={search}
      currentSort={sort}
      currentPage={page}
      currentGrade={grade}
      currentTag={tag}
    />
  );
}
