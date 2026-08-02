import React, { createContext, useState, useEffect } from 'react';
import { getCurrentUser } from '../utils/api';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (!token) return setUser(null);
    getCurrentUser(token).then((u) => setUser(u)).catch(() => setUser(null));
  }, [token]);

  const login = (tok) => {
    localStorage.setItem('token', tok);
    setToken(tok);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;
