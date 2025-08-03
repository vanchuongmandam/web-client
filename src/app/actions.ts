'use server';

import { getLiteraryRecommendations, type LiteraryRecommendationsInput } from '@/ai/flows/literary-recommendations';

export async function getRecommendations(input: LiteraryRecommendationsInput) {
  try {
    const result = await getLiteraryRecommendations(input);
    return result;
  } catch (error) {
    console.error(error);
    return { recommendations: [], error: 'Failed to get recommendations.' };
  }
}
