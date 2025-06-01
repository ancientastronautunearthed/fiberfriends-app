
'use server';
/**
 * @fileOverview A Genkit flow for suggesting products from a curated list based on user symptoms.
 *
 * - suggestProductSuggestions - Analyzes user symptoms and a product list, returning suggestions.
 * - ProductSuggestionInput - The input type for the suggestProductSuggestions function.
 * - ProductSuggestionOutput - The return type for the suggestProductSuggestions function.
 */

import {ai} from '../genkit'; // Changed from '@/ai/genkit' to relative path
import {z} from 'genkit';

// Defining ProductSchema for the AI flow
const ProductSchema = z.object({
  id: z.string().describe('Unique identifier for the product.'),
  name: z.string().describe('The name of the product.'),
  description: z.string().describe('A brief description of the product.'),
  affiliateLink: z.string().url().describe('The Amazon affiliate link for the product.'),
  category: z.string().describe('The category the product belongs to (e.g., Supplements, Topicals).'),
  keywords: z.array(z.string()).optional().describe('Keywords associated with the product for better matching.'),
});
export type ProductForAI = z.infer<typeof ProductSchema>;


const ProductSuggestionInputSchema = z.object({
  userSymptoms: z.array(z.string()).min(1).describe('A list of symptoms or issues reported by the user.'),
  allProducts: z.array(ProductSchema).min(1).describe('The complete list of curated wellness aids to consider.'),
});
export type ProductSuggestionInput = z.infer<typeof ProductSuggestionInputSchema>;

const SuggestedProductSchema = z.object({
  productName: z.string().describe('The name of the suggested product.'),
  affiliateLink: z.string().url().describe('The original affiliate link of the suggested product.'),
  reasoning: z.string().describe('A brief explanation why this product might be relevant for the given symptoms.'),
});

const ProductSuggestionOutputSchema = z.object({
  suggestedProducts: z.array(SuggestedProductSchema).describe('A list of suggested products.'),
  disclaimer: z.string().default("These suggestions are AI-generated based on keywords and product descriptions. They are not medical advice. Always consult with a healthcare professional before trying new products or supplements.").describe('A standard disclaimer about the AI suggestions.'),
});
export type ProductSuggestionOutput = z.infer<typeof ProductSuggestionOutputSchema>;

export async function suggestProductSuggestions(input: ProductSuggestionInput): Promise<ProductSuggestionOutput> {
  return productSuggestionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'productSuggestionPrompt',
  input: {schema: ProductSuggestionInputSchema},
  output: {schema: ProductSuggestionOutputSchema},
  prompt: `You are an AI assistant helping users find potentially relevant wellness aids from a curated list based on their symptoms.
User Symptoms:
{{#each userSymptoms}}
- {{{this}}}
{{/each}}

Available Products (Review their name, description, category, and keywords to find matches):
{{#each allProducts}}
- Name: {{name}}
  Description: {{description}}
  Category: {{category}}
  Keywords: {{#if keywords}}{{#each keywords}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{else}}N/A{{/if}}
  (Affiliate Link: {{affiliateLink}} - Do NOT include this link in your reasoning, only in the structured output if suggested)
{{/each}}

Based on the user's symptoms, suggest a few products (max 3-5) from the provided list that seem most relevant.
For each suggested product, provide:
1.  productName: The exact name of the product from the list.
2.  affiliateLink: The original affiliateLink provided for that product.
3.  reasoning: A brief, neutral explanation of why this product might be relevant to one or more of the user's symptoms, based on its description, category, or keywords.

IMPORTANT:
- Only suggest products from the provided 'Available Products' list.
- Do NOT invent products.
- Do NOT provide medical advice or make claims about efficacy.
- Your reasoning should be cautious and general.
- Ensure the output includes the standard disclaimer.

Return ONLY the JSON object.
`,
});

const productSuggestionFlow = ai.defineFlow(
  {
    name: 'productSuggestionFlow',
    inputSchema: ProductSuggestionInputSchema,
    outputSchema: ProductSuggestionOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error("The AI model did not return any product suggestions.");
    }
    // Ensure product names and links in suggestions actually come from the input list, if possible (can be complex)
    // For now, trust the LLM follows instructions to only use provided product details.
    return output;
  }
);
