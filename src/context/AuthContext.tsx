import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import type { AuthContextType, User as UserType } from '../types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);

  // Function to refresh user data from Firestore
  const refreshUserData = async () => {
    if (!auth.currentUser) {
      setUser(null);
      return;
    }

    try {
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data() as UserType;
        setUser({
          ...userData,
          // Use Firestore emailVerified value if it exists, otherwise fall back to Firebase Auth
          emailVerified: userData.emailVerified !== undefined ? userData.emailVerified : auth.currentUser.emailVerified,
          createdAt: userData.createdAt instanceof Date ? userData.createdAt : new Date()
        });
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  };

  // Benutzer registrieren
  const register = async (email: string, password: string, displayName?: string) => {
    try {
      const { user: firebaseUser } = await createUserWithEmailAndPassword(auth, email, password);
      
      // E-Mail-Verifizierung senden
      await sendEmailVerification(firebaseUser);
      
      // Profil aktualisieren
      if (displayName) {
        await updateProfile(firebaseUser, { displayName });
      }

      // Benutzer in Firestore speichern
      const userData: UserType = {
        uid: firebaseUser.uid,
        email: firebaseUser.email!,
        displayName: displayName || firebaseUser.displayName || '',
        photoURL: firebaseUser.photoURL || '',
        emailVerified: false, // Explicitly set to false initially
        createdAt: new Date()
      };

      await setDoc(doc(db, 'users', firebaseUser.uid), userData);
      
      // No default list creation - users can create their own lists after verification
      
    } catch (error: any) {
      // Nur loggen wenn es nicht ein Permission-Problem für unverifizierte Benutzer ist
      if (error.code !== 'permission-denied') {
        console.error('Registration error:', error);
      }
      throw new Error(getErrorMessage(error.code));
    }
  };

  // Benutzer anmelden
  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(getErrorMessage(error.code));
    }
  };

  // Benutzer abmelden
  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error: any) {
      console.error('Logout error:', error);
      throw new Error('Fehler beim Abmelden');
    }
  };

  // Passwort zurücksetzen
  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      console.error('Password reset error:', error);
      throw new Error(getErrorMessage(error.code));
    }
  };

  // E-Mail-Verifizierung erneut senden
  const resendEmailVerification = async () => {
    try {
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser);
      } else {
        throw new Error('Kein Benutzer angemeldet');
      }
    } catch (error: any) {
      console.error('Resend email verification error:', error);
      throw new Error(getErrorMessage(error.code));
    }
  };

  // Check email verification status (refresh user)
  const checkEmailVerification = async (): Promise<boolean> => {
    try {
      if (auth.currentUser) {
        // Force reload user data from Firebase to get latest emailVerified status
        await auth.currentUser.reload();
        
        // Get fresh user object after reload
        const refreshedUser = auth.currentUser;
        const isVerified = refreshedUser.emailVerified;
        
        if (isVerified) {
          // Update Firestore user document with verification status
          try {
            await setDoc(doc(db, 'users', refreshedUser.uid), {
              emailVerified: true,
              updatedAt: new Date()
            }, { merge: true });
          } catch (firestoreError) {
            console.log('Note: Could not update Firestore (this is expected during verification)');
          }
        }
        
        // Update user state with new verification status
        setUser(prevUser => prevUser ? { ...prevUser, emailVerified: isVerified } : null);
        
        return isVerified;
      }
      return false;
    } catch (error: any) {
      console.error('Error checking email verification:', error);
      return false;
    }
  };

  // Auth State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // CRITICAL: Always reload to get latest emailVerified status
          await firebaseUser.reload();
          const refreshedUser = auth.currentUser;
          
          if (!refreshedUser) {
            setUser(null);
            setLoading(false);
            return;
          }
          
          // Benutzer-Daten aus Firestore laden
          const userDoc = await getDoc(doc(db, 'users', refreshedUser.uid));
          
          if (userDoc.exists()) {
            const userData = userDoc.data() as UserType;
            setUser({
              ...userData,
              // Use Firestore emailVerified value if it exists, otherwise fall back to Firebase Auth
              emailVerified: userData.emailVerified !== undefined ? userData.emailVerified : refreshedUser.emailVerified,
              createdAt: userData.createdAt instanceof Date ? userData.createdAt : new Date()
            });
          } else {
            // Fallback: Benutzer-Objekt aus Firebase Auth erstellen
            const userData: UserType = {
              uid: refreshedUser.uid,
              email: refreshedUser.email!,
              displayName: refreshedUser.displayName || '',
              photoURL: refreshedUser.photoURL || '',
              emailVerified: refreshedUser.emailVerified,
              createdAt: new Date()
            };
            setUser(userData);
            
            // Benutzer in Firestore speichern
            await setDoc(doc(db, 'users', refreshedUser.uid), userData);
          }
        } catch (error) {
          console.error('Error loading user data:', error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Listen for user data updates (e.g., after email verification)
  useEffect(() => {
    const handleUserDataUpdate = () => {
      refreshUserData();
    };

    window.addEventListener('userDataUpdated', handleUserDataUpdate);
    
    return () => {
      window.removeEventListener('userDataUpdated', handleUserDataUpdate);
    };
  }, []);

// Enhanced Error Message Helper with Security Features
  const getErrorMessage = (errorCode: string): string => {
    switch (errorCode) {
      case 'auth/user-not-found':
        return 'E-Mail oder Passwort ist falsch'; // Don't reveal if user exists
      case 'auth/wrong-password':
        return 'E-Mail oder Passwort ist falsch'; // Don't reveal which is wrong
      case 'auth/email-already-in-use':
        return 'E-Mail-Adresse wird bereits verwendet';
      case 'auth/weak-password':
        return 'Passwort erfüllt nicht die Sicherheitsanforderungen';
      case 'auth/invalid-email':
        return 'Ungültige E-Mail-Adresse';
      case 'auth/too-many-requests':
        return 'Zu viele Anmeldeversuche. Konto temporär gesperrt. Versuche es in 15 Minuten erneut.';
      case 'auth/network-request-failed':
        return 'Netzwerkfehler. Bitte überprüfe deine Internetverbindung.';
      case 'auth/user-disabled':
        return 'Dieses Konto wurde deaktiviert. Kontaktiere den Support.';
      case 'auth/operation-not-allowed':
        return 'Diese Anmeldemethode ist nicht erlaubt.';
      case 'auth/invalid-credential':
        return 'E-Mail oder Passwort ist falsch';
      default:
        console.error('Unknown auth error:', errorCode); // Log for debugging
        return 'Ein Fehler ist aufgetreten. Bitte versuche es erneut.';
    }
  };

  // Session timeout configuration
  useEffect(() => {
    let timeoutId: number;
    
    const resetTimeout = () => {
      clearTimeout(timeoutId);
      // Set session timeout to 24 hours of inactivity
      timeoutId = window.setTimeout(() => {
        if (auth.currentUser) {
          logout();
          // You could show a session expired message here
          console.log('Session expired due to inactivity');
        }
      }, 24 * 60 * 60 * 1000); // 24 hours
    };

    // Reset timeout on user activity
    const handleActivity = () => {
      if (auth.currentUser) {
        resetTimeout();
      }
    };

    // Listen for user activity
    document.addEventListener('mousedown', handleActivity);
    document.addEventListener('keypress', handleActivity);
    document.addEventListener('scroll', handleActivity);
    
    // Start timeout if user is logged in
    if (auth.currentUser) {
      resetTimeout();
    }

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleActivity);
      document.removeEventListener('keypress', handleActivity);
      document.removeEventListener('scroll', handleActivity);
    };
  }, [user]);

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    resetPassword,
    resendEmailVerification,
    checkEmailVerification,
    refreshUserData
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};