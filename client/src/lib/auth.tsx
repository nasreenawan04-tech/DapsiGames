import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useLocation } from "wouter";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import {
  signIn,
  signUp,
  signOut,
  getCurrentUser,
  onAuthStateChange,
} from "@/services/authService";
import { getRedirectPath } from "./redirectAfterAuth";

interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  points?: number;
  rank?: number;
}

interface AuthContextType {
  user: AuthUser | null;
  supabaseUser: SupabaseUser | null;
  login: (email: string, password: string) => Promise<void>;
  register: (fullName: string, email: string, password: string) => Promise<{ needsEmailVerification: boolean }>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();

  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      try {
        const currentUser = await getCurrentUser();
        if (mounted && currentUser) {
          setSupabaseUser(currentUser);
          setUser({
            id: currentUser.id,
            email: currentUser.email || '',
            fullName: currentUser.user_metadata?.full_name || '',
            avatarUrl: currentUser.user_metadata?.avatar_url,
          });
        }
      } catch (error) {
        console.error('Error fetching current user:', error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    initAuth();

    const subscription = onAuthStateChange((supabaseUser) => {
      if (!mounted) return;

      setSupabaseUser(supabaseUser);
      if (supabaseUser) {
        setUser({
          id: supabaseUser.id,
          email: supabaseUser.email || '',
          fullName: supabaseUser.user_metadata?.full_name || '',
          avatarUrl: supabaseUser.user_metadata?.avatar_url,
        });
      } else {
        setUser(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    const { user: supabaseUser } = await signIn({ email, password });
    
    setSupabaseUser(supabaseUser);
    setUser({
      id: supabaseUser.id,
      email: supabaseUser.email || '',
      fullName: supabaseUser.user_metadata?.full_name || '',
      avatarUrl: supabaseUser.user_metadata?.avatar_url,
    });
    
    // Redirect using centralized utility
    setLocation(getRedirectPath());
  };

  const register = async (fullName: string, email: string, password: string) => {
    const result = await signUp({ email, password, fullName });
    
    if (result.needsEmailVerification) {
      return { needsEmailVerification: true };
    }

    if (result.user) {
      setSupabaseUser(result.user);
      setUser({
        id: result.user.id,
        email: result.user.email || '',
        fullName: result.user.user_metadata?.full_name || '',
        avatarUrl: result.user.user_metadata?.avatar_url,
      });
      
      // Redirect using centralized utility
      setLocation(getRedirectPath());
    }

    return { needsEmailVerification: false };
  };

  const logout = async () => {
    await signOut();
    setUser(null);
    setSupabaseUser(null);
    setLocation("/");
  };

  return (
    <AuthContext.Provider value={{ user, supabaseUser, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
