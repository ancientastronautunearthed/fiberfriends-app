'use client';

import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { onAuthStateChanged, type User as FirebaseUserType } from 'firebase/auth'; 
import { auth as firebaseAuthInstance, firebaseConfigError } from '@/lib/firebase';
import { firestoreService, type UserProfile } from '@/lib/firestore-service';
import { Loader2 } from 'lucide-react';

// --- Demo Mode Configuration ---
// Demo mode is now controlled by the NEXT_PUBLIC_DEMO_MODE environment variable.
// Set to "true" in .env to bypass Firebase login and use a mock user.
// Set to "false" for normal Firebase authentication.
const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
// --- End Demo Mode Configuration ---

type User = FirebaseUserType | {
  uid: string;
  email: string | null;
  displayName?: string | null;
};

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  configError: string | null;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  // Initialize configErrorState with firebaseConfigError from firebase.ts
  // but only if not in DEMO_MODE. In DEMO_MODE, we assume config errors are not relevant for UI blocking.
  const [configErrorState, setConfigErrorState] = useState<string | null>(DEMO_MODE ? null : firebaseConfigError);

  const refreshUserProfile = async () => {
    if (!user) {
      setUserProfile(null);
      return;
    }

    try {
      const profile = await firestoreService.getUserProfile(user.uid);
      setUserProfile(profile);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setUserProfile(null);
    }
  };

  const createUserProfileIfNeeded = async (firebaseUser: FirebaseUserType) => {
    try {
      // Check if user profile exists
      let profile = await firestoreService.getUserProfile(firebaseUser.uid);
      
      if (!profile) {
        // Create new user profile
        await firestoreService.createUserProfile(
          firebaseUser.uid,
          firebaseUser.email || '',
          firebaseUser.displayName || undefined
        );
        
        // Fetch the newly created profile
        profile = await firestoreService.getUserProfile(firebaseUser.uid);
      }
      
      setUserProfile(profile);
    } catch (error) {
      console.error('Error creating/fetching user profile:', error);
      setUserProfile(null);
    }
  };

  useEffect(() => {
    if (DEMO_MODE) {
      console.log("AuthContext: Running in DEMO_MODE (controlled by NEXT_PUBLIC_DEMO_MODE).");
      const demoUser = {
        uid: 'demo-user-123',
        email: 'demo@example.com',
        displayName: 'Demo User',
      } as User;
      
      setUser(demoUser);
      
      // Create a demo user profile
      const demoProfile: UserProfile = {
        uid: 'demo-user-123',
        email: 'demo@example.com',
        displayName: 'Demo User',
        createdAt: new Date() as any,
        updatedAt: new Date() as any,
        points: 150, // Give demo user some points
        tier: 'NONE'
      };
      setUserProfile(demoProfile);
      
      setLoading(false);
      setConfigErrorState(null); // Explicitly set no config error in demo mode
      return;
    }

    // If not in DEMO_MODE, proceed with Firebase Auth
    if (firebaseConfigError) { // This error is from firebase.ts
      setConfigErrorState(firebaseConfigError);
      setUser(null);
      setUserProfile(null);
      setLoading(false);
      return;
    }

    if (firebaseAuthInstance) {
      const unsubscribe = onAuthStateChanged(firebaseAuthInstance, async (currentUser) => {
        setUser(currentUser as User | null);
        
        if (currentUser) {
          // Create user profile if needed and load it
          await createUserProfileIfNeeded(currentUser);
        } else {
          setUserProfile(null);
        }
        
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      // This case should ideally be caught by firebaseConfigError earlier
      setUser(null);
      setUserProfile(null);
      setLoading(false);
      setConfigErrorState(prevError => prevError || "Firebase Auth instance is not available. Check configuration.");
    }
  }, []); // Empty dependency array, effect runs once on mount

  if (loading && !DEMO_MODE) { 
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <AuthContext.Provider value={{ user, userProfile, loading, configError: configErrorState, refreshUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}