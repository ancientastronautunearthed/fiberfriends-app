
'use server';
/**
 * @fileOverview A Genkit flow for generating an image of an AI Research Assistant.
 *
 * - generateAssistantImage - Takes species, name, and details, returns an image URL.
 * - AssistantImageInput - The input type.
 * - AssistantImageOutput - The return type.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit'; // Assuming z comes from genkit for schema definition as per previous examples

// Schema definitions - NOT EXPORTED
const AssistantImageInputSchema = z.object({
  assistantName: z.string().describe("The name of the AI assistant."),
  species: z.string().describe("The chosen species category for the assistant (e.g., Human, Animal, Sci-Fi, Monster, Other)."),
  speciesDetails: z.string().optional().describe("Specific details or style notes for the chosen species (e.g., 'wise owl with spectacles', 'friendly robot, blue accents', 'professional human, looking thoughtful')."),
});
export type AssistantImageInput = z.infer<typeof AssistantImageInputSchema>; // TYPE EXPORT - OK

// Schema definitions - NOT EXPORTED
const AssistantImageOutputSchema = z.object({
  imageUrl: z.string().url().describe('The generated image of the AI assistant as a data URI.'),
});
export type AssistantImageOutput = z.infer<typeof AssistantImageOutputSchema>; // TYPE EXPORT - OK

export async function generateAssistantImage(input: AssistantImageInput): Promise<AssistantImageOutput> { // ASYNC FUNCTION EXPORT - OK
  return assistantImageGenerationFlow(input);
}

const assistantImageGenerationFlow = ai.defineFlow(
  {
    name: 'assistantImageGenerationFlow',
    inputSchema: AssistantImageInputSchema, // INTERNAL USE
    outputSchema: AssistantImageOutputSchema, // INTERNAL USE
  },
  async ({ assistantName, species, speciesDetails }) => {
    let promptText = `Generate a professional and thematic visual representation for an AI Research Assistant named "${assistantName}". `;
    promptText += `The assistant's chosen species category is "${species}". `;
    if (speciesDetails) {
      promptText += `Specific characteristics or style notes: "${speciesDetails}". `;
    }

    // Tailor prompt based on species for better results
    if (species.toLowerCase() === 'human') {
      promptText += "Depict as a capable and intelligent human AI. ";
    } else if (species.toLowerCase() === 'animal') {
      promptText += "Depict as an intelligent animal embodiment of an AI, suitable for a research context. ";
    } else if (species.toLowerCase() === 'sci-fi') {
      promptText += "Depict as a futuristic or robotic AI, maintaining a professional or helpful demeanor. ";
    } else if (species.toLowerCase() === 'monster') {
      promptText += "Depict as a unique but approachable monster-like AI, suitable for a research assistant role (not too scary). ";
    } else { // Other
      promptText += "Depict creatively based on the details provided, keeping in mind it's an AI research assistant. ";
    }
    promptText += "Style: Clear digital illustration, suitable for a profile image, professional yet characterful. Avoid overly complex backgrounds unless specified in details.";

    const generationResult = await ai.generate({
      model: 'googleai/gemini-2.0-flash-exp',
      prompt: promptText,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
        safetySettings: [ 
           { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
           { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
           { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
           { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
         ],
      },
    });

    if (!generationResult.media || !generationResult.media.url) {
      console.error('AI Assistant image generation failed. Result:', JSON.stringify(generationResult, null, 2));
      throw new Error('AI Assistant image generation failed or did not return an image URL. The model might have refused to generate an image for the given prompt due to safety filters or other reasons.');
    }
    
    return { imageUrl: generationResult.media.url };
  }
);

