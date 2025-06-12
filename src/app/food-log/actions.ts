'use server';

import { revalidatePath } from 'next/cache';
import { suggestMeal } from '@/ai/flows/meal-suggestion-flow';
import { gradeFood } from '@/ai/flows/food-grading-flow';
import { generateRecipe } from '@/ai/flows/recipe-generation-flow';
import { firestoreService } from '@/lib/firestore-service';

// --- Constants ---
const MONSTER_DEATH_THRESHOLD = -50;
const MAX_MONSTER_HEALTH = 200;
const RIDDLE_HEALTH_IMPACT = 25;
const FIRST_SPEAK_BONUS_POINTS = 50;
const POINTS_PER_FOOD_LOG = 5;
const MIN_RECOVERY = 10;
const MAX_RECOVERY = 20;

// --- AI Flow Action Wrappers ---

/**
 * Grades a food item using AI to determine its health impact on the monster
 */
export async function gradeFoodItemAction(input: { foodItem: string }) {
  try {
    // Call the flow directly with the correct input format
    const result = await gradeFood({
      foodName: input.foodItem
    });
    return result;
  } catch (error) {
    console.error('Error grading food item:', error);
    throw new Error('Failed to grade food item');
  }
}

/**
 * Suggests a meal based on the meal type (breakfast, lunch, dinner, snack)
 */
export async function suggestMealAction(input: { mealType: "breakfast" | "lunch" | "dinner" | "snack" }) {
  try {
    // Call the flow directly
    const result = await suggestMeal({
      mealType: input.mealType
    });
    return result;
  } catch (error) {
    console.error('Error suggesting meal:', error);
    throw new Error('Failed to suggest meal');
  }
}

/**
 * Generates a complete recipe based on a meal description
 */
export async function generateRecipeAction(input: { mealName: string }) {
  try {
    // Call the flow directly
    const result = await generateRecipe({ // This is line 59
      mealName: input.mealName
    });
    return result;
  } catch (error) {
    console.error('Error generating recipe:', error);
    throw new Error('Failed to generate recipe');
  }
}

// --- Data Fetching ---

/**
 * Fetches all data needed for the food log page
 */
export async function getFoodLogPageData(userId: string) {
  if (!userId) {
    return { error: 'User not authenticated.' };
  }

  try {
    // Get monster data
    const monster = await firestoreService.getMonsterData(userId);
    
    // Get food logs
    const foodLogs = await firestoreService.getUserFoods(userId);
    
    // Convert Firestore timestamps to serializable format
    const serializedFoodLogs = foodLogs.map(log => ({
      ...log,
      createdAt: log.createdAt.toDate().toISOString(),
      updatedAt: log.updatedAt.toDate().toISOString(),
    }));

    const serializedMonster = monster ? {
      ...monster,
      createdAt: monster.createdAt.toDate().toISOString(),
      updatedAt: monster.updatedAt.toDate().toISOString(),
    } : null;

    return { 
      monster: serializedMonster, 
      foodLogs: serializedFoodLogs 
    };
  } catch (error) {
    console.error("Error fetching page data:", error);
    return { error: 'Failed to load page data.' };
  }
}

// --- Food Processing ---

/**
 * Processes a food submission: grades it, updates monster health, and logs it
 */
export async function processFoodSubmission(foodItem: string, userId: string) {
  if (!userId) return { error: 'User not authenticated.' };

  try {
    // Get monster data
    const monster = await firestoreService.getMonsterData(userId);
    if (!monster || !monster.generated) {
      return { error: 'Monster not found. Create one first!' };
    }

    const healthBefore = monster.health;
    
    // Grade the food with AI
    const gradingResult = await gradeFood({
      foodName: foodItem
    });

    // Calculate new health
    let newHealth = healthBefore + gradingResult.healthImpactPercentage;
    newHealth = Math.min(MAX_MONSTER_HEALTH, newHealth);

    // Add food entry to Firestore
    await firestoreService.addFood(userId, {
      foodName: gradingResult.foodName,
      userNotes: '',
      grade: gradingResult.grade,
      healthImpact: gradingResult.healthImpactPercentage,
      reasoning: gradingResult.reasoning,
      isGraded: true
    });

    // Add points to user
    await firestoreService.addPoints(userId, POINTS_PER_FOOD_LOG);

    // Check if monster dies
    if (newHealth <= MONSTER_DEATH_THRESHOLD) {
      await firestoreService.addToTomb(userId, {
        name: monster.name,
        imageUrl: monster.imageUrl,
        cause: foodItem
      });
      
      await firestoreService.deleteMonster(userId);
      
      revalidatePath('/food-log');
      revalidatePath('/create-monster');
      return { 
        monsterDied: true, 
        monsterName: monster.name, 
        cause: foodItem, 
        newHealth 
      };
    } else {
      // Update monster health
      await firestoreService.updateMonsterData(userId, { health: newHealth });
      
      revalidatePath('/food-log');
      return { 
        success: true, 
        newHealth, 
        gradingResult: {
          ...gradingResult,
          healthBefore,
          healthAfter: newHealth
        }
      };
    }

  } catch (error) {
    console.error("Error processing food submission:", error);
    return { error: 'Failed to grade or log food.' };
  }
}

// --- Riddle Processing ---

/**
 * Processes the result of a riddle challenge
 */
export async function processRiddleResult(wasCorrect: boolean, userId: string) {
  if (!userId) return { error: 'User not authenticated.' };

  try {
    const monster = await firestoreService.getMonsterData(userId);
    if (!monster || !monster.generated) {
      return { error: 'Monster not found.' };
    }
    
    let healthChange = wasCorrect ? -RIDDLE_HEALTH_IMPACT : RIDDLE_HEALTH_IMPACT;
    let newHealth = monster.health + healthChange;
    newHealth = Math.min(MAX_MONSTER_HEALTH, newHealth);

    let pointsAwarded = 0;
    
    // Update monster health
    await firestoreService.updateMonsterData(userId, { health: newHealth });

    if (newHealth <= MONSTER_DEATH_THRESHOLD) {
      await firestoreService.addToTomb(userId, {
        name: monster.name,
        imageUrl: monster.imageUrl,
        cause: "a riddle's outcome"
      });
      
      await firestoreService.deleteMonster(userId);
      revalidatePath('/food-log');
      return { 
        monsterDied: true, 
        monsterName: monster.name, 
        cause: "a riddle's outcome", 
        newHealth 
      };
    } else {
      revalidatePath('/food-log');
      return { 
        success: true, 
        newHealth, 
        healthChange, 
        pointsAwarded 
      };
    }
  } catch (error) {
    console.error("Error processing riddle result:", error);
    return { error: 'Failed to process riddle result.' };
  }
}

// --- Nightly Recovery ---

/**
 * Performs nightly health recovery for the monster
 */
export async function performNightlyRecovery(userId: string) {
  if (!userId) return { error: 'User not authenticated.' };

  try {
    const monster = await firestoreService.getMonsterData(userId);
    if (!monster || !monster.generated) {
      return { error: 'Monster not found.' };
    }

    const lastRecoveryDate = monster.lastRecoveryDate;
    const todayDateStr = new Date().toDateString();

    if (lastRecoveryDate !== todayDateStr && monster.health > MONSTER_DEATH_THRESHOLD) {
      const recoveryAmount = Math.floor(Math.random() * (MAX_RECOVERY - MIN_RECOVERY + 1)) + MIN_RECOVERY;
      const newHealth = Math.min(monster.health + recoveryAmount, MAX_MONSTER_HEALTH);

      await firestoreService.updateMonsterData(userId, {
        health: newHealth,
        lastRecoveryDate: todayDateStr
      });

      revalidatePath('/food-log');
      return {
        success: true,
        recoveryAmount,
        newHealth,
        monsterName: monster.name
      };
    }

    return { success: true, noRecoveryNeeded: true };
  } catch (error) {
    console.error("Error performing nightly recovery:", error);
    return { error: 'Failed to perform nightly recovery.' };
  }
}

// --- CRUD Operations ---

/**
 * Deletes a food log entry
 */
export async function deleteFoodLogEntry(entryId: string, userId: string) {
  if (!userId) return { error: 'User not authenticated.' };

  try {
    await firestoreService.deleteFood(entryId);
    revalidatePath('/food-log');
    return { success: true };
  } catch (error) {
    console.error("Error deleting food log entry:", error);
    return { error: 'Failed to delete food log entry.' };
  }
}

/**
 * Updates a food log entry
 */
export async function updateFoodLogEntry(entryId: string, updates: any, userId: string) {
  if (!userId) return { error: 'User not authenticated.' };

  try {
    await firestoreService.updateFood(entryId, updates);
    revalidatePath('/food-log');
    return { success: true };
  } catch (error) {
    console.error("Error updating food log entry:", error);
    return { error: 'Failed to update food log entry.' };
  }
}

// --- User Points ---

/**
 * Gets the user's current points
 */
export async function getUserPoints(userId: string) {
  if (!userId) return { error: 'User not authenticated.' };

  try {
    const userProfile = await firestoreService.getUserProfile(userId);
    return { 
      success: true, 
      points: userProfile?.points || 0 
    };
  } catch (error) {
    console.error("Error getting user points:", error);
    return { error: 'Failed to get user points.' };
  }
}

/**
 * Adds points to the user's total
 */
export async function addUserPoints(userId: string, points: number) {
  if (!userId) return { error: 'User not authenticated.' };

  try {
    await firestoreService.addPoints(userId, points);
    revalidatePath('/food-log');
    return { success: true };
  } catch (error) {
    console.error("Error adding user points:", error);
    return { error: 'Failed to add user points.' };
  }
}