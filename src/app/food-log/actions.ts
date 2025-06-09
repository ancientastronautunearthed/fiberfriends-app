'use server';

import { firestore } from '@/lib/firebase-admin';
import { revalidatePath } from 'next/cache';
import { Timestamp, FieldValue, QueryDocumentSnapshot, DocumentData } from 'firebase-admin/firestore';
import { foodGradingFlow } from '@/ai/flows/food-grading-flow';
import { mealSuggestionFlow } from '@/ai/flows/meal-suggestion-flow';
import { recipeGenerationFlow } from '@/ai/flows/recipe-generation-flow';

// --- Wrapper functions for AI Flows ---
// These are now correctly exported for your page to import.
export async function gradeFoodItemAction(input: { foodItem: string }) {
  return await foodGradingFlow(input.foodItem);
}

export async function suggestMealAction(input: { mealType: "breakfast" | "lunch" | "dinner" | "snack" }) {
  return await mealSuggestionFlow(input.mealType);
}

export async function generateRecipeAction(input: { mealName: string }) {
  return await recipeGenerationFlow(input.mealName);
}


// --- Interfaces for Firestore Data ---
interface Monster {
  id: string;
  userId: string;
  name: string;
  imageUrl: string;
  health: number;
  lastRecoveryDate?: string;
  hasSpoken?: boolean;
}

interface FoodLog {
  userId: string;
  foodName: string;
  loggedAt: Timestamp;
  grade: 'good' | 'bad' | 'neutral' | 'pending';
  reasoning: string;
  healthImpactPercentage: number;
  healthBefore: number;
  healthAfter: number;
  calories?: number;
  proteinGrams?: number;
  carbGrams?: number;
  fatGrams?: number;
  sugarGrams?: number;
  sodiumMilligrams?: number;
  servingDescription?: string;
  nutritionDisclaimer?: string;
  clarifyingQuestions?: string[];
}

// Constants
const MONSTER_DEATH_THRESHOLD = -50;
const MAX_MONSTER_HEALTH = 200;
const RIDDLE_HEALTH_IMPACT = 25;
const FIRST_SPEAK_BONUS_POINTS = 50;


/**
 * Fetches the user's monster, their food logs, and user points.
 */
export async function getFoodLogPageData(userId: string) {
  if (!userId) {
    return { error: 'User not authenticated.' };
  }

  try {
    const monsterQuery = await firestore.collection('monsters').where('userId', '==', userId).limit(1).get();
    let monster: Monster | null = null;
    if (!monsterQuery.empty) {
        const monsterDoc = monsterQuery.docs[0];
        monster = { id: monsterDoc.id, ...monsterDoc.data() } as Monster;
    }

    const logsQuery = await firestore.collection('food_logs').where('userId', '==', userId).orderBy('loggedAt', 'desc').limit(20).get();
    const foodLogs = logsQuery.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            loggedAt: (data.loggedAt as Timestamp).toDate().toISOString(),
        }
    });

    return { monster, foodLogs };
  } catch (error) {
    console.error("Error fetching page data:", error);
    return { error: 'Failed to load page data.' };
  }
}

/**
 * Handles the entire process of logging food and updating the monster's state.
 */
export async function processFoodSubmission(foodItem: string, userId: string) {
  if (!userId) return { error: 'User not authenticated.' };

  const monsterQuery = await firestore.collection('monsters').where('userId', '==', userId).limit(1).get();
  if (monsterQuery.empty) {
    return { error: 'Monster not found. Create one first!' };
  }
  const monsterDoc = monsterQuery.docs[0];
  const monster = { id: monsterDoc.id, ...monsterDoc.data() } as Monster;
  const healthBefore = monster.health;
  
  try {
    const gradingResult = await foodGradingFlow(foodItem);

    let newHealth = healthBefore + gradingResult.healthImpactPercentage;
    newHealth = Math.min(MAX_MONSTER_HEALTH, newHealth);

    const newLogEntry: FoodLog = {
      userId,
      foodName: foodItem,
      loggedAt: Timestamp.now(),
      grade: gradingResult.grade,
      reasoning: gradingResult.reasoning,
      healthImpactPercentage: gradingResult.healthImpactPercentage,
      healthBefore,
      healthAfter: newHealth,
      calories: gradingResult.calories,
      proteinGrams: gradingResult.proteinGrams,
      carbGrams: gradingResult.carbGrams,
      fatGrams: gradingResult.fatGrams,
      sugarGrams: gradingResult.sugarGrams,
      sodiumMilligrams: gradingResult.sodiumMilligrams,
      servingDescription: gradingResult.servingDescription,
      nutritionDisclaimer: gradingResult.nutritionDisclaimer,
      clarifyingQuestions: gradingResult.clarifyingQuestions,
    };
    await firestore.collection('food_logs').add(newLogEntry);

    if (newHealth <= MONSTER_DEATH_THRESHOLD) {
      await firestore.collection('monster_tomb').add({
        userId,
        name: monster.name,
        imageUrl: monster.imageUrl,
        diedAt: Timestamp.now(),
        causeOfDeath: foodItem,
      });
      await firestore.collection('monsters').doc(monster.id).delete();
      
      revalidatePath('/food-log');
      revalidatePath('/create-monster');
      return { monsterDied: true, monsterName: monster.name, cause: foodItem, newHealth };
    } else {
      await firestore.collection('monsters').doc(monster.id).update({ health: newHealth });
      
      revalidatePath('/food-log');
      return { success: true, newHealth, gradingResult };
    }

  } catch (error) {
    console.error("Error processing food submission:", error);
    return { error: 'Failed to grade or log food.' };
  }
}

/**
 * Handles the logic for when a user completes a riddle.
 */
export async function processRiddleResult(wasCorrect: boolean, userId: string) {
    if (!userId) return { error: 'User not authenticated.' };

    const monsterQuery = await firestore.collection('monsters').where('userId', '==', userId).limit(1).get();
    if (monsterQuery.empty) return { error: 'Monster not found.' };

    const monsterDoc = monsterQuery.docs[0];
    const monster = { id: monsterDoc.id, ...monsterDoc.data() } as Monster;
    
    let healthChange = wasCorrect ? -RIDDLE_HEALTH_IMPACT : RIDDLE_HEALTH_IMPACT;
    let newHealth = monster.health + healthChange;
    newHealth = Math.min(MAX_MONSTER_HEALTH, newHealth);

    const updates: { health: number, hasSpoken?: boolean } = { health: newHealth };
    let pointsAwarded = 0;

    if (!monster.hasSpoken) {
        updates.hasSpoken = true;
        const userProfileRef = firestore.collection('user_profiles').doc(userId);
        await userProfileRef.set({ points: FieldValue.increment(FIRST_SPEAK_BONUS_POINTS) }, { merge: true });
        pointsAwarded = FIRST_SPEAK_BONUS_POINTS;
    }

    if (newHealth <= MONSTER_DEATH_THRESHOLD) {
        await firestore.collection('monster_tomb').add({
            userId,
            name: monster.name,
            imageUrl: monster.imageUrl,
            diedAt: Timestamp.now(),
            causeOfDeath: "a riddle's outcome",
        });
        await firestore.collection('monsters').doc(monster.id).delete();
        revalidatePath('/food-log');
        return { monsterDied: true, monsterName: monster.name, cause: "a riddle's outcome", newHealth };
    } else {
        await firestore.collection('monsters').doc(monster.id).update(updates);
        revalidatePath('/food-log');
        return { success: true, newHealth, healthChange, pointsAwarded };
    }
}
