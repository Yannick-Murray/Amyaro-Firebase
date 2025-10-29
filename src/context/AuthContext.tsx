import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
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

  // Benutzer registrieren
  const register = async (email: string, password: string, displayName?: string) => {
    try {
      const { user: firebaseUser } = await createUserWithEmailAndPassword(auth, email, password);
      
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
        createdAt: new Date()
      };

      await setDoc(doc(db, 'users', firebaseUser.uid), userData);
      
      // Standard-Liste erstellen
      try {
        const ListService = await import('../services/listService').then(m => m.ListService);
        
        await ListService.createList(
          firebaseUser.uid,
          'Meine erste Einkaufsliste',
          'shopping',
          'Willkommen bei Amyaro! Das ist deine erste Einkaufsliste.',
          undefined, // no category
          false // not private
        );
      } catch (listError) {
        console.error('Error creating default list:', listError);
        // Don't throw error to prevent registration from failing
      }
      
    } catch (error: any) {
      console.error('Registration error:', error);
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

  // Auth State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Benutzer-Daten aus Firestore laden
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          
          if (userDoc.exists()) {
            const userData = userDoc.data() as UserType;
            setUser({
              ...userData,
              createdAt: userData.createdAt instanceof Date ? userData.createdAt : new Date()
            });
          } else {
            // Fallback: Benutzer-Objekt aus Firebase Auth erstellen
            const userData: UserType = {
              uid: firebaseUser.uid,
              email: firebaseUser.email!,
              displayName: firebaseUser.displayName || '',
              photoURL: firebaseUser.photoURL || '',
              createdAt: new Date()
            };
            setUser(userData);
            
            // Benutzer in Firestore speichern
            await setDoc(doc(db, 'users', firebaseUser.uid), userData);
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

  // Error Message Helper
  const getErrorMessage = (errorCode: string): string => {
    switch (errorCode) {
      case 'auth/user-not-found':
        return 'Benutzer nicht gefunden';
      case 'auth/wrong-password':
        return 'Falsches Passwort';
      case 'auth/email-already-in-use':
        return 'E-Mail-Adresse wird bereits verwendet';
      case 'auth/weak-password':
        return 'Passwort ist zu schwach (mindestens 6 Zeichen)';
      case 'auth/invalid-email':
        return 'Ungültige E-Mail-Adresse';
      case 'auth/too-many-requests':
        return 'Zu viele Anmeldeversuche. Versuche es später erneut.';
      default:
        return 'Ein unbekannter Fehler ist aufgetreten';
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    resetPassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};