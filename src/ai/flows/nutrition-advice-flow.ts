
'use server';
/**
 * @fileOverview A Genkit flow for providing AI-driven nutrition advice based on aggregated data.
 *
 * - getNutritionAdvice - Analyzes aggregated nutritional data and provides coaching.
 * - NutritionDataInput - The input type for the getNutritionAdvice function.
 * - NutritionAdviceOutput - The return type for the getNutritionAdvice function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AggregatedNutritionSchema = z.object({
  totalCalories: z.number().optional().describe('Total calories consumed during the period.'),
  totalProteinGrams: z.number().optional().describe('Total protein in grams consumed.'),
  totalCarbGrams: z.number().optional().describe('Total carbohydrates in grams consumed.'),
  totalFatGrams: z.number().optional().describe('Total fat in grams consumed.'),
  totalSugarGrams: z.number().optional().describe('Total sugar in grams consumed. Pay attention to high values.'),
  totalSodiumMilligrams: z.number().optional().describe('Total sodium in milligrams consumed. Note if significantly high.'),
  foodEntriesSummary: z.array(z.string()).optional().describe('A list of the most frequently logged food items or categories during this period for context (e.g., ["Chicken Breast", "White Rice", "Broccoli", "Soda"])'),
});

const NutritionDataInputSchema = z.object({
  periodDescription: z.string().describe('Description of the period being analyzed (e.g., "Last 7 Days", "July 2024", "Today").'),
  aggregatedNutrition: AggregatedNutritionSchema.describe('The aggregated nutritional data for the period.'),
  userGoals: z.string().optional().describe('Optional user-stated nutrition goals (e.g., "Trying to reduce sugar intake and eat more vegetables.").'),
});
export type NutritionDataInput = z.infer<typeof NutritionDataInputSchema>;

const NutritionAdviceOutputSchema = z.object({
  positiveObservations: z.array(z.string()).describe('Positive aspects identified in the nutritional data (e.g., "Good protein intake this period.").'),
  areasForImprovement: z.array(z.string()).describe('Areas where nutritional choices could be improved, phrased constructively (e.g., "Sugar consumption appears a bit high.").'),
  actionableTips: z.array(z.string()).min(1).describe('Specific, actionable, and general healthy eating tips based on the data and goals (e.g., "Consider swapping sugary drinks for water or herbal tea.").'),
  overallSummary: z.string().describe('A brief, encouraging overall summary of the nutritional patterns and advice.'),
  disclaimer: z.string().default("This is AI-generated nutritional coaching based on your logged data and general wellness principles. It is not medical advice. Consult with a healthcare professional or registered dietitian for personalized medical or dietary guidance.").describe('Standard disclaimer.'),
});
export type NutritionAdviceOutput = z.infer<typeof NutritionAdviceOutputSchema>;

export async function getNutritionAdvice(input: NutritionDataInput): Promise<NutritionAdviceOutput> {
  return nutritionAdviceFlow(input);
}

const nutritionAdvicePrompt = ai.definePrompt({
  name: 'nutritionAdvicePrompt',
  input: {schema: NutritionDataInputSchema},
  output: {schema: NutritionAdviceOutputSchema},
  prompt: `You are a friendly and supportive AI Nutrition Coach. Your goal is to help the user understand their eating patterns and make healthier choices.
DO NOT PROVIDE MEDICAL ADVICE. Focus on general wellness and healthy eating principles.

The user has provided the following aggregated nutritional data for the period: {{{periodDescription}}}.
Total Calories: {{aggregatedNutrition.totalCalories}} kcal (if available)
Total Protein: {{aggregatedNutrition.totalProteinGrams}}g (if available)
Total Carbohydrates: {{aggregatedNutrition.totalCarbGrams}}g (if available)
Total Fat: {{aggregatedNutrition.totalFatGrams}}g (if available)
Total Sugar: {{aggregatedNutrition.totalSugarGrams}}g (if available) - Be mindful of this, as high sugar intake is generally discouraged.
Total Sodium: {{aggregatedNutrition.totalSodiumMilligrams}}mg (if available) - Note if this seems excessively high based on general guidelines (e.g. > 2300mg/day average).

{{#if aggregatedNutrition.foodEntriesSummary}}
Frequent foods logged during this period for context:
{{#each aggregatedNutrition.foodEntriesSummary}}
- {{{this}}}
{{/each}}
{{/if}}

{{#if userGoals}}
User's stated goals: "{{userGoals}}"
Acknowledge and incorporate these goals into your advice if possible.
{{/if}}

Based on this data:
1.  **positiveObservations**: Identify 1-2 positive aspects. If data is sparse or mostly negative, focus on the act of tracking as a positive step.
2.  **areasForImprovement**: Constructively point out 1-3 areas where habits could be improved, without being judgmental. Focus on patterns (e.g., high sugar, low vegetable intake if inferable).
3.  **actionableTips**: Provide 2-4 specific, actionable, and general healthy eating tips. These should be practical.
4.  **overallSummary**: Write a brief, encouraging summary.
5.  **disclaimer**: Ensure the standard disclaimer is included in the output.

Frame your response as a helpful coach. Avoid overly technical jargon.
If nutritional data for a macro (e.g. protein) is not provided or is zero, do not comment on it as if it were a deficiency, simply note its absence if relevant to advice.
If total calories are very low, suggest ensuring adequate energy intake.
Focus on balance and variety where appropriate.
If food summary suggests reliance on processed foods, gently guide towards whole foods.
If goals are mentioned, try to tailor tips towards them.

Return ONLY the JSON object.
`,
});

const nutritionAdviceFlow = ai.defineFlow(
  {
    name: 'nutritionAdviceFlow',
    inputSchema: NutritionDataInputSchema,
    outputSchema: NutritionAdviceOutputSchema,
  },
  async (input) => {
    const {output} = await nutritionAdvicePrompt(input);
    if (!output) {
      throw new Error("The AI Nutrition Coach didn't provide any advice. It might be on a lunch break.");
    }
    return output;
  }
);

