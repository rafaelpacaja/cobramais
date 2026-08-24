import React, { useState } from 'react';
import { X, Calendar, DollarSign, User, Tag, CreditCard, QrCode, Plus, Check } from 'lucide-react';
import { Cliente, Cobranca, FormaPagamento } from '../types';
import { DEFAULT_CATEGORIAS } from '../services/storage';

interface NovaCobrancaModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientes: Cliente[];
  clientePreSelecionado?: Cliente | null;
  categorias?: string[];
  onSalvarCobranca: (novasCobrancas: Omit<Cobranca, 'id' | 'createdAt'>[]) => void;
  onOpenNovoClienteModal: () => void;
  onAdicionarCategoria?: (novaCat: string) => void;
  chavePixPadrao: string;
}

export const NovaCobrancaModal: React.FC<NovaCobrancaModalProps> = ({
  isOpen,
  onClose,
  clientes,
  clientePreSelecionado,
  categorias = DEFAULT_CATEGORIAS,
  onSalvarCobranca,
  onOpenNovoClienteModal,
  onAdicionarCategoria,
  chavePixPadrao
}) => {
  if (!isOpen) return null;

  const [clienteId, setClienteId] = useState<string>(clientePreSelecionado?.id || (clientes[0]?.id || ''));
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [dataVencimento, setDataVencimento] = useState(() => {
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${d.getFullYear()}-${mm}-05`;
  });

  const [mesReferencia, setMesReferencia] = useState(() => {
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${mm}/${d.getFullYear()}`;
  });

  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento>('pix');
  const [chavePix, setChavePix] = useState(chavePixPadrao);
  const [categoria, setCategoria] = useState('Serviços');
  const [totalParcelas, setTotalParcelas] = useState(1);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState('');

  // Combina lista de categorias
  const listaCategoriasMap = new Map<string, string>();
  [...DEFAULT_CATEGORIAS, ...categorias].forEach(c => {
    const trimmed = c.trim();
    if (trimmed && !listaCategoriasMap.has(trimmed.toLowerCase())) {
      listaCategoriasMap.set(trimmed.toLowerCase(), trimmed);
    }
  });
  const listaCategorias = Array.from(listaCategoriasMap.values());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const selectedClient = clientes.find(c => c.id === clienteId);
    if (!selectedClient) {
      alert('Selecione um cliente válido.');
      return;
    }

    const valorTotalNum = parseFloat(valor.replace(',', '.'));
    if (isNaN(valorTotalNum) || valorTotalNum <= 0) {
      alert('Informe um valor válido maior que zero.');
      return;
    }

    if (!descricao.trim()) {
      alert('Informe uma descrição para a cobrança.');
      return;
    }

    const novas: Omit<Cobranca, 'id' | 'createdAt'>[] = [];
    const valorParcela = valorTotalNum / totalParcelas;

    const baseDate = new Date(dataVencimento);

    for (let i = 1; i <= totalParcelas; i++) {
      const vDate = new Date(baseDate);
      if (i > 1) {
        vDate.setMonth(vDate.getMonth() + (i - 1));
      }
      const dataIso = vDate.toISOString().split('T')[0];

      const descComParcela = totalParcelas > 1 
        ? `${descricao.trim()} (Parcela ${i}/${totalParcelas})` 
        : descricao.trim();

      novas.push({
        clienteId: selectedClient.id,
        clienteNome: selectedClient.nome.replace(/\s*\([^)]*\)/g, '').trim(),
        clienteTelefone: selectedClient.telefone,
        descricao: descComParcela,
        valor: Math.round(valorParcela * 100) / 100,
        dataVencimento: dataIso,
        mesReferencia: mesReferencia.trim() || undefined,
        status: 'pendente',
        formaPagamento,
        chavePix: formaPagamento === 'pix' ? chavePix : undefined,
        categoria,
        parcelaAtual: i,
        totalParcelas
      });
    }

    onSalvarCobranca(novas);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl p-5 space-y-4 shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto">
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="text-lg font-extrabold text-slate-100 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-indigo-400" />
            Nova Cobrança
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Seleção do Cliente */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300">Cliente / Devedor</label>
              <button
                type="button"
                onClick={onOpenNovoClienteModal}
                className="text-[11px] font-bold text-indigo-400 hover:underline flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                Novo Cliente
              </button>
            </div>
            {clientes.length === 0 ? (
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300">
                Nenhum cliente cadastrado. Clique acima em "+ Novo Cliente" para continuar.
              </div>
            ) : (
              <select
                value={clienteId}
                onChange={(e) => setClienteId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              >
                {clientes.map(c => {
                  const nomeLimpo = c.nome.replace(/\s*\([^)]*\)/g, '').trim();
                  return (
                    <option key={c.id} value={c.id}>
                      {nomeLimpo}
                    </option>
                  );
                })}
              </select>
            )}
          </div>

          {/* Descrição da Cobrança */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Descrição do Serviço / Produto
            </label>
            <input
              type="text"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Ex: Mensalidade do Sistema Compuserve"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500"
              required
            />
          </div>

          {/* Valor, Vencimento & Mês de Referência */}
          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Valor Total (R$)
              </label>
              <input
                type="text"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                placeholder="0,00"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 font-bold"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Vencimento
              </label>
              <input
                type="date"
                value={dataVencimento}
                onChange={(e) => setDataVencimento(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2.5 text-xs text-slate-100 focus:border-indigo-500 font-medium"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Mês Ref. (MM/AAAA)
              </label>
              <input
                type="text"
                value={mesReferencia}
                onChange={(e) => setMesReferencia(e.target.value)}
                placeholder="07/2026"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2.5 text-xs text-indigo-300 font-bold focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Parcelamento & Categoria */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Parcelas
              </label>
              <select
                value={totalParcelas}
                onChange={(e) => setTotalParcelas(parseInt(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-100"
              >
                {[1,2,3,4,5,6,7,8,9,10,11,12].map(n => (
                  <option key={n} value={n}>
                    {n === 1 ? 'À vista (1x)' : `${n}x parcelas`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Categoria
                </label>
                {!isAddingCategory ? (
                  <button
                    type="button"
                    onClick={() => setIsAddingCategory(true)}
                    className="text-[11px] font-bold text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    Nova Categoria
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingCategory(false);
                      setNewCategoryInput('');
                    }}
                    className="text-[11px] font-semibold text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    Cancelar
                  </button>
                )}
              </div>

              {isAddingCategory ? (
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={newCategoryInput}
                    onChange={(e) => setNewCategoryInput(e.target.value)}
                    placeholder="Nome da nova categoria..."
                    className="w-full bg-slate-950 border border-indigo-500 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const trimmed = newCategoryInput.trim();
                        if (trimmed) {
                          if (onAdicionarCategoria) onAdicionarCategoria(trimmed);
                          setCategoria(trimmed);
                          setIsAddingCategory(false);
                          setNewCategoryInput('');
                        }
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const trimmed = newCategoryInput.trim();
                      if (trimmed) {
                        if (onAdicionarCategoria) onAdicionarCategoria(trimmed);
                        setCategoria(trimmed);
                        setIsAddingCategory(false);
                        setNewCategoryInput('');
                      }
                    }}
                    className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shrink-0 cursor-pointer"
                    title="Adicionar"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <select
                  value={categoria}
                  onChange={(e) => {
                    if (e.target.value === '__add_new__') {
                      setIsAddingCategory(true);
                    } else {
                      setCategoria(e.target.value);
                    }
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:border-indigo-500 cursor-pointer"
                >
                  {listaCategorias.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                  <option value="__add_new__" className="text-indigo-400 font-bold bg-slate-900">
                    ➕ Adicionar Nova Categoria...
                  </option>
                </select>
              )}
            </div>
          </div>

          {/* Forma de Pagamento */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Forma de Pagamento Preferencial
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'pix', label: 'PIX' },
                { id: 'boleto', label: 'Boleto' },
                { id: 'cartao', label: 'Cartão' },
                { id: 'dinheiro', label: 'Dinheiro' }
              ].map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setFormaPagamento(item.id as FormaPagamento)}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                    formaPagamento === item.id 
                      ? 'bg-indigo-600 border-indigo-500 text-white shadow-md' 
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {formaPagamento === 'pix' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Chave PIX para Pagamento
              </label>
              <input
                type="text"
                value={chavePix}
                onChange={(e) => setChavePix(e.target.value)}
                placeholder="Ex: CPF, CNPJ, Email ou Chave Aleatória"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:border-indigo-500"
              />
            </div>
          )}

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
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-extrabold shadow-lg shadow-indigo-600/40 hover:opacity-95 active:scale-95 transition-all"
            >
              Criar {totalParcelas > 1 ? `${totalParcelas} Cobranças` : 'Cobrança'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
