
"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User as FirebaseUser, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import type { Role } from '@/services/users';


interface UserProfile {
  id?: string;
  name: string;
  email: string;
  role: string;
  status: "Active" | "Inactive";
  permissions?: string[];
}

interface AuthContextType {
  user: FirebaseUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  login: (email: string, pass: string, role: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  
  const fetchUserProfile = async (firebaseUser: FirebaseUser): Promise<UserProfile | null> => {
    const userDocRef = doc(db, "users", firebaseUser.uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
        const userData = userDoc.data();
        let permissions: string[] = [];

        // Fetch permissions for the role
        if (userData.role) {
            const rolesQuery = query(collection(db, "roles"), where("name", "==", userData.role));
            const rolesSnapshot = await getDocs(rolesQuery);
            if (!rolesSnapshot.empty) {
                const roleData = rolesSnapshot.docs[0].data() as Role;
                permissions = roleData.permissions || [];
            }
        }
        
        return {
            id: userDoc.id,
            ...userData,
            permissions
        } as UserProfile;
    }
    return null;
  }

  const refreshUser = async () => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      await currentUser.reload();
      const freshUser = auth.currentUser;
      setUser(freshUser);
      if (freshUser) {
        const profile = await fetchUserProfile(freshUser);
        setUserProfile(profile);
      }
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        const profile = await fetchUserProfile(user);
        setUserProfile(profile);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, pass: string, role: string) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    const firebaseUser = userCredential.user;

    if (firebaseUser) {
        const profile = await fetchUserProfile(firebaseUser);

        if (!profile) {
            await signOut(auth);
            throw new Error("User data not found in database.");
        }

        if (profile.role !== role) {
            await signOut(auth);
            throw new Error(`Incorrect role. Please select your correct role to login.`);
        }
         if (profile.status !== 'Active') {
            await signOut(auth);
            throw new Error(`User account is not active.`);
        }
        setUser(firebaseUser);
        setUserProfile(profile);
    } else {
        throw new Error("Login failed: could not retrieve user information.");
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUserProfile(null);
  };

  const value = {
    user,
    userProfile,
    loading,
    login,
    logout,
    refreshUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
