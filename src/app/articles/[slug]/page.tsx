import Image from "next/image";
import { notFound } from "next/navigation";
import { articles } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import ReadingSuggestions from "./reading-suggestions";

export async function generateStaticParams() {
  return articles.map((article) => ({
    slug: article.slug,
  }));
}

export default function ArticlePage({ params }: { params: { slug: string } }) {
  const article = articles.find((p) => p.slug === params.slug);

  if (!article) {
    notFound();
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <article>
        <header className="mb-8">
          <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
            <Badge variant="secondary">{article.category}</Badge>
            <span>{article.date}</span>
          </div>
          <h1 className="font-headline text-4xl md:text-6xl font-extrabold tracking-tight text-primary">
            {article.title}
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Bởi <span className="font-semibold text-foreground">{article.author}</span>
          </p>
        </header>

        <div className="relative w-full aspect-video rounded-lg overflow-hidden mb-8">
          <Image
            src={article.imageUrl}
            alt={article.title}
            fill
            className="object-cover"
            data-ai-hint={article.imageHint}
            priority
          />
        </div>

        <div className="prose prose-lg dark:prose-invert max-w-none prose-p:font-body prose-headings:font-headline">
          {article.content.split('\n\n').map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      </article>

      <Separator className="my-12" />

      <ReadingSuggestions articleContent={article.content} />
    </div>
  );
}
