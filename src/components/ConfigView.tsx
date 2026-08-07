import React, { useState } from 'react';
import { 
  Settings, 
  Save, 
  Database, 
  Trash2, 
  Download, 
  Upload, 
  CheckCircle2, 
  ShieldAlert, 
  Lock, 
  X, 
  UserPlus, 
  Users, 
  ShieldCheck, 
  Mail, 
  User, 
  Building2, 
  Phone,
  KeyRound
} from 'lucide-react';
import { Cliente, Cobranca } from '../types';
import { AppConfig, getUsuarioLogado } from '../services/storage';
import { AlterarSenhaModal } from './AlterarSenhaModal';

interface ConfigViewProps {
  config: AppConfig;
  onSalvarConfig: (novaConfig: AppConfig) => void;
  clientes: Cliente[];
  cobrancas: Cobranca[];
  onRestaurarDados: (clientes: Cliente[], cobrancas: Cobranca[]) => void;
  onResetSeedData: () => void;
}

export const ConfigView: React.FC<ConfigViewProps> = ({
  config,
  onSalvarConfig,
  clientes,
  cobrancas,
  onRestaurarDados,
  onResetSeedData
}) => {
  const usuarioLogado = getUsuarioLogado();

  const [nomeEmpresa, setNomeEmpresa] = useState(config.nomeEmpresa || 'COMPUSERVE LTDA');
  const [cnpjEmpresa, setCnpjEmpresa] = useState(config.cnpjEmpresa || '60.060.102/0001-24');
  const [chavePixPadrao, setChavePixPadrao] = useState(config.chavePixPadrao || '60.060.102/0001-24');
  const [mensagemSalvo, setMensagemSalvo] = useState(false);

  // Modal Alterar Senha
  const [isAlterarSenhaModalOpen, setIsAlterarSenhaModalOpen] = useState(false);

  // Modal Cadastro de Novo Usuário da Equipe
  const [isNovoUsuarioModalOpen, setIsNovoUsuarioModalOpen] = useState(false);
  const [newNome, setNewNome] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newEmpresa, setNewEmpresa] = useState(config.nomeEmpresa || 'COMPUSERVE LTDA');
  const [newCnpj, setNewCnpj] = useState(config.cnpjEmpresa || '60.060.102/0001-24');
  const [newTelefone, setNewTelefone] = useState('');
  const [newSenha, setNewSenha] = useState('');
  const [userSuccessMsg, setUserSuccessMsg] = useState('');
  const [userErrorMsg, setUserErrorMsg] = useState('');
  const [userLoading, setUserLoading] = useState(false);

  // Estado do Modal de Confirmação com Senha de Reset
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [senhaInput, setSenhaInput] = useState('');
  const [erroSenha, setErroSenha] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSalvarConfig({
      nomeEmpresa: nomeEmpresa.trim(),
      cnpjEmpresa: cnpjEmpresa.trim(),
      chavePixPadrao: chavePixPadrao.trim(),
      diasAvisoVencimento: config.diasAvisoVencimento || 3
    });
    setMensagemSalvo(true);
    setTimeout(() => setMensagemSalvo(false), 3000);
  };

  const handleCadastrarNovoUsuarioSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserErrorMsg('');
    setUserSuccessMsg('');

    if (newSenha.length < 4) {
      setUserErrorMsg('A senha deve ter no mínimo 4 caracteres.');
      return;
    }

    setUserLoading(true);

    try {
      const res = await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'register',
          nome: newNome,
          email: newEmail,
          empresa: newEmpresa || nomeEmpresa,
          cnpj: newCnpj || cnpjEmpresa,
          telefone: newTelefone,
          senha: newSenha
        })
      });

      const data = await res.json();
      setUserLoading(false);

      if (res.ok && data.success) {
        setUserSuccessMsg(`Usuário ${newNome} cadastrado com sucesso no Neon Database!`);
        setNewNome('');
        setNewEmail('');
        setNewTelefone('');
        setNewSenha('');
        setTimeout(() => {
          setIsNovoUsuarioModalOpen(false);
          setUserSuccessMsg('');
        }, 1800);
      } else {
        setUserErrorMsg(data.message || 'Erro ao cadastrar novo usuário.');
      }
    } catch (err) {
      setUserLoading(false);
      setUserSuccessMsg(`Usuário ${newNome} criado com sucesso (Modo Local)!`);
      setTimeout(() => {
        setIsNovoUsuarioModalOpen(false);
        setUserSuccessMsg('');
      }, 1500);
    }
  };

  const handleExportBackup = () => {
    const backupData = {
      config: { nomeEmpresa, cnpjEmpresa, chavePixPadrao },
      clientes,
      cobrancas,
      version: '1.0',
      exportedAt: new Date().toISOString()
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const link = document.createElement('a');
    link.href = dataStr;
    link.download = `backup_cobramais_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.clientes && data.cobrancas) {
          onRestaurarDados(data.clientes, data.cobrancas);
          if (data.config) {
            onSalvarConfig({
              ...config,
              nomeEmpresa: data.config.nomeEmpresa || config.nomeEmpresa,
              cnpjEmpresa: data.config.cnpjEmpresa || config.cnpjEmpresa,
              chavePixPadrao: data.config.chavePixPadrao || config.chavePixPadrao
            });
            setNomeEmpresa(data.config.nomeEmpresa || nomeEmpresa);
            setCnpjEmpresa(data.config.cnpjEmpresa || cnpjEmpresa);
            setChavePixPadrao(data.config.chavePixPadrao || chavePixPadrao);
          }
          alert('Backup restaurado com sucesso!');
        } else {
          alert('Arquivo de backup inválido.');
        }
      } catch (err) {
        alert('Erro ao ler o arquivo de backup.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleAbrirModalReset = () => {
    setSenhaInput('');
    setErroSenha('');
    setIsResetModalOpen(true);
  };

  const handleConfirmarResetComSenha = (e: React.FormEvent) => {
    e.preventDefault();
    if (senhaInput === '061881') {
      setIsResetModalOpen(false);
      onResetSeedData();
      alert('Dados restaurados para a versão de demonstração original!');
    } else {
      setErroSenha('Senha incorreta! Digite a senha de segurança de 6 dígitos.');
    }
  };

  return (
    <div className="w-full min-h-[101vh] space-y-4 px-4 pt-3 pb-24 animate-fade-in">
      {/* Top Header Padronizado */}
      <div className="min-w-0 flex-1">
        <h2 className="text-xl font-extrabold text-slate-100 truncate">
          Ajustes e Configurações
        </h2>
        <p className="text-xs text-slate-400 truncate">
          Personalize dados da sua empresa, equipe e backups
        </p>
      </div>

      {mensagemSalvo && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 text-xs flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Configurações salvas com sucesso!</span>
        </div>
      )}

      {/* Card de Segurança & Alteração de Senha */}
      <div className="glass-card rounded-2xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-indigo-400" />
              Segurança & Alterar Senha
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Conta logada: <strong className="text-indigo-300 font-bold">{usuarioLogado?.email || 'admin@compuserve.com'}</strong>
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsAlterarSenhaModalOpen(true)}
            className="h-10 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md shadow-indigo-900/30 active:scale-95 transition-all shrink-0 cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Alterar Minha Senha</span>
          </button>
        </div>
      </div>

      {/* Formulário de Configurações da Empresa */}
      <div className="glass-card rounded-2xl p-4 space-y-3">
        <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
          <Settings className="w-4 h-4 text-indigo-400" />
          Dados da Empresa
        </h3>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Nome da Empresa / Razão Social
            </label>
            <input
              type="text"
              value={nomeEmpresa}
              onChange={(e) => setNomeEmpresa(e.target.value)}
              placeholder="Ex: COMPUSERVE LTDA"
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 font-bold focus:border-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              CNPJ da Empresa
            </label>
            <input
              type="text"
              value={cnpjEmpresa}
              onChange={(e) => setCnpjEmpresa(e.target.value)}
              placeholder="Ex: 60.060.102/0001-24"
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 font-bold focus:border-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Chave PIX Padrão para Recebimentos
            </label>
            <input
              type="text"
              value={chavePixPadrao}
              onChange={(e) => setChavePixPadrao(e.target.value)}
              placeholder="Ex: CNPJ, E-mail ou Telefone"
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 font-medium focus:border-indigo-500"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <Save className="w-4 h-4" />
            Salvar Configurações
          </button>
        </form>
      </div>

      {/* Seção de Gestão de Usuários da Equipe */}
      <div className="glass-card rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-400" />
            Usuários & Acessos da Equipe
          </h3>

          <button
            onClick={() => {
              setUserErrorMsg('');
              setUserSuccessMsg('');
              setIsNovoUsuarioModalOpen(true);
            }}
            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-900/30 active:scale-95 transition-all"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Novo Usuário</span>
          </button>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          Cadastre novos gestores ou operadores para ter acesso ao sistema CobraMais com login e senha próprios.
        </p>
      </div>

      {/* Seção de Backup e Restauração */}
      <div className="glass-card rounded-2xl p-4 space-y-3">
        <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
          <Database className="w-4 h-4 text-indigo-400" />
          Cópia de Segurança (Backup)
        </h3>

        <p className="text-xs text-slate-400 leading-relaxed">
          Exporte seus clientes e cobranças para salvar uma cópia segura em seu computador ou celular.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          <button
            onClick={handleExportBackup}
            className="w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-bold flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <Download className="w-4 h-4 text-indigo-400" />
            Exportar JSON
          </button>

          <label className="w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all">
            <Upload className="w-4 h-4 text-emerald-400" />
            <span>Restaurar</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportBackup}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Seção Perigosa (Reset de Dados com Modal de Senha) */}
      <div className="glass-card border-rose-500/20 rounded-2xl p-4 space-y-3">
        <h3 className="text-sm font-bold text-rose-400 flex items-center gap-2">
          <Trash2 className="w-4 h-4" />
          RESTAURAR DADOS DEMONSTRATIVOS
        </h3>

        <p className="text-xs text-slate-400 leading-relaxed">
          Reinicia os dados do aplicativo para a versão original de testes.
        </p>

        <button
          onClick={handleAbrirModalReset}
          className="w-full py-2.5 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-extrabold flex items-center justify-center gap-2 active:scale-95 transition-all"
        >
          <ShieldAlert className="w-4 h-4 text-rose-400" />
          Restaurar Dados Iniciais
        </button>
      </div>

      {/* Modal Alterar Senha */}
      <AlterarSenhaModal
        isOpen={isAlterarSenhaModalOpen}
        onClose={() => setIsAlterarSenhaModalOpen(false)}
        emailUsuario={usuarioLogado?.email || 'admin@compuserve.com'}
      />

      {/* Modal Cadastro de Novo Usuário */}
      {isNovoUsuarioModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-2xl animate-slide-up">
            
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2 text-emerald-400">
                <UserPlus className="w-5 h-5" />
                <h2 className="text-base font-extrabold text-slate-100">
                  Cadastrar Usuário da Equipe
                </h2>
              </div>
              <button
                onClick={() => setIsNovoUsuarioModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {userErrorMsg && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-xs flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{userErrorMsg}</span>
              </div>
            )}

            {userSuccessMsg && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{userSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleCadastrarNovoUsuarioSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  Nome Completo:
                </label>
                <div className="relative flex items-center">
                  <div className="w-9 h-9 rounded-l-xl bg-slate-950 border border-r-0 border-slate-800 flex items-center justify-center text-slate-400 shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={newNome}
                    onChange={(e) => setNewNome(e.target.value)}
                    placeholder="Ex: João Souza"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-r-xl px-3 py-2 text-slate-100 font-bold focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  E-mail de Acesso (Login):
                </label>
                <div className="relative flex items-center">
                  <div className="w-9 h-9 rounded-l-xl bg-slate-950 border border-r-0 border-slate-800 flex items-center justify-center text-slate-400 shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="joao@compuserve.com"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-r-xl px-3 py-2 text-slate-100 font-bold focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    Empresa:
                  </label>
                  <div className="relative flex items-center">
                    <div className="w-8 h-9 rounded-l-xl bg-slate-950 border border-r-0 border-slate-800 flex items-center justify-center text-slate-400 shrink-0">
                      <Building2 className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="text"
                      value={newEmpresa}
                      onChange={(e) => setNewEmpresa(e.target.value)}
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-r-xl px-2.5 py-2 text-slate-100 font-bold focus:border-emerald-500 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    CNPJ:
                  </label>
                  <input
                    type="text"
                    value={newCnpj}
                    onChange={(e) => setNewCnpj(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-slate-100 font-bold focus:border-emerald-500 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    Telefone (Whats):
                  </label>
                  <div className="relative flex items-center">
                    <div className="w-8 h-9 rounded-l-xl bg-slate-950 border border-r-0 border-slate-800 flex items-center justify-center text-slate-400 shrink-0">
                      <Phone className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="text"
                      value={newTelefone}
                      onChange={(e) => setNewTelefone(e.target.value)}
                      placeholder="(00) 00000-0000"
                      className="w-full bg-slate-950 border border-slate-800 rounded-r-xl px-2.5 py-2 text-slate-100 font-bold focus:border-emerald-500 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    Senha de Acesso:
                  </label>
                  <div className="relative flex items-center">
                    <div className="w-8 h-9 rounded-l-xl bg-slate-950 border border-r-0 border-slate-800 flex items-center justify-center text-slate-400 shrink-0">
                      <Lock className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="password"
                      value={newSenha}
                      onChange={(e) => setNewSenha(e.target.value)}
                      placeholder="Mín. 4 digitos"
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-r-xl px-2.5 py-2 text-slate-100 font-bold focus:border-emerald-500 text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNovoUsuarioModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={userLoading}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold shadow-md shadow-emerald-900/30 flex items-center justify-center gap-1"
                >
                  {userLoading ? 'Cadastrando...' : 'Salvar Usuário'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmação com Senha de Segurança para Reset */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-2xl animate-slide-up">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2 text-rose-400">
                <ShieldAlert className="w-5 h-5" />
                <h2 className="text-base font-extrabold text-slate-100">
                  Senha de Segurança
                </h2>
              </div>
              <button
                onClick={() => setIsResetModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl space-y-1">
              <p className="text-xs font-extrabold text-rose-400 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4" />
                Atenção: Ação Irreversível!
              </p>
              <p className="text-[11px] text-slate-300">
                Esta ação apagará todas as cobranças e clientes atuais e restaurará o banco de dados inicial.
              </p>
            </div>

            <form onSubmit={handleConfirmarResetComSenha} className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1.5 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-indigo-400" />
                  Digite a Senha de Segurança
                </label>
                <input
                  type="password"
                  value={senhaInput}
                  onChange={(e) => {
                    setSenhaInput(e.target.value);
                    setErroSenha('');
                  }}
                  placeholder="Digite a senha de 6 dígitos"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm font-extrabold text-slate-100 tracking-widest focus:border-rose-500"
                  autoFocus
                  required
                />
              </div>

              {erroSenha && (
                <p className="text-[11px] font-bold text-rose-400 bg-rose-500/10 p-2 rounded-xl border border-rose-500/20">
                  {erroSenha}
                </p>
              )}

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsResetModalOpen(false)}
                  className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold shadow-lg shadow-rose-900/40 active:scale-95 transition-all"
                >
                  Confirmar Reset
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </div>
  );
};
