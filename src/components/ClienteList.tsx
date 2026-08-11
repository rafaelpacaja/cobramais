import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  UserPlus, 
  Phone, 
  Trash2, 
  MessageSquare,
  AlertCircle,
  FileSpreadsheet,
  Pencil
} from 'lucide-react';
import { Cliente, Cobranca } from '../types';
import { formatCurrency, formatPhoneForWhatsApp } from '../utils/whatsapp';

interface ClienteListProps {
  clientes: Cliente[];
  cobrancas: Cobranca[];
  onOpenNovoCliente: () => void;
  onOpenImportarExcel: () => void;
  onOpenEditarCliente: (cliente: Cliente) => void;
  onDeletarCliente: (clienteId: string) => void;
  onNovaCobrancaParaCliente: (cliente: Cliente) => void;
  isReadOnly?: boolean;
}

export const ClienteList: React.FC<ClienteListProps> = ({
  clientes,
  cobrancas,
  onOpenNovoCliente,
  onOpenImportarExcel,
  onOpenEditarCliente,
  onDeletarCliente,
  onNovaCobrancaParaCliente,
  isReadOnly = false
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const clientesFiltrados = clientes.filter(c => 
    c.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.telefone.includes(searchQuery) ||
    (c.documento && c.documento.includes(searchQuery))
  );

  const getEstatisticasCliente = (clienteId: string) => {
    const cobrancasCliente = cobrancas.filter(c => c.clienteId === clienteId);
    const totalPendente = cobrancasCliente
      .filter(c => c.status === 'pendente' || c.status === 'atrasado')
      .reduce((acc, curr) => acc + curr.valor, 0);

    const totalPago = cobrancasCliente
      .filter(c => c.status === 'pago')
      .reduce((acc, curr) => acc + curr.valor, 0);

    const possuiAtraso = cobrancasCliente.some(c => c.status === 'atrasado');

    return {
      qtdTotal: cobrancasCliente.length,
      totalPendente,
      totalPago,
      possuiAtraso,
      cobrancasCliente
    };
  };

  return (
    <div className="w-full max-w-full overflow-x-hidden space-y-4 px-4 pt-3 pb-24 animate-fade-in">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-extrabold text-slate-100 truncate">
            Meus Clientes
          </h2>
          <p className="text-xs text-slate-400 truncate">
            {clientes.length} devedores/clientes cadastrados
          </p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {!isReadOnly ? (
            <>
              <button
                onClick={onOpenImportarExcel}
                className="h-9 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-slate-800 font-extrabold text-xs transition-all shadow-sm flex items-center gap-1.5 whitespace-nowrap active:scale-95"
                title="Importar lista do Excel (.csv)"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 shrink-0" />
                <span>Excel</span>
              </button>

              <button
                onClick={onOpenNovoCliente}
                className="h-9 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-1.5 whitespace-nowrap active:scale-95"
              >
                <UserPlus className="w-3.5 h-3.5 shrink-0" />
                <span>Novo</span>
              </button>
            </>
          ) : (
            <span className="px-3 py-1.5 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-extrabold flex items-center gap-1">
              👁️ Somente Leitura
            </span>
          )}
        </div>
      </div>

      {/* Busca */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar por nome, telefone ou CPF/CNPJ..."
          className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-medium"
        />
      </div>

      {/* Lista de Clientes */}
      {clientesFiltrados.length === 0 ? (
        <div className="glass-panel rounded-2xl p-8 text-center space-y-3">
          <Users className="w-12 h-12 text-slate-600 mx-auto" />
          <p className="text-sm font-medium text-slate-300">Nenhum cliente encontrado</p>
          <div className="flex items-center justify-center gap-2 pt-1">
            <button
              onClick={onOpenImportarExcel}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-xl text-xs font-bold border border-slate-700"
            >
              Importar Excel
            </button>
            <button
              onClick={onOpenNovoCliente}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-lg"
            >
              Novo Cliente
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3 w-full">
          {clientesFiltrados.map((cliente) => {
            const stats = getEstatisticasCliente(cliente.id);

            return (
              <div 
                key={cliente.id}
                className="glass-card rounded-2xl p-4 space-y-3 w-full"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-200 text-base shrink-0">
                      {cliente.nome.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5 truncate">
                        <span className="truncate">{cliente.nome}</span>
                        {stats.possuiAtraso && (
                          <span title="Cliente possui títulos em atraso" className="shrink-0">
                            <AlertCircle className="w-3.5 h-3.5 text-rose-500 fill-rose-500/20" />
                          </span>
                        )}
                      </h3>
                      <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5 truncate">
                        <Phone className="w-3 h-3 text-slate-500 shrink-0" />
                        <span className="truncate">{cliente.telefone || 'Sem número'}</span>
                        {cliente.documento && (
                          <span className="text-[10px] text-slate-500 shrink-0">
                            ({cliente.documento})
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Ações de Edição e Exclusão */}
                  {!isReadOnly && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => onOpenEditarCliente(cliente)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-300 hover:bg-slate-800 transition-colors"
                        title="Editar dados do cliente"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => onDeletarCliente(cliente.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                        title="Excluir cliente"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Resumo Financeiro do Cliente */}
                <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80 text-xs w-full">
                  <div>
                    <span className="text-[10px] text-slate-500 font-medium uppercase">Pendente / Atraso</span>
                    <p className={`font-bold text-xs truncate ${stats.totalPendente > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                      {formatCurrency(stats.totalPendente)}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-medium uppercase">Total Quitados</span>
                    <p className="font-bold text-xs text-emerald-400 truncate">
                      {formatCurrency(stats.totalPago)}
                    </p>
                  </div>
                </div>

                {/* Botões de Ação na parte inferior do Card */}
                <div className="flex items-center justify-center gap-2 pt-1 w-full">
                  <button
                    onClick={() => {
                      const num = formatPhoneForWhatsApp(cliente.telefone);
                      window.open(`https://wa.me/${num}`, '_blank');
                    }}
                    className="flex-1 py-2 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 font-bold text-xs border border-emerald-500/30 flex items-center justify-center gap-1.5 transition-all active:scale-95"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Conversar</span>
                  </button>

                  {!isReadOnly && (
                    <button
                      onClick={() => onNovaCobrancaParaCliente(cliente)}
                      className="flex-1 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-md shadow-indigo-600/30 transition-all active:scale-95"
                    >
                      + Cobrança
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
