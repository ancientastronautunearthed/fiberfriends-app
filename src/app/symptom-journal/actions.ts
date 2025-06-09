'use server';

import { firestore } from '@/lib/firebase-admin'; // Using the Admin SDK for server-side operations
import { revalidatePath } from 'next/cache';
import { Timestamp, QueryDocumentSnapshot, DocumentData } from 'firebase-admin/firestore';

// Define the type for the data being saved
interface SymptomEntryData {
  date: string; 
  symptoms: string[];
  notes: string;
  photoDataUri?: string;
}

// NOTE: In a production application, you should implement a robust server-side
// session management system (e.g., using session cookies with Firebase Auth)
// to securely verify the user's identity on the server.
// For simplicity, this example trusts the 'userId' passed from the client,
// but adds a basic check in the delete function.

/**
 * Saves a new symptom entry to the 'symptom_logs' collection in Firestore.
 */
export async function saveSymptomEntry(data: SymptomEntryData, userId: string) {
  if (!userId) {
    return { error: 'User is not authenticated.' };
  }

  const newEntry = {
    ...data,
    userId: userId,
    createdAt: Timestamp.now(), // Use server-side timestamp for accuracy
  };

  try {
    const docRef = await firestore.collection('symptom_logs').add(newEntry);
    revalidatePath('/symptom-journal'); // This tells Next.js to refresh the data on the page
    
    // Return the newly created entry so we can optimistically update the UI
    return { 
      success: true, 
      newEntry: { 
        ...newEntry, 
        id: docRef.id, 
        createdAt: newEntry.createdAt.toDate().toISOString() 
      } 
    };
  } catch (error) {
    console.error('Error saving symptom entry:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { error: `Failed to save entry: ${errorMessage}` };
  }
}

/**
 * Fetches all symptom entries for a given user.
 */
export async function getSymptomEntries(userId: string) {
  if (!userId) {
    return [];
  }

  try {
    const snapshot = await firestore
      .collection('symptom_logs')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();

    // Map over documents and convert Firestore Timestamps to serializable ISO strings
    return snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            // Ensure createdAt is always a string for the client
            createdAt: (data.createdAt as Timestamp).toDate().toISOString(),
        }
    });
  } catch (error) {
    console.error('Error fetching symptom entries:', error);
    return []; // Return an empty array on error
  }
}

/**
 * Deletes a specific symptom entry from Firestore.
 */
export async function deleteSymptomEntry(entryId: string, userId: string) {
    if (!userId) {
        return { error: 'User is not authenticated.' };
    }
    
    try {
        const docRef = firestore.collection('symptom_logs').doc(entryId);
        const doc = await docRef.get();

        // Security check: ensure the user requesting deletion owns the document
        if (!doc.exists || doc.data()?.userId !== userId) {
            return { error: 'Permission denied or entry not found.' };
        }
        
        await docRef.delete();
        revalidatePath('/symptom-journal');
        return { success: true };
    } catch (error) {
        console.error('Error deleting symptom entry:', error);
        return { error: 'Failed to delete entry.' };
    }
}
