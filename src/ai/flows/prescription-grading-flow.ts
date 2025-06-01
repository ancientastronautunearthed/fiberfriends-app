
'use server';
/**
 * @fileOverview A Genkit flow for grading prescriptions based on their general benefit
 * from a user's perspective, translating to a health reduction for the user's monster.
 *
 * - gradePrescription - Analyzes a prescription and returns its grade, benefit score, and reasoning.
 * - PrescriptionGradingInput - The input type for the gradePrescription function.
 * - PrescriptionGradingOutput - The return type for the gradePrescription function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PrescriptionGradingInputSchema = z.object({
  prescriptionName: z.string().describe('The name of the prescription medication.'),
  userNotes: z.string().optional().describe('User notes on their experience or the perceived benefits.'),
});
export type PrescriptionGradingInput = z.infer<typeof PrescriptionGradingInputSchema>;

const PrescriptionGradingOutputSchema = z.object({
  prescriptionName: z.string().describe('The recognized name of the prescription.'),
  benefitScore: z.number().min(0).max(15).describe('A score from 0 (no benefit or not assessable for monster impact) to 15 (significant perceived benefit for user, thus high monster health reduction).'),
  reasoning: z.string().describe('A brief explanation for the assigned benefit score, considering the typical use and perceived positive impact described by user notes if available.'),
});
export type PrescriptionGradingOutput = z.infer<typeof PrescriptionGradingOutputSchema>;

export async function gradePrescription(input: PrescriptionGradingInput): Promise<PrescriptionGradingOutput> {
  return prescriptionGradingFlow(input);
}

const prescriptionGradingPrompt = ai.definePrompt({
  name: 'prescriptionGradingPrompt',
  input: {schema: PrescriptionGradingInputSchema},
  output: {schema: PrescriptionGradingOutputSchema},
  prompt: `You are an AI assistant helping a user assess the general perceived benefit of a prescription medication, from the perspective of it helping them manage their condition (which, in a gamified context, 'damages' their inner 'Morgellon Monster').
The user will provide the prescription name and optionally some notes on their experience.

Prescription Name: {{{prescriptionName}}}
User Notes: {{{userNotes}}}

Evaluate the typical intended benefits of this medication, especially considering the user's notes if they emphasize positive effects.
Assign a 'benefitScore' between 0 (no clear benefit that would 'harm' the monster, or the AI cannot assess it for this purpose) and 15 (significant positive impact for the user, thus high damage to the monster).
- Score 0 if it's a medication whose primary purpose is not directly for symptomatic relief that would be considered 'monster damaging' (e.g., a statin, unless user notes strongly indicate otherwise for their specific condition).
- Score 1-5 for mild benefits.
- Score 6-10 for moderate benefits.
- Score 11-15 for strong or crucial benefits.

Provide:
1.  prescriptionName: The recognized name.
2.  benefitScore: The numerical score (0-15).
3.  reasoning: A brief explanation for the score, linking it to the medication's purpose and any user-noted benefits.

Return only the JSON object.
`,
});

const prescriptionGradingFlow = ai.defineFlow(
  {
    name: 'prescriptionGradingFlow',
    inputSchema: PrescriptionGradingInputSchema,
    outputSchema: PrescriptionGradingOutputSchema,
  },
  async (input) => {
    const {output} = await prescriptionGradingPrompt(input);
    if (!output) {
      throw new Error("The AI model did not return a valid prescription grading.");
    }
    if (!output.prescriptionName && input.prescriptionName) {
        output.prescriptionName = input.prescriptionName;
    }
    return output;
  }
);
