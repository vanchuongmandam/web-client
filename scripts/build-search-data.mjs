
import { writeFileSync } from 'fs';
import { join } from 'path';
import 'dotenv/config'; // Load environment variables

async function buildSearchData() {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000'; // Fallback to localhost
  const ARTICLES_API_URL = `${API_BASE_URL}/articles`; // Corrected endpoint as per user's input

  console.log(`Attempting to fetch articles from: ${ARTICLES_API_URL}`);

  try {
    const response = await fetch(ARTICLES_API_URL);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status} from ${ARTICLES_API_URL}`);
    }
    const articles = await response.json();

    const searchData = articles.map(article => ({
      id: article._id, // *** ADDED THIS LINE: Using _id from API as unique key ***
      slug: article.slug,
      title: article.title,
      // You might need to adjust 'content_snippet' based on your actual article structure
      // For now, let's assume 'content' field exists and we take a substring
      content_snippet: article.content ? article.content.substring(0, 200) + '...' : '',
      category_slug: article.category?.slug, // Assuming category is an object with a slug
      date: article.publishedAt || article.createdAt, // Use publishedAt if available, otherwise createdAt
    }));

    const outputPath = join(process.cwd(), 'public', 'search-data.json');
    writeFileSync(outputPath, JSON.stringify(searchData, null, 2));

    console.log('Search data built successfully to public/search-data.json');
  } catch (error) {
    console.error('Failed to build search data:', error);
    process.exit(1);
  }
}

buildSearchData();
