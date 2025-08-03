import Link from 'next/link';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';

const articles = [
  {
    slug: 'the-great-gatsby-symbolism',
    title: 'The Symbolism of the Green Light in The Great Gatsby',
    excerpt: 'An in-depth analysis of one of literature\'s most famous symbols, exploring its representation of hope, the American Dream, and unattainable desires.',
  },
  {
    slug: 'a-modest-proposal-satire',
    title: 'Unpacking the Satire in A Modest Proposal',
    excerpt: 'A deep dive into Jonathan Swift\'s masterful use of irony and satire to critique British policy in Ireland.',
  },
  {
    slug: 'frankenstein-and-the-prometheus-myth',
    title: 'Frankenstein as a Modern Prometheus',
    excerpt: 'Examining the parallels between Mary Shelley\'s Victor Frankenstein and the mythological figure of Prometheus.',
  },
    {
    slug: 'to-kill-a-mockingbird-moral-growth',
    title: 'Moral Growth in To Kill a Mockingbird',
    excerpt: 'Tracing the development of Scout, Jem, and Dill as they confront the prejudices of their society.',
  },
];

export default function ArticlesPage() {
  return (
    <div className="container max-w-4xl py-12 md:py-20">
      <header className="mb-12 text-center">
        <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl font-headline">Articles</h1>
        <p className="mt-3 text-lg text-foreground/70">
          Explorations, essays, and analyses of literary works.
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
                    Read article
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
