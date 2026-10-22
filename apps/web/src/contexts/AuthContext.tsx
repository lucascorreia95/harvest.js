import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../api';

interface User {
  id: string;
  username: string;
  createdAt: string;
  updatedAt: string;
  profile?: {
    id: string;
    userId: string;
    avatar?: string;
    level: number;
    experience: number;
    coins: number;
    farmName?: string;
    createdAt: string;
  };
}

interface AuthContextData {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStorageData() {
      const storageToken = localStorage.getItem('harvest_token');

      if (storageToken) {
        try {
          const response = await api.get('/auth/me');
          setUser(response.data);
        } catch (error: any) {
          localStorage.removeItem('harvest_token');
        }
      }
      setLoading(false);
    }
    loadStorageData();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);