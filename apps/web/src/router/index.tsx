import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AuthPage from '../pages/auth';
import GamePage from '../pages/game';
import DashboardPage from '../pages/dashboard';

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AuthPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/game" element={<GamePage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
      </Routes>
    </BrowserRouter>
  );
}
