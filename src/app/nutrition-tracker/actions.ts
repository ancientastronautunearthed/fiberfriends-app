'use server';

import {
  getNutritionAdvice,
  type NutritionDataInput,
  type NutritionAdviceOutput,
} from '@/ai/flows/nutrition-advice-flow';
import { auth } from '@/lib/firebase-admin';
import { firestore } from '@/lib/firebase-admin';
import { cookies } from 'next/headers';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

// Interface for nutritional food log entries stored in Firestore
interface NutritionalFoodLogEntry {
  userId: string;
  foodName: string;
  calories?: number;
  proteinGrams?: number;
  carbGrams?: number;
  fatGrams?: number;
  sugarGrams?: number;
  sodiumMilligrams?: number;
  servingDescription?: string;
  loggedAt: FirebaseFirestore.Timestamp;
  grade?: 'good' | 'bad' | 'neutral';
  reasoning?: string;
  healthImpactPercentage?: number;
}

// Interface for nutrition analysis logs
interface NutritionAnalysisLog {
  userId: string;
  period: string;
  aggregatedData: {
    totalCalories: number;
    totalProteinGrams: number;
    totalCarbGrams: number;
    totalFatGrams: number;
    totalSugarGrams: number;
    totalSodiumMilligrams: number;
    entryCount: number;
    foodSummary: string[];
  };
  aiAdvice: NutritionAdviceOutput;
  createdAt: FirebaseFirestore.Timestamp;
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

export async function getNutritionAdviceAction(
  input: NutritionDataInput
): Promise<NutritionAdviceOutput> {
  try {
    // Get authenticated user
    const user = await getAuthenticatedUser();
    
    // Generate AI nutrition advice
    const result = await getNutritionAdvice(input);
    
    // Log the analysis for future reference and insights
    try {
      const analysisLog: NutritionAnalysisLog = {
        userId: user.uid,
        period: input.periodDescription,
        aggregatedData: {
          totalCalories: input.aggregatedNutrition.totalCalories || 0,
          totalProteinGrams: input.aggregatedNutrition.totalProteinGrams || 0,
          totalCarbGrams: input.aggregatedNutrition.totalCarbGrams || 0,
          totalFatGrams: input.aggregatedNutrition.totalFatGrams || 0,
          totalSugarGrams: input.aggregatedNutrition.totalSugarGrams || 0,
          totalSodiumMilligrams: input.aggregatedNutrition.totalSodiumMilligrams || 0,
          entryCount: input.aggregatedNutrition.foodEntriesSummary?.length || 0,
          foodSummary: input.aggregatedNutrition.foodEntriesSummary || []
        },
        aiAdvice: result,
        createdAt: FieldValue.serverTimestamp() as FirebaseFirestore.Timestamp
      };

      await firestore.collection('nutritionAnalysisLogs').add(analysisLog);
    } catch (logError) {
      // Don't fail the main request if logging fails
      console.error('Failed to log nutrition analysis:', logError);
    }
    
    return result;
  } catch (error) {
    console.error("Error in getNutritionAdviceAction:", error);
    if (error instanceof Error) {
      throw new Error(`AI Nutrition Coach failed to provide advice: ${error.message}`);
    }
    throw new Error("An unexpected error occurred while fetching nutrition advice.");
  }
}

export async function getNutritionalFoodDataAction(
  period: 'daily' | 'weekly' | 'monthly'
): Promise<{
  success: boolean;
  entries?: NutritionalFoodLogEntry[];
  aggregatedData?: {
    totalCalories: number;
    totalProteinGrams: number;
    totalCarbGrams: number;
    totalFatGrams: number;
    totalSugarGrams: number;
    totalSodiumMilligrams: number;
    entryCount: number;
    foodSummary: string[];
  };
  error?: string;
}> {
  try {
    // Get authenticated user
    const user = await getAuthenticatedUser();
    
    // Calculate date range based on period
    const now = new Date();
    let startDate: Date;
    
    if (period === 'daily') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (period === 'weekly') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
    } else { // monthly
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }
    
    // Query food logs with nutritional data
    const foodLogsQuery = await firestore
      .collection('foodLogs')
      .where('userId', '==', user.uid)
      .where('loggedAt', '>=', Timestamp.fromDate(startDate))
      .where('calories', '>', 0) // Only entries with nutritional data
      .orderBy('calories', 'desc')
      .orderBy('loggedAt', 'desc')
      .limit(100)
      .get();
    
    const entries: NutritionalFoodLogEntry[] = [];
    
    foodLogsQuery.docs.forEach(doc => {
      const data = doc.data();
      if (data.calories || data.proteinGrams || data.carbGrams || data.fatGrams) {
        entries.push({
          userId: data.userId,
          foodName: data.foodName,
          calories: data.calories,
          proteinGrams: data.proteinGrams,
          carbGrams: data.carbGrams,
          fatGrams: data.fatGrams,
          sugarGrams: data.sugarGrams,
          sodiumMilligrams: data.sodiumMilligrams,
          servingDescription: data.servingDescription,
          loggedAt: data.loggedAt,
          grade: data.grade,
          reasoning: data.reasoning,
          healthImpactPercentage: data.healthImpactPercentage
        });
      }
    });
    
    // Calculate aggregated data
    const aggregatedData = entries.reduce(
      (acc, entry) => {
        acc.totalCalories += Number(entry.calories) || 0;
        acc.totalProteinGrams += Number(entry.proteinGrams) || 0;
        acc.totalCarbGrams += Number(entry.carbGrams) || 0;
        acc.totalFatGrams += Number(entry.fatGrams) || 0;
        acc.totalSugarGrams += Number(entry.sugarGrams) || 0;
        acc.totalSodiumMilligrams += Number(entry.sodiumMilligrams) || 0;
        acc.entryCount = entries.length;
        return acc;
      },
      {
        totalCalories: 0,
        totalProteinGrams: 0,
        totalCarbGrams: 0,
        totalFatGrams: 0,
        totalSugarGrams: 0,
        totalSodiumMilligrams: 0,
        entryCount: 0,
        foodSummary: [] as string[]
      }
    );
    
    // Generate food summary (top 5 most frequent foods)
    const foodFrequency: { [key: string]: number } = {};
    entries.forEach(entry => {
      const foodName = entry.foodName?.toLowerCase().trim() || 'unknown food';
      foodFrequency[foodName] = (foodFrequency[foodName] || 0) + 1;
    });
    
    aggregatedData.foodSummary = Object.entries(foodFrequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name]) => name.charAt(0).toUpperCase() + name.slice(1));
    
    return {
      success: true,
      entries,
      aggregatedData
    };
  } catch (error) {
    console.error("Error in getNutritionalFoodDataAction:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch nutritional data";
    return { success: false, error: errorMessage };
  }
}

export async function getNutritionAnalysisHistoryAction(): Promise<{
  success: boolean;
  analyses?: Array<{
    id: string;
    period: string;
    totalCalories: number;
    entryCount: number;
    createdAt: FirebaseFirestore.Timestamp;
    overallSummary: string;
  }>;
  error?: string;
}> {
  try {
    // Get authenticated user
    const user = await getAuthenticatedUser();
    
    // Get recent nutrition analyses
    const analysesQuery = await firestore
      .collection('nutritionAnalysisLogs')
      .where('userId', '==', user.uid)
      .orderBy('createdAt', 'desc')
      .limit(20)
      .get();
    
    const analyses = analysesQuery.docs.map(doc => {
      const data = doc.data() as NutritionAnalysisLog;
      return {
        id: doc.id,
        period: data.period,
        totalCalories: data.aggregatedData.totalCalories,
        entryCount: data.aggregatedData.entryCount,
        createdAt: data.createdAt,
        overallSummary: data.aiAdvice.overallSummary
      };
    });
    
    return { success: true, analyses };
  } catch (error) {
    console.error("Error in getNutritionAnalysisHistoryAction:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch analysis history";
    return { success: false, error: errorMessage };
  }
}

export async function exportNutritionDataAction(
  period: 'daily' | 'weekly' | 'monthly'
): Promise<{
  success: boolean;
  csvData?: string;
  error?: string;
}> {
  try {
    // Get authenticated user
    const user = await getAuthenticatedUser();
    
    // Get nutritional data
    const dataResult = await getNutritionalFoodDataAction(period);
    
    if (!dataResult.success || !dataResult.entries) {
      return { success: false, error: dataResult.error || "No data to export" };
    }
    
    // Convert to CSV format
    const headers = [
      'Date',
      'Food Name',
      'Calories',
      'Protein (g)',
      'Carbs (g)',
      'Fat (g)',
      'Sugar (g)',
      'Sodium (mg)',
      'Serving Description',
      'Grade',
      'Health Impact %'
    ];
    
    const csvRows = [
      headers.join(','),
      ...dataResult.entries.map(entry => [
        entry.loggedAt.toDate().toISOString().split('T')[0],
        `"${entry.foodName}"`,
        Number(entry.calories) || 0,
        Number(entry.proteinGrams) || 0,
        Number(entry.carbGrams) || 0,
        Number(entry.fatGrams) || 0,
        Number(entry.sugarGrams) || 0,
        Number(entry.sodiumMilligrams) || 0,
        `"${entry.servingDescription || ''}"`,
        entry.grade || '',
        Number(entry.healthImpactPercentage) || 0
      ].join(','))
    ];
    
    const csvData = csvRows.join('\n');
    
    return { success: true, csvData };
  } catch (error) {
    console.error("Error in exportNutritionDataAction:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to export nutrition data";
    return { success: false, error: errorMessage };
  }
}

export async function setNutritionGoalsAction(goals: {
  dailyCalories?: number;
  dailyProtein?: number;
  dailyCarbs?: number;
  dailyFat?: number;
  dailySodium?: number;
  customGoals?: string[];
}): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // Get authenticated user
    const user = await getAuthenticatedUser();
    
    // Store nutrition goals in user's profile
    await firestore
      .collection('users')
      .doc(user.uid)
      .update({
        nutritionGoals: {
          ...goals,
          updatedAt: FieldValue.serverTimestamp()
        }
      });
    
    return { success: true };
  } catch (error) {
    console.error("Error in setNutritionGoalsAction:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to save nutrition goals";
    return { success: false, error: errorMessage };
  }
}

export async function getNutritionGoalsAction(): Promise<{
  success: boolean;
  goals?: {
    dailyCalories?: number;
    dailyProtein?: number;
    dailyCarbs?: number;
    dailyFat?: number;
    dailySodium?: number;
    customGoals?: string[];
    updatedAt?: FirebaseFirestore.Timestamp;
  };
  error?: string;
}> {
  try {
    // Get authenticated user
    const user = await getAuthenticatedUser();
    
    // Get user's nutrition goals
    const userDoc = await firestore
      .collection('users')
      .doc(user.uid)
      .get();
    
    if (!userDoc.exists) {
      return { success: false, error: "User not found" };
    }
    
    const userData = userDoc.data();
    const goals = userData?.nutritionGoals;
    
    return { success: true, goals };
  } catch (error) {
    console.error("Error in getNutritionGoalsAction:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch nutrition goals";
    return { success: false, error: errorMessage };
  }
}