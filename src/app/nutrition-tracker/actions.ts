
'use server';

import {
  getNutritionAdvice,
  type NutritionDataInput,
  type NutritionAdviceOutput,
} from '@/ai/flows/nutrition-advice-flow';

export async function getNutritionAdviceAction(
  input: NutritionDataInput
): Promise<NutritionAdviceOutput> {
  try {
    const result = await getNutritionAdvice(input);
    return result;
  } catch (error) {
    console.error("Error in getNutritionAdviceAction:", error);
    if (error instanceof Error) {
      throw new Error(`AI Nutrition Coach failed to provide advice: ${error.message}`);
    }
    throw new Error("An unexpected error occurred while fetching nutrition advice.");
  }
}
