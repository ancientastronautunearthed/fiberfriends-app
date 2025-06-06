
'use client';

import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { onAuthStateChanged, type User as FirebaseUserType } from 'firebase/auth'; 
import { auth as firebaseAuthInstance, firebaseConfigError } from '@/lib/firebase';
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
  loading: boolean;
  configError: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  // Initialize configErrorState with firebaseConfigError from firebase.ts
  // but only if not in DEMO_MODE. In DEMO_MODE, we assume config errors are not relevant for UI blocking.
  const [configErrorState, setConfigErrorState] = useState<string | null>(DEMO_MODE ? null : firebaseConfigError);

  useEffect(() => {
    if (DEMO_MODE) {
      console.log("AuthContext: Running in DEMO_MODE (controlled by NEXT_PUBLIC_DEMO_MODE).");
      setUser({
        uid: 'demo-user-123',
        email: 'demo@example.com',
        displayName: 'Demo User',
      } as User); 
      setLoading(false);
      setConfigErrorState(null); // Explicitly set no config error in demo mode
      return;
    }

    // If not in DEMO_MODE, proceed with Firebase Auth
    if (firebaseConfigError) { // This error is from firebase.ts
      setConfigErrorState(firebaseConfigError);
      setUser(null);
      setLoading(false);
      return;
    }

    if (firebaseAuthInstance) {
      const unsubscribe = onAuthStateChanged(firebaseAuthInstance, (currentUser) => {
        setUser(currentUser as User | null); 
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      // This case should ideally be caught by firebaseConfigError earlier
      setUser(null);
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
    <AuthContext.Provider value={{ user, loading, configError: configErrorState }}>
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
