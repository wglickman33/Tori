import { createContext, useContext, useState, useEffect } from "react";
import * as api from "../services/api.js";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadSession = async () => {
    const token = api.getToken();
    if (!token) {
      setCurrentUser(null);
      setLoading(false);
      return;
    }
    try {
      const user = await api.apiMe();
      setCurrentUser({ uid: user.uid, email: user.email, displayName: user.displayName });
    } catch {
      api.setToken(null);
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSession();
  }, []);

  const createUser = async (email, password, fullName) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.apiRegister(email, password, fullName);
      api.setToken(data.token);
      const user = data.user;
      setCurrentUser({ uid: user.uid, email: user.email, displayName: user.displayName });
      await api.createUser(user.uid, { displayName: user.displayName });
      setLoading(false);
      return { uid: user.uid, email: user.email, displayName: user.displayName };
    } catch (err) {
      setError(err.message || "Failed to create account");
      setLoading(false);
      throw err;
    }
  };

  const loginUser = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.apiLogin(email, password);
      api.setToken(data.token);
      const user = data.user;
      setCurrentUser({ uid: user.uid, email: user.email, displayName: user.displayName });
      setLoading(false);
    } catch (err) {
      setError(err.message || "Failed to log in");
      setLoading(false);
      throw err;
    }
  };

  const logoutUser = () => {
    api.setToken(null);
    setCurrentUser(null);
    setError(null);
  };

  const value = {
    currentUser,
    loading,
    error,
    createUser,
    loginUser,
    logoutUser,
    logOutUser: logoutUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
