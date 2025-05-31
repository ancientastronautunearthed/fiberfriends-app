
'use server';

import {
  gradeFoodItem,
  FoodGradingInput,
  FoodGradingOutput,
} from '@/ai/flows/food-grading-flow';

import {
  suggestMeal,
  MealSuggestionInput,
  MealSuggestionOutput,
} from '@/ai/flows/meal-suggestion-flow';

import {
  generateRecipe,
  RecipeGenerationInput,
  RecipeGenerationOutput,
} from '@/ai/flows/recipe-generation-flow';


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

export async function suggestMealAction(
  input: MealSuggestionInput
): Promise<MealSuggestionOutput> {
  try {
    const result = await suggestMeal(input);
    return result;
  } catch (error) {
    console.error("Error in suggestMealAction:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to suggest meal: ${error.message}`);
    }
    throw new Error("An unexpected error occurred during meal suggestion.");
  }
}

export async function generateRecipeAction(
  input: RecipeGenerationInput
): Promise<RecipeGenerationOutput> {
  try {
    const result = await generateRecipe(input);
    return result;
  } catch (error) {
    console.error("Error in generateRecipeAction:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to generate recipe: ${error.message}`);
    }
    throw new Error("An unexpected error occurred during recipe generation.");
  }
}
