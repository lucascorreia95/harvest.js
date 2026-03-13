import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authApi, type SignupData, type LoginData } from '../api/auth';

interface User {
  id: string;
  username: string;
  displayName: string;
  farmName?: string;
}

export const useAuth = () => {
  const navigate = useNavigate();

  const loginMutation = useMutation({
    mutationFn: (data: LoginData) => authApi.login(data),
    onSuccess: (response) => {
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
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
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      navigate('/game');
    },
    onError: (error) => {
      // Log the full error for debugging
      console.error('Signup error:', error);
    },
  });

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const getCurrentUser = (): User | null => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  };

  const getToken = (): string | null => {
    return localStorage.getItem('token');
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
