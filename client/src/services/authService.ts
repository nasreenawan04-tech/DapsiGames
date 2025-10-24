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

const API_BASE = '/api';

/**
 * Sign up a new user with email and password using backend API
 */
export async function signUp(data: SignupData) {
  const response = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create account');
  }

  const userData = await response.json();

  const user: AuthUser = {
    id: userData.id,
    email: userData.email,
    fullName: userData.fullName,
    avatarUrl: userData.avatarUrl,
    points: userData.points || 0,
  };

  return {
    user,
    needsEmailVerification: false,
  };
}

/**
 * Sign in with email and password using backend API
 */
export async function signIn(data: LoginData) {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to sign in');
  }

  const userData = await response.json();

  const user: AuthUser = {
    id: userData.id,
    email: userData.email,
    fullName: userData.fullName,
    avatarUrl: userData.avatarUrl,
    points: userData.points || 0,
  };

  return {
    user,
  };
}

/**
 * Sign out the current user
 */
export async function signOut() {
  const response = await fetch(`${API_BASE}/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to sign out');
  }
}

/**
 * Get current authenticated user
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const response = await fetch(`${API_BASE}/auth/me`, {
      credentials: 'include',
    });

    if (!response.ok) {
      return null;
    }

    const userData = await response.json();

    return {
      id: userData.id,
      email: userData.email,
      fullName: userData.fullName,
      avatarUrl: userData.avatarUrl,
      points: userData.points || 0,
    };
  } catch (error) {
    console.error('Error fetching current user:', error);
    return null;
  }
}

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
  // For backend API, we can poll or use websockets
  // For now, return a no-op subscription since the auth state is managed in the AuthContext
  return {
    unsubscribe: () => {},
  };
}
