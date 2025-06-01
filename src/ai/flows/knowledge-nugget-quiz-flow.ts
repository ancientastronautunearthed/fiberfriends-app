
'use server';
/**
 * @fileOverview A Genkit flow for generating a multiple-choice quiz question
 * related to general wellness, resilience, or common, non-medical aspects of
 * chronic conditions. THIS FLOW MUST NOT PROVIDE MEDICAL ADVICE.
 *
 * - generateQuizQuestion - Generates a question, options, correct answer, and explanation.
 * - QuizQuestionOutput - The return type for the generateQuizQuestion function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const QuizQuestionOutputSchema = z.object({
  question: z.string().describe('The quiz question text. It should be focused on general wellness, resilience, or common non-medical experiences.'),
  options: z.array(z.string()).min(3).max(4).describe('An array of 3 or 4 plausible answer options.'),
  correctAnswer: z.string().describe('The text of the correct answer, which must exactly match one of the strings in the "options" array.'),
  explanation: z.string().optional().describe('A brief, neutral explanation for why the correct answer is correct, or general context. Avoid medical advice.'),
});
export type QuizQuestionOutput = z.infer<typeof QuizQuestionOutputSchema>;

export async function generateQuizQuestion(): Promise<QuizQuestionOutput> {
  return quizQuestionFlow({});
}

const prompt = ai.definePrompt({
  name: 'knowledgeNuggetQuizPrompt',
  output: {schema: QuizQuestionOutputSchema},
  prompt: `You are an AI assistant creating a single multiple-choice quiz question for a "Knowledge Nugget" section in an app for people dealing with chronic conditions.
The question MUST be about general wellness, resilience, coping mechanisms (non-medical), or understanding common emotional/social experiences related to long-term health challenges.
ABSOLUTELY DO NOT provide medical advice, suggest treatments, or discuss specific medical conditions in a way that could be construed as diagnostic or prescriptive.

Your task is to generate:
1.  **question**: The quiz question text.
2.  **options**: An array of 3 or 4 plausible answer options.
3.  **correctAnswer**: The exact text of the correct option.
4.  **explanation**: (Optional but recommended) A brief, neutral explanation for the correct answer, or helpful context related to the topic. This explanation must also avoid medical advice.

Example Topic Areas (General Wellness/Resilience - NOT MEDICAL):
- The benefits of mindfulness for stress.
- General tips for improving sleep hygiene (e.g., consistent bedtime).
- The importance of social connection for well-being.
- Common emotional responses to chronic challenges (e.g., frustration, grief) and the idea that these are valid.
- The concept of pacing oneself with activities.

Example of a GOOD question output:
{
  "question": "Which of these is a commonly suggested technique for managing stress in daily life?",
  "options": ["Drinking more coffee", "Deep breathing exercises", "Watching intense action movies before bed", "Skipping meals"],
  "correctAnswer": "Deep breathing exercises",
  "explanation": "Deep breathing exercises can help activate the body's relaxation response, which can be beneficial for managing stress."
}

Example of a BAD question output (AVOID):
{
  "question": "What is the best medication for nerve pain in Morgellons?",
  "options": ["Drug A", "Drug B", "Herbal Supplement C"],
  "correctAnswer": "Drug A",
  "explanation": "Drug A is often prescribed because..."
}

Generate a new, unique quiz question, options, the correct answer, and an explanation.
Return ONLY the JSON object.
`,
});

const quizQuestionFlow = ai.defineFlow(
  {
    name: 'quizQuestionFlow',
    outputSchema: QuizQuestionOutputSchema,
  },
  async () => {
    const {output} = await prompt({});
    if (!output || !output.question || !output.options || output.options.length < 3 || !output.correctAnswer) {
      throw new Error("The AI model did not return a valid quiz question with options and a correct answer.");
    }
    if (!output.options.includes(output.correctAnswer)) {
      console.error("AI Error (Quiz): Correct answer not found in options. Output:", output);
      throw new Error("AI consistency error: The provided correct answer is not one of the options.");
    }
    return output;
  }
);
