
'use server';
/**
 * @fileOverview A Genkit flow for generating personalized workout plans.
 *
 * - generateWorkoutPlan - Creates a workout plan based on user inputs.
 * - WorkoutPlanInput - The input type for the generateWorkoutPlan function.
 * - WorkoutPlanOutput - The return type for the generateWorkoutPlan function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExerciseDetailSchema = z.object({
  name: z.string().describe('Name of the exercise.'),
  sets: z.string().optional().describe('Number of sets (e.g., "3-4", "3").'),
  reps: z.string().optional().describe('Number of repetitions or duration (e.g., "8-12", "15", "30 seconds").'),
  rest: z.string().optional().describe('Rest time between sets (e.g., "60-90s", "45s").'),
  notes: z.string().optional().describe('Additional notes for the exercise (e.g., "Focus on form", "Tempo: 2-0-2").'),
});

const WorkoutDaySchema = z.object({
  day: z.string().describe('Label for the day (e.g., "Day 1", "Monday - Upper Body Focus", "Rest or Active Recovery").'),
  focus: z.string().optional().describe('Primary focus for the day if applicable (e.g., "Full Body", "Upper Body", "Lower Body", "Cardio & Core", "Active Recovery").'),
  exercises: z.array(ExerciseDetailSchema).optional().describe('List of exercises for the day. Empty if it is a rest day or only active recovery without specific exercises.'),
  activeRecoverySuggestion: z.string().optional().describe('Suggestion for active recovery if it is a rest day (e.g., "Light walk for 20-30 minutes", "Gentle stretching").')
});

export const WorkoutPlanInputSchema = z.object({
  equipmentAvailable: z.array(z.string()).describe('List of equipment available to the user.'),
  customEquipment: z.string().optional().describe('Any other equipment specified by the user.'),
  daysPerWeek: z.number().min(1).max(7).describe('Number of days per week the user can work out.'),
  timePerWorkoutMinutes: z.number().min(15).describe('Time available for each workout session in minutes.'),
  fitnessGoals: z.array(z.string()).min(1).describe('User\'s primary fitness goals (e.g., Weight Loss, Muscle Gain).'),
});
export type WorkoutPlanInput = z.infer<typeof WorkoutPlanInputSchema>;

export const WorkoutPlanOutputSchema = z.object({
  planTitle: z.string().describe('A catchy and descriptive title for the workout plan.'),
  planOverview: z.string().describe('A brief overview of the plan, its strategy, and general advice (e.g., importance of warm-up/cool-down, progressive overload).'),
  weeklySchedule: z.array(WorkoutDaySchema).describe('The workout schedule for the week, with details for each day.'),
  warmUpSuggestion: z.string().describe('General warm-up routine suggestion (e.g., "5-10 minutes of light cardio and dynamic stretches like arm circles, leg swings.").'),
  coolDownSuggestion: z.string().describe('General cool-down routine suggestion (e.g., "5-10 minutes of static stretches, holding each stretch for 20-30 seconds.").'),
  disclaimer: z.string().default('This workout plan is AI-generated. Consult with a healthcare professional or certified fitness trainer before starting any new exercise program, especially if you have pre-existing health conditions. Ensure proper form to prevent injuries.').describe('Standard fitness disclaimer.'),
});
export type WorkoutPlanOutput = z.infer<typeof WorkoutPlanOutputSchema>;

export async function generateWorkoutPlan(input: WorkoutPlanInput): Promise<WorkoutPlanOutput> {
  return workoutPlanGenerationFlow(input);
}

const workoutPlanGenerationPrompt = ai.definePrompt({
  name: 'workoutPlanGenerationPrompt',
  input: {schema: WorkoutPlanInputSchema},
  output: {schema: WorkoutPlanOutputSchema},
  prompt: `You are an expert AI fitness trainer. Generate a comprehensive and safe workout plan based on the user's inputs.

User Profile:
- Equipment Available: {{#each equipmentAvailable}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{#if customEquipment}}, {{{customEquipment}}}{{/if}}
- Workout Days Per Week: {{{daysPerWeek}}}
- Time Per Workout Session: {{{timePerWorkoutMinutes}}} minutes
- Fitness Goals: {{#each fitnessGoals}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}

Workout Plan Requirements:
1.  **planTitle**: Create a suitable title (e.g., "{{{daysPerWeek}}}-Day {{{fitnessGoals.[0]}}} Focused Plan").
2.  **planOverview**: Provide a brief overview. Mention the importance of consistency, listening to the body, and progressive overload if applicable.
3.  **weeklySchedule**:
    *   Create a schedule for the specified number of workout days. Distribute workout days and rest days appropriately. For example, if 3 days, suggest Mon/Wed/Fri or similar.
    *   If daysPerWeek < 7, clearly indicate "Rest Day" or "Active Recovery" for non-workout days.
    *   For each workout day:
        *   Assign a 'day' label (e.g., "Day 1", "Monday").
        *   Assign a 'focus' if appropriate (e.g., "Full Body Strength", "Upper Body Push", "Cardio & Core", "Active Recovery").
        *   List specific 'exercises'. Use ONLY the equipment listed as available. If no specific equipment is listed or suitable, prioritize bodyweight exercises.
        *   For each exercise, suggest 'sets', 'reps' (or duration for timed exercises like planks), and 'rest' times.
        *   Add brief 'notes' for exercises if needed (e.g., "Focus on controlled movement", "Explosive on the way up").
        *   Ensure the total workout time (including exercises and rests) roughly fits within 'timePerWorkoutMinutes'. Be mindful of this constraint.
    *   For "Active Recovery" days, provide an 'activeRecoverySuggestion' like "20-30 minutes of light walking or stretching." and leave exercises array empty or undefined.
4.  **warmUpSuggestion**: Provide a general 5-10 minute warm-up suggestion (e.g., light cardio and dynamic stretches).
5.  **coolDownSuggestion**: Provide a general 5-10 minute cool-down suggestion (e.g., static stretches).
6.  **disclaimer**: Include the default disclaimer.

Prioritize exercises that align with the user's goals. For "Weight Loss", include a mix of strength and cardio. For "Muscle Gain", focus on resistance training. For "Endurance", include longer duration or higher rep cardio/circuit work. For "Flexibility", include more stretching or yoga-like movements. For "General Fitness", provide a balanced mix.

Structure the output as a valid JSON object adhering to the WorkoutPlanOutputSchema.
Example for an exercise: { "name": "Dumbbell Squats", "sets": "3", "reps": "10-12", "rest": "60s" }
`,
});

const workoutPlanGenerationFlow = ai.defineFlow(
  {
    name: 'workoutPlanGenerationFlow',
    inputSchema: WorkoutPlanInputSchema,
    outputSchema: WorkoutPlanOutputSchema,
  },
  async (input) => {
    const {output} = await workoutPlanGenerationPrompt(input);
    if (!output) {
      throw new Error("The AI fitness trainer failed to generate a workout plan.");
    }
    return output;
  }
);
