'use server';

import {
  expandRomanticMonsterPrompt,
  RomanticMonsterWordsInput,
  RomanticMonsterPromptOutput,
} from '@/ai/flows/romantic-monster-prompt-expansion-flow';
import {
  generateRomanticMonsterImage,
  RomanticMonsterImageInput,
  RomanticMonsterImageOutput,
} from '@/ai/flows/romantic-monster-image-generation-flow';
import {
  analyzeMessageQuality,
  MessageQualityInput,
  MessageQualityOutput,
} from '@/ai/flows/message-quality-flow';
import {
  generateMonsterBanter,
  MonsterBanterInput,
  MonsterBanterOutput,
} from '@/ai/flows/monster-banter-flow';
import { auth } from '@/lib/firebase-admin';
import { firestore } from '@/lib/firebase-admin';
import { cookies } from 'next/headers';
import { Timestamp } from 'firebase-admin/firestore';

// Interface for romantic monster data stored in Firestore
interface RomanticMonsterData {
  userId: string;
  name: string;
  imageUrl: string;
  words: string[];
  detailedPrompt: string;
  createdAt: FirebaseFirestore.Timestamp;
  generated: boolean;
}

// Helper function to get authenticated user
async function getAuthenticatedUser() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;
    
    if (!sessionCookie) {
      throw new Error('No session cookie found');
    }

    const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);
    return decodedClaims;
  } catch (error) {
    throw new Error('Authentication required');
  }
}

export async function expandRomanticMonsterPromptAction(
  input: RomanticMonsterWordsInput
): Promise<RomanticMonsterPromptOutput> {
  try {
    const result = await expandRomanticMonsterPrompt(input);
    return result;
  } catch (error) {
    console.error("Error in expandRomanticMonsterPromptAction:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to expand romantic monster prompt: ${error.message}`);
    }
    throw new Error("An unexpected error occurred during romantic prompt expansion.");
  }
}

export async function generateRomanticMonsterImageAction(
  input: RomanticMonsterImageInput
): Promise<RomanticMonsterImageOutput> {
  try {
    const result = await generateRomanticMonsterImage(input);
    return result;
  } catch (error) {
    console.error("Error in generateRomanticMonsterImageAction:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to generate romantic monster image: ${error.message}`);
    }
    throw new Error("An unexpected error occurred during romantic image generation.");
  }
}

export async function createRomanticMonsterAction(
  input: RomanticMonsterWordsInput
): Promise<{ success: boolean; monsterId?: string; error?: string }> {
  try {
    // Get authenticated user
    const user = await getAuthenticatedUser();
    
    // Check if user already has a romantic monster
    const existingMonsters = await firestore
      .collection('romanticMonsters')
      .where('userId', '==', user.uid)
      .get();
    
    // Delete existing romantic monster if it exists
    if (!existingMonsters.empty) {
      const batch = firestore.batch();
      existingMonsters.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();
    }

    // Generate prompt expansion
    const promptResult = await expandRomanticMonsterPrompt(input);
    
    // Generate image
    const imageResult = await generateRomanticMonsterImage({ 
      detailedPrompt: promptResult.detailedPrompt 
    });

    // Save to Firestore
    const romanticMonsterData: RomanticMonsterData = {
      userId: user.uid,
      name: promptResult.monsterName,
      imageUrl: imageResult.imageUrl,
      words: input.words,
      detailedPrompt: promptResult.detailedPrompt,
      createdAt: Timestamp.now(),
      generated: true
    };

    const docRef = await firestore
      .collection('romanticMonsters')
      .add(romanticMonsterData);

    return { success: true, monsterId: docRef.id };
  } catch (error) {
    console.error("Error in createRomanticMonsterAction:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to create romantic monster";
    return { success: false, error: errorMessage };
  }
}

export async function getRomanticMonsterAction(): Promise<{
  success: boolean;
  monster?: {
    id: string;
    name: string;
    imageUrl: string;
    words: string[];
  };
  error?: string;
}> {
  try {
    // Get authenticated user
    const user = await getAuthenticatedUser();
    
    // Get user's romantic monster
    const monstersQuery = await firestore
      .collection('romanticMonsters')
      .where('userId', '==', user.uid)
      .where('generated', '==', true)
      .limit(1)
      .get();
    
    if (monstersQuery.empty) {
      return { success: false, error: "No romantic monster found" };
    }

    const monsterDoc = monstersQuery.docs[0];
    const monsterData = monsterDoc.data() as RomanticMonsterData;

    return {
      success: true,
      monster: {
        id: monsterDoc.id,
        name: monsterData.name,
        imageUrl: monsterData.imageUrl,
        words: monsterData.words
      }
    };
  } catch (error) {
    console.error("Error in getRomanticMonsterAction:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch romantic monster";
    return { success: false, error: errorMessage };
  }
}

export async function deleteRomanticMonsterAction(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // Get authenticated user
    const user = await getAuthenticatedUser();
    
    // Get user's romantic monsters
    const monstersQuery = await firestore
      .collection('romanticMonsters')
      .where('userId', '==', user.uid)
      .get();
    
    if (monstersQuery.empty) {
      return { success: true }; // Nothing to delete
    }

    // Delete all romantic monsters for this user
    const batch = firestore.batch();
    monstersQuery.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();

    return { success: true };
  } catch (error) {
    console.error("Error in deleteRomanticMonsterAction:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to delete romantic monster";
    return { success: false, error: errorMessage };
  }
}

export async function getAvailableUsersAction(): Promise<{
  success: boolean;
  users?: Array<{
    id: string;
    displayName: string;
    romanticMonsterName: string;
    romanticMonsterImageUrl: string;
  }>;
  error?: string;
}> {
  try {
    // Get authenticated user
    const user = await getAuthenticatedUser();
    
    // Get all romantic monsters except the current user's
    const monstersQuery = await firestore
      .collection('romanticMonsters')
      .where('generated', '==', true)
      .limit(20) // Limit to 20 potential matches
      .get();
    
    const availableUsers = [];
    
    for (const monsterDoc of monstersQuery.docs) {
      const monsterData = monsterDoc.data() as RomanticMonsterData;
      
      // Skip current user's monster
      if (monsterData.userId === user.uid) continue;
      
      // Get user data
      const userDoc = await firestore
        .collection('users')
        .doc(monsterData.userId)
        .get();
      
      if (userDoc.exists) {
        const userData = userDoc.data();
        availableUsers.push({
          id: monsterData.userId,
          displayName: userData?.displayName || userData?.email?.split('@')[0] || 'Anonymous User',
          romanticMonsterName: monsterData.name,
          romanticMonsterImageUrl: monsterData.imageUrl
        });
      }
    }

    return { success: true, users: availableUsers };
  } catch (error) {
    console.error("Error in getAvailableUsersAction:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch available users";
    return { success: false, error: errorMessage };
  }
}

export async function getChatRoomsAction(): Promise<{
  success: boolean;
  chatRooms?: Array<{
    id: string;
    opponentId: string;
    opponentName: string;
    opponentMonsterName: string;
    opponentMonsterImageUrl: string;
    lastActivity: FirebaseFirestore.Timestamp;
    monstersSynced: boolean;
  }>;
  error?: string;
}> {
  try {
    // Get authenticated user
    const user = await getAuthenticatedUser();
    
    // Get chat rooms where user is a participant
    const chatRoomsQuery = await firestore
      .collection('chatRooms')
      .where('participants', 'array-contains', user.uid)
      .orderBy('lastActivity', 'desc')
      .limit(20)
      .get();
    
    const chatRooms = [];
    
    for (const roomDoc of chatRoomsQuery.docs) {
      const roomData = roomDoc.data();
      const participants = roomData.participants as string[];
      const opponentId = participants.find(p => p !== user.uid);
      
      if (!opponentId) continue;
      
      // Get opponent's data
      const opponentUserDoc = await firestore
        .collection('users')
        .doc(opponentId)
        .get();
      
      // Get opponent's romantic monster
      const opponentMonsterQuery = await firestore
        .collection('romanticMonsters')
        .where('userId', '==', opponentId)
        .where('generated', '==', true)
        .limit(1)
        .get();
      
      if (opponentUserDoc.exists && !opponentMonsterQuery.empty) {
        const opponentUserData = opponentUserDoc.data();
        const opponentMonsterData = opponentMonsterQuery.docs[0].data();
        
        chatRooms.push({
          id: roomDoc.id,
          opponentId,
          opponentName: opponentUserData?.displayName || opponentUserData?.email?.split('@')[0] || 'Anonymous',
          opponentMonsterName: opponentMonsterData.name,
          opponentMonsterImageUrl: opponentMonsterData.imageUrl,
          lastActivity: roomData.lastActivity,
          monstersSynced: roomData.monstersSynced || false
        });
      }
    }

    return { success: true, chatRooms };
  } catch (error) {
    console.error("Error in getChatRoomsAction:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch chat rooms";
    return { success: false, error: errorMessage };
  }
}

export async function analyzeMessageQualityAction(
  input: MessageQualityInput
): Promise<MessageQualityOutput> {
  try {
    const result = await analyzeMessageQuality(input);
    return result;
  } catch (error) {
    console.error("Error in analyzeMessageQualityAction:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to analyze message quality: ${error.message}`);
    }
    throw new Error("An unexpected error occurred during message quality analysis.");
  }
}

export async function generateMonsterBanterAction(
  input: MonsterBanterInput
): Promise<MonsterBanterOutput> {
  try {
    const result = await generateMonsterBanter(input);
    return result;
  } catch (error) {
    console.error("Error in generateMonsterBanterAction:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to generate monster banter: ${error.message}`);
    }
    throw new Error("An unexpected error occurred during monster banter generation.");
  }
}