'use server';

/**
 * @fileOverview AI-powered reading suggestions based on the current article.
 *
 * - getReadingSuggestions - A function that provides reading suggestions.
 * - ReadingSuggestionsInput - The input type for the getReadingSuggestions function.
 * - ReadingSuggestionsOutput - The return type for the getReadingSuggestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ReadingSuggestionsInputSchema = z.object({
  articleContent: z
    .string()
    .describe('The content of the current article.'),
});
export type ReadingSuggestionsInput = z.infer<typeof ReadingSuggestionsInputSchema>;

const ReadingSuggestionsOutputSchema = z.object({
  suggestions: z
    .array(z.string())
    .describe('A list of suggested readings or authors.'),
});
export type ReadingSuggestionsOutput = z.infer<typeof ReadingSuggestionsOutputSchema>;

export async function getReadingSuggestions(
  input: ReadingSuggestionsInput
): Promise<ReadingSuggestionsOutput> {
  return readingSuggestionsFlow(input);
}

const readingSuggestionsPrompt = ai.definePrompt({
  name: 'readingSuggestionsPrompt',
  input: {schema: ReadingSuggestionsInputSchema},
  output: {schema: ReadingSuggestionsOutputSchema},
  prompt: `You are a literary expert. Based on the following article content, suggest readings or authors that the user might find interesting.

Article Content:
{{{articleContent}}}

Suggestions:`,
});

const readingSuggestionsFlow = ai.defineFlow(
  {
    name: 'readingSuggestionsFlow',
    inputSchema: ReadingSuggestionsInputSchema,
    outputSchema: ReadingSuggestionsOutputSchema,
  },
  async input => {
    const {output} = await readingSuggestionsPrompt(input);
    return output!;
  }
);
