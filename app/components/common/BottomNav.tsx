
import React from 'react';
import { HomeIcon, WalletIcon, ChartIcon, TargetIcon, UserIcon } from './Icons';

type Screen = 'inicio' | 'historico' | 'relatorios' | 'metas' | 'perfil';

interface BottomNavProps {
  activeScreen: Screen;
  setActiveScreen: (screen: Screen) => void;
}

const NavItem: React.FC<{
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
}> = ({ label, icon, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center w-full pt-2 pb-1 transition-colors duration-200 ${
      isActive ? 'text-[#3B82F6]' : 'text-gray-500 hover:text-[#3B82F6]'
    }`}
    aria-label={`Navegar para ${label}`}
  >
    {icon}
    <span className="text-xs font-medium">{label}</span>
  </button>
);

const BottomNav: React.FC<BottomNavProps> = ({ activeScreen, setActiveScreen }) => {
  const navItems = [
    { id: 'inicio', label: 'Início', icon: <HomeIcon /> },
    { id: 'historico', label: 'Histórico', icon: <WalletIcon /> },
    { id: 'relatorios', label: 'Relatórios', icon: <ChartIcon /> },
    { id: 'metas', label: 'Metas', icon: <TargetIcon /> },
    { id: 'perfil', label: 'Perfil', icon: <UserIcon /> },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto h-16 bg-white border-t border-gray-200 flex justify-around items-center shadow-top">
      {navItems.map((item) => (
        <NavItem
          key={item.id}
          label={item.label}
          icon={item.icon}
          isActive={activeScreen === item.id}
          onClick={() => setActiveScreen(item.id as Screen)}
        />
      ))}
    </nav>
  );
};

export default BottomNav;
