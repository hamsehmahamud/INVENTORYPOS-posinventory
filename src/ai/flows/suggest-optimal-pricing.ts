'use server';

/**
 * @fileOverview AI agent that suggests optimal pricing for products.
 *
 * - suggestOptimalPricing - A function that suggests the optimal price for a product.
 * - SuggestOptimalPricingInput - The input type for the suggestOptimalPricing function.
 * - SuggestOptimalPricingOutput - The return type for the suggestOptimalPricing function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestOptimalPricingInputSchema = z.object({
  productName: z.string().describe('The name of the product.'),
  salesTrends: z.string().describe('Recent sales trends for the product.'),
  competitorPrices: z.string().describe('Competitor prices for the product.'),
  marketDemand: z.string().describe('Current market demand for the product.'),
});
export type SuggestOptimalPricingInput = z.infer<typeof SuggestOptimalPricingInputSchema>;

const SuggestOptimalPricingOutputSchema = z.object({
  suggestedPrice: z.number().describe('The suggested optimal price for the product.'),
  reasoning: z.string().describe('The reasoning behind the suggested price.'),
});
export type SuggestOptimalPricingOutput = z.infer<typeof SuggestOptimalPricingOutputSchema>;

export async function suggestOptimalPricing(input: SuggestOptimalPricingInput): Promise<SuggestOptimalPricingOutput> {
  return suggestOptimalPricingFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestOptimalPricingPrompt',
  input: {schema: SuggestOptimalPricingInputSchema},
  output: {schema: SuggestOptimalPricingOutputSchema},
  prompt: `You are an expert pricing strategist. Based on the following information, suggest an optimal price for the product and explain your reasoning.\n\nProduct Name: {{{productName}}}\nSales Trends: {{{salesTrends}}}\nCompetitor Prices: {{{competitorPrices}}}\nMarket Demand: {{{marketDemand}}}\n\nConsider all factors to maximize profit while remaining competitive. Return the suggested price as a number, and your reasoning in a brief paragraph.`,
});

const suggestOptimalPricingFlow = ai.defineFlow(
  {
    name: 'suggestOptimalPricingFlow',
    inputSchema: SuggestOptimalPricingInputSchema,
    outputSchema: SuggestOptimalPricingOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
