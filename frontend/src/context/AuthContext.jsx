import React, { createContext, useState, useEffect, useContext } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is logged in on mount
  useEffect(() => {
    const bootstrapAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const response = await authService.getMe();
        if (response.data?.success) {
          setUser(response.data.user || response.data);
        } else {
          logout();
        }
      } catch (err) {
        console.error('Session bootstrap failed:', err.message);
        logout();
      } finally {
        setIsLoading(false);
      }
    };

    bootstrapAuth();
  }, []);

  const login = async (email, password) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.login({ email, password });
      if (response.data?.success) {
        const userData = response.data;
        localStorage.setItem('token', userData.token);
        setUser(userData);
        return userData;
      } else {
        throw new Error(response.data?.message || 'Login failed');
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Login failed';
      setError(errMsg);
      throw new Error(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (formData) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.register(formData);
      if (response.data?.success) {
        const userData = response.data;
        localStorage.setItem('token', userData.token);
        setUser(userData);
        return userData;
      } else {
        throw new Error(response.data?.message || 'Registration failed');
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Registration failed';
      setError(errMsg);
      throw new Error(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.error('Logout request failed:', err.message);
    } finally {
      localStorage.removeItem('token');
      setUser(null);
    }
  };

  const updateProfile = async (formData) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.updateProfile(formData);
      if (response.data?.success) {
        const updatedUser = response.data;
        // Merge updating user fields
        setUser((prev) => ({ ...prev, ...updatedUser }));
        return updatedUser;
      } else {
        throw new Error(response.data?.message || 'Profile update failed');
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Profile update failed';
      setError(errMsg);
      throw new Error(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => setError(null);

  const value = {
    user,
    isLoading,
    error,
    login,
    register,
    logout,
    updateProfile,
    clearError,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
