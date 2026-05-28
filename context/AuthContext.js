import React, { createContext, useContext, useState, useEffect } from 'react';
import { getToken, removeToken } from '../services/api';
import * as SecureStore from 'expo-secure-store';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(null);
  const [username, setUsername] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getToken(),
      SecureStore.getItemAsync('username'),
    ]).then(([t, u]) => {
      setTokenState(t);
      setUsername(u);
      setLoading(false);
    });
  }, []);

  const setToken = async (newToken, newUsername) => {
    setTokenState(newToken);
    if (newUsername) {
      setUsername(newUsername);
      await SecureStore.setItemAsync('username', newUsername);
    }
  };

  const logout = async () => {
    await removeToken();
    await SecureStore.deleteItemAsync('username');
    setTokenState(null);
    setUsername(null);
  };

  return (
    <AuthContext.Provider value={{ token, setToken, username, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
