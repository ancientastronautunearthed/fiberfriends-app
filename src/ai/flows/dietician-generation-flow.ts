import { gemini20FlashExp, googleAI } from '@genkit-ai/googleai';
import { genkit, z } from 'genkit';
import { generateAssistantImage } from './assistant-image-generation-flow'; // Import the image generation flow

const ai = genkit({
  model: gemini20FlashExp,
  plugins: [googleAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY })],
});

// UPDATED: Input schema now takes 'symptoms' instead of 'specialization'
export const DieticianGenerationInputSchema = z.object({
  gender: z.string().describe('Gender of the dietician'),
  type: z.string().describe('Type of dietician (human-professional, fantasy-elf, etc.)'),
  communicationStyle: z.string().describe('How the dietician communicates'),
  additionalTraits: z.string().optional().describe('Additional personality traits'),
  symptoms: z.array(z.string()).describe("A list of the user's symptoms that the dietician will specialize in addressing."),
});

// Output schema is unchanged, as 'specialization' is still a required output field
export const DieticianGenerationOutputSchema = z.object({
  name: z.string().describe("The dietician's full name"),
  imageUrl: z.string().describe("URL to the dietician's image"),
  personality: z.string().describe('Detailed personality description'),
  specialization: z.string().describe('Their area of expertise'),
  catchphrase: z.string().describe('Their signature catchphrase'),
  communicationStyle: z.string().describe('How they communicate'),
});

export type DieticianGenerationInput = z.infer<typeof DieticianGenerationInputSchema>;
export type DieticianGenerationOutput = z.infer<typeof DieticianGenerationOutputSchema>;

// Main dietician generation flow
export const generateDietician = ai.defineFlow(
  {
    name: 'dietician-generation-flow',
    inputSchema: DieticianGenerationInputSchema,
    outputSchema: DieticianGenerationOutputSchema,
  },
  async (input) => {
    const typeDescriptions: Record<string, string> = {
      'human-professional': 'a professional, certified nutritionist in formal attire',
      'human-friendly': 'a warm, approachable neighbor who loves cooking healthy meals',
      'fantasy-elf': 'an elegant woodland elf with knowledge of natural healing herbs',
      'fantasy-wizard': 'a wise wizard specializing in magical healing foods',
      'fantasy-fairy': 'a tiny healing fairy who sprinkles nutritional magic',
      'sci-fi-android': 'a futuristic android chef with perfect nutritional calculations',
      'sci-fi-alien': 'a benevolent alien nutritionist from an advanced civilization',
      'mythical-dragon': 'a wise dragon who hoards nutritional knowledge instead of gold',
      'anime-inspired': 'an enthusiastic anime-style chef with sparkly eyes and colorful hair',
    };

    // UPDATED: The prompt is changed to use symptoms and generate the specialization
    const prompt = `
You are creating a unique AI dietician character specialized in helping people with complex health issues like Morgellons disease manage their nutrition.

Details provided:
- Gender: ${input.gender}
- Type: ${typeDescriptions[input.type] || input.type}
- Key Symptoms to Address: ${input.symptoms.join(', ')}
- Communication Style: ${input.communicationStyle}
- Additional Traits: ${input.additionalTraits || 'None specified'}

Generate a JSON object with:
{
  "name": "A full name that fits their type and personality",
  "specialization": "A description of their expertise, framed around solving the user's symptoms (e.g., 'Specializing in diets to combat fatigue and brain fog')",
  "personality": "A comprehensive personality description (2-3 sentences) that reflects their type and new specialization",
  "catchphrase": "A memorable catchphrase they would use that reflects their communication style and specialization"
}

Make them supportive, knowledgeable about anti-inflammatory diets, and understanding of chronic illness challenges.
`;

    const result = await ai.generate({
      model: gemini20FlashExp,
      prompt,
    });

    // Parse the generated content
    let generatedData;
    try {
      const jsonMatch = result.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        // UPDATED: The AI now generates the specialization, so we expect it in the JSON
        generatedData = JSON.parse(jsonMatch[0]);
      } else {
        // Handle cases where the response is not valid JSON
        generatedData = {
          name: "Dr. Wellness",
          specialization: `Focusing on ${input.symptoms[0] || 'holistic health'}`,
          personality: "A caring and knowledgeable nutritionist dedicated to helping those with chronic conditions.",
          catchphrase: "Nourish your body, heal your spirit!"
        };
      }
    } catch (e) {
      // Fallback values
      generatedData = {
        name: "Dr. Wellness",
        specialization: `Focusing on ${input.symptoms[0] || 'holistic health'}`,
        personality: "A caring and knowledgeable nutritionist dedicated to helping those with chronic conditions.",
        catchphrase: "Nourish your body, heal your spirit!"
      };
    }
    
    // Generate the image
    const imageResult = await generateAssistantImage({
        assistantName: generatedData.name,
        species: input.type,
        // UPDATED: Use the newly generated specialization for image details
        speciesDetails: `${generatedData.specialization}, ${input.communicationStyle}, ${input.additionalTraits || ''}`.trim(),
    });

    return {
      name: generatedData.name || "Dr. Wellness",
      imageUrl: imageResult.imageUrl, // Use the generated image URL
      personality: generatedData.personality || "A caring professional dedicated to your wellness journey.",
      // UPDATED: Return the generated specialization
      specialization: generatedData.specialization || "Symptom-Focused Nutrition",
      catchphrase: generatedData.catchphrase || "Your health is my priority!",
      communicationStyle: input.communicationStyle,
    };
  }
);