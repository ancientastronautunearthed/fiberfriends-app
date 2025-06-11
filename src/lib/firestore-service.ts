import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs, 
  Timestamp,
  type DocumentReference,
  type QuerySnapshot
} from 'firebase/firestore';
import { db } from './firebase';

// Types
export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  points: number;
  tier: 'NONE' | 'CONTRIBUTOR' | 'BRONZE' | 'SILVER' | 'GOLD';
}

export interface MonsterData {
  uid: string;
  name: string;
  imageUrl: string;
  health: number;
  generated: boolean;
  lastRecoveryDate?: string;
  voiceConfig?: {
    voiceURI: string;
    pitch: number;
    rate: number;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface PrescriptionEntry {
  id: string;
  uid: string;
  prescriptionName: string;
  userComments: string;
  benefitScore: number;
  reasoning: string;
  isGraded: boolean;
  experienceType: 'beneficial' | 'not-beneficial' | 'neutral';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ProductEntry {
  id: string;
  uid: string;
  productName: string;
  userNotes: string;
  benefitScore: number;
  isGraded: boolean;
  experienceType: 'beneficial' | 'not-beneficial' | 'neutral';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface StreakData {
  uid: string;
  type: 'prescription' | 'product' | 'exercise' | 'food';
  date: string; // YYYY-MM-DD
  count: number;
  updatedAt: Timestamp;
}

export interface CompletionData {
  uid: string;
  type: 'affirmation' | 'mindful-moment' | 'kindness-challenge';
  date: string; // YYYY-MM-DD
  completedAt: Timestamp;
}

export interface TombEntry {
  name: string;
  imageUrl: string;
  cause: string;
  diedAt?: Timestamp;
}

export interface ExerciseEntry {
  id: string;
  uid: string;
  exerciseName: string;
  duration: string;
  userNotes: string;
  benefitScore: number;
  reasoning: string;
  isGraded: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface FoodEntry {
  id: string;
  uid: string;
  foodName: string;
  userNotes: string;
  grade: 'good' | 'bad' | 'neutral';
  healthImpact: number;
  reasoning: string;
  isGraded: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface SymptomEntry {
  id: string;
  uid: string;
  date: string; // YYYY-MM-DD
  symptoms: string[];
  notes: string;
  photos?: string[];
  location?: {
    latitude: number;
    longitude: number;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

class FirestoreService {
  private getCollection(name: string) {
    if (!db) throw new Error('Firestore not initialized');
    return collection(db, name);
  }

  private getDocument(collectionName: string, docId: string) {
    if (!db) throw new Error('Firestore not initialized');
    return doc(db, collectionName, docId);
  }

  // User Profile methods
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const docRef = this.getDocument('users', uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { uid, ...docSnap.data() } as UserProfile;
      }
      return null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
  }

  async createUserProfile(uid: string, email: string, displayName?: string): Promise<void> {
    try {
      const docRef = this.getDocument('users', uid);
      const now = Timestamp.now();
      
      const profileData: any = {
        email,
        points: 0,
        tier: 'NONE',
        createdAt: now,
        updatedAt: now
      };
      
      // Only add displayName if it's defined
      if (displayName !== undefined && displayName !== null) {
        profileData.displayName = displayName;
      }
      
      await setDoc(docRef, profileData);
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }
  }

  async updateUserProfile(uid: string, updates: Partial<UserProfile>): Promise<void> {
    try {
      const docRef = this.getDocument('users', uid);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  async addPoints(uid: string, points: number): Promise<void> {
    try {
      const profile = await this.getUserProfile(uid);
      if (profile) {
        const newPoints = profile.points + points;
        await this.updateUserProfile(uid, { points: newPoints });
      }
    } catch (error) {
      console.error('Error adding points:', error);
      throw error;
    }
  }

  // Monster methods
  async getMonsterData(uid: string): Promise<MonsterData | null> {
    try {
      const docRef = this.getDocument('monsters', uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { uid, ...docSnap.data() } as MonsterData;
      }
      return null;
    } catch (error) {
      console.error('Error getting monster data:', error);
      throw error;
    }
  }

  async createMonster(uid: string, monsterData: Omit<MonsterData, 'uid' | 'createdAt' | 'updatedAt'>): Promise<void> {
    try {
      const docRef = this.getDocument('monsters', uid);
      const now = Timestamp.now();
      
      await setDoc(docRef, {
        ...monsterData,
        createdAt: now,
        updatedAt: now
      });
    } catch (error) {
      console.error('Error creating monster:', error);
      throw error;
    }
  }

  async updateMonsterData(uid: string, updates: Partial<MonsterData>): Promise<void> {
    try {
      const docRef = this.getDocument('monsters', uid);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating monster data:', error);
      throw error;
    }
  }

  async deleteMonster(uid: string): Promise<void> {
    try {
      const docRef = this.getDocument('monsters', uid);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting monster:', error);
      throw error;
    }
  }

  // Prescription methods
  async getUserPrescriptions(uid: string, experienceType?: 'beneficial' | 'not-beneficial' | 'neutral'): Promise<PrescriptionEntry[]> {
    try {
      const collectionRef = this.getCollection('prescriptions');
      let q = query(
        collectionRef, 
        where('uid', '==', uid), 
        orderBy('createdAt', 'desc'),
        limit(50)
      );
      
      if (experienceType) {
        q = query(
          collectionRef,
          where('uid', '==', uid),
          where('experienceType', '==', experienceType),
          orderBy('createdAt', 'desc'),
          limit(50)
        );
      }
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PrescriptionEntry[];
    } catch (error) {
      console.error('Error getting user prescriptions:', error);
      throw error;
    }
  }

  async addPrescription(uid: string, prescriptionData: Omit<PrescriptionEntry, 'id' | 'uid' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const collectionRef = this.getCollection('prescriptions');
      const now = Timestamp.now();
      
      const docRef = await addDoc(collectionRef, {
        uid,
        ...prescriptionData,
        createdAt: now,
        updatedAt: now
      });
      
      return docRef.id;
    } catch (error) {
      console.error('Error adding prescription:', error);
      throw error;
    }
  }

  async updatePrescription(prescriptionId: string, updates: Partial<PrescriptionEntry>): Promise<void> {
    try {
      const docRef = this.getDocument('prescriptions', prescriptionId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating prescription:', error);
      throw error;
    }
  }

  async deletePrescription(prescriptionId: string): Promise<void> {
    try {
      const docRef = this.getDocument('prescriptions', prescriptionId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting prescription:', error);
      throw error;
    }
  }

  // Product methods
  async getUserProducts(uid: string, experienceType?: 'beneficial' | 'not-beneficial' | 'neutral'): Promise<ProductEntry[]> {
    try {
      const collectionRef = this.getCollection('products');
      let q = query(
        collectionRef, 
        where('uid', '==', uid), 
        orderBy('createdAt', 'desc'),
        limit(50)
      );
      
      if (experienceType) {
        q = query(
          collectionRef,
          where('uid', '==', uid),
          where('experienceType', '==', experienceType),
          orderBy('createdAt', 'desc'),
          limit(50)
        );
      }
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ProductEntry[];
    } catch (error) {
      console.error('Error getting user products:', error);
      throw error;
    }
  }

  async addProduct(uid: string, productData: Omit<ProductEntry, 'id' | 'uid' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const collectionRef = this.getCollection('products');
      const now = Timestamp.now();
      
      const docRef = await addDoc(collectionRef, {
        uid,
        ...productData,
        createdAt: now,
        updatedAt: now
      });
      
      return docRef.id;
    } catch (error) {
      console.error('Error adding product:', error);
      throw error;
    }
  }

  async updateProduct(productId: string, updates: Partial<ProductEntry>): Promise<void> {
    try {
      const docRef = this.getDocument('products', productId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  }

  async deleteProduct(productId: string): Promise<void> {
    try {
      const docRef = this.getDocument('products', productId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  }

  // Exercise methods
  async getUserExercises(uid: string): Promise<ExerciseEntry[]> {
    try {
      const collectionRef = this.getCollection('exercises');
      const q = query(
        collectionRef, 
        where('uid', '==', uid), 
        orderBy('createdAt', 'desc'),
        limit(50)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ExerciseEntry[];
    } catch (error) {
      console.error('Error getting user exercises:', error);
      throw error;
    }
  }

  async addExercise(uid: string, exerciseData: Omit<ExerciseEntry, 'id' | 'uid' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const collectionRef = this.getCollection('exercises');
      const now = Timestamp.now();
      
      const docRef = await addDoc(collectionRef, {
        uid,
        ...exerciseData,
        createdAt: now,
        updatedAt: now
      });
      
      return docRef.id;
    } catch (error) {
      console.error('Error adding exercise:', error);
      throw error;
    }
  }

  async updateExercise(exerciseId: string, updates: Partial<ExerciseEntry>): Promise<void> {
    try {
      const docRef = this.getDocument('exercises', exerciseId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating exercise:', error);
      throw error;
    }
  }

  async deleteExercise(exerciseId: string): Promise<void> {
    try {
      const docRef = this.getDocument('exercises', exerciseId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting exercise:', error);
      throw error;
    }
  }

  // Food methods
  async getUserFoods(uid: string): Promise<FoodEntry[]> {
    try {
      const collectionRef = this.getCollection('foods');
      const q = query(
        collectionRef, 
        where('uid', '==', uid), 
        orderBy('createdAt', 'desc'),
        limit(50)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FoodEntry[];
    } catch (error) {
      console.error('Error getting user foods:', error);
      throw error;
    }
  }

  async addFood(uid: string, foodData: Omit<FoodEntry, 'id' | 'uid' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const collectionRef = this.getCollection('foods');
      const now = Timestamp.now();
      
      const docRef = await addDoc(collectionRef, {
        uid,
        ...foodData,
        createdAt: now,
        updatedAt: now
      });
      
      return docRef.id;
    } catch (error) {
      console.error('Error adding food:', error);
      throw error;
    }
  }

  async updateFood(foodId: string, updates: Partial<FoodEntry>): Promise<void> {
    try {
      const docRef = this.getDocument('foods', foodId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating food:', error);
      throw error;
    }
  }

  async deleteFood(foodId: string): Promise<void> {
    try {
      const docRef = this.getDocument('foods', foodId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting food:', error);
      throw error;
    }
  }

  // Streak methods
  async getStreak(uid: string, type: 'prescription' | 'product' | 'exercise' | 'food'): Promise<StreakData | null> {
    try {
      const docRef = this.getDocument('streaks', `${uid}_${type}`);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data() as StreakData;
      }
      return null;
    } catch (error) {
      console.error('Error getting streak:', error);
      throw error;
    }
  }

  async updateStreak(uid: string, type: 'prescription' | 'product' | 'exercise' | 'food'): Promise<number> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const docRef = this.getDocument('streaks', `${uid}_${type}`);
      const docSnap = await getDoc(docRef);
      
      let newCount = 1;
      
      if (docSnap.exists()) {
        const existingData = docSnap.data() as StreakData;
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        
        if (existingData.date === today) {
          // Already updated today, return current count
          return existingData.count;
        } else if (existingData.date === yesterdayStr) {
          // Continue streak
          newCount = existingData.count + 1;
        }
        // else: streak broken, reset to 1
      }
      
      const streakData: StreakData = {
        uid,
        type,
        date: today,
        count: newCount,
        updatedAt: Timestamp.now()
      };
      
      await setDoc(docRef, streakData);
      return newCount;
    } catch (error) {
      console.error('Error updating streak:', error);
      throw error;
    }
  }

  // Completion methods
  async getCompletion(uid: string, type: 'affirmation' | 'mindful-moment' | 'kindness-challenge'): Promise<CompletionData | null> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const docRef = this.getDocument('completions', `${uid}_${type}_${today}`);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data() as CompletionData;
      }
      return null;
    } catch (error) {
      console.error('Error getting completion:', error);
      throw error;
    }
  }

  async setCompletion(uid: string, type: 'affirmation' | 'mindful-moment' | 'kindness-challenge'): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const docRef = this.getDocument('completions', `${uid}_${type}_${today}`);
      
      const completionData: CompletionData = {
        uid,
        type,
        date: today,
        completedAt: Timestamp.now()
      };
      
      await setDoc(docRef, completionData);
    } catch (error) {
      console.error('Error setting completion:', error);
      throw error;
    }
  }

  // Tomb methods
  async addToTomb(uid: string, tombEntry: Omit<TombEntry, 'diedAt'>): Promise<void> {
    try {
      const collectionRef = this.getCollection('tomb');
      await addDoc(collectionRef, {
        uid,
        ...tombEntry,
        diedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error adding to tomb:', error);
      throw error;
    }
  }

  async getTombEntries(uid: string): Promise<TombEntry[]> {
    try {
      const collectionRef = this.getCollection('tomb');
      const q = query(
        collectionRef,
        where('uid', '==', uid),
        orderBy('diedAt', 'desc'),
        limit(50)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => doc.data()) as TombEntry[];
    } catch (error) {
      console.error('Error getting tomb entries:', error);
      throw error;
    }
  }

  // Symptom methods
  async getUserSymptoms(uid: string): Promise<SymptomEntry[]> {
    try {
      const collectionRef = this.getCollection('symptoms');
      const q = query(
        collectionRef, 
        where('uid', '==', uid), 
        orderBy('createdAt', 'desc'),
        limit(100)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SymptomEntry[];
    } catch (error) {
      console.error('Error getting user symptoms:', error);
      throw error;
    }
  }

  async addSymptom(uid: string, symptomData: Omit<SymptomEntry, 'id' | 'uid' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const collectionRef = this.getCollection('symptoms');
      const now = Timestamp.now();
      
      const docRef = await addDoc(collectionRef, {
        uid,
        ...symptomData,
        createdAt: now,
        updatedAt: now
      });
      
      return docRef.id;
    } catch (error) {
      console.error('Error adding symptom:', error);
      throw error;
    }
  }

  async updateSymptom(symptomId: string, updates: Partial<SymptomEntry>): Promise<void> {
    try {
      const docRef = this.getDocument('symptoms', symptomId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating symptom:', error);
      throw error;
    }
  }

  async deleteSymptom(symptomId: string): Promise<void> {
    try {
      const docRef = this.getDocument('symptoms', symptomId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting symptom:', error);
      throw error;
    }
  }
}

export const firestoreService = new FirestoreService();