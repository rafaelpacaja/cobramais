import React from 'react';
import { 
  TrendingUp, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Plus, 
  MessageSquare, 
  ChevronRight
} from 'lucide-react';
import { Cobranca, IndicadoresFinanceiros } from '../types';
import { formatCurrency, formatDateBR } from '../utils/whatsapp';

interface DashboardProps {
  indicadores: IndicadoresFinanceiros;
  cobrancas: Cobranca[];
  onOpenNovaCobranca: () => void;
  onOpenWhatsAppModal: (cobranca: Cobranca) => void;
  onVerTodasCobrancas: () => void;
  onSelectCobranca: (cobranca: Cobranca) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  indicadores,
  cobrancas,
  onOpenNovaCobranca,
  onOpenWhatsAppModal,
  onVerTodasCobrancas,
  onSelectCobranca
}) => {
  const cobrancasUrgentes = cobrancas
    .filter(c => c.status === 'atrasado' || c.status === 'pendente')
    .sort((a, b) => a.dataVencimento.localeCompare(b.dataVencimento))
    .slice(0, 5);

  return (
    <div className="w-full min-h-[101vh] space-y-5 px-4 pt-3 pb-24 animate-fade-in">
      {/* Banner de Boas-Vindas & Ação Rápida */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-800 p-5 shadow-xl shadow-indigo-900/30 w-full">
        <div className="relative z-10">
          <span className="inline-block px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md text-[11px] font-semibold text-indigo-100 mb-2 border border-white/10">
            Resumo Financeiro
          </span>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Gestão de Cobranças
          </h2>
          <p className="text-xs text-indigo-100/80 mt-1 max-w-[280px]">
            Acompanhe recebimentos e envie lembretes no WhatsApp com 1 clique.
          </p>

          <div className="mt-4 flex items-center gap-2">
            <button
              onClick={onOpenNovaCobranca}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-indigo-900 font-bold text-xs shadow-lg shadow-black/20 hover:bg-slate-100 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              Nova Cobrança
            </button>
            
            <button
              onClick={onVerTodasCobrancas}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-indigo-900/50 text-white font-medium text-xs hover:bg-indigo-900/80 border border-white/10 transition-all"
            >
              Ver Todas
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="absolute -right-8 -bottom-8 w-40 h-40 rounded-full bg-purple-500/20 blur-2xl pointer-events-none" />
        <div className="absolute right-12 -top-12 w-32 h-32 rounded-full bg-indigo-400/20 blur-xl pointer-events-none" />
      </div>

      {/* Cards Principais de Valores */}
      <div className="grid grid-cols-1 gap-3 w-full">
        {/* Card: Em Atraso */}
        <div className="glass-card w-full rounded-2xl p-4 border-l-4 border-l-rose-500 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-400">Em Atraso (Vencidos)</p>
                <h3 className="text-xl font-extrabold text-rose-400 mt-0.5">
                  {formatCurrency(indicadores.totalEmAtraso)}
                </h3>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-rose-500/15 text-rose-300 text-xs font-bold border border-rose-500/30 shrink-0">
              {indicadores.qtdAtrasados} {indicadores.qtdAtrasados === 1 ? 'título' : 'títulos'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 w-full">
          {/* Card: A Receber */}
          <div className="glass-card w-full rounded-2xl p-4 border-l-4 border-l-amber-500">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 w-fit mb-2 border border-amber-500/20">
              <Clock className="w-4 h-4" />
            </div>
            <p className="text-[11px] font-medium text-slate-400">A Receber (Pendentes)</p>
            <h4 className="text-base font-bold text-amber-400 mt-0.5 truncate">
              {formatCurrency(indicadores.totalAReceber)}
            </h4>
            <p className="text-[10px] text-slate-500 mt-1">{indicadores.qtdPendentes} cobranças</p>
          </div>

          {/* Card: Recebido */}
          <div className="glass-card w-full rounded-2xl p-4 border-l-4 border-l-emerald-500">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 w-fit mb-2 border border-emerald-500/20">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <p className="text-[11px] font-medium text-slate-400">Total Recebido</p>
            <h4 className="text-base font-bold text-emerald-400 mt-0.5 truncate">
              {formatCurrency(indicadores.totalRecebido)}
            </h4>
            <p className="text-[10px] text-slate-500 mt-1">{indicadores.qtdPagos} quitadas</p>
          </div>
        </div>
      </div>

      {/* Barra de Taxa de Inadimplência */}
      <div className="glass-card w-full rounded-2xl p-4">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="font-semibold text-slate-300 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-indigo-400" />
            Índice de Inadimplência
          </span>
          <span className="font-bold text-slate-200">
            {indicadores.taxaInadimplencia.toFixed(1)}%
          </span>
        </div>
        <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
          <div 
            className="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, Math.max(5, indicadores.taxaInadimplencia))}%` }}
          />
        </div>
        <p className="text-[10px] text-slate-400 mt-2">
          {indicadores.qtdAtrasados > 0 
            ? `Você possui ${indicadores.qtdAtrasados} cobrança(s) pendente(s) de cobrança via WhatsApp.` 
            : 'Parabéns! Nenhuma cobrança em atraso no momento.'}
        </p>
      </div>

      {/* Seção: Cobranças Prioritárias / Urgentes */}
      <div className="space-y-3 w-full">
        <div className="flex items-center justify-between w-full">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            Próximos Vencimentos & Atrasos
          </h3>
          <button 
            onClick={onVerTodasCobrancas}
            className="text-xs text-indigo-400 font-semibold hover:underline flex items-center shrink-0"
          >
            Ver todas ({cobrancas.length})
          </button>
        </div>

        {cobrancasUrgentes.length === 0 ? (
          <div className="glass-panel w-full rounded-2xl p-6 text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2 opacity-80" />
            <p className="text-sm font-medium text-slate-300">Tudo em dia!</p>
            <p className="text-xs text-slate-500 mt-1">Não há cobranças pendentes ou em atraso.</p>
          </div>
        ) : (
          <div className="space-y-2.5 w-full">
            {cobrancasUrgentes.map((cob) => {
              const isAtrasado = cob.status === 'atrasado';
              return (
                <div 
                  key={cob.id} 
                  className="glass-card glass-card-hover w-full rounded-2xl p-3.5 flex items-center justify-between"
                >
                  <div 
                    className="flex-1 cursor-pointer pr-2"
                    onClick={() => onSelectCobranca(cob)}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                        isAtrasado ? 'badge-atrasado' : 'badge-pendente'
                      }`}>
                        {isAtrasado ? 'Atrasado' : 'Pendente'}
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium">
                        Vence: {formatDateBR(cob.dataVencimento)}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-100 truncate max-w-[200px]">
                      {cob.clienteNome}
                    </h4>
                    <p className="text-xs text-slate-400 truncate max-w-[220px]">
                      {cob.descricao}
                    </p>

                    <p className="text-sm font-extrabold text-indigo-300 mt-1">
                      {formatCurrency(cob.valor)}
                    </p>
                  </div>

                  <button
                    onClick={() => onOpenWhatsAppModal(cob)}
                    className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-900/30 transition-all active:scale-95 shrink-0"
                    title="Cobrar via WhatsApp"
                  >
                    <MessageSquare className="w-4 h-4 fill-white/20" />
                    <span>Cobrar</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Action Button (FAB) */}
      <button
        onClick={onOpenNovaCobranca}
        className="fixed bottom-20 right-4 z-30 w-14 h-14 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-2xl shadow-indigo-600/50 hover:scale-110 active:scale-95 transition-all border border-white/20"
        aria-label="Adicionar Nova Cobrança"
      >
        <Plus className="w-7 h-7 stroke-[3]" />
      </button>
    </div>
  );
};
