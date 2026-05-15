import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useProfile } from '../contexts/ProfileContext';

const Profile: React.FC = () => {
  const { user, logout } = useAuth();
  const { activeProfile } = useProfile();

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800">Perfil</h2>
      </div>

      <section>
        <h3 className="text-lg font-semibold text-gray-700 mb-3">Informações da Conta</h3>
        <div className="bg-white p-4 rounded-xl shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-blue-200 flex items-center justify-center text-2xl font-bold text-blue-700">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <p className="font-bold text-lg text-gray-800">{user?.name}</p>
              <p className="text-sm text-gray-500">{user?.email}</p>
            </div>
          </div>
        </div>
      </section>

      {activeProfile && (
        <section>
          <h3 className="text-lg font-semibold text-gray-700 mb-3">Perfil Ativo</h3>
          <div className="bg-white p-4 rounded-xl shadow-sm">
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
                style={{ backgroundColor: activeProfile.color || '#3B82F6' }}
              >
                {activeProfile.avatar || activeProfile.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-gray-800">{activeProfile.name}</p>
                <p className="text-sm text-gray-500">{activeProfile.members?.length || 1} membro(s)</p>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="pt-4">
        <button
          onClick={logout}
          className="w-full px-4 py-2.5 bg-red-500 text-white font-semibold rounded-md hover:bg-red-600 transition-colors shadow"
        >
          Sair (Logout)
        </button>
      </section>
    </div>
  );
};

export default Profile;
