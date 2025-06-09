'use server';

import {
  generateWorkoutPlan,
  type WorkoutPlanInput,
  type WorkoutPlanOutput,
} from '@/ai/flows/workout-plan-generation-flow';
import { auth } from '@/lib/firebase-admin';
import { firestore } from '@/lib/firebase-admin';
import { cookies } from 'next/headers';
import { FieldValue } from 'firebase-admin/firestore';

// Interface for workout plan stored in Firestore
interface WorkoutPlanData {
  userId: string;
  planTitle: string;
  planOverview: string;
  input: WorkoutPlanInput;
  output: WorkoutPlanOutput;
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

export async function generateWorkoutPlanAction(
  input: WorkoutPlanInput
): Promise<WorkoutPlanOutput> {
  try {
    // Get authenticated user
    const user = await getAuthenticatedUser();
    
    // Generate the workout plan
    const result = await generateWorkoutPlan(input);
    
    // Save the workout plan to Firestore for future reference
    try {
      const workoutPlanData: WorkoutPlanData = {
        userId: user.uid,
        planTitle: result.planTitle,
        planOverview: result.planOverview,
        input,
        output: result,
        createdAt: FieldValue.serverTimestamp() as FirebaseFirestore.Timestamp
      };

      await firestore.collection('workoutPlans').add(workoutPlanData);
    } catch (logError) {
      // Don't fail the main request if logging fails
      console.error('Failed to save workout plan:', logError);
    }
    
    return result;
  } catch (error) {
    console.error("Error in generateWorkoutPlanAction:", error);
    if (error instanceof Error) {
      throw new Error(`AI Fitness Trainer failed: ${error.message}`);
    }
    throw new Error("An unexpected error occurred while generating the workout plan.");
  }
}

export async function getWorkoutPlansAction(): Promise<{
  success: boolean;
  plans?: Array<{
    id: string;
    planTitle: string;
    planOverview: string;
    createdAt: FirebaseFirestore.Timestamp;
    daysPerWeek: number;
    timePerWorkout: number;
    fitnessGoals: string[];
  }>;
  error?: string;
}> {
  try {
    // Get authenticated user
    const user = await getAuthenticatedUser();
    
    // Get user's workout plans
    const workoutPlansQuery = await firestore
      .collection('workoutPlans')
      .where('userId', '==', user.uid)
      .orderBy('createdAt', 'desc')
      .limit(20)
      .get();
    
    const plans = workoutPlansQuery.docs.map(doc => {
      const data = doc.data() as WorkoutPlanData;
      return {
        id: doc.id,
        planTitle: data.planTitle,
        planOverview: data.planOverview,
        createdAt: data.createdAt,
        daysPerWeek: data.input.daysPerWeek,
        timePerWorkout: data.input.timePerWorkoutMinutes,
        fitnessGoals: data.input.fitnessGoals
      };
    });
    
    return { success: true, plans };
  } catch (error) {
    console.error("Error in getWorkoutPlansAction:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch workout plans";
    return { success: false, error: errorMessage };
  }
}

export async function deleteWorkoutPlanAction(planId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // Get authenticated user
    const user = await getAuthenticatedUser();
    
    // Verify the plan belongs to the user before deleting
    const planDoc = await firestore.collection('workoutPlans').doc(planId).get();
    
    if (!planDoc.exists) {
      return { success: false, error: "Workout plan not found" };
    }
    
    const planData = planDoc.data() as WorkoutPlanData;
    if (planData.userId !== user.uid) {
      return { success: false, error: "Unauthorized" };
    }
    
    // Delete the workout plan
    await firestore.collection('workoutPlans').doc(planId).delete();
    
    return { success: true };
  } catch (error) {
    console.error("Error in deleteWorkoutPlanAction:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to delete workout plan";
    return { success: false, error: errorMessage };
  }
}