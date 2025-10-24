import { AuthUser, SignupData, LoginData } from "./authService";

/**
 * Sign up a new user with backend authentication
 */
export async function firebaseSignUp(data: SignupData) {
  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fullName: data.fullName,
        email: data.email,
        password: data.password,
      }),
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
  } catch (error: any) {
    console.error('Signup error:', error);
    throw new Error(error.message || 'Failed to create account');
  }
}

/**
 * Sign in with backend authentication
 */
export async function firebaseSignIn(data: LoginData) {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: data.email,
        password: data.password,
      }),
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
  } catch (error: any) {
    console.error('Signin error:', error);
    throw new Error(error.message || 'Failed to sign in');
  }
}

/**
 * Sign out from backend
 */
export async function firebaseSignOutUser() {
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
  } catch (error: any) {
    console.error('Signout error:', error);
    throw new Error(error.message || 'Failed to sign out');
  }
}

/**
 * Get current user from backend session
 */
export async function firebaseGetCurrentUser(): Promise<AuthUser | null> {
  try {
    const response = await fetch('/api/auth/me', {
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
    console.error('Error fetching user from backend:', error);
    return null;
  }
}

/**
 * Listen to auth state changes (for session-based authentication)
 * Note: Session-based auth doesn't have real-time listeners like Firebase,
 * so this is primarily for initial state and manual refreshes
 */
export function onFirebaseAuthStateChange(callback: (user: AuthUser | null) => void) {
  // Immediately check current session state
  fetch('/api/auth/me', {
    credentials: 'include',
  })
    .then(async (response) => {
      if (!response.ok) {
        callback(null);
        return;
      }

      const userData = await response.json();
      callback({
        id: userData.id,
        email: userData.email,
        fullName: userData.fullName,
        avatarUrl: userData.avatarUrl,
        points: userData.points || 0,
      });
    })
    .catch((error) => {
      console.error('Error in auth state check:', error);
      callback(null);
    });

  // Return empty cleanup function
  return () => {};
}
