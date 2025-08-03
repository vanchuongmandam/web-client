import { RecommendationEngine } from '@/components/recommendation-engine';

const articleContent = `The green light, an almost mystical beacon at the end of Daisy's dock, is arguably one of the most potent symbols in American literature. For Jay Gatsby, it represents his undying hope and the seemingly unattainable dream of recapturing the past with Daisy Buchanan. It is a tangible link to his idealized version of her, a constant reminder of the distance that separates them, both physically across the water and emotionally through time and social class.

This single, unwavering light embodies the essence of the American Dream, a concept central to F. Scott Fitzgerald's critique of 1920s society. It suggests that the dream is always just out of reach, a shimmering illusion that fuels ambition but ultimately leads to disillusionment. Gatsby's relentless pursuit of the green light is a testament to his "extraordinary gift for hope," a quality that Nick Carraway both admires and pities. The light's color itself is significant; green symbolizes not only hope and renewal but also wealth and envy, reflecting the complex motivations driving the characters. Ultimately, the green light serves as a powerful metaphor for the elusive nature of happiness and the tragic consequences of clinging to an idealized past.`;

const moreContent = `Throughout the novel, the significance of the light evolves. Initially, it is a private symbol for Gatsby, a personal totem of his love. As Nick observes Gatsby reaching for it across the bay, it's a moment of profound loneliness and longing. Later, as Gatsby and Daisy are briefly reunited, the light's symbolic power seems to diminish for him. "You can't repeat the past," Nick warns, but Gatsby's entire existence is a testament to his refusal to believe it. His mansion, his parties, his wealth—all are constructs built to lure Daisy back, to turn back time to their romantic beginnings.

In the end, as Nick reflects on Gatsby's dream, the green light transcends Gatsby's personal quest and becomes a universal symbol for all human aspiration. "Gatsby believed in the green light, the orgastic future that year by year recedes before us. It eluded us then, but that’s no matter—tomorrow we will run faster, stretch out our arms farther. . . . And one fine morning—— So we beat on, boats against the current, borne back ceaselessly into the past."`;


export default function ArticlePage({ params }: { params: { slug: string } }) {
  const title = params.slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  
  return (
    <div className="container max-w-3xl py-12 md:py-20">
      <article>
        <header className="mb-8 text-center">
          <h1 className="font-headline text-4xl font-extrabold tracking-tight lg:text-5xl">
            {title}
          </h1>
          <p className="mt-4 text-sm text-muted-foreground">Posted by Literary Lantern Staff on {new Date().toLocaleDateString()}</p>
        </header>

        <div className="space-y-6 text-lg font-body leading-relaxed text-foreground/90">
          <p>{articleContent}</p>
          <p>{moreContent}</p>
        </div>
        
        <RecommendationEngine text={`${articleContent}\n${moreContent}`} />
      </article>
    </div>
  );
}
