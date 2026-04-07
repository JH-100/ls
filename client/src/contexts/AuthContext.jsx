import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiCall } from '../api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const encodeToken = (str) => btoa(unescape(encodeURIComponent(str)));
  const decodeToken = (str) => decodeURIComponent(escape(atob(str)));

  const saveCredentials = useCallback((username, password) => {
    localStorage.setItem('likeslack-user', username);
    localStorage.setItem('likeslack-token', encodeToken(username + ':' + password));
  }, []);

  const clearCredentials = useCallback(() => {
    localStorage.removeItem('likeslack-user');
    localStorage.removeItem('likeslack-token');
  }, []);

  const login = useCallback(async (username, password) => {
    const data = await apiCall('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    saveCredentials(username, password);
    setCurrentUser(data);
    return data;
  }, [saveCredentials]);

  const register = useCallback(async (username, password, displayName) => {
    const data = await apiCall('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, displayName }),
    });
    saveCredentials(username, password);
    setCurrentUser(data);
    return data;
  }, [saveCredentials]);

  const logout = useCallback(async () => {
    try {
      await apiCall('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore logout errors
    }
    clearCredentials();
    setCurrentUser(null);
    navigate('/login');
  }, [clearCredentials, navigate]);

  const updateProfile = useCallback(async (displayName, avatarColor) => {
    const data = await apiCall('/api/auth/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ displayName, avatarColor }),
    });
    setCurrentUser((prev) => prev ? { ...prev, displayName, avatarColor } : prev);
    return data;
  }, []);

  useEffect(() => {
    const tryAutoLogin = async () => {
      try {
        const data = await apiCall('/api/auth/me');
        setCurrentUser(data);
        setLoading(false);
        return;
      } catch {
        // session expired or not logged in
      }

      const savedUsername = localStorage.getItem('likeslack-user');
      const savedToken = localStorage.getItem('likeslack-token');
      if (savedUsername && savedToken) {
        try {
          const decoded = decodeToken(savedToken);
          const separatorIndex = decoded.indexOf(':');
          if (separatorIndex > 0) {
            const username = decoded.substring(0, separatorIndex);
            const password = decoded.substring(separatorIndex + 1);
            const data = await apiCall('/api/auth/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ username, password }),
            });
            setCurrentUser(data);
            setLoading(false);
            return;
          }
        } catch {
          clearCredentials();
        }
      }

      setLoading(false);
    };

    tryAutoLogin();
  }, [clearCredentials]);

  const value = {
    currentUser,
    loading,
    login,
    register,
    logout,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
