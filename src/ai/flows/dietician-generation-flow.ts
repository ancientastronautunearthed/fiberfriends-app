import { gemini20FlashExp, googleAI } from '@genkit-ai/googleai';
import { genkit, z } from 'genkit';

const ai = genkit({
  model: gemini20FlashExp,
  plugins: [googleAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY })],
});

// Input schema for dietician generation
export const DieticianGenerationInputSchema = z.object({
  gender: z.string().describe('Gender of the dietician'),
  type: z.string().describe('Type of dietician (human-professional, fantasy-elf, etc.)'),
  specialization: z.string().describe('Area of nutritional specialization'),
  communicationStyle: z.string().describe('How the dietician communicates'),
  additionalTraits: z.string().optional().describe('Additional personality traits'),
});

// Output schema for dietician generation
export const DieticianGenerationOutputSchema = z.object({
  name: z.string().describe('The dietician\'s full name'),
  imageUrl: z.string().describe('URL to the dietician\'s image'),
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

    const prompt = `
You are creating a unique AI dietician character specialized in helping people with Morgellons disease manage their nutrition.

Details provided:
- Gender: ${input.gender}
- Type: ${typeDescriptions[input.type] || input.type}
- Specialization: ${input.specialization}
- Communication Style: ${input.communicationStyle}
- Additional Traits: ${input.additionalTraits || 'None specified'}

Generate a JSON object with:
{
  "name": "A full name that fits their type and personality",
  "personality": "A comprehensive personality description (2-3 sentences) that reflects their type and specialization",
  "catchphrase": "A memorable catchphrase they would use that reflects their communication style"
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
        generatedData = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      // Fallback values
      generatedData = {
        name: "Dr. Wellness",
        personality: "A caring and knowledgeable nutritionist dedicated to helping those with chronic conditions.",
        catchphrase: "Nourish your body, heal your spirit!"
      };
    }

    // Generate appropriate image URL based on type
    const placeholderImages: Record<string, string> = {
      'professional': 'https://placehold.co/400x400/4A5568/FFFFFF.png?text=Professional+Dietician',
      'friendly': 'https://placehold.co/400x400/F59E0B/FFFFFF.png?text=Friendly+Dietician',
      'fantasy': 'https://placehold.co/400x400/8B5CF6/FFFFFF.png?text=Fantasy+Dietician',
      'sci-fi': 'https://placehold.co/400x400/3B82F6/FFFFFF.png?text=Sci-Fi+Dietician',
      'anime': 'https://placehold.co/400x400/EC4899/FFFFFF.png?text=Anime+Dietician',
    };

    let imageType = 'professional';
    if (input.type.includes('friendly')) {
      imageType = 'friendly';
    } else if (input.type.includes('fantasy') || input.type.includes('mythical')) {
      imageType = 'fantasy';
    } else if (input.type.includes('sci-fi')) {
      imageType = 'sci-fi';
    } else if (input.type.includes('anime')) {
      imageType = 'anime';
    }

    return {
      name: generatedData.name || "Dr. Wellness",
      imageUrl: placeholderImages[imageType] || placeholderImages['professional'],
      personality: generatedData.personality || "A caring professional dedicated to your wellness journey.",
      specialization: input.specialization,
      catchphrase: generatedData.catchphrase || "Your health is my priority!",
      communicationStyle: input.communicationStyle,
    };
  }
);