import React, { useState, useEffect, useMemo } from 'react';
import { X, Trash2, AlertTriangle, CheckSquare, Square, Users, Layers } from 'lucide-react';
import { Cobranca } from '../types';
import { formatCurrency, formatDateBR } from '../utils/whatsapp';

interface ExcluirCobrancasModalProps {
  isOpen: boolean;
  onClose: () => void;
  cobranca: Cobranca | null;
  todasCobrancas?: Cobranca[];
  onConfirmarExclusao: (cobrancaIds: string[]) => void;
}

export const ExcluirCobrancasModal: React.FC<ExcluirCobrancasModalProps> = ({
  isOpen,
  onClose,
  cobranca,
  todasCobrancas = [],
  onConfirmarExclusao
}) => {
  if (!isOpen || !cobranca) return null;

  // Busca todas as cobranças cadastradas deste mesmo cliente
  const cobrancasDoCliente = useMemo(() => {
    if (!cobranca || !todasCobrancas || todasCobrancas.length === 0) return [cobranca];
    
    const keyNome = cobranca.clienteNome.trim().toLowerCase();
    const lista = todasCobrancas.filter(c => 
      c.id === cobranca.id || 
      (c.clienteId && c.clienteId === cobranca.clienteId) || 
      c.clienteNome.trim().toLowerCase() === keyNome
    );

    return lista.sort((a, b) => a.dataVencimento.localeCompare(b.dataVencimento));
  }, [cobranca, todasCobrancas]);

  // Por padrão inicia selecionada apenas a cobrança em que o usuário clicou na lixeira
  const [selectedIds, setSelectedIds] = useState<string[]>([cobranca.id]);

  useEffect(() => {
    if (cobranca) {
      setSelectedIds([cobranca.id]);
    }
  }, [cobranca]);

  const toggleSelectId = (id: string) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) {
        if (prev.length === 1) return prev; // Mantém pelo menos 1 selecionado
        return prev.filter(item => item !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleSelectOnlyThis = () => {
    setSelectedIds([cobranca.id]);
  };

  const handleSelectAll = () => {
    setSelectedIds(cobrancasDoCliente.map(c => c.id));
  };

  const totalExcluirValor = useMemo(() => {
    return cobrancasDoCliente
      .filter(c => selectedIds.includes(c.id))
      .reduce((sum, c) => sum + c.valor, 0);
  }, [cobrancasDoCliente, selectedIds]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIds.length === 0) {
      alert('Selecione pelo menos uma cobrança para excluir.');
      return;
    }

    onConfirmarExclusao(selectedIds);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl p-5 space-y-4 shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto">
        
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2 text-rose-400">
            <Trash2 className="w-5 h-5" />
            <div>
              <h2 className="text-base font-extrabold text-slate-100">
                Excluir Cobrança(s)
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

        {/* Cenário de Cliente com Múltiplas Cobranças */}
        {cobrancasDoCliente.length > 1 ? (
          <div className="space-y-3">
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-amber-300 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  Este cliente possui {cobrancasDoCliente.length} cobranças no sistema:
                </span>
              </div>

              <p className="text-[11px] text-slate-300">
                Marque quais contas você deseja <strong>APAGAR PERMANENTEMENTE</strong> ou use as opções de seleção rápida:
              </p>

              {/* Botões Rápidos de Seleção */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleSelectOnlyThis}
                  className={`flex-1 py-1.5 px-2 rounded-xl text-[10px] font-extrabold border transition-all ${
                    selectedIds.length === 1 && selectedIds[0] === cobranca.id
                      ? 'bg-rose-600 text-white border-rose-500 shadow-md'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Apagar Apenas Esta
                </button>

                <button
                  type="button"
                  onClick={handleSelectAll}
                  className={`flex-1 py-1.5 px-2 rounded-xl text-[10px] font-extrabold border transition-all ${
                    selectedIds.length === cobrancasDoCliente.length
                      ? 'bg-rose-600 text-white border-rose-500 shadow-md'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Apagar TODAS ({cobrancasDoCliente.length})
                </button>
              </div>

              {/* Lista de Contas com Checkbox */}
              <div className="space-y-1.5 pt-2 max-h-48 overflow-y-auto pr-1">
                {cobrancasDoCliente.map(item => {
                  const isSelected = selectedIds.includes(item.id);
                  const mesRefStr = item.mesReferencia || (item.dataVencimento ? `${item.dataVencimento.split('-')[1]}/${item.dataVencimento.split('-')[0]}` : '-');

                  return (
                    <div
                      key={item.id}
                      onClick={() => toggleSelectId(item.id)}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-rose-950/40 border-rose-500/60 text-rose-200 shadow-md'
                          : 'bg-slate-950/80 border-slate-800/80 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-rose-400 shrink-0" />
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
                        <span className="text-xs font-extrabold text-slate-200 block">
                          {formatCurrency(item.valor)}
                        </span>
                        <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                          item.status === 'pago' ? 'bg-emerald-500/20 text-emerald-300' :
                          item.status === 'atrasado' ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300'
                        }`}>
                          {item.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* Cenário de Cliente com Apenas 1 Cobrança */
          <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl space-y-1">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Cliente</span>
                <p className="text-sm font-extrabold text-slate-100">{cobranca.clienteNome}</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Valor</span>
                <p className="text-lg font-black text-rose-400">{formatCurrency(cobranca.valor)}</p>
              </div>
            </div>
            <p className="text-xs text-slate-400 pt-1 border-t border-slate-900">{cobranca.descricao}</p>
          </div>
        )}

        {/* Resumo da Ação de Exclusão */}
        <div className="p-3 bg-slate-950 border border-rose-500/20 rounded-2xl flex items-center justify-between text-xs">
          <span className="text-slate-400">Total a Excluir do Banco:</span>
          <span className="font-extrabold text-rose-400 text-sm">
            {selectedIds.length} {selectedIds.length === 1 ? 'cobrança' : 'cobranças'} ({formatCurrency(totalExcluirValor)})
          </span>
        </div>

        {/* Botões de Ação */}
        <form onSubmit={handleSubmit} className="pt-1 flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
          >
            Cancelar
          </button>
          
          <button
            type="submit"
            className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold shadow-lg shadow-rose-900/40 active:scale-95 transition-all flex items-center justify-center gap-1.5"
          >
            <Trash2 className="w-4 h-4" />
            <span>
              Excluir {selectedIds.length === 1 ? 'Esta Cobrança' : `${selectedIds.length} Cobranças`}
            </span>
          </button>
        </form>

      </div>
    </div>
  );
};
