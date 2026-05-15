import React, { useEffect } from 'react';
import { useProfile } from '../contexts/ProfileContext';

const ProfileSelector: React.FC = () => {
  const { profiles, setActiveProfile, loading, refreshProfiles } = useProfile();

  useEffect(() => {
    refreshProfiles();
  }, [refreshProfiles]);

  useEffect(() => {
    if (profiles.length === 1) {
      setActiveProfile(profiles[0]);
    }
  }, [profiles, setActiveProfile]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center">
        <p className="text-lg font-semibold animate-pulse">Carregando...</p>
      </div>
    );
  }

  if (profiles.length === 1) return null;

  return (
    <div className="min-h-screen bg-[#F7F8FA] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-sm mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Selecione um perfil</h1>
          <p className="text-gray-500">Escolha qual família ou projeto você quer gerenciar</p>
        </div>
        <div className="space-y-3">
          {profiles.map((p) => (
            <button
              key={p.id}
              onClick={() => setActiveProfile(p)}
              className="w-full bg-white p-4 rounded-xl shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow text-left"
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                style={{ backgroundColor: p.color || '#3B82F6' }}
              >
                {p.avatar || p.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-gray-800">{p.name}</p>
                <p className="text-sm text-gray-500">{p.members?.length || 1} membro(s)</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProfileSelector;
