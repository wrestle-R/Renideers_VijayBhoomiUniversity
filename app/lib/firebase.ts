import { initializeApp } from 'firebase/app';
import { GoogleAuthProvider, getAuth } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const firebaseConfig = {
  apiKey: Constants.expoConfig?.extra?.FIREBASE_API_KEY,
  authDomain: Constants.expoConfig?.extra?.FIREBASE_AUTH_DOMAIN,
  projectId: Constants.expoConfig?.extra?.FIREBASE_PROJECT_ID,
  storageBucket: Constants.expoConfig?.extra?.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: Constants.expoConfig?.extra?.FIREBASE_MESSAGING_SENDER_ID,
  appId: Constants.expoConfig?.extra?.FIREBASE_APP_ID,
  measurementId: Constants.expoConfig?.extra?.FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);

// Initialize auth. Prefer React Native persistence when available (native build / Expo
// client). If the RN-specific helpers are not available (e.g. web environment or
// TypeScript typings missing), fall back to the standard `getAuth`.
let _auth: any;
try {
  // Dynamically require RN helpers so TypeScript won't fail compilation when
  // typings or modules are not present in web builds.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const rnAuth = require('firebase/auth/react-native');
  _auth = rnAuth.initializeAuth(app, {
    persistence: rnAuth.getReactNativePersistence(AsyncStorage),
  });
} catch (e) {
  // Fallback for web or environments without RN helpers
  _auth = getAuth(app);
}

export const auth = _auth;

export const googleProvider = new GoogleAuthProvider();
