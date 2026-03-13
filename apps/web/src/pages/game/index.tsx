import { useAuth } from '../../hooks/useAuth';
import { useRequireAuth } from '../../hooks/useRequireAuth';

export default function GamePage() {
  useRequireAuth(); // Redirect to login if not authenticated
  const { getCurrentUser, logout } = useAuth();
  const user = getCurrentUser();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-amber-50 flex flex-col">
      {/* Header */}
      <header className="bg-wood-medium border-b-4 border-wood-dark p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="text-4xl">🌾</div>
            <div>
              <h1 className="text-2xl font-bold text-harvest-gold">Happy Harvest</h1>
              <p className="text-parchment text-sm">Welcome back, {user?.username || 'Farmer'}!</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-parchment">
              <span className="font-semibold">Farm:</span> {user?.farmName || 'My Farm'}
            </div>
            <button
              onClick={logout}
              className="bg-red-600 hover:bg-red-700 text-parchment font-bold py-2 px-4 rounded-lg transition-colors cursor-pointer"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Game Area */}
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-wood-medium rounded-3xl border-4 border-wood-dark p-8 relative">
            {/* Inner highlight */}
            <div className="absolute inset-0 rounded-3xl border border-harvest-gold/30 pointer-events-none"></div>
            
            <div className="relative z-10">
              <h2 className="text-3xl font-bold text-harvest-gold mb-6 text-center">Your Farm</h2>
              
              {/* Farm Grid */}
              <div className="grid grid-cols-4 gap-4 mb-8">
                {Array.from({ length: 16 }, (_, i) => (
                  <div
                    key={i}
                    className="aspect-square bg-dry-soil border-2 border-wood-dark rounded-lg flex items-center justify-center text-2xl hover:bg-green-600 transition-colors cursor-pointer"
                  >
                    {i % 3 === 0 ? '🌱' : ''}
                  </div>
                ))}
              </div>

              {/* Game Stats */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-parchment/20 border-2 border-dry-soil rounded-lg p-4">
                  <div className="text-3xl mb-2">🌾</div>
                  <div className="text-harvest-gold font-bold">Crops</div>
                  <div className="text-parchment">12</div>
                </div>
                <div className="bg-parchment/20 border-2 border-dry-soil rounded-lg p-4">
                  <div className="text-3xl mb-2">🥕</div>
                  <div className="text-harvest-gold font-bold">Vegetables</div>
                  <div className="text-parchment">8</div>
                </div>
                <div className="bg-parchment/20 border-2 border-dry-soil rounded-lg p-4">
                  <div className="text-3xl mb-2">🐔</div>
                  <div className="text-harvest-gold font-bold">Animals</div>
                  <div className="text-parchment">5</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-center space-x-4 mt-8">
                <button className="bg-harvest-green hover:bg-green-600 text-parchment font-bold py-3 px-6 rounded-lg transition-colors cursor-pointer">
                  Plant Seeds 🌱
                </button>
                <button className="bg-harvest-gold hover:bg-yellow-500 text-wood-dark font-bold py-3 px-6 rounded-lg transition-colors cursor-pointer">
                  Water 💧
                </button>
                <button className="bg-orange-600 hover:bg-orange-700 text-parchment font-bold py-3 px-6 rounded-lg transition-colors cursor-pointer">
                  Harvest 🌾
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-wood-medium border-t-4 border-wood-dark p-4 text-center">
        <p className="text-parchment text-sm">
          The best farm game on the web! 🚜🌻🥕🐔
        </p>
      </footer>
    </div>
  );
}
