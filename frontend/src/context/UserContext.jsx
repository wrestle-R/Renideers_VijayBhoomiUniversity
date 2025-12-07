import { createContext, useContext, useEffect, useState } from "react";
import { auth, googleProvider } from "../lib/firebase";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  updateProfile
} from "firebase/auth";
import axios from "axios";
import Cookies from "js-cookie";
import toast from "react-hot-toast";

const UserContext = createContext();

export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const backendUrl = `${import.meta.env.VITE_API_URL}/api/users/auth`;
  console.log("API URL:", backendUrl);

  const syncWithBackend = async (firebaseUser, fullName) => {
    try {
      console.log("Syncing with backend...", firebaseUser, fullName);
      const payload = {
        firebaseUid: firebaseUser.uid,
        email: firebaseUser.email,
        fullName: fullName || firebaseUser.displayName,
        photoUrl: firebaseUser.photoURL || "",
      };

      const res = await axios.post(backendUrl, payload);
      console.log("Backend response:", res.data);

      const userData = {
        fullName: res.data.fullName,
        firebase_id: res.data.firebaseUid,
        mongo_uid: res.data._id,
        email: res.data.email,
        photoUrl: res.data.photoUrl
      };

      setUser(userData);
      Cookies.set("trekky_user", JSON.stringify(userData), { expires: 7 });
      return userData;
    } catch (error) {
      console.error("Backend Sync Error:", error);
      toast.error("Failed to sync with backend");
      throw error;
    }
  };

  const login = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await syncWithBackend(userCredential.user);
      toast.success("Logged in successfully!");
    } catch (error) {
      console.error("Login Error:", error);
      toast.error(error.message);
      throw error;
    }
  };

  const signup = async (email, password, fullName) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: fullName });
      await syncWithBackend(userCredential.user, fullName);
      toast.success("Account created successfully!");
    } catch (error) {
      console.error("Signup Error:", error);
      toast.error(error.message);
      throw error;
    }
  };

  const googleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await syncWithBackend(result.user);
      toast.success("Logged in with Google!");
    } catch (error) {
      console.error("Google Login Error:", error);
      toast.error(error.message);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      Cookies.remove("trekky_user");
      toast.success("Logged out");
    } catch (error) {
      console.error("Logout Error:", error);
      toast.error("Logout failed");
    }
  };

  useEffect(() => {
    const cookieUser = Cookies.get("trekky_user");
    if (cookieUser) {
      setUser(JSON.parse(cookieUser));
    }
    
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(false);
      if (currentUser) {
         // Optional: Auto-sync on reload if needed, but cookie is faster
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <UserContext.Provider value={{ user, login, signup, googleLogin, logout, loading }}>
      {children}
    </UserContext.Provider>
  );
};
