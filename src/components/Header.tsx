import React from 'react';
import { Bell, Wifi, WifiOff, LogOut, User } from 'lucide-react';
import { Usuario } from '../types';

interface HeaderProps {
  nomeEmpresa: string;
  qtdAtrasados: number;
  usuario?: Usuario | null;
  onLogout?: () => void;
  onOpenNotifications: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  nomeEmpresa, 
  qtdAtrasados, 
  usuario,
  onLogout,
  onOpenNotifications 
}) => {
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-4 py-3">
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
            <span className="font-extrabold text-white text-xl tracking-wider">C$</span>
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-100 flex items-center gap-1.5 leading-none">
              CobraMais
              <span className="text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                ANDROID PWA
              </span>
            </h1>
            <p className="text-xs text-slate-400 font-medium mt-0.5 truncate max-w-[180px]">
              {usuario?.empresa || nomeEmpresa}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Badge de status Offline / Online */}
          <div 
            title={isOnline ? "Modo Online (Sincronizado Neon DB)" : "Modo Offline (Salvo localmente)"}
            className={`flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-full border ${
              isOnline 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
            }`}
          >
            {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3 animate-pulse" />}
            <span className="hidden xs:inline">{isOnline ? 'Online' : 'Offline'}</span>
          </div>

          {/* Botão de Alertas */}
          <button 
            onClick={onOpenNotifications}
            className="relative p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-300 transition-colors border border-slate-700/50"
            aria-label="Alertas e Notificações"
          >
            <Bell className="w-5 h-5" />
            {qtdAtrasados > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-bounce shadow-lg shadow-rose-500/50">
                {qtdAtrasados}
              </span>
            )}
          </button>

          {/* Botão de Logout de Usuário */}
          {usuario && onLogout && (
            <button
              onClick={onLogout}
              className="flex items-center gap-1 py-2 px-2.5 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 border border-slate-700 text-xs font-bold transition-all"
              title={`Sair da conta de ${usuario.nome}`}
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
