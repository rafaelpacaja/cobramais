import React, { useState, useEffect, useMemo } from 'react';
import { X, CheckCircle2, Calendar, DollarSign, Tag, CreditCard, QrCode, Layers, AlertCircle, CheckSquare, Square } from 'lucide-react';
import { Cobranca, FormaPagamento } from '../types';
import { formatCurrency, formatDateBR } from '../utils/whatsapp';

interface BaixarCobrancaModalProps {
  isOpen: boolean;
  onClose: () => void;
  cobranca: Cobranca | null;
  todasCobrancas?: Cobranca[];
  onConfirmarBaixa: (cobrancaIds: string[], dadosBaixa: { mesReferencia?: string; dataPagamento: string; formaPagamento: FormaPagamento }) => void;
}

export const BaixarCobrancaModal: React.FC<BaixarCobrancaModalProps> = ({
  isOpen,
  onClose,
  cobranca,
  todasCobrancas = [],
  onConfirmarBaixa
}) => {
  if (!isOpen || !cobranca) return null;

  // Busca todas as cobranças em aberto (atrasadas ou pendentes) deste mesmo cliente
  const cobrancasAbertasDoCliente = useMemo(() => {
    if (!cobranca || !todasCobrancas || todasCobrancas.length === 0) return [cobranca];
    
    const keyNome = cobranca.clienteNome.trim().toLowerCase();
    const abertas = todasCobrancas.filter(c => 
      (c.id === cobranca.id || c.clienteId === cobranca.clienteId || c.clienteNome.trim().toLowerCase() === keyNome) &&
      (c.status === 'pendente' || c.status === 'atrasado' || c.id === cobranca.id)
    );

    // Ordena por data de vencimento (as mais antigas primeiro)
    return abertas.sort((a, b) => a.dataVencimento.localeCompare(b.dataVencimento));
  }, [cobranca, todasCobrancas]);

  // IDs selecionados para dar baixa (por padrão inicia com a cobrança em que o usuário clicou)
  const [selectedIds, setSelectedIds] = useState<string[]>([cobranca.id]);

  const mesRefInicial = cobranca.mesReferencia || (
    cobranca.dataVencimento 
      ? `${cobranca.dataVencimento.split('-')[1]}/${cobranca.dataVencimento.split('-')[0]}` 
      : `${String(new Date().getMonth() + 1).padStart(2, '0')}/${new Date().getFullYear()}`
  );

  const [mesReferencia, setMesReferencia] = useState(mesRefInicial);
  const [dataPagamento, setDataPagamento] = useState(() => new Date().toISOString().split('T')[0]);
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento>(cobranca.formaPagamento || 'pix');

  useEffect(() => {
    if (cobranca) {
      setSelectedIds([cobranca.id]);
      const initial = cobranca.mesReferencia || (
        cobranca.dataVencimento 
          ? `${cobranca.dataVencimento.split('-')[1]}/${cobranca.dataVencimento.split('-')[0]}` 
          : `${String(new Date().getMonth() + 1).padStart(2, '0')}/${new Date().getFullYear()}`
      );
      setMesReferencia(initial);
      setDataPagamento(new Date().toISOString().split('T')[0]);
      setFormaPagamento(cobranca.formaPagamento || 'pix');
    }
  }, [cobranca]);

  const toggleSelectId = (id: string) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) {
        if (prev.length === 1) return prev; // Mantém pelo menos um selecionado
        return prev.filter(item => item !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.length === cobrancasAbertasDoCliente.length) {
      setSelectedIds([cobranca.id]);
    } else {
      setSelectedIds(cobrancasAbertasDoCliente.map(c => c.id));
    }
  };

  // Calcula soma total dos títulos selecionados
  const totalSelecionado = useMemo(() => {
    return cobrancasAbertasDoCliente
      .filter(c => selectedIds.includes(c.id))
      .reduce((sum, c) => sum + c.valor, 0);
  }, [cobrancasAbertasDoCliente, selectedIds]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedIds.length === 0) {
      alert('Selecione pelo menos um mês para dar baixa.');
      return;
    }

    onConfirmarBaixa(selectedIds, {
      mesReferencia: mesReferencia.trim(),
      dataPagamento,
      formaPagamento
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl p-5 space-y-4 shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto">
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-base font-extrabold text-slate-100">
                Dar Baixa em Mensalidade
              </h2>
              <p className="text-xs text-slate-400">
                {cobranca.clienteNome}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Alerta de Múltiplas Parcelas do Cliente se houver mais de 1 em aberto */}
        {cobrancasAbertasDoCliente.length > 1 && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/25 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-amber-300 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                {cobrancasAbertasDoCliente.length} mensalidades em aberto deste cliente:
              </span>
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-[10px] font-black text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded-lg border border-amber-500/30 hover:bg-amber-500/30"
              >
                {selectedIds.length === cobrancasAbertasDoCliente.length ? 'Selecionar Apenas Esta' : 'Quitar Todas'}
              </button>
            </div>

            <p className="text-[11px] text-slate-300">
              Clique no mês que o cliente pagou para dar baixa individual ou selecione múltiplos:
            </p>

            {/* Lista com Seleção de Parcelas */}
            <div className="space-y-1.5 pt-1 max-h-48 overflow-y-auto pr-1">
              {cobrancasAbertasDoCliente.map((item) => {
                const isSelected = selectedIds.includes(item.id);
                const mesRefStr = item.mesReferencia || (item.dataVencimento ? `${item.dataVencimento.split('-')[1]}/${item.dataVencimento.split('-')[0]}` : '-');

                return (
                  <div
                    key={item.id}
                    onClick={() => toggleSelectId(item.id)}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-200 shadow-md'
                        : 'bg-slate-950/80 border-slate-800/80 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-500 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-bold truncate">
                          Mês Ref: <span className="text-white font-extrabold">{mesRefStr}</span>
                          <span className="text-[10px] text-slate-400 font-semibold ml-2">
                            (Venc: {formatDateBR(item.dataVencimento)})
                          </span>
                        </p>
                        <p className="text-[10px] text-slate-400 truncate">{item.descricao}</p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-extrabold text-emerald-400 block">
                        {formatCurrency(item.valor)}
                      </span>
                      <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                        item.status === 'atrasado' ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300'
                      }`}>
                        {item.status === 'atrasado' ? 'Atrasado' : 'A Vencer'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Resumo do Valor Total a Quitar */}
        <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl space-y-1">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Cliente</span>
              <p className="text-sm font-extrabold text-slate-100">{cobranca.clienteNome}</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                Total Quitado ({selectedIds.length} {selectedIds.length === 1 ? 'mês' : 'meses'})
              </span>
              <p className="text-xl font-black text-emerald-400">{formatCurrency(totalSelecionado)}</p>
            </div>
          </div>
        </div>

        {/* Formulário de Baixa */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Mês de Referência (ocorre em baixas individuais ou como referência principal) */}
          {selectedIds.length === 1 && (
            <div>
              <label className="block text-xs font-bold text-indigo-300 mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                Mês de Referência da Conta (MM/AAAA)
              </label>
              <input
                type="text"
                value={mesReferencia}
                onChange={(e) => setMesReferencia(e.target.value)}
                placeholder="Ex: 07/2026, 08/2026"
                className="w-full bg-slate-950 border border-indigo-500/50 rounded-xl px-3.5 py-2.5 text-sm font-bold text-indigo-300 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                required
              />
            </div>
          )}

          {/* Data do Pagamento & Forma de Pagamento */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Data do Pagamento
              </label>
              <input
                type="date"
                value={dataPagamento}
                onChange={(e) => setDataPagamento(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-100 font-medium focus:border-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Meio de Pagamento
              </label>
              <select
                value={formaPagamento}
                onChange={(e) => setFormaPagamento(e.target.value as FormaPagamento)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-100 font-bold"
              >
                <option value="pix">PIX</option>
                <option value="boleto">Boleto</option>
                <option value="cartao">Cartão</option>
                <option value="dinheiro">Dinheiro</option>
              </select>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold shadow-lg shadow-emerald-900/40 active:scale-95 transition-all flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {selectedIds.length === 1 
                  ? `Quitar ${mesReferencia || 'Mensalidade'} (${formatCurrency(totalSelecionado)})` 
                  : `Quitar ${selectedIds.length} Mensalidades (${formatCurrency(totalSelecionado)})`}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
