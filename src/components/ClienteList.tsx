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
        <div className="text-center py-12 glass-card rounded-2xl p-6">
          <p className="text-slate-400 text-sm font-medium">
            Nenhum cliente encontrado.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {clientesFiltrados.map((cliente) => {
            const stats = getEstatisticasCliente(cliente.id);

            return (
              <div
                key={cliente.id}
                className="glass-card rounded-2xl p-4 space-y-3 relative group border border-slate-800/80 hover:border-slate-700/80 transition-all"
              >
                {/* Header do Card */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
                      <span className="font-extrabold text-indigo-300 text-sm">
                        {cliente.nome.charAt(0).toUpperCase()}
                      </span>
                    </div>

                    <div className="min-w-0">
                      <h3 className="font-bold text-slate-100 text-sm truncate">
                        {cliente.nome}
                      </h3>
                      <p className="text-xs text-slate-400 font-medium flex items-center gap-1">
                        <Phone className="w-3 h-3 shrink-0 text-emerald-400" />
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

                  <button
                    onClick={() => onNovaCobrancaParaCliente(cliente)}
                    className="flex-1 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-md shadow-indigo-600/30 transition-all active:scale-95"
                  >
                    + Cobrança
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
