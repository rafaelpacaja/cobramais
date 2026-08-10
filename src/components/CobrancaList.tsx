import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  MessageSquare, 
  CheckCircle, 
  Trash2, 
  Plus, 
  Calendar,
  FileCheck,
  CreditCard,
  QrCode,
  DollarSign,
  Pencil,
  Sparkles,
  Repeat
} from 'lucide-react';
import { Cobranca, StatusCobranca } from '../types';
import { formatCurrency, formatDateBR } from '../utils/whatsapp';

interface CobrancaListProps {
  cobrancas: Cobranca[];
  onOpenNovaCobranca: () => void;
  onOpenGerarMensalidades?: () => void;
  onOpenWhatsAppModal: (cobranca: Cobranca) => void;
  onOpenReciboModal: (cobranca: Cobranca) => void;
  onOpenEditarModal: (cobranca: Cobranca) => void;
  onOpenBaixarModal?: (cobranca: Cobranca) => void;
  onMarcarComoPago: (cobrancaId: string) => void;
  onMarcarComoCancelado: (cobrancaId: string) => void;
  onDeletarCobranca: (cobrancaId: string) => void;
  onLimparDuplicadas?: () => void;
}

export const CobrancaList: React.FC<CobrancaListProps> = ({
  cobrancas,
  onOpenNovaCobranca,
  onOpenGerarMensalidades,
  onOpenWhatsAppModal,
  onOpenReciboModal,
  onOpenEditarModal,
  onOpenBaixarModal,
  onMarcarComoPago,
  onMarcarComoCancelado,
  onDeletarCobranca,
  onLimparDuplicadas
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('em_aberto');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('todas');

  const cobrancasFiltradas = cobrancas.filter((cob) => {
    const matchSearch = 
      cob.clienteNome.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cob.descricao.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (cob.mesReferencia && cob.mesReferencia.toLowerCase().includes(searchQuery.toLowerCase())) ||
      cob.valor.toString().includes(searchQuery);

    const matchStatus = 
      filterStatus === 'todos' ? true :
      filterStatus === 'em_aberto' ? (cob.status === 'pendente' || cob.status === 'atrasado') :
      cob.status === filterStatus;

    const matchCategoria = selectedCategory === 'todas' || cob.categoria === selectedCategory;

    return matchSearch && matchStatus && matchCategoria;
  });

  const getFormaPagamentoIcon = (forma: string) => {
    switch (forma) {
      case 'pix': return <QrCode className="w-3.5 h-3.5 text-emerald-400" />;
      case 'cartao': return <CreditCard className="w-3.5 h-3.5 text-indigo-400" />;
      default: return <DollarSign className="w-3.5 h-3.5 text-amber-400" />;
    }
  };

  const getBadgeClass = (status: StatusCobranca) => {
    switch (status) {
      case 'pago': return 'badge-pago';
      case 'atrasado': return 'badge-atrasado';
      case 'pendente': return 'badge-pendente';
      case 'cancelado': return 'badge-cancelado';
    }
  };

  return (
    <div className="w-full max-w-full overflow-x-hidden space-y-4 px-4 pt-3 pb-24 animate-fade-in">
      {/* Top Controls Padronizados */}
      <div className="flex items-center justify-between gap-2 w-full">
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-extrabold text-slate-100 truncate">
            Minhas Cobranças
          </h2>
          <p className="text-xs text-slate-400 truncate">
            {cobrancasFiltradas.length} de {cobrancas.length} títulos listados
          </p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {onOpenGerarMensalidades && (
            <button
              onClick={onOpenGerarMensalidades}
              className="h-9 px-3 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 font-extrabold text-xs border border-indigo-500/30 transition-all flex items-center justify-center gap-1.5 whitespace-nowrap active:scale-95"
              title="Gerar mensalidades em lote para todos os clientes"
            >
              <Repeat className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span>Gerar Lote</span>
            </button>
          )}

          {onLimparDuplicadas && (
            <button
              onClick={onLimparDuplicadas}
              className="h-9 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-extrabold text-xs border border-amber-500/30 transition-all flex items-center justify-center gap-1.5 whitespace-nowrap active:scale-95"
              title="Remover títulos duplicados"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Limpar</span>
            </button>
          )}

          <button
            onClick={onOpenNovaCobranca}
            className="h-9 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-1.5 whitespace-nowrap active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3] shrink-0" />
            <span>Nova</span>
          </button>
        </div>
      </div>

      {/* Campo de Busca */}
      <div className="relative w-full">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar cliente, valor, mês ref (ex: 08/2026)..."
          className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-medium"
        />
        {searchQuery && (
          <button 
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
          >
            Limpar
          </button>
        )}
      </div>

      {/* Abas de Filtro de Status */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none w-full">
        {[
          { id: 'em_aberto', label: 'Em Aberto' },
          { id: 'pendente', label: 'Pendentes' },
          { id: 'atrasado', label: 'Atrasados' },
          { id: 'pago', label: 'Pagos' },
          { id: 'todos', label: 'Todos' },
          { id: 'cancelado', label: 'Cancelados' }
        ].map((tab) => {
          const count = 
            tab.id === 'todos' ? cobrancas.length :
            tab.id === 'em_aberto' ? cobrancas.filter(c => c.status === 'pendente' || c.status === 'atrasado').length :
            cobrancas.filter(c => c.status === tab.id).length;

          const isActive = filterStatus === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                isActive 
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-bold' 
                  : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Lista de Cobranças */}
      {cobrancasFiltradas.length === 0 ? (
        <div className="glass-panel rounded-2xl p-8 text-center space-y-3">
          <Filter className="w-12 h-12 text-slate-600 mx-auto" />
          <p className="text-sm font-medium text-slate-300">Nenhuma cobrança encontrada em {filterStatus === 'em_aberto' ? 'Em Aberto' : filterStatus}</p>
          <p className="text-xs text-slate-500">Tente ajustar os filtros de busca ou selecione a aba 'Todos'.</p>
        </div>
      ) : (
        <div className="space-y-3 w-full">
          {cobrancasFiltradas.map((cob) => {
            const keyNome = cob.clienteNome.trim().toLowerCase();
            const abertasDoCliente = cobrancas.filter(c => 
              (c.clienteId === cob.clienteId || c.clienteNome.trim().toLowerCase() === keyNome) &&
              (c.status === 'pendente' || c.status === 'atrasado')
            );

            return (
              <div 
                key={cob.id}
                className="glass-card rounded-2xl p-4 space-y-3 border-l-4 transition-all w-full"
                style={{
                  borderLeftColor: 
                    cob.status === 'pago' ? '#10b981' :
                    cob.status === 'atrasado' ? '#ef4444' :
                    cob.status === 'pendente' ? '#f59e0b' : '#64748b'
                }}
              >
                {/* Cabeçalho do Card */}
                <div className="flex items-start justify-between gap-2 w-full">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center flex-wrap gap-1">
                      <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${getBadgeClass(cob.status)}`}>
                        {cob.status}
                      </span>

                      {abertasDoCliente.length > 1 && (
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          ⚠️ {abertasDoCliente.length} em aberto
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm sm:text-base font-extrabold text-slate-100 mt-1 truncate">
                      {cob.clienteNome}
                    </h3>
                    <p className="text-xs text-slate-400 font-medium truncate">
                      {cob.descricao}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-base sm:text-lg font-extrabold text-slate-100">
                      {formatCurrency(cob.valor)}
                    </p>
                    <div className="flex items-center justify-end gap-1 text-[11px] text-slate-400 mt-0.5">
                      {getFormaPagamentoIcon(cob.formaPagamento)}
                      <span className="uppercase font-semibold">{cob.formaPagamento}</span>
                    </div>
                  </div>
                </div>

                {/* Detalhes Adicionais */}
                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/80 text-slate-400 w-full">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="text-[11px] truncate">Venc: <strong className="text-slate-200">{formatDateBR(cob.dataVencimento)}</strong></span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {cob.mesReferencia && (
                      <span className="px-2 py-0.5 rounded bg-indigo-500/15 text-[10px] text-indigo-300 font-bold border border-indigo-500/30">
                        Ref: {cob.mesReferencia}
                      </span>
                    )}

                    {cob.categoria && (
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 font-medium border border-slate-700/50 hidden xs:inline">
                        {cob.categoria}
                      </span>
                    )}
                  </div>
                </div>

                {/* Barra de Ações Rápidas do Card */}
                <div className="flex items-center gap-1.5 pt-1 w-full">
                  {/* WhatsApp */}
                  <button
                    onClick={() => onOpenWhatsAppModal(cob)}
                    className="flex-1 flex items-center justify-center gap-1 py-2 px-2.5 rounded-xl bg-emerald-600/90 hover:bg-emerald-500 text-white font-bold text-xs transition-all active:scale-95"
                  >
                    <MessageSquare className="w-3.5 h-3.5 fill-white/20 shrink-0" />
                    <span>WhatsApp</span>
                  </button>

                  {/* Status toggle / Dar Baixa */}
                  {cob.status !== 'pago' ? (
                    <button
                      onClick={() => {
                        if (onOpenBaixarModal) {
                          onOpenBaixarModal(cob);
                        } else {
                          onMarcarComoPago(cob.id);
                        }
                      }}
                      className="flex-1 flex items-center justify-center gap-1 py-2 px-2.5 rounded-xl bg-indigo-600/90 hover:bg-indigo-500 text-white font-bold text-xs transition-all active:scale-95 whitespace-nowrap"
                      title="Dar baixa como Pago"
                    >
                      <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>Dar Baixa</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => onOpenReciboModal(cob)}
                      className="flex-1 flex items-center justify-center gap-1 py-2 px-2.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 font-bold text-xs border border-indigo-500/30 transition-all"
                    >
                      <FileCheck className="w-3.5 h-3.5 shrink-0" />
                      <span>Recibo</span>
                    </button>
                  )}

                  {/* Botão Editar */}
                  <button
                    onClick={() => onOpenEditarModal(cob)}
                    className="p-2 rounded-xl bg-slate-800/80 hover:bg-indigo-500/20 text-slate-400 hover:text-indigo-300 transition-colors border border-slate-700/40 shrink-0"
                    title="Editar cobrança"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>

                  {/* Botão Excluir */}
                  <button
                    onClick={() => onDeletarCobranca(cob.id)}
                    className="p-2 rounded-xl bg-slate-800/80 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors border border-slate-700/40 shrink-0"
                    title="Excluir cobrança"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
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
