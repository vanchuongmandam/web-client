import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";

const featuredContent = [
  {
    type: "Article",
    title: "The Symbolism of the Green Light in The Great Gatsby",
    description: "An in-depth analysis of one of literature's most famous symbols.",
    image: "https://placehold.co/600x400.png",
    dataAiHint: "books library",
    link: "/articles/the-great-gatsby-symbolism",
  },
  {
    type: "Poetry",
    title: "Ozymandias by Percy Bysshe Shelley",
    description: "A timeless sonnet on the ephemeral nature of power.",
    image: "https://placehold.co/600x400.png",
    dataAiHint: "desert ruins",
    link: "/library",
  },
  {
    type: "Prose",
    title: "A Modest Proposal by Jonathan Swift",
    description: "Unpacking the satire in Swift's most controversial work.",
    image: "https://placehold.co/600x400.png",
    dataAiHint: "vintage paper",
    link: "/articles/a-modest-proposal-satire",
  },
];

export default function Home() {
  return (
    <div>
      <section className="w-full py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
            <div className="flex flex-col justify-center space-y-4">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none font-headline">
                  Illuminate Your Mind
                </h1>
                <p className="max-w-[600px] text-foreground/80 md:text-xl font-body">
                  Welcome to Literary Lantern, a sanctuary for the curious reader. Explore timeless articles, poetry, and prose. Discover new perspectives.
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Link href="/articles">
                  <Button size="lg" className="w-full min-[400px]:w-auto">Explore Articles</Button>
                </Link>
                <Link href="/library">
                  <Button size="lg" variant="secondary" className="w-full min-[400px]:w-auto">Visit the Library</Button>
                </Link>
              </div>
            </div>
            <Image
              src="https://placehold.co/600x400.png"
              data-ai-hint="lantern library"
              width="600"
              height="400"
              alt="Hero"
              className="mx-auto aspect-video overflow-hidden rounded-xl object-cover sm:w-full lg:order-last"
            />
          </div>
        </div>
      </section>

      <section className="w-full py-12 md:py-24 bg-background/50">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl font-headline">Featured Works</h2>
              <p className="max-w-[900px] text-foreground/80 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed font-body">
                Dive into some of our curated selections of literary analysis and classic works.
              </p>
            </div>
          </div>
          <div className="mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 pt-12">
            {featuredContent.map((item) => (
              <Card key={item.title} className="flex flex-col overflow-hidden transition-transform transform hover:-translate-y-2 hover:shadow-xl">
                <CardHeader className="p-0">
                  <Image
                    src={item.image}
                    data-ai-hint={item.dataAiHint}
                    alt={item.title}
                    width={600}
                    height={400}
                    className="aspect-video object-cover"
                  />
                </CardHeader>
                <CardContent className="p-6 flex-grow">
                  <div className="text-xs uppercase font-semibold text-secondary-foreground tracking-wider">{item.type}</div>
                  <CardTitle className="mt-2 font-headline">{item.title}</CardTitle>
                  <CardDescription className="mt-2 font-body">{item.description}</CardDescription>
                </CardContent>
                <CardFooter className="p-6 pt-0">
                  <Link href={item.link} className="w-full">
                    <Button variant="outline" className="w-full">
                      Read More <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="w-full py-12 md:py-24 lg:py-32">
        <div className="container grid items-center justify-center gap-4 px-4 text-center md:px-6">
          <div className="space-y-3">
            <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight font-headline">Unlock Premium Access</h2>
            <p className="mx-auto max-w-[600px] text-foreground/80 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed font-body">
              Gain early access to new articles, exclusive downloads from our digital library, and support our work.
            </p>
          </div>
          <div className="mx-auto w-full max-w-sm space-y-2">
            <Link href="/premium">
              <Button size="lg" className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                Become a Member
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
