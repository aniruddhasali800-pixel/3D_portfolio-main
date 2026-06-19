import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Demo mode bypass
    const savedDemoUser = localStorage.getItem("demo_admin");
    if (savedDemoUser) {
      const email = localStorage.getItem("demo_admin_email") || "aniruddhasali800@gmail.com";
      setCurrentUser({ email });
      setLoading(false);
      return;
    }

    if (!auth) {
      // Firebase not configured, just finish loading
      setLoading(false);
      return;
    }

    try {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        setCurrentUser(user);
        setLoading(false);
      });
      return unsubscribe;
    } catch (error) {
      console.error("Firebase auth error (likely missing config):", error);
      setLoading(false);
    }
  }, []);

  const loginDemo = (email = "aniruddhasali800@gmail.com") => {
    localStorage.setItem("demo_admin", "true");
    localStorage.setItem("demo_admin_email", email);
    setCurrentUser({ email });
  };

  const logoutDemo = () => {
    localStorage.removeItem("demo_admin");
    localStorage.removeItem("demo_admin_email");
    setCurrentUser(null);
  };

  const value = {
    currentUser,
    loginDemo,
    logoutDemo
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
