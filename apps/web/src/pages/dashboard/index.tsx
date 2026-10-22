

import { useAuth as useAuthContext } from '../../contexts/AuthContext';
import { useAuth as useAuthActions } from '../../hooks/useAuth';
import { useRequireAuth } from '../../hooks/useRequireAuth';

export default function Dashboard() {
  useRequireAuth(); // Redirect to login if not authenticated
  const { user, loading } = useAuthContext();
  const { logout } = useAuthActions();

  if (loading) {
    return <div>Carregando...</div>;
  }

  if (!user) {
    return <div>Usuário não encontrado</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-start mb-6">
          <h1 className="text-2xl font-bold">Dashboard do Fazendeiro</h1>
          <button
            onClick={logout}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
          >
            Sair
          </button>
        </div>

        <div className="flex items-center space-x-4 mb-6">
          {user.profile?.avatar ? (
            <img
              src={user.profile.avatar}
              alt="Avatar"
              className="w-20 h-20 rounded-full"
            />
          ) : (
            <div className="w-20 h-20 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-2xl text-gray-600">
                {user.username.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div>
            <h2 className="text-xl font-semibold">{user.username}</h2>
            <p className="text-gray-600">
              {user.profile?.farmName || 'Fazenda sem nome'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-800">Nível</h3>
            <p className="text-2xl font-bold text-blue-600">
              {user.profile?.level || 1}
            </p>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold text-green-800">Experiência</h3>
            <p className="text-2xl font-bold text-green-600">
              {user.profile?.experience || 0} XP
            </p>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="font-semibold text-yellow-800">Moedas</h3>
            <p className="text-2xl font-bold text-yellow-600">
              {user.profile?.coins || 0}
            </p>
          </div>
        </div>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-2">Informações da Conta</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <p><strong>ID:</strong> {user.id}</p>
            <p><strong>Usuário:</strong> {user.username}</p>
            <p><strong>Criado em:</strong> {new Date(user.createdAt).toLocaleDateString('pt-BR')}</p>
            <p><strong>Atualizado em:</strong> {new Date(user.updatedAt).toLocaleDateString('pt-BR')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
