'use server';

import {
  generateDietician,
  DieticianGenerationInput,
  DieticianGenerationOutput,
} from '@/ai/flows/dietician-generation-flow';

import {
  createDietPlan,
  DietPlanGenerationInput,
  DietPlanGenerationOutput,
} from '@/ai/flows/diet-plan-generation-flow';

export async function generateDieticianAction(
  input: DieticianGenerationInput
): Promise<DieticianGenerationOutput> {
  try {
    const result = await generateDietician(input);
    return result;
  } catch (error) {
    console.error("Error in generateDieticianAction:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to generate dietician: ${error.message}`);
    }
    throw new Error("An unexpected error occurred during dietician generation.");
  }
}

export async function createDietPlanAction(
  input: DietPlanGenerationInput
): Promise<DietPlanGenerationOutput> {
  try {
    const result = await createDietPlan(input);
    return result;
  } catch (error) {
    console.error("Error in createDietPlanAction:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to create diet plan: ${error.message}`);
    }
    throw new Error("An unexpected error occurred during diet plan creation.");
  }
}