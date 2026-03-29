import type { MetadataRoute } from 'next';
import { getArticles, getCategories } from '@/lib/api';

const BASE_URL = 'https://vanchuongmandam.thptchuyenhatinh.edu.vn';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/articles`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
  ];

  // Add all article pages
  try {
    const articles = await getArticles({ limit: 500 });
    for (const article of articles) {
      entries.push({
        url: `${BASE_URL}/articles/${article.slug}`,
        lastModified: new Date(article.updatedAt || article.createdAt),
        changeFrequency: 'weekly',
        priority: 0.7,
      });
    }
  } catch {
    // If API is down, return static entries only
  }

  // Add category listing pages
  try {
    const categories = await getCategories();
    for (const category of categories) {
      entries.push({
        url: `${BASE_URL}/articles?category=${category.slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.6,
      });
      for (const child of category.children || []) {
        entries.push({
          url: `${BASE_URL}/articles?category=${child.slug}`,
          lastModified: new Date(),
          changeFrequency: 'weekly',
          priority: 0.5,
        });
      }
    }
  } catch {
    // If API is down, skip categories
  }

  return entries;
}
