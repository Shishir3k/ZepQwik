import {
  signOut as firebaseSignOut,
  onAuthStateChanged,
  deleteUser,
  User,
} from "firebase/auth";
import React, { createContext, useContext, useEffect, useState } from "react";
import { auth } from "../lib/firebase";
import { supabase } from "../lib/supabase";

interface AuthContextType {
  user: User | null;
  profile: any | null;
  isLoading: boolean;
  refreshProfile: () => Promise<void>;
  softDeleteAccount: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      // Now checks for email to link accounts
      if (firebaseUser?.email) {
        await fetchProfile(firebaseUser.email);
      } else {
        setProfile(null);
      }
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  const fetchProfile = async (email: string) => {
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("email", email)
        .maybeSingle();

      if (error) throw error;
      setProfile(data);
    } catch (err) {
      console.error("Error fetching profile:", err);
    }
  };

  const softDeleteAccount = async () => {
    if (!user?.email || !auth.currentUser) return;

    try {
      // 1. Soft Delete in Supabase: Flag them as deleted, keep the data for analytics
      await supabase
        .from("user_profiles")
        .update({ is_deleted: true, deleted_at: new Date().toISOString() })
        .eq("email", user.email);

      // 2. Hard Delete in Firebase: Erase login credentials completely
      await deleteUser(auth.currentUser);
      
      setUser(null);
      setProfile(null);
    } catch (error: any) {
      console.error("Error deleting account:", error);
      // Firebase requires recent authentication for sensitive actions like account deletion
      if (error.code === 'auth/requires-recent-login') {
        alert("For security reasons, please log out, log back in, and try deleting your account again.");
        await logout();
      }
    }
  };

  const logout = async () => {
    await firebaseSignOut(auth);
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isLoading,
        refreshProfile: () =>
          user?.email
            ? fetchProfile(user.email)
            : Promise.resolve(),
        softDeleteAccount,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);