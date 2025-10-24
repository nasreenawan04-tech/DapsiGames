import {
  firebaseSignUp,
  firebaseSignIn,
  firebaseSignOutUser,
  firebaseGetCurrentUser,
  onFirebaseAuthStateChange,
} from './firebaseAuthService';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  points?: number;
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
  points?: number;
}

/**
 * Sign up a new user with Firebase Authentication
 */
export async function signUp(data: SignupData) {
  return await firebaseSignUp(data);
}

/**
 * Sign in with Firebase Authentication
 */
export async function signIn(data: LoginData) {
  return await firebaseSignIn(data);
}

/**
 * Sign out from Firebase and backend
 */
export async function signOut() {
  await firebaseSignOutUser();
}

/**
 * Get current authenticated user from Firebase
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  return await firebaseGetCurrentUser();
}

const API_BASE = '/api';

/**
 * Send password reset email
 */
export async function resetPassword(email: string) {
  const response = await fetch(`${API_BASE}/auth/reset-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to send reset email');
  }
}

/**
 * Update user password
 */
export async function updatePassword(newPassword: string, token?: string) {
  const response = await fetch(`${API_BASE}/auth/update-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ password: newPassword, token }),
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update password');
  }
}

/**
 * Upload profile picture
 */
export async function uploadProfilePicture(file: File, userId: string) {
  const formData = new FormData();
  formData.append('avatar', file);

  const response = await fetch(`${API_BASE}/user/${userId}/avatar`, {
    method: 'POST',
    body: formData,
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to upload avatar');
  }

  const data = await response.json();
  return data.avatarUrl;
}

/**
 * Auth state change callback type
 */
export function onAuthStateChange(callback: (user: AuthUser | null) => void) {
  return onFirebaseAuthStateChange(callback);
}
