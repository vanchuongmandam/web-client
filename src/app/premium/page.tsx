import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Star } from 'lucide-react';

const premiumFeatures = [
  "Early access to new articles and essays.",
  "Unlimited downloads from our digital library.",
  "Access to exclusive premium-only content.",
  "Ad-free reading experience.",
  "Support independent literary analysis.",
];

export default function PremiumPage() {
  return (
    <div className="container max-w-4xl py-12 md:py-20">
      <div className="grid md:grid-cols-2 gap-12 items-center">
        <div>
          <h1 className="font-headline text-4xl font-extrabold tracking-tight lg:text-5xl">
            Go Premium
          </h1>
          <p className="mt-4 text-xl text-foreground/80">
            Unlock the full experience of Literary Lantern and support our mission to keep literary discovery alive.
          </p>
          <ul className="mt-8 space-y-4">
            {premiumFeatures.map((feature, index) => (
              <li key={index} className="flex items-start">
                <div className="rounded-full bg-secondary p-1 mr-4">
                  <Check className="h-4 w-4 text-secondary-foreground" />
                </div>
                <span className="flex-1 text-lg">{feature}</span>
              </li>
            ))}
          </ul>
        </div>
        <Card className="bg-gradient-to-br from-card to-background">
          <CardHeader className="text-center">
            <Star className="mx-auto h-12 w-12 text-accent" />
            <CardTitle className="font-headline text-3xl mt-4">Become a Member</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <p className="text-4xl font-bold font-headline">$5<span className="text-xl font-body text-muted-foreground">/month</span></p>
            <p className="text-muted-foreground">Billed annually, or $7 month-to-month.</p>
            <Link href="/signup" className="w-full block">
              <Button size="lg" className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                Sign Up Now
              </Button>
            </Link>
             <p className="text-sm text-muted-foreground">Already a member? <Link href="/login" className="underline text-primary">Log in</Link>.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
