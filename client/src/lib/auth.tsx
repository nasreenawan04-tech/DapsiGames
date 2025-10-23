import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useLocation } from "wouter";
import {
  signIn,
  signUp,
  signOut,
  getCurrentUser,
  onAuthStateChange,
  type AuthUser,
} from "@/services/authService";
import { getRedirectPath } from "./redirectAfterAuth";

interface AuthContextType {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  register: (fullName: string, email: string, password: string) => Promise<{ needsEmailVerification: boolean }>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();

  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      try {
        const currentUser = await getCurrentUser();
        if (mounted && currentUser) {
          setUser(currentUser);
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

    const subscription = onAuthStateChange((authUser) => {
      if (!mounted) return;
      setUser(authUser);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    const { user: authUser } = await signIn({ email, password });
    
    setUser(authUser);
    
    // Redirect using centralized utility
    setLocation(getRedirectPath());
  };

  const register = async (fullName: string, email: string, password: string) => {
    const result = await signUp({ email, password, fullName });
    
    if (result.needsEmailVerification) {
      return { needsEmailVerification: true };
    }

    if (result.user) {
      setUser(result.user);
      
      // Redirect using centralized utility
      setLocation(getRedirectPath());
    }

    return { needsEmailVerification: false };
  };

  const logout = async () => {
    await signOut();
    setUser(null);
    setLocation("/");
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
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
