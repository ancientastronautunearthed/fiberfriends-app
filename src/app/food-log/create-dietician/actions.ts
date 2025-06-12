'use server';

import {
  generateDietician,
  DieticianGenerationInput, // This will be the updated type from the flow
} from '@/ai/flows/dietician-generation-flow';

import {
  createDietPlan,
  DietPlanGenerationInput, // This will be the updated type from the flow
} from '@/ai/flows/diet-plan-generation-flow';

// The input type for this action now matches what the page sends
export async function generateDieticianAction(input: {
  gender: string;
  type: string;
  communicationStyle: string;
  additionalTraits: string;
  age: number;
  height: number;
  weight: number;
  symptoms: string[];
}) {
  // We no longer pass a separate 'specialization'.
  // The 'symptoms' array is now part of the input for the AI flow.
  const result = await generateDietician(input);
  return result;
}

// The input type for this action now also includes symptoms
export async function createDietPlanAction(input: {
    dietaryRestrictions: string;
    allergies: string;
    favoriteFoods: string;
    dislikedFoods: string;
    badFoodFrequency: string;
    healthGoals: string;
    mealPrepTime: string;
    budget: string;
  age: number;
  height: number;
  weight: number;
    dieticianName: string;
    symptoms: string[];
}) {
    // We pass the entire input, now including symptoms, to the diet plan flow.
    const result = await createDietPlan(input);
    return result;
}