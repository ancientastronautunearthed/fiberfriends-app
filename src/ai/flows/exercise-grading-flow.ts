
'use server';
/**
 * @fileOverview A Genkit flow for grading exercises based on their general benefit
 * and duration, translating to a health reduction for the user's monster.
 *
 * - gradeExercise - Analyzes an exercise and returns its grade, benefit score, and reasoning.
 * - ExerciseGradingInput - The input type for the gradeExercise function.
 * - ExerciseGradingOutput - The return type for the gradeExercise function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExerciseGradingInputSchema = z.object({
  exerciseDescription: z.string().describe('A description of the physical exercise performed.'),
  durationMinutes: z.number().min(1).describe('The duration of the exercise in minutes.'),
});
export type ExerciseGradingInput = z.infer<typeof ExerciseGradingInputSchema>;

const ExerciseGradingOutputSchema = z.object({
  exerciseName: z.string().describe('A concise name for the recognized exercise (e.g., "Moderate Jog", "Intense Weightlifting").'),
  benefitScore: z.number().min(1).max(15).describe('A score from 1 (very light activity) to 15 (very strenuous or long activity), representing the positive impact (monster health reduction).'),
  reasoning: z.string().describe('A brief explanation for the assigned benefit score, considering type and duration.'),
});
export type ExerciseGradingOutput = z.infer<typeof ExerciseGradingOutputSchema>;

export async function gradeExercise(input: ExerciseGradingInput): Promise<ExerciseGradingOutput> {
  return exerciseGradingFlow(input);
}

const exerciseGradingPrompt = ai.definePrompt({
  name: 'exerciseGradingPrompt',
  input: {schema: ExerciseGradingInputSchema},
  output: {schema: ExerciseGradingOutputSchema},
  prompt: `You are an AI fitness assistant. A user will describe an exercise and its duration in minutes.
Evaluate the general cardiovascular and strength-building benefit of this exercise.
Based on its intensity and duration, assign a 'benefitScore' between 1 (very light activity) and 15 (very strenuous or long activity). This score represents how much the activity helps in a positive way (which, in the game, reduces a 'monster's' health).
For example:
- A 10-minute gentle walk might get a score of 1-2.
- A 30-minute moderate jog might get 5-7.
- A 60-minute intense gym session might get 10-13.
- A 90-minute very intense activity or long endurance effort like a half-marathon might get 15.

User's exercise: {{{exerciseDescription}}}
Duration: {{{durationMinutes}}} minutes

Analyze this exercise and provide the following:
1.  exerciseName: A concise, recognized name for the exercise (e.g., "Gentle Walk", "Moderate Jog", "Intense Weightlifting Circuit", "Yoga Session").
2.  benefitScore: The numerical benefit score (1-15).
3.  reasoning: A brief explanation for your grading, focusing on the exercise type and duration.

Return only the JSON object based on the ExerciseGradingOutputSchema.
`,
});

const exerciseGradingFlow = ai.defineFlow(
  {
    name: 'exerciseGradingFlow',
    inputSchema: ExerciseGradingInputSchema,
    outputSchema: ExerciseGradingOutputSchema,
  },
  async (input) => {
    const {output} = await exerciseGradingPrompt(input);
    if (!output) {
      throw new Error("The AI model did not return a valid exercise grading.");
    }
    return output;
  }
);
