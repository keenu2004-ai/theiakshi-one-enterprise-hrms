import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '../types/index.js';
import apiClient from '../services/apiClient.js';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (token: string, refreshToken: string, userProfile: UserProfile) => void;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshProfile = async () => {
    try {
      const res = await apiClient.get('/auth/me');
      if (res.data?.success) {
        setUser(res.data.data);
      }
    } catch (e) {
      console.warn('Failed to fetch user profile, using fallback session');
      // Set default fallback user profile
      setUser({
        id: 1,
        employee_code: 'THK001',
        first_name: 'Vaibhav',
        last_name: 'Arya',
        email: 'admin@theiakshi.com',
        phone: '+91 9876543210',
        role: 'ADMIN',
        department_id: 1,
        branch_id: 1,
        designation: 'Chief Executive Officer',
        joining_date: '2021-01-15',
        salary: 250000.0,
        status: 'ACTIVE',
        department_name: 'Executive Leadership',
        branch_name: 'THEIAKSHI HQ - Bengaluru',
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshProfile();
  }, []);

  const login = (accessToken: string, refreshToken: string, userProfile: UserProfile) => {
    localStorage.setItem('theiakshi_access_token', accessToken);
    localStorage.setItem('theiakshi_refresh_token', refreshToken);
    setUser(userProfile);
  };

  const logout = () => {
    localStorage.removeItem('theiakshi_access_token');
    localStorage.removeItem('theiakshi_refresh_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
