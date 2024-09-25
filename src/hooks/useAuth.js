import { useState } from "react";
import { getAuth, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "../services/firebaseConfig.js";

const useAuth = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loginUser = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      setCurrentUser(userCredential.user);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const logOutUser = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
    } catch (err) {
      setError(err.message);
    }
  };

  return { currentUser, loading, error, loginUser, logOutUser };
};

export default useAuth;