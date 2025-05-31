
'use server';
/**
 * @fileOverview A Genkit flow for suggesting healthy, "monster-killing" meals.
 *
 * - suggestMeal - Suggests a meal based on the meal type.
 * - MealSuggestionInput - The input type for the suggestMeal function.
 * - MealSuggestionOutput - The return type for the suggestMeal function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MealSuggestionInputSchema = z.object({
  mealType: z.enum(["breakfast", "lunch", "dinner", "snack"]).describe('The type of meal for which a suggestion is needed.'),
});
export type MealSuggestionInput = z.infer<typeof MealSuggestionInputSchema>;

const MealSuggestionOutputSchema = z.object({
  suggestedMealName: z.string().describe('The name of the suggested healthy meal.'),
  shortDescription: z.string().describe('A brief, appealing description of the meal.'),
  monsterImpactStatement: z.string().describe("A short, in-character statement from the user's 'monster' about how much it dreads this healthy meal (e.g., 'Ugh, not that! It saps my very essence!')."),
});
export type MealSuggestionOutput = z.infer<typeof MealSuggestionOutputSchema>;

export async function suggestMeal(input: MealSuggestionInput): Promise<MealSuggestionOutput> {
  return mealSuggestionFlow(input);
}

const mealSuggestionPrompt = ai.definePrompt({
  name: 'mealSuggestionPrompt',
  input: {schema: MealSuggestionInputSchema},
  output: {schema: MealSuggestionOutputSchema},
  prompt: `You are an AI assistant helping a user choose a healthy, anti-inflammatory meal that is "monster-killing" (i.e., very bad for their metaphorical inner Morgellon Monster).
The user wants a suggestion for {{{mealType}}}.

Suggest a specific meal that fits these criteria:
1.  **suggestedMealName**: A clear and appealing name for the meal.
2.  **shortDescription**: A one-sentence enticing description of the meal.
3.  **monsterImpactStatement**: A short, dramatic, in-character line from the user's grumpy "inner monster" expressing its dismay or fear about this particular healthy meal. For example: "Not that wretched concoction! It makes my shadows wither!" or "My power fades at the mere mention of such 'goodness'!"

Focus on meals that are generally considered anti-inflammatory and nutrient-dense.
Example for 'breakfast':
- suggestedMealName: "Berry Power Smoothie"
- shortDescription: "A vibrant smoothie packed with antioxidant-rich berries, spinach, and protein."
- monsterImpactStatement: "Gah! All those 'nutrients'! My darkness trembles!"

Return only the JSON object.
`,
});

const mealSuggestionFlow = ai.defineFlow(
  {
    name: 'mealSuggestionFlow',
    inputSchema: MealSuggestionInputSchema,
    outputSchema: MealSuggestionOutputSchema,
  },
  async (input) => {
    const {output} = await mealSuggestionPrompt(input);
    if (!output) {
      throw new Error("The AI model did not return a meal suggestion.");
    }
    return output;
  }
);
