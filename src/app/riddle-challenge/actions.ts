
'use server';

import {
  generateMonsterRiddle,
  MonsterRiddleOutput,
} from '@/ai/flows/monster-riddle-flow';

export async function generateMonsterRiddleAction(): Promise<MonsterRiddleOutput> {
  try {
    const result = await generateMonsterRiddle();
    return result;
  } catch (error) {
    console.error("Error in generateMonsterRiddleAction:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to generate monster riddle: ${error.message}`);
    }
    throw new Error("An unexpected error occurred during riddle generation.");
  }
}
