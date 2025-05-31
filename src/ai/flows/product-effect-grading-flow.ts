
'use server';
/**
 * @fileOverview A Genkit flow for grading the perceived effect of products
 * (supplements, creams, etc.) on Morgellons-related symptoms.
 *
 * - gradeProductEffect - Analyzes a product and its noted effects, returns a benefit score and reasoning.
 * - ProductEffectGradingInput - The input type for the gradeProductEffect function.
 * - ProductEffectGradingOutput - The return type for the gradeProductEffect function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ProductEffectGradingInputSchema = z.object({
  productName: z.string().describe('The name of the product being evaluated.'),
  notes: z.string().optional().describe('User notes on how the product affected their symptoms (e.g., "reduced itching by 50%", "no noticeable change", "caused a rash").'),
});
export type ProductEffectGradingInput = z.infer<typeof ProductEffectGradingInputSchema>;

const ProductEffectGradingOutputSchema = z.object({
  productName: z.string().describe('The recognized or refined name of the product.'),
  benefitScore: z.number().min(1).max(5).describe('A score from 1 (mild benefit/symptom reduction) to 5 (significant benefit/symptom reduction). If the product had no effect or adverse effects, this score might still be low, and reasoning will clarify.'),
  reasoning: z.string().describe('A brief explanation for the assigned benefit score, considering the product type and user-described effects.'),
});
export type ProductEffectGradingOutput = z.infer<typeof ProductEffectGradingOutputSchema>;

export async function gradeProductEffect(input: ProductEffectGradingInput): Promise<ProductEffectGradingOutput> {
  return productEffectGradingFlow(input);
}

const productEffectGradingPrompt = ai.definePrompt({
  name: 'productEffectGradingPrompt',
  input: {schema: ProductEffectGradingInputSchema},
  output: {schema: ProductEffectGradingOutputSchema},
  prompt: `You are an AI assistant helping a user evaluate the perceived effect of a product (supplement, cream, device, etc.) on their Morgellons-like symptoms.
The user will provide the product name and their notes on its effects.
Based on this information, assign a 'benefitScore' from 1 (mild perceived benefit or symptom reduction) to 5 (significant perceived benefit or symptom reduction).
If the product had no effect or adverse effects, the score should be 1, and the reasoning should clearly state this. The goal is to quantify positive impact.
Also, provide a brief 'reasoning' for your score.

Product Name: {{{productName}}}
User Notes: {{{notes}}}

Analyze this and provide:
1.  productName: The recognized or refined product name.
2.  benefitScore: The numerical benefit score (1-5).
3.  reasoning: Your brief explanation.

Return only the JSON object based on the ProductEffectGradingOutputSchema.
`,
});

const productEffectGradingFlow = ai.defineFlow(
  {
    name: 'productEffectGradingFlow',
    inputSchema: ProductEffectGradingInputSchema,
    outputSchema: ProductEffectGradingOutputSchema,
  },
  async (input) => {
    const {output} = await productEffectGradingPrompt(input);
    if (!output) {
      throw new Error("The AI model did not return a valid product effect grading.");
    }
    // Ensure the output has the productName, even if the AI forgets to include it in the structured output but used the input.
    if (!output.productName && input.productName) {
        output.productName = input.productName;
    }
    return output;
  }
);
