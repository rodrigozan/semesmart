import React, { useState, useRef, useEffect } from 'react';
import { useProfile } from '../../contexts/ProfileContext';
import { useAuth } from '../../contexts/AuthContext';
import { ChevronDownIcon, BellIcon, CloseIcon } from './Icons';
import api from '../../api';

const PRESET_COLORS = [
  '#3B82F6', '#8B5CF6', '#10B981', '#F59E0B',
  '#EF4444', '#EC4899', '#06B6D4', '#6366F1',
];

interface HeaderProps {
  onViewConsolidated?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onViewConsolidated }) => {
  const { activeProfile, profiles, setActiveProfile, refreshProfiles } = useProfile();
  const { user } = useAuth();
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(PRESET_COLORS[0]);
  const [creating, setCreating] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
        setIsCreating(false);
        setNewName('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const res = await api.createProfile({ name: newName.trim(), color: newColor });
      await refreshProfiles();
      if (res.data) setActiveProfile(res.data);
      setIsCreating(false);
      setNewName('');
      setNewColor(PRESET_COLORS[0]);
      setDropdownOpen(false);
    } catch (err) {
      console.error('Failed to create profile:', err);
    } finally {
      setCreating(false);
    }
  };

  if (!activeProfile) return null;

  return (
    <header className="p-4 bg-white border-b border-gray-100">
      <div className="flex justify-between items-center">
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => { setDropdownOpen(!isDropdownOpen); setIsCreating(false); }}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
              style={{ backgroundColor: activeProfile.color || '#3B82F6' }}
            >
              {activeProfile.avatar || activeProfile.name.charAt(0).toUpperCase()}
            </div>
            <div className="text-left">
              <h1 className="text-lg font-bold text-gray-800 leading-tight">{activeProfile.name}</h1>
              <p className="text-xs text-gray-500">Semear o futuro financeiro</p>
            </div>
            <ChevronDownIcon />
          </button>

          {isDropdownOpen && (
            <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-gray-100 z-50 py-2">

              {/* Profile list */}
              <div className="px-3 pb-1">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1 pb-1">Perfis</p>
              </div>
              {profiles.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setActiveProfile(p);
                    setDropdownOpen(false);
                    setIsCreating(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left ${
                    p.id === activeProfile.id ? 'bg-blue-50' : ''
                  }`}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
                    style={{ backgroundColor: p.color || '#3B82F6' }}
                  >
                    {p.avatar || p.name.charAt(0).toUpperCase()}
                  </div>
                  <span className={`text-sm font-medium ${p.id === activeProfile.id ? 'text-blue-600' : 'text-gray-700'}`}>
                    {p.name}
                  </span>
                  {p.id === activeProfile.id && (
                    <span className="ml-auto text-xs text-blue-500 font-semibold">Ativo</span>
                  )}
                </button>
              ))}

              <div className="border-t border-gray-100 my-1" />

              {/* Consolidated view */}
              {onViewConsolidated && (
                <button
                  onClick={() => {
                    onViewConsolidated();
                    setDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm">📊</span>
                  </div>
                  <span className="text-sm font-medium text-gray-700">Ver todos os gastos</span>
                </button>
              )}

              {/* Create profile */}
              {!isCreating ? (
                <button
                  onClick={() => setIsCreating(true)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-gray-500 text-lg leading-none">+</span>
                  </div>
                  <span className="text-sm font-medium text-gray-500">Criar novo perfil</span>
                </button>
              ) : (
                <div className="px-4 py-3 border-t border-gray-100">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold text-gray-700">Novo perfil</p>
                    <button
                      onClick={() => { setIsCreating(false); setNewName(''); }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <CloseIcon />
                    </button>
                  </div>
                  <form onSubmit={handleCreateProfile} className="space-y-3">
                    <input
                      type="text"
                      value={newName}
                      onChange={e => setNewName(e.target.value)}
                      placeholder="Nome do perfil"
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
                      autoFocus
                      required
                    />
                    <div className="flex gap-2 flex-wrap">
                      {PRESET_COLORS.map(c => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setNewColor(c)}
                          className={`w-6 h-6 rounded-full flex-shrink-0 transition-transform ${newColor === c ? 'ring-2 ring-offset-1 ring-gray-400 scale-110' : ''}`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                    <button
                      type="submit"
                      disabled={creating || !newName.trim()}
                      className="w-full py-2 bg-blue-500 text-white text-sm font-semibold rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {creating ? 'Criando...' : 'Criar perfil'}
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button className="text-gray-500 hover:text-gray-700" aria-label="Notificações">
            <BellIcon />
          </button>
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold text-gray-600">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
