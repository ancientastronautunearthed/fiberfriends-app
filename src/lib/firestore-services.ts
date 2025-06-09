import {
  collection,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  type Timestamp,
} from 'firebase/firestore';
import { db } from './firebase'; // db can be undefined if Firebase fails to initialize
import { z } from 'zod';

// Define the UserProfile schema using Zod
export const userProfileSchema = z.object({
  uid: z.string(),
  email: z.string().email(),
  displayName: z.string().optional(),
  createdAt: z.any(), // Zod doesn't have a direct serverTimestamp equivalent
  updatedAt: z.any(),
  points: z.number().default(0),
  tier: z.enum(['BRONZE', 'SILVER', 'GOLD', 'NONE']).default('NONE'),
});

export type UserProfile = z.infer<typeof userProfileSchema> & {
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

// --- FirestoreService Class ---
// This class will handle all our Firestore interactions.
class FirestoreService {
  private db;

  constructor(firestoreInstance: any) {
    if (!firestoreInstance) {
      throw new Error(
        'Firestore instance is not available. Check Firebase configuration.'
      );
    }
    this.db = firestoreInstance;
  }

  // Get a user's profile
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    const userDocRef = doc(this.db, 'users', uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const data = userDoc.data();
      // Add uid to the data object before parsing
      const profileDataWithId = { ...data, uid: userDoc.id };
      return userProfileSchema.parse(profileDataWithId) as UserProfile;
    } else {
      return null;
    }
  }

  // Create a new user profile
  async createUserProfile(
    uid: string,
    email: string,
    displayName?: string
  ): Promise<void> {
    const userDocRef = doc(this.db, 'users', uid);
    const newUserProfile: Omit<UserProfile, 'uid' | 'createdAt' | 'updatedAt'> =
      {
        email,
        displayName: displayName || email.split('@')[0],
        points: 0,
        tier: 'NONE',
      };

    await setDoc(userDocRef, {
      ...newUserProfile,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
}

// --- Singleton Firestore Service ---
let firestoreServiceInstance: FirestoreService | null = null;

function initializeFirestoreService(): FirestoreService {
  if (!firestoreServiceInstance) {
    if (!db) {
      console.error(
        'Firebase DB is not available for FirestoreService. App will not function correctly.'
      );
      // Return a dummy/mock service or throw an error
      // to avoid complete app failure. For now, we throw.
      throw new Error(
        'Firestore database is not initialized. Check your Firebase config file (.env).'
      );
    }
    firestoreServiceInstance = new FirestoreService(db);
  }
  return firestoreServiceInstance;
}

// Export a single, initialized instance of the service.
// This is the key change: we invoke the function to get the instance.
export const firestoreService = initializeFirestoreService();