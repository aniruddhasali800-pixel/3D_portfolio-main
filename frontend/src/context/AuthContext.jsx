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
      setCurrentUser({ email: "admin@gmail.com" });
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

  const loginDemo = () => {
    localStorage.setItem("demo_admin", "true");
    setCurrentUser({ email: "admin@gmail.com" });
  };

  const logoutDemo = () => {
    localStorage.removeItem("demo_admin");
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
