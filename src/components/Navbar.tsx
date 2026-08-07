import React from 'react';
import { LayoutDashboard, FileText, Users, BarChart3, Settings } from 'lucide-react';
import { TabType } from '../types';

interface NavbarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  qtdAtrasados: number;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, qtdAtrasados }) => {
  const items = [
    { id: 'dashboard' as TabType, label: 'Início', icon: LayoutDashboard },
    { id: 'cobrancas' as TabType, label: 'Cobranças', icon: FileText, badge: qtdAtrasados },
    { id: 'clientes' as TabType, label: 'Clientes', icon: Users },
    { id: 'relatorios' as TabType, label: 'Relatórios', icon: BarChart3 },
    { id: 'config' as TabType, label: 'Ajustes', icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 z-40 w-full max-w-[480px] bg-slate-950/95 backdrop-blur-xl border-t border-x border-slate-800/80 px-2 py-2.5 shadow-2xl">
      <div className="flex items-center justify-around w-full">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`relative flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all duration-200 ${
                isActive 
                  ? 'text-indigo-400 bg-indigo-500/10 scale-105 font-bold' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-110' : ''}`} />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-rose-500 text-white text-[9px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center border-2 border-slate-950">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-1 tracking-tight font-medium">
                {item.label}
              </span>
              {isActive && (
                <div className="absolute -bottom-1 w-8 h-1 bg-indigo-500 rounded-full glow-primary" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
