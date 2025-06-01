
'use client';

import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { onAuthStateChanged, type User as FirebaseUserType } from 'firebase/auth'; // Renamed to avoid conflict with local User type
import { auth as firebaseAuthInstance, firebaseConfigError } from '@/lib/firebase';
import { Loader2 } from 'lucide-react';

// --- Demo Mode Configuration ---
// Set this to true to bypass Firebase login and use a mock user for demo purposes.
// Set to false for normal Firebase authentication.
const DEMO_MODE = true;
// --- End Demo Mode Configuration ---

// Define a User type that can be either FirebaseUser or our mock user structure
type User = FirebaseUserType | {
  uid: string;
  email: string | null;
  displayName?: string | null;
  // Add any other properties your app might expect on a user object
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
  const [configErrorState, setConfigErrorState] = useState<string | null>(firebaseConfigError);

  useEffect(() => {
    if (DEMO_MODE) {
      console.log("AuthContext: Running in DEMO_MODE");
      setUser({
        uid: 'demo-user-123',
        email: 'demo@example.com',
        displayName: 'Demo User',
        // Ensure mock user has all properties your app might access from FirebaseUserType
        // For example:
        // photoURL: null,
        // emailVerified: true,
        // isAnonymous: false,
        // providerData: [],
        // metadata: {}, // Add appropriate mock metadata if needed
        // refreshToken: 'mockRefreshToken',
        // tenantId: null,
        // delete: async () => { console.warn("Mock delete called"); },
        // getIdToken: async () => "mockIdToken",
        // getIdTokenResult: async () => ({ token: "mockIdToken", claims: {}, authTime: "", expirationTime: "", issuedAtTime: "", signInProvider: null, signInSecondFactor: null }),
        // reload: async () => { console.warn("Mock reload called"); },
        // toJSON: () => ({ uid: 'demo-user-123', email: 'demo@example.com', displayName: 'Demo User' }),
      } as User); // Cast to User type
      setLoading(false);
      setConfigErrorState(null); // Assume no config error in demo mode for simplicity
      return;
    }

    if (firebaseConfigError) {
      setConfigErrorState(firebaseConfigError);
      setUser(null);
      setLoading(false);
      return;
    }

    if (firebaseAuthInstance) {
      const unsubscribe = onAuthStateChanged(firebaseAuthInstance, (currentUser) => {
        setUser(currentUser as User | null); // Cast FirebaseUser to User
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      setUser(null);
      setLoading(false);
      setConfigErrorState(prevError => prevError || "Firebase Auth instance is not available. Check configuration.");
    }
  }, []);

  if (loading && !DEMO_MODE) { // Only show full page loader if not in demo mode and loading
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
