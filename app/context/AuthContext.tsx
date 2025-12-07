import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, googleProvider } from '@/lib/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  // signInWithPopup, // web-only
  signInWithCredential,
  signOut,
  onAuthStateChanged,
  updateProfile,
  User as FirebaseUser,
  GoogleAuthProvider,
} from 'firebase/auth';
import { Platform } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

export type AppUser = {
  fullName: string;
  firebase_id: string;
  mongo_uid: string;
  email: string;
  photoUrl: string;
};

type AuthContextValue = {
  user: AppUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, fullName: string) => Promise<void>;
  googleLogin: (idToken?: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  const backendUrl = `${Constants.expoConfig?.extra?.API_URL}/api/users/auth`;

  const syncWithBackend = async (firebaseUser: FirebaseUser, fullName?: string) => {
    try {
      console.log('🔄 Syncing with backend...', {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
      });

      const payload = {
        firebaseUid: firebaseUser.uid,
        email: firebaseUser.email,
        fullName: fullName || firebaseUser.displayName,
        photoUrl: firebaseUser.photoURL || '',
      };

      const res = await axios.post(backendUrl, payload);
      console.log('✅ Backend response:', res.data);

      const userData: AppUser = {
        fullName: res.data.fullName,
        firebase_id: res.data.firebaseUid,
        mongo_uid: res.data._id,
        email: res.data.email,
        photoUrl: res.data.photoUrl,
      };

      setUser(userData);
      await AsyncStorage.setItem('trekky_user', JSON.stringify(userData));
      console.log('💾 User saved to AsyncStorage:', userData);
      return userData;
    } catch (error) {
      console.error('❌ Backend Sync Error:', error);
      throw error;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await syncWithBackend(userCredential.user);
      console.log('✅ Logged in successfully!');
    } catch (error) {
      console.error('❌ Login Error:', error);
      throw error;
    }
  };

  const signup = async (email: string, password: string, fullName: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: fullName });
      await syncWithBackend(userCredential.user, fullName);
      console.log('✅ Account created successfully!');
    } catch (error) {
      console.error('❌ Signup Error:', error);
      throw error;
    }
  };

  const googleLogin = async (idToken?: string) => {
    try {
      if (Platform.OS === 'web') {
        // on web use popup when no idToken provided
        if (!idToken) {
          // dynamic import signInWithPopup to avoid bundling issues on native
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const { signInWithPopup } = require('firebase/auth');
          const result = await signInWithPopup(auth, googleProvider as any);
          await syncWithBackend(result.user);
          console.log('✅ Logged in with Google (web via popup)!');
          return;
        }
      }

      if (!idToken) {
        throw new Error('Missing idToken for native Google login');
      }

      const credential = GoogleAuthProvider.credential(idToken);
      const userCredential = await signInWithCredential(auth, credential as any);
      await syncWithBackend(userCredential.user);
      console.log('✅ Logged in with Google (token exchange)!');
    } catch (error) {
      console.error('❌ Google Login Error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      await AsyncStorage.removeItem('trekky_user');
      console.log('✅ Logged out');
    } catch (error) {
      console.error('❌ Logout Error:', error);
    }
  };

  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('trekky_user');
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          setUser(parsed);
          console.log('💾 User loaded from AsyncStorage:', parsed);
        }
      } catch (error) {
        console.error('Error loading user from AsyncStorage:', error);
      }
    };

    loadUser();

    const unsubscribe = onAuthStateChanged(auth, async (currentUser: FirebaseUser | null) => {
      setLoading(false);
      console.log('🔐 Auth state changed:', currentUser?.email || 'No user');
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, signup, googleLogin, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
