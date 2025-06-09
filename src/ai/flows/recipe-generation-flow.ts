'use server';
/**
 * @fileOverview A Genkit flow for generating a recipe for a given meal.
 *
 * - generateRecipe - Generates a recipe including ingredients and instructions.
 * - RecipeGenerationInput - The input type for the generateRecipe function.
 * - RecipeGenerationOutput - The return type for the generateRecipe function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RecipeGenerationInputSchema = z.object({
  mealName: z.string().describe('The name of the meal for which to generate a recipe.'),
});
export type RecipeGenerationInput = z.infer<typeof RecipeGenerationInputSchema>;

const IngredientSchema = z.object({
  name: z.string().describe('The name of the ingredient.'),
  quantity: z.string().describe('The quantity of the ingredient (e.g., "1", "1/2", "200").'),
  unit: z.string().describe('The unit for the quantity (e.g., "cup", "tsp", "grams", "cloves", "to taste").'),
  isLinkable: z.boolean().default(false).describe('True if this ingredient is a common packaged good that could potentially be linked to an online store like Amazon (e.g., "rolled oats", "chia seeds", "canned tomatoes"). False for fresh produce like "fresh basil" or generic items like "water".'),
  notes: z.string().optional().describe('Optional notes for the ingredient, e.g., "finely chopped", "or alternative sweetener".')
});

// FIX: Export the Ingredient type
export type Ingredient = z.infer<typeof IngredientSchema>;

const RecipeGenerationOutputSchema = z.object({
  recipeName: z.string().describe('The confirmed or full name of the recipe, often same as input mealName.'),
  ingredients: z.array(IngredientSchema).describe('A list of ingredients for the recipe.'),
  instructions: z.array(z.string()).describe('Step-by-step instructions to prepare the meal.'),
  prepTime: z.string().optional().describe('Estimated preparation time (e.g., "15 minutes").'),
  cookTime: z.string().optional().describe('Estimated cooking time (e.g., "30 minutes").'),
  servings: z.string().optional().describe('Number of servings the recipe makes (e.g., "2 servings").'),
  recipeNotes: z.string().optional().describe('Any additional notes or tips for the recipe (e.g., "Great for meal prep!").'),
});
export type RecipeGenerationOutput = z.infer<typeof RecipeGenerationOutputSchema>;

export async function generateRecipe(input: RecipeGenerationInput): Promise<RecipeGenerationOutput> {
  return recipeGenerationFlow(input);
}

const recipeGenerationPrompt = ai.definePrompt({
  name: 'recipeGenerationPrompt',
  input: {schema: RecipeGenerationInputSchema},
  output: {schema: RecipeGenerationOutputSchema},
  prompt: `You are a helpful AI assistant that generates recipes.
The user wants a recipe for: {{{mealName}}}

Generate a complete recipe including:
1.  **recipeName**: The official name of the recipe (often the same as the input mealName).
2.  **ingredients**: An array of objects, each with:
    * **name**: Ingredient name.
    * **quantity**: Numerical or fractional quantity.
    * **unit**: Measurement unit (e.g., cup, tsp, grams, item, to taste).
    * **isLinkable**: Set to \`true\` if the ingredient is a common, non-perishable, packaged item that someone might buy online (e.g., 'rolled oats', 'canned chickpeas', 'olive oil', 'almond flour', 'maple syrup', 'protein powder', 'specific spice blend name'). Set to \`false\` for fresh produce (e.g., 'fresh spinach', 'apple', 'onion'), very generic items like 'water', 'salt', 'black pepper', or items that are highly variable/brand-dependent if not specified.
    * **notes**: (Optional) Any specific preparation for the ingredient, like "finely chopped" or "melted".
3.  **instructions**: A list of clear, step-by-step instructions.
4.  **prepTime**: (Optional) Estimated preparation time.
5.  **cookTime**: (Optional) Estimated cooking time.
6.  **servings**: (Optional) Number of servings.
7.  **recipeNotes**: (Optional) Any helpful tips, variations, or storage instructions for the recipe.

Ensure the recipe is healthy, generally anti-inflammatory, and aligns with the "monster-killing" theme (meaning good for the user, bad for their metaphorical inner monster).

Return only the JSON object.
`,
});

const recipeGenerationFlow = ai.defineFlow(
  {
    name: 'recipeGenerationFlow',
    inputSchema: RecipeGenerationInputSchema,
    outputSchema: RecipeGenerationOutputSchema,
  },
  async (input) => {
    const {output} = await recipeGenerationPrompt(input);
    if (!output) {
      throw new Error("The AI model did not return a recipe.");
    }
    if (!output.recipeName && input.mealName) {
        output.recipeName = input.mealName;
    }
    return output;
  }
);