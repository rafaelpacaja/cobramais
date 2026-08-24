import React, { useState, useRef } from 'react';
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
  KeyRound,
  Tag,
  Plus,
  Pencil,
  Check
} from 'lucide-react';
import { Cliente, Cobranca, Usuario } from '../types';
import { AppConfig, getUsuarioLogado, DEFAULT_CATEGORIAS } from '../services/storage';
import { AlterarSenhaModal } from './AlterarSenhaModal';

interface ConfigViewProps {
  config: AppConfig;
  onSalvarConfig: (novaConfig: AppConfig) => void;
  clientes: Cliente[];
  cobrancas: Cobranca[];
  usuarios?: Usuario[];
  onRestaurarDados: (clientes: Cliente[], cobrancas: Cobranca[]) => void;
  onResetSeedData: () => void;
  onAdicionarCategoria?: (novaCat: string) => void;
  onRenomearCategoria?: (antigaCat: string, novaCat: string) => void;
  onRemoverCategoria?: (catParaRemover: string) => void;
}

export const ConfigView: React.FC<ConfigViewProps> = ({
  config,
  onSalvarConfig,
  clientes,
  cobrancas,
  usuarios = [],
  onRestaurarDados,
  onResetSeedData,
  onAdicionarCategoria,
  onRenomearCategoria,
  onRemoverCategoria
}) => {
  const usuarioLogado = getUsuarioLogado();

  const [nomeEmpresa, setNomeEmpresa] = useState(config.nomeEmpresa || 'COMPUSERVE LTDA');
  const [cnpjEmpresa, setCnpjEmpresa] = useState(config.cnpjEmpresa || '60.060.102/0001-24');
  const [chavePixPadrao, setChavePixPadrao] = useState(config.chavePixPadrao || '60.060.102/0001-24');
  const [mensagemSalvo, setMensagemSalvo] = useState(false);

  // Estados para Gestão de Categorias
  const [newCatInput, setNewCatInput] = useState('');
  const [editingCatName, setEditingCatName] = useState<string | null>(null);
  const [editingCatValue, setEditingCatValue] = useState<string>('');

  // Lista combinada de categorias
  const categoriasListMap = new Map<string, string>();
  [...DEFAULT_CATEGORIAS, ...(config.categorias || [])].forEach(c => {
    const trimmed = c.trim();
    if (trimmed && !categoriasListMap.has(trimmed.toLowerCase())) {
      categoriasListMap.set(trimmed.toLowerCase(), trimmed);
    }
  });
  const categoriasList = Array.from(categoriasListMap.values());

  const handleAddCatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (usuarioLogado?.role === 'visualizador') {
      alert('🔒 Acesso Negado\n\nSeu perfil de usuário não tem permissão para alterar categorias.');
      return;
    }
    const trimmed = newCatInput.trim();
    if (!trimmed) return;

    if (onAdicionarCategoria) {
      onAdicionarCategoria(trimmed);
      setNewCatInput('');
    }
  };

  const handleSaveRenameCat = (antigaCat: string) => {
    const trimmed = editingCatValue.trim();
    if (trimmed && trimmed.toLowerCase() !== antigaCat.toLowerCase()) {
      if (onRenomearCategoria) {
        onRenomearCategoria(antigaCat, trimmed);
      }
    }
    setEditingCatName(null);
    setEditingCatValue('');
  };

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
  const [newRole, setNewRole] = useState<'admin' | 'visualizador'>('visualizador');
  const [userSuccessMsg, setUserSuccessMsg] = useState('');
  const [userErrorMsg, setUserErrorMsg] = useState('');
  const [userLoading, setUserLoading] = useState(false);

  // Estado do Modal de Confirmação com Senha de Reset
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [senhaInput, setSenhaInput] = useState('');
  const [erroSenha, setErroSenha] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (usuarioLogado?.role === 'visualizador') {
      alert('🔒 Acesso Negado\n\nSeu perfil de usuário (Somente Leitura) não possui permissão para alterar as configurações da empresa. Apenas administradores podem modificar estes dados.');
      return;
    }
    onSalvarConfig({
      nomeEmpresa: nomeEmpresa.trim(),
      cnpjEmpresa: cnpjEmpresa.trim(),
      chavePixPadrao: chavePixPadrao.trim(),
      diasAvisoVencimento: config.diasAvisoVencimento || 3,
      categorias: config.categorias || DEFAULT_CATEGORIAS
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
          senha: newSenha,
          role: newRole
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

  const handleDeletarUsuario = async (u: Usuario) => {
    if (usuarioLogado?.role === 'visualizador') {
      alert('🔒 Acesso Negado\n\nSeu perfil de usuário (Somente Leitura) não possui permissão para excluir usuários da equipe. Apenas administradores podem gerenciar usuários.');
      return;
    }

    if (u.email.toLowerCase() === usuarioLogado?.email.toLowerCase()) {
      alert('⚠️ Operação não permitida!\n\nVocê não pode excluir o seu próprio usuário enquanto estiver conectado.');
      return;
    }

    if (confirm(`Tem certeza que deseja EXCLUIR o usuário "${u.nome || u.email}" (${u.email})?\n\nEste usuário perderá imediatamente o acesso ao sistema CobraMais.`)) {
      try {
        await fetch('/api/db', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'delete_usuario',
            userId: u.id,
            userEmail: u.email
          })
        });
        alert(`Usuário ${u.nome || u.email} excluído com sucesso!`);
        window.location.reload();
      } catch (err) {
        alert('Erro ao comunicar com o servidor para excluir usuário.');
      }
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClickRestaurar = () => {
    if (usuarioLogado?.role === 'visualizador') {
      alert('🔒 Acesso Negado\n\nSeu perfil de usuário (Somente Leitura) não possui permissão para restaurar backups. Apenas administradores podem realizar restaurações do sistema.');
      return;
    }
    fileInputRef.current?.click();
  };

  const handleExportBackup = () => {
    if (usuarioLogado?.role === 'visualizador') {
      alert('🔒 Acesso Negado\n\nSeu perfil de usuário (Somente Leitura) não possui permissão para exportar cópias de segurança (Backup). Apenas administradores podem realizar backups do sistema.');
      return;
    }
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
    if (usuarioLogado?.role === 'visualizador') {
      alert('🔒 Acesso Negado\n\nSeu perfil de usuário (Somente Leitura) não possui permissão para restaurar backups. Apenas administradores podem realizar restaurações.');
      e.target.value = '';
      return;
    }
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
    if (usuarioLogado?.role === 'visualizador') {
      alert('🔒 Acesso Negado\n\nSeu perfil de usuário (Somente Leitura) não possui permissão para restaurar dados demonstrativos iniciais. Apenas administradores podem executar esta ação.');
      return;
    }
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

      {/* Seção de Gestão de Categorias */}
      <div className="glass-card rounded-2xl p-4 space-y-3">
        <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
          <Tag className="w-4 h-4 text-indigo-400" />
          Gerenciar Categorias de Cobrança
        </h3>

        <p className="text-xs text-slate-400 leading-relaxed">
          Altere os nomes, remova ou crie novas categorias para organizar seus títulos e relatórios.
        </p>

        {/* Formulário de Adicionar Categoria */}
        <form onSubmit={handleAddCatSubmit} className="flex items-center gap-2">
          <input
            type="text"
            value={newCatInput}
            onChange={(e) => setNewCatInput(e.target.value)}
            placeholder="Nova categoria (ex: Manutenção, Licença)..."
            className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 font-bold focus:border-indigo-500"
          />
          <button
            type="submit"
            className="h-9 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-900/30 shrink-0 cursor-pointer active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar</span>
          </button>
        </form>

        {/* Lista de Categorias com Opção de Editar Nome e Excluir */}
        <div className="pt-2 flex flex-wrap gap-2">
          {categoriasList.map(cat => {
            const count = cobrancas.filter(c => c.categoria && c.categoria.toLowerCase() === cat.toLowerCase()).length;
            const isEditing = editingCatName === cat;

            return (
              <div
                key={cat}
                className="px-3 py-2 rounded-xl bg-slate-950/90 border border-slate-800 flex items-center gap-2 text-xs font-bold text-slate-200 shadow-sm"
              >
                {isEditing ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={editingCatValue}
                      onChange={(e) => setEditingCatValue(e.target.value)}
                      className="bg-slate-900 border border-indigo-500 rounded-lg px-2 py-1 text-xs text-slate-100 font-bold focus:outline-none"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSaveRenameCat(cat);
                        } else if (e.key === 'Escape') {
                          setEditingCatName(null);
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveRenameCat(cat)}
                      className="p-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer"
                      title="Salvar novo nome"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingCatName(null)}
                      className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
                      title="Cancelar"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="text-slate-100 font-extrabold">{cat}</span>
                    {count > 0 && (
                      <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded-md text-indigo-300 font-semibold">
                        {count} {count === 1 ? 'cobrança' : 'cobranças'}
                      </span>
                    )}

                    <div className="flex items-center gap-1 pl-1 border-l border-slate-800">
                      {/* Botão de Renomear / Alterar Nome */}
                      <button
                        type="button"
                        onClick={() => {
                          if (usuarioLogado?.role === 'visualizador') {
                            alert('🔒 Acesso Negado\n\nSeu perfil não tem permissão para alterar categorias.');
                            return;
                          }
                          setEditingCatName(cat);
                          setEditingCatValue(cat);
                        }}
                        className="p-1 rounded text-slate-400 hover:text-indigo-400 hover:bg-slate-900 transition-all cursor-pointer"
                        title={`Renomear categoria "${cat}"`}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>

                      {/* Botão de Excluir Categoria */}
                      {onRemoverCategoria && (
                        <button
                          type="button"
                          onClick={() => {
                            if (usuarioLogado?.role === 'visualizador') {
                              alert('🔒 Acesso Negado\n\nSeu perfil não tem permissão para excluir categorias.');
                              return;
                            }
                            if (confirm(`Tem certeza que deseja APAGAR a categoria "${cat}"?`)) {
                              onRemoverCategoria(cat);
                            }
                          }}
                          className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-900 transition-all cursor-pointer"
                          title={`Apagar categoria "${cat}"`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
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
              if (usuarioLogado?.role === 'visualizador') {
                alert('🔒 Acesso Negado\n\nSeu perfil de usuário (Somente Leitura) não possui permissão para cadastrar novos usuários da equipe. Apenas administradores podem gerenciar acessos do sistema.');
                return;
              }
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

        {usuarios && usuarios.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-slate-800/80">
            <span className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
              <span>Usuários da Equipe Cadastrados ({usuarios.length}):</span>
              <span className="text-[10px] text-slate-500 font-normal">Para testar o acesso, faça logout no topo.</span>
            </span>

            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {usuarios.map((u, idx) => (
                <div key={u.id || idx} className="p-2.5 rounded-xl bg-slate-950/90 border border-slate-800/90 flex items-center justify-between text-xs shadow-inner">
                  <div className="truncate pr-2">
                    <p className="font-bold text-slate-100 truncate">{u.nome || u.email}</p>
                    <p className="text-[10px] text-slate-400 truncate">{u.email}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-lg border shrink-0 ${
                      u.role === 'visualizador' 
                        ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' 
                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    }`}>
                      {u.role === 'visualizador' ? '👁️ Somente Leitura' : '👑 Administrador'}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleDeletarUsuario(u)}
                      title="Excluir Usuário"
                      className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-all active:scale-95 flex items-center justify-center"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
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

          <button
            type="button"
            onClick={handleClickRestaurar}
            className="w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all"
          >
            <Upload className="w-4 h-4 text-emerald-400" />
            <span>Restaurar</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImportBackup}
            className="hidden"
          />
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

              {/* Perfil de Acesso (Permissões) */}
              <div>
                <label className="block text-slate-300 font-bold mb-1.5 flex items-center justify-between">
                  <span>Perfil de Acesso (Permissão):</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewRole('visualizador')}
                    className={`p-2.5 rounded-xl border text-left flex flex-col gap-0.5 transition-all cursor-pointer ${
                      newRole === 'visualizador'
                        ? 'bg-indigo-950/70 border-indigo-500 text-indigo-200 shadow-md ring-1 ring-indigo-500'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span className="font-extrabold text-xs flex items-center gap-1">
                      👁️ Somente Leitura
                    </span>
                    <span className="text-[10px] text-slate-400 leading-tight">
                      Apenas visualiza dados e relatórios. Não altera ou exclui nada.
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewRole('admin')}
                    className={`p-2.5 rounded-xl border text-left flex flex-col gap-0.5 transition-all cursor-pointer ${
                      newRole === 'admin'
                        ? 'bg-emerald-950/70 border-emerald-500 text-emerald-200 shadow-md ring-1 ring-emerald-500'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span className="font-extrabold text-xs flex items-center gap-1">
                      👑 Administrador
                    </span>
                    <span className="text-[10px] text-slate-400 leading-tight">
                      Acesso total para criar, editar, dar baixa e excluir.
                    </span>
                  </button>
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
