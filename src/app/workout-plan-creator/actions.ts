
'use server';

import {
  generateWorkoutPlan,
  type WorkoutPlanInput,
  type WorkoutPlanOutput,
} from '@/ai/flows/workout-plan-generation-flow';

export async function generateWorkoutPlanAction(
  input: WorkoutPlanInput
): Promise<WorkoutPlanOutput> {
  try {
    const result = await generateWorkoutPlan(input);
    return result;
  } catch (error) {
    console.error("Error in generateWorkoutPlanAction:", error);
    if (error instanceof Error) {
      throw new Error(`AI Fitness Trainer failed: ${error.message}`);
    }
    throw new Error("An unexpected error occurred while generating the workout plan.");
  }
}
