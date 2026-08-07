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
}

export const ClienteList: React.FC<ClienteListProps> = ({
  clientes,
  cobrancas,
  onOpenNovoCliente,
  onOpenImportarExcel,
  onOpenEditarCliente,
  onDeletarCliente,
  onNovaCobrancaParaCliente
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
    <div className="space-y-4 px-4 pt-3 pb-6 animate-fade-in">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-slate-100">
            Meus Clientes
          </h2>
          <p className="text-xs text-slate-400">
            {clientes.length} devedores/clientes cadastrados
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenImportarExcel}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-slate-800 font-bold text-xs transition-all shadow-sm"
            title="Importar lista do Excel (.csv)"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Excel
          </button>

          <button
            onClick={onOpenNovoCliente}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
          >
            <UserPlus className="w-4 h-4" />
            Novo
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
          className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
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
        <div className="space-y-3">
          {clientesFiltrados.map((cliente) => {
            const stats = getEstatisticasCliente(cliente.id);

            return (
              <div 
                key={cliente.id}
                className="glass-card rounded-2xl p-4 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-11 h-11 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-200 text-lg shrink-0">
                      {cliente.nome.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-100 flex items-center gap-1.5">
                        {cliente.nome}
                        {stats.possuiAtraso && (
                          <span title="Cliente possui títulos em atraso">
                            <AlertCircle className="w-4 h-4 text-rose-500 fill-rose-500/20" />
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-500" />
                        {cliente.telefone}
                        {cliente.documento && (
                          <span className="text-[11px] text-slate-500 ml-1">
                            ({cliente.documento})
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Ações de Edição e Exclusão */}
                  <div className="flex items-center gap-1">
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
                <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 font-medium uppercase">Pendente / Atraso</span>
                    <p className={`font-bold ${stats.totalPendente > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                      {formatCurrency(stats.totalPendente)}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-medium uppercase">Total Quitados</span>
                    <p className="font-bold text-emerald-400">
                      {formatCurrency(stats.totalPago)}
                    </p>
                  </div>
                </div>

                {/* Botões de Ação na parte inferior do Card - Centralizados */}
                <div className="flex items-center justify-center gap-2 pt-1">
                  <button
                    onClick={() => {
                      const num = formatPhoneForWhatsApp(cliente.telefone);
                      window.open(`https://wa.me/${num}`, '_blank');
                    }}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 font-bold text-xs border border-emerald-500/30 flex items-center justify-center gap-1.5 transition-all"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Conversar
                  </button>

                  <button
                    onClick={() => onNovaCobrancaParaCliente(cliente)}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-md shadow-indigo-600/30 transition-all active:scale-95"
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
