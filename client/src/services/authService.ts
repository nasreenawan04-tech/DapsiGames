import { supabase } from '@/lib/supabase';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
}

export interface SignupData {
  email: string;
  password: string;
  fullName: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface LoginResponse {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
}

/**
 * Sign up a new user with email and password using Supabase
 */
export async function signUp(data: SignupData) {
  const { data: authData, error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        full_name: data.fullName,
      },
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!authData.user) {
    throw new Error('Failed to create user account');
  }

  // Check if email confirmation is required
  const needsEmailVerification = authData.user.identities?.length === 0;

  const user: AuthUser = {
    id: authData.user.id,
    email: authData.user.email!,
    fullName: data.fullName,
    avatarUrl: authData.user.user_metadata?.avatar_url,
  };

  return {
    user,
    session: authData.session,
    needsEmailVerification,
  };
}

/**
 * Sign in with email and password using Supabase
 */
export async function signIn(data: LoginData) {
  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!authData.user) {
    throw new Error('Failed to sign in');
  }

  const user: AuthUser = {
    id: authData.user.id,
    email: authData.user.email!,
    fullName: authData.user.user_metadata?.full_name || authData.user.email!.split('@')[0],
    avatarUrl: authData.user.user_metadata?.avatar_url,
  };

  return {
    user,
    session: authData.session,
  };
}

/**
 * Sign out the current user using Supabase
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  
  if (error) {
    throw new Error(error.message);
  }
}

/**
 * Send password reset email using Supabase
 */
export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });

  if (error) {
    throw new Error(error.message);
  }
}

/**
 * Update user password using Supabase (after reset)
 */
export async function updatePassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    throw new Error(error.message);
  }
}

/**
 * Resend verification email using Supabase
 */
export async function resendVerificationEmail(email: string) {
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
  });

  if (error) {
    throw new Error(error.message);
  }
}

/**
 * Get current session from Supabase
 */
export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

/**
 * Get current user from Supabase
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email!,
    fullName: user.user_metadata?.full_name || user.email!.split('@')[0],
    avatarUrl: user.user_metadata?.avatar_url,
  };
}

/**
 * Sign in with Google OAuth using Supabase
 */
export async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth-callback`,
    },
  });

  if (error) {
    throw new Error(error.message);
  }
}

/**
 * Upload profile picture using Supabase Storage
 */
export async function uploadProfilePicture(file: File, userId: string) {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}-${Date.now()}.${fileExt}`;
  const filePath = `avatars/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file);

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath);

  // Update user metadata with new avatar URL
  const { error: updateError } = await supabase.auth.updateUser({
    data: { avatar_url: publicUrl },
  });

  if (updateError) {
    throw new Error(updateError.message);
  }

  return publicUrl;
}

/**
 * Listen to auth state changes using Supabase
 */
export function onAuthStateChange(callback: (user: AuthUser | null) => void) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      if (session?.user) {
        const user: AuthUser = {
          id: session.user.id,
          email: session.user.email!,
          fullName: session.user.user_metadata?.full_name || session.user.email!.split('@')[0],
          avatarUrl: session.user.user_metadata?.avatar_url,
        };
        callback(user);
      } else {
        callback(null);
      }
    }
  );

  return subscription;
}
