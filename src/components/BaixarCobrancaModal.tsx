import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, Calendar, DollarSign, Tag, CreditCard, QrCode } from 'lucide-react';
import { Cobranca, FormaPagamento } from '../types';
import { formatCurrency, formatDateBR } from '../utils/whatsapp';

interface BaixarCobrancaModalProps {
  isOpen: boolean;
  onClose: () => void;
  cobranca: Cobranca | null;
  onConfirmarBaixa: (cobrancaId: string, dadosBaixa: { mesReferencia: string; dataPagamento: string; formaPagamento: FormaPagamento }) => void;
}

export const BaixarCobrancaModal: React.FC<BaixarCobrancaModalProps> = ({
  isOpen,
  onClose,
  cobranca,
  onConfirmarBaixa
}) => {
  if (!isOpen || !cobranca) return null;

  // Auto-sugere o mês de referência (se já salvo ou calculado a partir do vencimento)
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!mesReferencia.trim()) {
      alert('Por favor, informe o mês de referência.');
      return;
    }

    onConfirmarBaixa(cobranca.id, {
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
          <h2 className="text-lg font-extrabold text-slate-100 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            Dar Baixa em Cobrança
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Resumo da Cobrança */}
        <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl space-y-1">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Cliente / Devedor</span>
              <p className="text-sm font-extrabold text-slate-100">{cobranca.clienteNome}</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Valor Quitado</span>
              <p className="text-lg font-black text-emerald-400">{formatCurrency(cobranca.valor)}</p>
            </div>
          </div>
          <p className="text-xs text-slate-400 pt-1 border-t border-slate-900">{cobranca.descricao}</p>
        </div>

        {/* Formulário de Baixa */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Mês de Referência */}
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
            <p className="text-[10px] text-slate-500 mt-1">
              Confirme ou altere se o pagamento for referente a um mês anterior/específico.
            </p>
          </div>

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
              Confirmar Baixa
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
