import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import type { SignupData, LoginData } from '../../api/auth';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    farmName: ''
  });
  
  const { login, signup, isLoading, error } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLogin) {
      const loginData: LoginData = {
        username: formData.username,
        password: formData.password,
      };
      await login(loginData);
    } else {
      const signupData: SignupData = {
        username: formData.username,
        password: formData.password,
        farmName: formData.farmName,
      };
      await signup(signupData);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <>
      {/* Full screen background */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/background.png)' }}
      />
      
      {/* Content */}
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="bg-wood-medium rounded-3xl shadow-2xl p-8 w-full max-w-md border-4 border-wood-dark relative">
          {/* Inner highlight */}
          <div className="absolute inset-0 rounded-3xl border border-harvest-gold/30 pointer-events-none"></div>
          
          {/* Content */}
          <div className="relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🌾</div>
          <h1 className="text-3xl font-bold text-harvest-gold mb-2">
            Happy Harvest
          </h1>
          <p className="text-parchment">
            {isLogin ? 'Welcome back!' : 'Create your farm'}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-900/50 border border-red-500 rounded-lg text-red-200 text-sm">
            {(error as any)?.response?.data?.message || (error as any)?.message || 'An error occurred'}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-parchment mb-1">
              Username
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="w-full px-4 py-2 border-2 border-dry-soil rounded-lg focus:border-harvest-gold focus:outline-none transition-colors bg-parchment/20 text-parchment placeholder-parchment/50"
              placeholder="your_username"
              required
            />
          </div>

          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-parchment mb-1">
                Farm Name
              </label>
              <input
                type="text"
                name="farmName"
                value={formData.farmName}
                onChange={handleChange}
                className="w-full px-4 py-2 border-2 border-dry-soil rounded-lg focus:border-harvest-gold focus:outline-none transition-colors bg-parchment/20 text-parchment placeholder-parchment/50"
                placeholder="Happy Farm"
                required={!isLogin}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-parchment mb-1">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-2 border-2 border-dry-soil rounded-lg focus:border-harvest-gold focus:outline-none transition-colors bg-parchment/20 text-parchment placeholder-parchment/50"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-harvest-green hover:bg-green-600 text-parchment font-bold py-3 px-6 rounded-lg transition-colors shadow-lg transform hover:scale-105 duration-200 border-2 border-harvest-gold/50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Loading...' : (isLogin ? 'Enter Farm' : 'Create Farm')}
          </button>
        </form>

        {/* Toggle */}
        <div className="mt-6 text-center">
          <p className="text-parchment">
            {isLogin ? "Don't have a farm yet?" : 'Already have a farm?'}
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="ml-2 text-harvest-gold hover:text-yellow-400 font-semibold underline cursor-pointer"
            >
              {isLogin ? 'Create one!' : 'Sign in!'}
            </button>
          </p>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-dry-soil text-center">
          <div className="flex justify-center space-x-4 text-2xl">
            <span>🚜</span>
            <span>🌻</span>
            <span>🥕</span>
            <span>🐔</span>
          </div>
          <p className="text-sm text-parchment/80 mt-2">
            The best farm game on the web!
          </p>
        </div>
        </div>
        </div>
      </div>
    </>
  );
}