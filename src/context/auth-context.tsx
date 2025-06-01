
'use client';

import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth as firebaseAuthInstance, firebaseConfigError } from '@/lib/firebase'; // Import named auth and global error
import { Loader2 } from 'lucide-react';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  configError: string | null; // Add configError to context
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [configErrorState, setConfigErrorState] = useState<string | null>(firebaseConfigError); // Initialize with error from firebase.ts

  useEffect(() => {
    // If there's a config error from firebase.ts, reflect it immediately.
    if (firebaseConfigError) {
      setConfigErrorState(firebaseConfigError);
      setUser(null);
      setLoading(false);
      return; // No need to subscribe to onAuthStateChanged if Firebase isn't configured
    }

    // Only subscribe if auth instance was successfully initialized
    if (firebaseAuthInstance) {
      const unsubscribe = onAuthStateChanged(firebaseAuthInstance, (currentUser) => {
        setUser(currentUser);
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      // This case should ideally be caught by the initial firebaseConfigError check
      setUser(null);
      setLoading(false);
      setConfigErrorState(prevError => prevError || "Firebase Auth instance is not available. Check configuration.");
    }
  }, []); // Dependency array is empty as firebaseAuthInstance and firebaseConfigError are module-level

  // Initial loading screen logic
  if (loading) { // Show loader if still loading and no config error displayed yet
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

