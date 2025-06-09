'use server';
/**
 * @fileOverview A Genkit flow for grading food items based on their general health impact,
 * particularly considering sensitivities relevant to conditions like Morgellons.
 */

// Core Genkit and AI Model Imports
import { configure } from '@genkit-ai/core';
import { defineFlow, runFlow } from '@genkit-ai/flow';
import { generate } from '@genkit-ai/ai';
import { vertexAI } from '@genkit-ai/vertexai';
import { firebase } from '@genkit-ai/firebase/plugin';
import { z } from 'zod';

// Initialize Genkit with necessary plugins. This should be done once per server instance.
configure({
  plugins: [
    firebase(), // For logging and tracing
    vertexAI({ location: 'us-central1' }), // Define the AI provider
  ],
  logSinks: ['firebase'],
  enableTracing: true,
  flowStateStore: 'firebase',
});

// Define the input schema for the flow
const FoodGradingInputSchema = z.object({
  foodItem: z.string().describe('The name of the food item to be graded.'),
});
export type FoodGradingInput = z.infer<typeof FoodGradingInputSchema>;

// Define the structured output we expect from the AI
const FoodGradingOutputSchema = z.object({
  foodName: z.string().describe('The recognized name of the food item.'),
  grade: z.enum(['good', 'bad', 'neutral']).describe('The overall grade of the food: "good" (hurts monster), "bad" (helps monster), or "neutral".'),
  healthImpactPercentage: z.number().min(-2.0).max(3.0).describe('The percentage impact on monster health. Negative for "good" foods (up to -2.0, monster is hurt), positive for "bad" foods (up to +3.0, monster is healed/strengthened), and 0 for "neutral".'),
  reasoning: z.string().describe('The monster\'s brief, in-character explanation for the grade and health impact. If the food is garlic, the monster should be particularly annoyed and explain (in a slightly folkloric or pseudo-scientific monster way) why it specifically despises garlic.'),
  calories: z.number().optional().describe('Estimated calories for the serving size. Provide only if food item is specific enough for estimation.'),
  proteinGrams: z.number().optional().describe('Estimated protein in grams. Provide only if food item is specific enough.'),
  carbGrams: z.number().optional().describe('Estimated carbohydrates in grams. Provide only if food item is specific enough.'),
  fatGrams: z.number().optional().describe('Estimated fat in grams. Provide only if food item is specific enough.'),
  sugarGrams: z.number().optional().describe('Estimated sugar in grams. Provide only if food item is specific enough.'),
  sodiumMilligrams: z.number().optional().describe('Estimated sodium in milligrams. Provide only if food item is specific enough.'),
  servingDescription: z.string().optional().describe('Description of the serving size used for nutritional estimates (e.g., "1 medium apple", "100g chicken breast"). Provide only if nutritional estimates are given.'),
  nutritionDisclaimer: z.string().optional().describe('A standard disclaimer for AI-estimated nutritional values (e.g., "AI-estimated values for a standard serving. May not be accurate. Consult verified sources for precision."). Provide only if nutritional estimates are given.'),
  clarifyingQuestions: z.array(z.string()).optional().describe('If the food item is too vague for nutritional estimation, provide 1-2 specific questions here to help the user specify (e.g., "What kind of chocolate?", "How much?"). Do NOT populate if providing nutritional estimates.'),
});
export type FoodGradingOutput = z.infer<typeof FoodGradingOutputSchema>;

// Export the main flow function that will be called by your server actions
export const foodGradingFlow = defineFlow(
  {
    name: 'foodGradingFlow',
    inputSchema: FoodGradingInputSchema,
    outputSchema: FoodGradingOutputSchema,
  },
  async (input) => {
    
    const prompt = `You are the user's inner "Morgellon Monster". Your personality is a bit grumpy, self-serving, and you get annoyed when the user eats "good" foods that weaken you, and pleased when they eat "bad" foods that strengthen you.

    User's food item: ${input.foodItem}

    First, perform your monster grading:
    1.  foodName: The recognized or canonical name of the food item.
    2.  grade: Classify the food as "good" (it hurts you, the monster), "bad" (it helps you, the monster), or "neutral".
        * "good": Foods that are generally anti-inflammatory, nutrient-dense. These are BAD for YOU.
        * "bad": Foods that are generally pro-inflammatory, highly processed, high in refined sugars. These are GOOD for YOU.
        * "neutral": Foods that have minimal direct impact, or are essential like water. These are BORING for YOU.
    3.  healthImpactPercentage: Assign a numerical impact on YOUR health:
        * For "good" foods (bad for you), this should be a negative value between -0.1 and -2.0.
        * For "bad" foods (good for you), this should be a positive value between +0.1 and +3.0.
        * For "neutral" foods, this should be 0.
    4.  reasoning: Provide YOUR concise, in-character explanation for the grade and health impact.
        * If the food item is "garlic" or a dish where garlic is a primary, identifiable component: You ABSOLUTELY HATE garlic. Your reasoning should be particularly annoyed. Grade for garlic should be "good" and healthImpactPercentage significantly negative.
        * For other foods, maintain your grumpy/elated persona.

    Second, provide nutritional information OR clarifying questions:
    -   If the food item is specific enough for a nutritional estimate (e.g., "1 banana", "100g grilled salmon", "1 slice whole wheat bread"):
        * Attempt to estimate calories, proteinGrams, carbGrams, fatGrams, sugarGrams, and sodiumMilligrams for a standard serving.
        * Set servingDescription to describe the serving size you used (e.g., "1 medium banana", "100g cooked salmon").
        * Set nutritionDisclaimer to: "AI-estimated values for the described serving. May not be accurate. Consult verified sources for precision."
        * Leave clarifyingQuestions empty or null.
    -   If the food item is too vague for nutritional estimates (e.g., "salad", "chocolate bar", "pasta dish", "cereal"):
        * Do NOT provide any nutritional estimates (calories, proteinGrams, etc., servingDescription, nutritionDisclaimer should be empty or null).
        * Instead, populate the clarifyingQuestions array with 1-2 brief questions to help the user provide more detail next time (e.g., For "salad": ["What are the main ingredients in the salad?", "What kind of dressing was used?"]. For "chocolate bar": ["What type of chocolate (milk, dark %)?", "What is the approximate size or weight?"]).

    Even if the food is vague for nutrition, YOU MUST STILL PROVIDE THE MONSTER'S GRADING (foodName, grade, healthImpactPercentage, reasoning).

    Return ONLY the JSON object based on the FoodGradingOutputSchema.
    `;

    // Use the standard 'generate' function to call the AI model
    const llmResponse = await generate({
        prompt: prompt,
        model: 'vertexai/gemini-1.0-pro', // Reference the model by its string ID
        output: {
            schema: FoodGradingOutputSchema,
        },
    });
    
    const output = llmResponse.output();

    if (!output) {
      throw new Error("The AI model (monster) did not return a valid food grading. It's probably sulking.");
    }

    // Fallback logic to ensure foodName is populated
    if (!output.foodName && input.foodItem) {
        output.foodName = input.foodItem;
    }
    
    // Clean up the output to ensure data consistency
    if (output.clarifyingQuestions && output.clarifyingQuestions.length > 0) {
        delete output.calories;
        delete output.proteinGrams;
        delete output.carbGrams;
        delete output.fatGrams;
        delete output.sugarGrams;
        delete output.sodiumMilligrams;
        delete output.servingDescription;
        delete output.nutritionDisclaimer;
    }
    return output;
  }
);
