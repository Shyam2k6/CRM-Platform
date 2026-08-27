import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { message } from 'antd';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('crm_token');
      if (token) {
        try {
          const res = await api.get('/auth/me');
          if (res.data.success) {
            setUser(res.data.user);
            localStorage.setItem('crm_user', JSON.stringify(res.data.user));
          } else {
            handleLogoutClear();
          }
        } catch (error) {
          handleLogoutClear();
        }
      }
      setLoading(false);
    };
    initializeAuth();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data.success) {
        const { token, user: loggedUser } = res.data;
        localStorage.setItem('crm_token', token);
        localStorage.setItem('crm_user', JSON.stringify(loggedUser));
        setUser(loggedUser);
        message.success(`Welcome back, ${loggedUser.name}!`);
        return loggedUser;
      }
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleLogoutClear = () => {
    localStorage.removeItem('crm_token');
    localStorage.removeItem('crm_user');
    setUser(null);
  };

  const logout = () => {
    handleLogoutClear();
    message.success('Logged out successfully.');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
        logout,
        setUser
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
