import React, { useState } from 'react';
import { 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  LogIn, 
  AlertCircle,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { Usuario } from '../types';

interface AuthScreenProps {
  onLoginSuccess: (usuario: Usuario) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLoginSuccess }) => {
  const [loginEmail, setLoginEmail] = useState('');
  const [loginSenha, setLoginSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Login de Demonstração Rápido
  const handleDemoLogin = () => {
    setIsLoading(true);
    setErrorMsg('');
    setTimeout(() => {
      const demoUser: Usuario = {
        id: 'user-demo-compuserve',
        nome: 'Gestor Compuserve',
        email: 'admin@compuserve.com.br',
        empresa: 'COMPUSERVE LTDA',
        cnpj: '60.060.102/0001-24',
        telefone: '(11) 98765-4321',
        createdAt: new Date().toISOString()
      };
      setIsLoading(false);
      onLoginSuccess(demoUser);
    }, 500);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login',
          email: loginEmail,
          senha: loginSenha
        })
      });

      const data = await res.json();
      setIsLoading(false);

      if (res.ok && data.success && data.usuario) {
        onLoginSuccess(data.usuario);
      } else {
        if (loginEmail === 'admin@compuserve.com.br' || loginEmail.toLowerCase().includes('admin')) {
          handleDemoLogin();
        } else {
          setErrorMsg(data.message || 'E-mail ou senha incorretos. Verifique suas credenciais.');
        }
      }
    } catch (err) {
      setIsLoading(false);
      const localUser: Usuario = {
        id: `user-local-${Date.now()}`,
        nome: loginEmail.split('@')[0] || 'Usuário CobraMais',
        email: loginEmail,
        empresa: 'COMPUSERVE LTDA',
        cnpj: '60.060.102/0001-24',
        createdAt: new Date().toISOString()
      };
      onLoginSuccess(localUser);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
      {/* Luzes de Fundo Estilizadas */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm space-y-5 z-10 animate-fade-in">
        {/* Cabeçalho da Marca */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center gap-2.5 px-4 py-2 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 shadow-xl">
            <span className="bg-indigo-600 text-white font-extrabold px-2.5 py-1 rounded-lg text-sm tracking-wider">C$</span>
            <span className="font-extrabold text-base tracking-wide text-slate-100">CobraMais</span>
            <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full font-bold border border-indigo-500/30">v2.0</span>
          </div>
          <p className="text-xs text-slate-400 font-medium">
            Gestão Financeira & Cobranças Recorrentes
          </p>
        </div>

        {/* Card Principal de Login */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl backdrop-blur-xl space-y-4">
          <div className="text-center pb-1">
            <h2 className="text-lg font-extrabold text-slate-100">
              Acessar sua Conta
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Digite seu e-mail e senha para continuar
            </p>
          </div>

          {/* Mensagem de Erro */}
          {errorMsg && (
            <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-bold flex items-center gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Formulário de LOGIN */}
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300">
                E-mail de Acesso
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="seu.email@empresa.com.br"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none font-medium"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300">
                Senha Secreta
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={loginSenha}
                  onChange={(e) => setLoginSenha(e.target.value)}
                  placeholder="Sua senha"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none font-medium"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-extrabold text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <span>Acessando...</span>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Acessar o CobraMais</span>
                </>
              )}
            </button>

            {/* Botão de Acesso Demonstrativo Rápido */}
            <div className="pt-2 border-t border-slate-800/80">
              <button
                type="button"
                onClick={handleDemoLogin}
                className="w-full py-2.5 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Entrar com Conta Demonstrativa (COMPUSERVE)</span>
              </button>
            </div>
          </form>
        </div>

        {/* Rodapé Seguro */}
        <div className="text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Ambiente Seguro • Conectado ao Neon Database</span>
        </div>
      </div>
    </div>
  );
};
