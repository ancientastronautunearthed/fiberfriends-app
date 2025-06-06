
'use server';

import {
  generateMonsterSlayingImage,
  type MonsterSlayingImageInput,
  type MonsterSlayingImageOutput,
} from '@/ai/flows/monster-slaying-image-flow'; // Reverted to alias

export async function generateMonsterSlayingImageAction(
  input: MonsterSlayingImageInput
): Promise<MonsterSlayingImageOutput> {
  try {
    const result = await generateMonsterSlayingImage(input);
    return result;
  } catch (error) {
    console.error("Error in generateMonsterSlayingImageAction:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to generate monster slaying image: ${error.message}`);
    }
    throw new Error("An unexpected error occurred during image generation.");
  }
}
