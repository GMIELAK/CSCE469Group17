import React, { createContext, useContext, useState } from "react";

interface AuthContextType {
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};

/**
 * Manages authentication state.
 * 
 * TODO: Replace mock login/logout with real API integration
 * using functions from `api.ts` (e.g., loginUser, logoutUser).
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    !!localStorage.getItem("loggedIn")
  );

  const login = async (username: string, password: string) => {
    // TODO: Replace with actual API call (loginUser)
    if (username && password) {
      localStorage.setItem("loggedIn", "true");
      setIsAuthenticated(true);
    }
  };

  const logout = () => {
    // TODO: Optionally call logout API endpoint
    localStorage.removeItem("loggedIn");
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
