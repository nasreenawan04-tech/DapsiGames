import { apiRequest } from '@/lib/queryClient';

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
 * Sign up a new user with email and password
 */
export async function signUp(data: SignupData) {
  const response = await apiRequest<LoginResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  if (!response) {
    throw new Error('Failed to create user account');
  }

  // Store user ID in localStorage for session management
  localStorage.setItem('userId', response.id);

  return {
    user: response,
    session: { userId: response.id },
    needsEmailVerification: false,
  };
}

/**
 * Sign in with email and password
 */
export async function signIn(data: LoginData) {
  const response = await apiRequest<LoginResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  if (!response) {
    throw new Error('Failed to sign in');
  }

  // Store user ID in localStorage for session management
  localStorage.setItem('userId', response.id);

  return {
    user: response,
    session: { userId: response.id },
  };
}

/**
 * Sign out the current user
 */
export async function signOut() {
  localStorage.removeItem('userId');
}

/**
 * Send password reset email
 */
export async function resetPassword(email: string) {
  // TODO: Implement password reset functionality
  throw new Error('Password reset not yet implemented');
}

/**
 * Update user password (after reset)
 */
export async function updatePassword(newPassword: string) {
  // TODO: Implement password update functionality
  throw new Error('Password update not yet implemented');
}

/**
 * Resend verification email
 */
export async function resendVerificationEmail(email: string) {
  // Email verification not needed for this implementation
}

/**
 * Get current session
 */
export async function getSession() {
  const userId = localStorage.getItem('userId');
  return userId ? { userId } : null;
}

/**
 * Get current user
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const userId = localStorage.getItem('userId');
  
  if (!userId) {
    return null;
  }

  try {
    const user = await apiRequest<LoginResponse>(`/api/user/${userId}`);
    return user || null;
  } catch (error) {
    // If user not found or error, clear the session
    localStorage.removeItem('userId');
    return null;
  }
}

/**
 * Sign in with Google OAuth
 */
export async function signInWithGoogle() {
  throw new Error('Google OAuth not yet implemented');
}

/**
 * Upload profile picture
 */
export async function uploadProfilePicture(file: File, userId: string) {
  // TODO: Implement profile picture upload
  throw new Error('Profile picture upload not yet implemented');
}

/**
 * Listen to auth state changes
 */
export function onAuthStateChange(callback: (user: AuthUser | null) => void) {
  // For localStorage-based auth, we'll check on an interval
  let lastUserId = localStorage.getItem('userId');
  
  const checkAuth = async () => {
    const currentUserId = localStorage.getItem('userId');
    
    if (lastUserId !== currentUserId) {
      lastUserId = currentUserId;
      if (currentUserId) {
        const user = await getCurrentUser();
        callback(user);
      } else {
        callback(null);
      }
    }
  };

  // Check every 500ms
  const interval = setInterval(checkAuth, 500);

  return {
    unsubscribe: () => clearInterval(interval)
  };
}
