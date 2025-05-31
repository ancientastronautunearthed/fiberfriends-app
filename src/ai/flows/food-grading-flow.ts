
'use server';
/**
 * @fileOverview A Genkit flow for grading food items based on their general health impact,
 * particularly considering sensitivities relevant to conditions like Morgellons.
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
  grade: z.enum(['good', 'bad', 'neutral']).describe('The overall grade of the food: "good", "bad", or "neutral".'),
  healthImpactPercentage: z.number().min(-2).max(3).describe('The percentage impact on health. Negative for good foods (up to -2.0), positive for bad foods (up to +3.0), and 0 for neutral.'),
  reasoning: z.string().describe('A brief explanation for the grade and health impact, focusing on general health principles like inflammation, nutrient density, and processing levels.'),
});
export type FoodGradingOutput = z.infer<typeof FoodGradingOutputSchema>;

export async function gradeFoodItem(input: FoodGradingInput): Promise<FoodGradingOutput> {
  return foodGradingFlow(input);
}

const foodGradingPrompt = ai.definePrompt({
  name: 'foodGradingPrompt',
  input: {schema: FoodGradingInputSchema},
  output: {schema: FoodGradingOutputSchema},
  prompt: `You are a nutritional AI assistant. Your goal is to evaluate a given food item based on its general impact on health, with a consideration for sensitivities that might be relevant to conditions like Morgellons.

User's food item: {{{foodItem}}}

Analyze this food item and provide the following:
1.  foodName: The recognized or canonical name of the food item.
2.  grade: Classify the food as "good", "bad", or "neutral".
    *   "good": Foods that are generally anti-inflammatory, nutrient-dense, and supportive of overall health.
    *   "bad": Foods that are generally pro-inflammatory, highly processed, high in refined sugars, or known common irritants.
    *   "neutral": Foods that have minimal direct impact, or are essential like water.
3.  healthImpactPercentage: Assign a numerical impact on health:
    *   For "good" foods, this should be a negative value between -0.1 and -2.0 (e.g., -1.5 for very beneficial).
    *   For "bad" foods, this should be a positive value between +0.1 and +3.0 (e.g., +2.5 for very detrimental).
    *   For "neutral" foods, this should be 0.
4.  reasoning: Provide a concise explanation for your grading. Focus on general nutritional principles (e.g., anti-inflammatory properties, nutrient density, processing level, common allergens/irritants if widely recognized). Avoid making specific medical claims or dietary recommendations for Morgellons itself, as research is ongoing. Stick to generally accepted nutritional science.

Example for "Spinach":
{
  "foodName": "Spinach",
  "grade": "good",
  "healthImpactPercentage": -1.8,
  "reasoning": "Spinach is a nutrient-dense leafy green, rich in vitamins, minerals, and antioxidants. It's known for its anti-inflammatory properties and supports overall health."
}

Example for "Fried Doughnut":
{
  "foodName": "Fried Doughnut",
  "grade": "bad",
  "healthImpactPercentage": 2.2,
  "reasoning": "Fried doughnuts are typically high in refined sugars, unhealthy fats, and processed flour, offering little nutritional value and potentially promoting inflammation."
}

Example for "Plain Water":
{
  "foodName": "Plain Water",
  "grade": "neutral",
  "healthImpactPercentage": 0,
  "reasoning": "Water is essential for hydration and bodily functions. It has no direct caloric or inflammatory impact and is crucial for health."
}

Return only the JSON object based on the FoodGradingOutputSchema.
`,
});

const foodGradingFlow = ai.defineFlow(
  {
    name: 'foodGradingFlow',
    inputSchema: FoodGradingInputSchema,
    outputSchema: FoodGradingOutputSchema,
    // Add safety settings to filter potentially harmful advice if necessary
    // config: {
    //   safetySettings: [
    //     { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    //   ]
    // }
  },
  async (input) => {
    const {output} = await foodGradingPrompt(input);
    if (!output) {
      throw new Error("The AI model did not return a valid food grading.");
    }
    // Ensure the output has the foodName, even if the AI forgets to include it in the structured output but used the input.
    if (!output.foodName && input.foodItem) {
        output.foodName = input.foodItem;
    }
    return output;
  }
);
