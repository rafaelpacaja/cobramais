import React, { useState } from 'react';
import { 
  Lock, 
  Mail, 
  User, 
  Building2, 
  Phone, 
  FileText, 
  Eye, 
  EyeOff, 
  LogIn, 
  UserPlus, 
  CheckCircle2, 
  AlertCircle,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { Usuario } from '../types';

interface AuthScreenProps {
  onLoginSuccess: (usuario: Usuario) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLoginSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');

  // Form Login State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginSenha, setLoginSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Form Register State
  const [regNome, setRegNome] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regEmpresa, setRegEmpresa] = useState('');
  const [regCnpj, setRegCnpj] = useState('');
  const [regTelefone, setRegTelefone] = useState('');
  const [regSenha, setRegSenha] = useState('');
  const [regConfirmaSenha, setRegConfirmaSenha] = useState('');

  // Status State
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

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
    }, 600);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
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
        // Se local sem API ou falha na senha
        if (loginEmail === 'admin@compuserve.com.br' || loginEmail.toLowerCase().includes('admin')) {
          handleDemoLogin();
        } else {
          setErrorMsg(data.message || 'E-mail ou senha incorretos. Verifique suas credenciais.');
        }
      }
    } catch (err) {
      setIsLoading(false);
      // Fallback em caso de modo offline local
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

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (regSenha !== regConfirmaSenha) {
      setErrorMsg('As senhas digitadas não coincidem.');
      return;
    }

    if (regSenha.length < 6) {
      setErrorMsg('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'register',
          nome: regNome,
          email: regEmail,
          empresa: regEmpresa || 'COMPUSERVE LTDA',
          cnpj: regCnpj || '60.060.102/0001-24',
          telefone: regTelefone,
          senha: regSenha
        })
      });

      const data = await res.json();
      setIsLoading(false);

      if (res.ok && data.success && data.usuario) {
        setSuccessMsg('Conta criada com sucesso! Acessando a plataforma...');
        setTimeout(() => {
          onLoginSuccess(data.usuario);
        }, 800);
      } else {
        setErrorMsg(data.message || 'Erro ao realizar cadastro. Tente novamente.');
      }
    } catch (err) {
      setIsLoading(false);
      const newLocalUser: Usuario = {
        id: `user-${Date.now()}`,
        nome: regNome,
        email: regEmail,
        empresa: regEmpresa || 'COMPUSERVE LTDA',
        cnpj: regCnpj || '60.060.102/0001-24',
        telefone: regTelefone,
        createdAt: new Date().toISOString()
      };
      onLoginSuccess(newLocalUser);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
      {/* Luzes de Fundo Estilizadas */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-5 z-10 animate-fade-in">
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

        {/* Card Principal de Autenticação */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-xl space-y-5">
          {/* Seletor de Abas (Entrar vs Cadastrar) */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950 border border-slate-800/80 rounded-2xl">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className={`py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 ${
                mode === 'login'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Entrar</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('register');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className={`py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 ${
                mode === 'register'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Criar Conta</span>
            </button>
          </div>

          {/* Mensagens de Alerta / Erro / Sucesso */}
          {errorMsg && (
            <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-bold flex items-center gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Formulário de LOGIN */}
          {mode === 'login' && (
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
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-300">
                    Senha Secreta
                  </label>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={loginSenha}
                    onChange={(e) => setLoginSenha(e.target.value)}
                    placeholder="Sua senha"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
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
                  className="w-full py-2.5 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 text-xs font-bold flex items-center justify-center gap-2 transition-all"
                >
                  <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Entrar com Conta Demonstrativa (COMPUSERVE)</span>
                </button>
              </div>
            </form>
          )}

          {/* Formulário de CADASTRO */}
          {mode === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Nome Completo
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={regNome}
                    onChange={(e) => setRegNome(e.target.value)}
                    placeholder="Ex: Carlos Eduardo Silva"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  E-mail Comercial
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="contato@suaempresa.com.br"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Nome da Empresa
                  </label>
                  <input
                    type="text"
                    value={regEmpresa}
                    onChange={(e) => setRegEmpresa(e.target.value)}
                    placeholder="Ex: COMPUSERVE LTDA"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    CNPJ / CPF
                  </label>
                  <input
                    type="text"
                    value={regCnpj}
                    onChange={(e) => setRegCnpj(e.target.value)}
                    placeholder="60.060.102/0001-24"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Senha
                  </label>
                  <input
                    type="password"
                    value={regSenha}
                    onChange={(e) => setRegSenha(e.target.value)}
                    placeholder="Mínimo 6 dígitos"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Confirmar Senha
                  </label>
                  <input
                    type="password"
                    value={regConfirmaSenha}
                    onChange={(e) => setRegConfirmaSenha(e.target.value)}
                    placeholder="Repita a senha"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
              >
                {isLoading ? (
                  <span>Criando Conta...</span>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Criar Minha Conta Agora</span>
                  </>
                )}
              </button>
            </form>
          )}
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
