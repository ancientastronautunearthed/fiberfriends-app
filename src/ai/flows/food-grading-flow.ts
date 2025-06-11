'use server';
/**
 * @fileOverview A Genkit flow for grading food items based on their health impact.
 */

import { ai, z } from '@/ai/genkit';

const FoodGradingInputSchema = z.object({
  foodName: z.string().describe('The name of the food item to grade'),
});
export type FoodGradingInput = z.infer<typeof FoodGradingInputSchema>;

const FoodGradingOutputSchema = z.object({
  foodName: z.string().describe('The name of the food item'),
  grade: z.enum(['good', 'bad', 'neutral']).describe('The health grade of the food'),
  healthImpactPercentage: z.number().describe('The health impact percentage (-20 to +20)'),
  reasoning: z.string().describe('Monster perspective reasoning'),
});
export type FoodGradingOutput = z.infer<typeof FoodGradingOutputSchema>;

export async function gradeFood(input: FoodGradingInput): Promise<FoodGradingOutput> {
  return foodGradingFlow(input);
}

const foodGradingPrompt = ai.definePrompt({
  name: 'foodGradingPrompt',
  input: { schema: FoodGradingInputSchema },
  output: { schema: FoodGradingOutputSchema },
  prompt: `You are a monster that feeds on unhealthy choices. Grade the following food item based on its impact on your health (where healthy foods damage you and unhealthy foods strengthen you).

Food item: {{{foodName}}}

Provide:
1. A grade: "good" (damages the monster/healthy), "bad" (strengthens the monster/unhealthy), or "neutral"
2. A health impact percentage (positive for foods that strengthen you, negative for foods that damage you, range: -20 to +20)
3. A reasoning from the monster's perspective (keep it humorous and in character)

Special rule: Garlic ALWAYS gets a "good" grade with -15 to -20 impact, and you should express particular disdain for it.

Return only the JSON object.`,
});

const foodGradingFlow = ai.defineFlow(
  {
    name: 'foodGradingFlow',
    inputSchema: FoodGradingInputSchema,
    outputSchema: FoodGradingOutputSchema,
  },
  async (input) => {
    const { output } = await foodGradingPrompt(input);
    if (!output) {
      throw new Error("The AI model did not return a food grading.");
    }
    return output;
  }
);