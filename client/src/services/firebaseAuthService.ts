import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { AuthUser, SignupData, LoginData } from "./authService";

/**
 * Sign up a new user with Firebase Authentication
 * Then sync with backend database
 */
export async function firebaseSignUp(data: SignupData) {
  if (!auth) {
    throw new Error('Firebase is not configured. Please set up Firebase environment variables.');
  }

  try {
    // Create user in Firebase
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      data.email,
      data.password
    );

    // Update Firebase profile with full name
    await updateProfile(userCredential.user, {
      displayName: data.fullName,
    });

    // Get Firebase ID token to send to backend
    const idToken = await userCredential.user.getIdToken();

    // Sync with backend database
    const response = await fetch('/api/auth/firebase-register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        fullName: data.fullName,
        email: data.email,
      }),
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to sync user with backend');
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
    console.error('Firebase signup error:', error);
    throw new Error(error.message || 'Failed to create account');
  }
}

/**
 * Sign in with Firebase Authentication
 * Then sync session with backend
 */
export async function firebaseSignIn(data: LoginData) {
  if (!auth) {
    throw new Error('Firebase is not configured. Please set up Firebase environment variables.');
  }

  try {
    // Sign in with Firebase
    const userCredential = await signInWithEmailAndPassword(
      auth,
      data.email,
      data.password
    );

    // Get Firebase ID token to send to backend
    const idToken = await userCredential.user.getIdToken();

    // Sync with backend to create session
    const response = await fetch('/api/auth/firebase-login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to sync session with backend');
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
    console.error('Firebase signin error:', error);
    throw new Error(error.message || 'Failed to sign in');
  }
}

/**
 * Sign out from Firebase and backend
 */
export async function firebaseSignOutUser() {
  if (!auth) {
    throw new Error('Firebase is not configured. Please set up Firebase environment variables.');
  }

  try {
    // Sign out from Firebase
    await firebaseSignOut(auth);

    // Sign out from backend
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
  } catch (error: any) {
    console.error('Firebase signout error:', error);
    throw new Error(error.message || 'Failed to sign out');
  }
}

/**
 * Get current Firebase user and sync with backend
 */
export async function firebaseGetCurrentUser(): Promise<AuthUser | null> {
  if (!auth) {
    console.warn('Firebase is not configured');
    return null;
  }

  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth!, async (firebaseUser) => {
      unsubscribe();

      if (!firebaseUser) {
        resolve(null);
        return;
      }

      try {
        // Get user data from backend
        const response = await fetch('/api/auth/me', {
          credentials: 'include',
        });

        if (!response.ok) {
          resolve(null);
          return;
        }

        const userData = await response.json();

        resolve({
          id: userData.id,
          email: userData.email,
          fullName: userData.fullName,
          avatarUrl: userData.avatarUrl,
          points: userData.points || 0,
        });
      } catch (error) {
        console.error('Error fetching user from backend:', error);
        resolve(null);
      }
    });
  });
}

/**
 * Listen to Firebase auth state changes
 */
export function onFirebaseAuthStateChange(callback: (user: AuthUser | null) => void) {
  if (!auth) {
    console.warn('Firebase is not configured');
    callback(null);
    return () => {};
  }

  return onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
    if (!firebaseUser) {
      callback(null);
      return;
    }

    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
      });

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
    } catch (error) {
      console.error('Error in auth state change:', error);
      callback(null);
    }
  });
}
