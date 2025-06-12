'use server';

import {
  expandMonsterPrompt,
  MonsterWordsInput,
  MonsterPromptOutput,
} from '@/ai/flows/monster-prompt-expansion-flow';
import {
  generateMonsterImage,
  MonsterImageInput,
  MonsterImageOutput,
} from '@/ai/flows/monster-image-generation-flow';
import { firestore } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { v4 as uuidv4 } from 'uuid';

export async function expandMonsterPromptAction(
  input: MonsterWordsInput
): Promise<MonsterPromptOutput> {
  try {
    const result = await expandMonsterPrompt(input);
    return result;
  } catch (error) {
    console.error("Error in expandMonsterPromptAction:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to expand monster prompt: ${error.message}`);
    }
    throw new Error("An unexpected error occurred during prompt expansion.");
  }
}

export async function generateMonsterImageAction(
  input: MonsterImageInput & { name: string; description: string; userId: string }
): Promise<{ success: boolean; imageUrl?: string; error?: string }> {
  try {
    const result = await generateMonsterImage(input);

    if (!result || !result.imageData) {
      return { success: false, error: 'Failed to generate monster image or get image URL.' };
    }

    // Upload image to Firebase Storage
    const storageRef = require('firebase-admin').storage().bucket().file(`monster_images/${uuidv4()}.png`);
    const response = await fetch(result.imageData);
    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    await storageRef.save(buffer, {
      metadata: { contentType: 'image/png' },
    });

    // Generate a signed URL with an expiration time
    const [publicUrl] = await storageRef.getSignedUrl({
      action: 'read',
 expires: '03-01-2026', // Set the expiration date to 03-01-2026
    });

    // Save monster data to Firestore
    // You may want to update an existing monster document instead of adding a new one each time
    // based on your application logic for when a new monster replaces an old one.
    // For now, I'm keeping the add operation as in the original code.
 await firestore.collection('monsters').add({
      name: input.name,
      description: input.description,
      imageUrl: publicUrl,
      userId: input.userId,
      createdAt: Timestamp.now(),
    });

    return { success: true, imageUrl: publicUrl };
  } catch (error) {
    console.error("Error in generateMonsterImageAction:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to generate monster image: ${error.message}`);
    }
    throw new Error("An unexpected error occurred during image generation.");
  }
}
