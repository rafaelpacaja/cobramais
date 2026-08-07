import React, { useState } from 'react';
import { Settings, Save, Database, Trash2, Download, Upload, CheckCircle2, ShieldAlert, Lock, X } from 'lucide-react';
import { Cliente, Cobranca } from '../types';
import { AppConfig } from '../services/storage';

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
  const [nomeEmpresa, setNomeEmpresa] = useState(config.nomeEmpresa || 'COMPUSERVE LTDA');
  const [cnpjEmpresa, setCnpjEmpresa] = useState(config.cnpjEmpresa || '60.060.102/0001-24');
  const [chavePixPadrao, setChavePixPadrao] = useState(config.chavePixPadrao || '60.060.102/0001-24');
  const [mensagemSalvo, setMensagemSalvo] = useState(false);

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
    link.click();
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const json = JSON.parse(evt.target?.result as string);
        if (json.clientes && json.cobrancas) {
          onRestaurarDados(json.clientes, json.cobrancas);
          if (json.config) {
            onSalvarConfig(json.config);
            setNomeEmpresa(json.config.nomeEmpresa);
            setCnpjEmpresa(json.config.cnpjEmpresa || '');
            setChavePixPadrao(json.config.chavePixPadrao);
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
  };

  const handleConfirmarResetComSenha = (e: React.FormEvent) => {
    e.preventDefault();
    setErroSenha('');

    if (senhaInput.trim() === '061881') {
      onResetSeedData();
      setIsResetModalOpen(false);
      setSenhaInput('');
      alert('Dados resetados com sucesso para a versão inicial!');
    } else {
      setErroSenha('Senha incorreta! Digite a senha válida para autorizar o reset.');
    }
  };

  return (
    <div className="w-full min-h-[101vh] space-y-4 px-4 pt-3 pb-24 animate-fade-in">
      <div>
        <h2 className="text-xl font-extrabold text-slate-100">
          Ajustes e Configurações
        </h2>
        <p className="text-xs text-slate-400">
          Personalize dados da sua empresa e backups
        </p>
      </div>

      {mensagemSalvo && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          Configurações salvas com sucesso!
        </div>
      )}

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

      {/* Seção de Backup e Restauração */}
      <div className="glass-card rounded-2xl p-4 space-y-3">
        <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
          <Database className="w-4 h-4 text-indigo-400" />
          Cópia de Segurança (Backup)
        </h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          Exporte seus clientes e cobranças para salvar uma cópia segura em seu computador ou celular.
        </p>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={handleExportBackup}
            className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
          >
            <Download className="w-4 h-4 text-indigo-400" />
            Exportar JSON
          </button>

          <label className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer">
            <Upload className="w-4 h-4 text-emerald-400" />
            Restaurar
            <input
              type="file"
              accept=".json"
              onChange={handleImportBackup}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Zona de Perigo / Reset */}
      <div className="glass-card rounded-2xl p-4 space-y-2 border-rose-500/20">
        <h3 className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
          <Trash2 className="w-4 h-4" />
          Restaurar Dados Demonstrativos
        </h3>
        <p className="text-[11px] text-slate-400">
          Reinicia os dados do aplicativo para a versão original de testes.
        </p>
        <button
          onClick={() => {
            setSenhaInput('');
            setErroSenha('');
            setIsResetModalOpen(true);
          }}
          className="w-full py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold border border-rose-500/30 transition-all active:scale-95"
        >
          Resetar Dados Demonstrativos
        </button>
      </div>

      {/* Modal de Confirmação com Senha de Segurança */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-rose-500/30 rounded-3xl p-5 space-y-4 shadow-2xl animate-slide-up">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2 text-rose-400">
                <ShieldAlert className="w-5 h-5" />
                <h3 className="text-base font-extrabold text-slate-100">
                  Confirmar Reset de Dados
                </h3>
              </div>
              <button
                onClick={() => setIsResetModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-xs text-rose-300 space-y-1">
              <p className="font-bold flex items-center gap-1 text-rose-400">
                ⚠️ AVISO IMPORTANTE!
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
