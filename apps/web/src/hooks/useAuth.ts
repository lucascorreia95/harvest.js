import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth as useAuthContext } from '../contexts/AuthContext';
import { authApi, type SignupData, type LoginData } from '../api/auth';

export const useAuth = () => {
  const navigate = useNavigate();
  const { setUser } = useAuthContext();

  const loginMutation = useMutation({
    mutationFn: (data: LoginData) => authApi.login(data),
    onSuccess: (response) => {
      localStorage.setItem('harvest_token', response.access_token);
      localStorage.setItem('harvest_user', JSON.stringify(response.user));
      
      // Transformar dados para compatibilizar com AuthContext
      const userForContext = {
        ...response.user,
        createdAt: new Date().toISOString(), // ou pegar da API se disponível
        updatedAt: new Date().toISOString(),
      };
      setUser(userForContext);
      navigate('/game');
    },
    onError: (error) => {
      // Log the full error for debugging
      console.error('Login error:', error);
    },
  });

  const signupMutation = useMutation({
    mutationFn: (data: SignupData) => authApi.signup(data),
    onSuccess: (response) => {
      localStorage.setItem('harvest_token', response.access_token);
      localStorage.setItem('harvest_user', JSON.stringify(response.user));
      
      // Transformar dados para compatibilizar com AuthContext
      const userForContext = {
        ...response.user,
        createdAt: new Date().toISOString(), // ou pegar da API se disponível
        updatedAt: new Date().toISOString(),
      };
      setUser(userForContext);
      navigate('/game');
    },
    onError: (error) => {
      // Log the full error for debugging
      console.error('Signup error:', error);
    },
  });

  const logout = () => {
    localStorage.removeItem('harvest_token');
    localStorage.removeItem('harvest_user');
    setUser(null);
    navigate('/');
  };

  const getCurrentUser = () => {
    const { user } = useAuthContext();
    return user;
  };

  const getToken = (): string | null => {
    return localStorage.getItem('harvest_token');
  };

  const isAuthenticated = (): boolean => {
    return !!getToken();
  };

  return {
    login: loginMutation.mutateAsync,
    signup: signupMutation.mutateAsync,
    logout,
    getCurrentUser,
    getToken,
    isAuthenticated,
    isLoading: loginMutation.isPending || signupMutation.isPending,
    error: loginMutation.error || signupMutation.error,
  };
};
