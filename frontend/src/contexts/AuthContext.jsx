import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load User profile if token exists in localStorage
  const loadUser = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const response = await api.get('/auth/profile');
      if (response.data && response.data.success) {
        setUser(response.data.user);
      } else {
        // Token is invalid/expired
        localStorage.removeItem('token');
        setUser(null);
      }
    } catch (error) {
      console.error('Failed to load user profile on startup:', error.message);
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  // Register a new user account
  const signup = async (name, email, password, companyName = '', jobTitle = '', monthlyVolume = '', workspaceName = '') => {
    setLoading(true);
    try {
      const response = await api.post('/auth/register', { 
        name, 
        email, 
        password, 
        companyName, 
        jobTitle, 
        monthlyVolume, 
        workspaceName 
      });
      if (response.data && response.data.success) {
        const { token, user: userData } = response.data;
        localStorage.setItem('token', token);
        setUser(userData);
        return { success: true };
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Registration failed. Please try again.';
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  // Log in to an existing account
  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      if (response.data && response.data.success) {
        const { token, user: userData } = response.data;
        localStorage.setItem('token', token);
        setUser(userData);
        return { success: true };
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Invalid email or password';
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  // Switch Workspace context globally
  const switchWorkspace = async (workspaceId) => {
    setLoading(true);
    try {
      const response = await api.post(`/workspaces/select/${workspaceId}`);
      if (response.data && response.data.success) {
        await loadUser();
        return { success: true, message: response.data.message };
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to switch workspace context';
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  // Sign out
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
        signup,
        logout,
        reloadUser: loadUser,
        switchWorkspace,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
