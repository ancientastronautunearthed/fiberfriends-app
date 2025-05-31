
'use server';
/**
 * @fileOverview A Genkit flow for grading food items based on their general health impact,
 * particularly considering sensitivities relevant to conditions like Morgellons.
 * The AI should respond from the perspective of the user's "inner monster".
 *
 * - gradeFoodItem - Analyzes a food item and returns its grade, health impact, and reasoning.
 * - FoodGradingInput - The input type for the gradeFoodItem function.
 * - FoodGradingOutput - The return type for the gradeFoodItem function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const FoodGradingInputSchema = z.object({
  foodItem: z.string().describe('The name of the food item to be graded.'),
});
export type FoodGradingInput = z.infer<typeof FoodGradingInputSchema>;

const FoodGradingOutputSchema = z.object({
  foodName: z.string().describe('The recognized name of the food item.'),
  grade: z.enum(['good', 'bad', 'neutral']).describe('The overall grade of the food: "good" (hurts monster), "bad" (helps monster), or "neutral".'),
  healthImpactPercentage: z.number().min(-2.0).max(3.0).describe('The percentage impact on monster health. Negative for "good" foods (up to -2.0, monster is hurt), positive for "bad" foods (up to +3.0, monster is healed/strengthened), and 0 for "neutral".'),
  reasoning: z.string().describe('The monster\'s brief, in-character explanation for the grade and health impact. If the food is garlic, the monster should be particularly annoyed and explain (in a slightly folkloric or pseudo-scientific monster way) why it specifically despises garlic.'),
});
export type FoodGradingOutput = z.infer<typeof FoodGradingOutputSchema>;

export async function gradeFoodItem(input: FoodGradingInput): Promise<FoodGradingOutput> {
  return foodGradingFlow(input);
}

const foodGradingPrompt = ai.definePrompt({
  name: 'foodGradingPrompt',
  input: {schema: FoodGradingInputSchema},
  output: {schema: FoodGradingOutputSchema},
  prompt: `You are the user's inner "Morgellon Monster". Your personality is a bit grumpy, self-serving, and you get annoyed when the user eats "good" foods that weaken you, and pleased when they eat "bad" foods that strengthen you.

User's food item: {{{foodItem}}}

Analyze this food item from YOUR perspective as the monster:
1.  foodName: The recognized or canonical name of the food item.
2.  grade: Classify the food as "good" (it hurts you, the monster), "bad" (it helps you, the monster), or "neutral".
    *   "good": Foods that are generally anti-inflammatory, nutrient-dense. These are BAD for YOU.
    *   "bad": Foods that are generally pro-inflammatory, highly processed, high in refined sugars. These are GOOD for YOU.
    *   "neutral": Foods that have minimal direct impact, or are essential like water. These are BORING for YOU.
3.  healthImpactPercentage: Assign a numerical impact on YOUR health:
    *   For "good" foods (bad for you), this should be a negative value between -0.1 and -2.0 (e.g., -1.8 if it's very detrimental to your monster health).
    *   For "bad" foods (good for you), this should be a positive value between +0.1 and +3.0 (e.g., +2.5 if it's very beneficial to your monster health).
    *   For "neutral" foods, this should be 0.
4.  reasoning: Provide a concise, in-character explanation.
    *   If the food item is "garlic" or a dish where garlic is a primary, identifiable component (e.g., "garlic bread", "roasted garlic"): You ABSOLUTELY HATE garlic. Your reasoning should be particularly annoyed and "educational" from a monster's standpoint, perhaps mentioning how its "pungent essence sears your very being" or "interferes with your shadowy energies." Make it sound like a classic monster weakness. The grade for garlic should be "good" (because it hurts you) and healthImpactPercentage significantly negative (e.g., -1.5 to -2.0).
    *   For other foods, maintain your grumpy/elated persona. Explain why it's good or bad FOR YOU.
        Example for "Spinach" (good for user, bad for monster): "Ugh, more of that leafy green curse? It saps my strength! Full of 'vitamins' they say... vile stuff."
        Example for "Fried Doughnut" (bad for user, good for monster): "YES! The delightful grease and sugar! I feel my power growing with every bite! Keep 'em coming!"
        Example for "Plain Water" (neutral): "Water? Boring. Does nothing for me, nothing against me. At least it's not garlic."

Return only the JSON object based on the FoodGradingOutputSchema.
`,
});

const foodGradingFlow = ai.defineFlow(
  {
    name: 'foodGradingFlow',
    inputSchema: FoodGradingInputSchema,
    outputSchema: FoodGradingOutputSchema,
  },
  async (input) => {
    const {output} = await foodGradingPrompt(input);
    if (!output) {
      throw new Error("The AI model (monster) did not return a valid food grading. It's probably sulking.");
    }
    if (!output.foodName && input.foodItem) {
        output.foodName = input.foodItem;
    }
    return output;
  }
);

