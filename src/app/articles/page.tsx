import Link from 'next/link';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';

const articles = [
  {
    slug: 'the-great-gatsby-symbolism',
    title: 'Tính biểu tượng của ánh sáng xanh trong The Great Gatsby',
    excerpt: 'Một phân tích chuyên sâu về một trong những biểu tượng nổi tiếng nhất của văn học, khám phá sự thể hiện của nó về hy vọng, Giấc mơ Mỹ và những khát vọng không thể đạt được.',
  },
  {
    slug: 'a-modest-proposal-satire',
    title: 'Giải mã nghệ thuật châm biếm trong Một đề nghị khiêm tốn',
    excerpt: 'Một cái nhìn sâu sắc về việc Jonathan Swift sử dụng bậc thầy sự mỉa mai và châm biếm để chỉ trích chính sách của Anh ở Ireland.',
  },
  {
    slug: 'frankenstein-and-the-prometheus-myth',
    title: 'Frankenstein như một Prometheus hiện đại',
    excerpt: 'Kiểm tra sự tương đồng giữa Victor Frankenstein của Mary Shelley và nhân vật thần thoại Prometheus.',
  },
    {
    slug: 'to-kill-a-mockingbird-moral-growth',
    title: 'Sự trưởng thành về đạo đức trong Giết con chim nhại',
    excerpt: 'Theo dõi sự phát triển của Scout, Jem và Dill khi họ đối mặt với những định kiến của xã hội.',
  },
];

export default function ArticlesPage() {
  return (
    <div className="container max-w-4xl py-12 md:py-20">
      <header className="mb-12 text-center">
        <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl font-headline">Bài viết</h1>
        <p className="mt-3 text-lg text-foreground/70">
          Những khám phá, tiểu luận và phân tích các tác phẩm văn học.
        </p>
      </header>
      <div className="space-y-8">
        {articles.map((article) => (
          <Link href={`/articles/${article.slug}`} key={article.slug} className="block group">
            <Card className="transition-all duration-300 ease-in-out hover:shadow-lg hover:border-primary/50">
              <CardHeader>
                <CardTitle className="font-headline group-hover:text-primary transition-colors">{article.title}</CardTitle>
                <CardDescription className="mt-2 text-base">{article.excerpt}</CardDescription>
                <div className="flex items-center mt-4 text-sm font-semibold text-primary">
                    Đọc bài viết
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
