
'use server';

import {
  gradeFoodItem,
  FoodGradingInput,
  FoodGradingOutput,
} from '@/ai/flows/food-grading-flow';

export async function gradeFoodItemAction(
  input: FoodGradingInput
): Promise<FoodGradingOutput> {
  try {
    const result = await gradeFoodItem(input);
    return result;
  } catch (error) {
    console.error("Error in gradeFoodItemAction:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to grade food item: ${error.message}`);
    }
    throw new Error("An unexpected error occurred during food grading.");
  }
}
