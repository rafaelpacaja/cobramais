import React, { useState } from 'react';
import { X, Lock, KeyRound, CheckCircle2, AlertCircle, Loader2, ShieldCheck } from 'lucide-react';
import { getUsuarioLogado, saveUsuarioLogado } from '../services/storage';

interface AlterarSenhaModalProps {
  isOpen: boolean;
  onClose: () => void;
  emailUsuario: string;
}

export const AlterarSenhaModal: React.FC<AlterarSenhaModalProps> = ({
  isOpen,
  onClose,
  emailUsuario
}) => {
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarNovaSenha, setConfirmarNovaSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);
  const [mostrarSenhas, setMostrarSenhas] = useState(false);

  if (!isOpen) return null;

  const handleSalvarSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSucesso(false);

    if (!senhaAtual.trim()) {
      setError('Por favor, informe sua senha atual ou o código de segurança.');
      return;
    }

    if (!novaSenha || novaSenha.length < 4) {
      setError('A nova senha deve ter no mínimo 4 caracteres.');
      return;
    }

    if (novaSenha !== confirmarNovaSenha) {
      setError('A confirmação de senha não confere com a nova senha.');
      return;
    }

    setLoading(true);

    try {
      // 1. Tenta atualizar no banco de dados Neon
      const response = await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'change_password',
          email: emailUsuario,
          senhaAtual: senhaAtual.trim(),
          novaSenha: novaSenha.trim()
        })
      });

      const resData = await response.json();

      if (!response.ok || (resData && resData.success === false)) {
        // Se a senha atual for o código master '061881', permite redefinir
        if (senhaAtual.trim() !== '061881') {
          throw new Error(resData?.message || 'Senha atual incorreta.');
        }
      }

      // 2. Atualiza o usuário no LocalStorage se for o usuário logado
      const usuarioLogado = getUsuarioLogado();
      if (usuarioLogado) {
        saveUsuarioLogado({
          ...usuarioLogado
        });
      }

      setSucesso(true);
      setSenhaAtual('');
      setNovaSenha('');
      setConfirmarNovaSenha('');

      setTimeout(() => {
        setSucesso(false);
        onClose();
      }, 1800);

    } catch (err: any) {
      setError(err.message || 'Erro ao alterar senha. Verifique a senha atual.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-2xl animate-slide-up">
        
        {/* Cabeçalho do Modal */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2 text-indigo-400">
            <KeyRound className="w-5 h-5" />
            <h2 className="text-base font-extrabold text-slate-100">
              Alterar Senha de Acesso
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-400">
          Conta: <strong className="text-indigo-300">{emailUsuario}</strong>
        </p>

        {/* Banner de Feedback de Erro */}
        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-xs flex items-center gap-2 animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Banner de Sucesso */}
        {sucesso && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 text-xs flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Senha alterada com sucesso!</span>
          </div>
        )}

        {/* Formulário */}
        <form onSubmit={handleSalvarSenha} className="space-y-3">
          
          {/* Senha Atual */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Senha Atual:
            </label>
            <div className="relative flex items-center">
              <div className="w-10 h-10 rounded-l-xl bg-slate-950 border border-r-0 border-slate-800 flex items-center justify-center text-slate-400 shrink-0">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={mostrarSenhas ? 'text' : 'password'}
                value={senhaAtual}
                onChange={(e) => setSenhaAtual(e.target.value)}
                placeholder="Sua senha atual"
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-r-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-500 font-medium"
              />
            </div>
          </div>

          {/* Nova Senha */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Nova Senha:
            </label>
            <div className="relative flex items-center">
              <div className="w-10 h-10 rounded-l-xl bg-slate-950 border border-r-0 border-slate-800 flex items-center justify-center text-slate-400 shrink-0">
                <KeyRound className="w-4 h-4 text-indigo-400" />
              </div>
              <input
                type={mostrarSenhas ? 'text' : 'password'}
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                placeholder="Digite a nova senha"
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-r-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-500 font-medium"
              />
            </div>
          </div>

          {/* Confirmar Nova Senha */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Confirmar Nova Senha:
            </label>
            <div className="relative flex items-center">
              <div className="w-10 h-10 rounded-l-xl bg-slate-950 border border-r-0 border-slate-800 flex items-center justify-center text-slate-400 shrink-0">
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
              </div>
              <input
                type={mostrarSenhas ? 'text' : 'password'}
                value={confirmarNovaSenha}
                onChange={(e) => setConfirmarNovaSenha(e.target.value)}
                placeholder="Repita a nova senha"
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-r-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-500 font-medium"
              />
            </div>
          </div>

          {/* Opção Visualizar Senhas */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-400 select-none">
              <input
                type="checkbox"
                checked={mostrarSenhas}
                onChange={(e) => setMostrarSenhas(e.target.checked)}
                className="rounded border-slate-800 bg-slate-950 text-indigo-600 focus:ring-0"
              />
              <span>Mostrar senhas</span>
            </label>
          </div>

          {/* Botões de Ação */}
          <div className="flex items-center gap-2 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
            >
              Cancelar
            </button>
            
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-900/40 active:scale-95 transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Salvar Nova Senha</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
