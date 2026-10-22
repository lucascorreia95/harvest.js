import { useAuth as useAuthContext } from '../../contexts/AuthContext';
import { useAuth as useAuthActions } from '../../hooks/useAuth';
import { useRequireAuth } from '../../hooks/useRequireAuth';
import { useFarm } from '../../hooks/useFarm';
import { FarmGrid } from '../../components/FarmGrid';

export default function GamePage() {
  useRequireAuth(); // Redirect to login if not authenticated
  const { user, loading } = useAuthContext();
  const { logout } = useAuthActions();
  const { farmData, loading: farmLoading, error } = useFarm();

  if (loading || farmLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-amber-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl mb-4">🚜</div>
          <div className="text-lg">Carregando fazenda...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-amber-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl mb-4">❌</div>
          <div className="text-lg text-red-600">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-amber-50 flex flex-col">

      {/* Main Game Area */}
      <main className="flex-1 flex items-center justify-center p-8">
        <div className="transform-gpu" style={{ transformStyle: 'preserve-3d' }}>
          {farmData && <FarmGrid plots={farmData.plots} />}
        </div>
      </main>
      
    </div>
  );
}
