'use server';

/**
 * @fileOverview AI-powered literary recommendations flow.
 *
 * - getLiteraryRecommendations - A function that provides literary recommendations based on a given text.
 * - LiteraryRecommendationsInput - The input type for the getLiteraryRecommendations function.
 * - LiteraryRecommendationsOutput - The return type for the getLiteraryRecommendations function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const LiteraryRecommendationsInputSchema = z.object({
  text: z.string().describe('The literary work to provide recommendations for.'),
});
export type LiteraryRecommendationsInput = z.infer<
  typeof LiteraryRecommendationsInputSchema
>;

const LiteraryRecommendationsOutputSchema = z.object({
  recommendations: z
    .array(z.string())
    .describe('List of recommended literary works.'),
});
export type LiteraryRecommendationsOutput = z.infer<
  typeof LiteraryRecommendationsOutputSchema
>;

export async function getLiteraryRecommendations(
  input: LiteraryRecommendationsInput
): Promise<LiteraryRecommendationsOutput> {
  return literaryRecommendationsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'literaryRecommendationsPrompt',
  input: {schema: LiteraryRecommendationsInputSchema},
  output: {schema: LiteraryRecommendationsOutputSchema},
  prompt: `You are a literary expert. Based on the following literary work, recommend other similar works considering style, theme and period.\n\nLiterary Work: {{{text}}}\n\nRecommendations:`,
});

const literaryRecommendationsFlow = ai.defineFlow(
  {
    name: 'literaryRecommendationsFlow',
    inputSchema: LiteraryRecommendationsInputSchema,
    outputSchema: LiteraryRecommendationsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
