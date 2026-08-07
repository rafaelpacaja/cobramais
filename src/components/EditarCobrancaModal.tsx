import React, { useState, useEffect } from 'react';
import { X, Edit3, DollarSign, Calendar, QrCode, CreditCard } from 'lucide-react';
import { Cliente, Cobranca, FormaPagamento, StatusCobranca } from '../types';

interface EditarCobrancaModalProps {
  isOpen: boolean;
  onClose: () => void;
  cobranca: Cobranca | null;
  clientes: Cliente[];
  onSalvarEdicao: (cobrancaAtualizada: Cobranca) => void;
}

export const EditarCobrancaModal: React.FC<EditarCobrancaModalProps> = ({
  isOpen,
  onClose,
  cobranca,
  clientes,
  onSalvarEdicao
}) => {
  if (!isOpen || !cobranca) return null;

  const [clienteId, setClienteId] = useState(cobranca.clienteId);
  const [descricao, setDescricao] = useState(cobranca.descricao);
  const [valor, setValor] = useState(cobranca.valor.toString());
  const [dataVencimento, setDataVencimento] = useState(cobranca.dataVencimento);
  const [mesReferencia, setMesReferencia] = useState(cobranca.mesReferencia || '');
  const [status, setStatus] = useState<StatusCobranca>(cobranca.status);
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento>(cobranca.formaPagamento);
  const [chavePix, setChavePix] = useState(cobranca.chavePix || '');
  const [categoria, setCategoria] = useState(cobranca.categoria || 'Serviços');

  useEffect(() => {
    if (cobranca) {
      setClienteId(cobranca.clienteId);
      setDescricao(cobranca.descricao);
      setValor(cobranca.valor.toString());
      setDataVencimento(cobranca.dataVencimento);
      
      // Auto-sugere Mês de Referência caso esteja em branco
      if (cobranca.mesReferencia) {
        setMesReferencia(cobranca.mesReferencia);
      } else if (cobranca.dataVencimento) {
        const parts = cobranca.dataVencimento.split('-');
        if (parts.length === 3) {
          setMesReferencia(`${parts[1]}/${parts[0]}`);
        }
      }
      
      setStatus(cobranca.status);
      setFormaPagamento(cobranca.formaPagamento);
      setChavePix(cobranca.chavePix || '');
      setCategoria(cobranca.categoria || 'Serviços');
    }
  }, [cobranca]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const selectedClient = clientes.find(c => c.id === clienteId);
    if (!selectedClient) {
      alert('Selecione um cliente válido.');
      return;
    }

    const valorNum = parseFloat(valor.replace(',', '.'));
    if (isNaN(valorNum) || valorNum <= 0) {
      alert('Informe um valor válido.');
      return;
    }

    if (!descricao.trim()) {
      alert('Informe uma descrição.');
      return;
    }

    const cobrancaAtualizada: Cobranca = {
      ...cobranca,
      clienteId: selectedClient.id,
      clienteNome: selectedClient.nome.replace(/\s*\([^)]*\)/g, '').trim(),
      clienteTelefone: selectedClient.telefone,
      descricao: descricao.trim(),
      valor: Math.round(valorNum * 100) / 100,
      dataVencimento,
      mesReferencia: mesReferencia.trim() || undefined,
      status,
      formaPagamento,
      chavePix: formaPagamento === 'pix' ? chavePix : undefined,
      categoria,
      dataPagamento: status === 'pago' ? (cobranca.dataPagamento || new Date().toISOString().split('T')[0]) : undefined
    };

    onSalvarEdicao(cobrancaAtualizada);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl p-5 space-y-4 shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto">
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="text-lg font-extrabold text-slate-100 flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-indigo-400" />
            Editar Cobrança #{cobranca.id.slice(0, 8)}
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
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Cliente / Devedor
            </label>
            <select
              value={clienteId}
              onChange={(e) => setClienteId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:border-indigo-500"
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
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Descrição do Serviço / Produto
            </label>
            <input
              type="text"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:border-indigo-500"
              required
            />
          </div>

          {/* Valor, Vencimento & Mês de Referência */}
          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Valor (R$)
              </label>
              <input
                type="text"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-100 font-bold focus:border-indigo-500"
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
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2.5 text-xs text-slate-100 font-medium focus:border-indigo-500"
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

          {/* Status da Cobrança */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Status Atual do Título
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'pendente', label: 'Pendente' },
                { id: 'atrasado', label: 'Atrasado' },
                { id: 'pago', label: 'Pago' },
                { id: 'cancelado', label: 'Cancelado' }
              ].map(st => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setStatus(st.id as StatusCobranca)}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                    status === st.id 
                      ? st.id === 'pago' ? 'bg-emerald-600 border-emerald-500 text-white' :
                        st.id === 'atrasado' ? 'bg-rose-600 border-rose-500 text-white' :
                        st.id === 'pendente' ? 'bg-amber-600 border-amber-500 text-white' :
                        'bg-slate-700 border-slate-600 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* Forma de Pagamento & Categoria */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Forma de Pagamento
              </label>
              <select
                value={formaPagamento}
                onChange={(e) => setFormaPagamento(e.target.value as FormaPagamento)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-100"
              >
                <option value="pix">PIX</option>
                <option value="boleto">Boleto</option>
                <option value="cartao">Cartão</option>
                <option value="dinheiro">Dinheiro</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Categoria
              </label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-100"
              >
                <option value="Serviços">Serviços</option>
                <option value="Vendas">Vendas de Produtos</option>
                <option value="Consultoria">Consultoria</option>
                <option value="Mensalidade">Mensalidade</option>
                <option value="Outros">Outros</option>
              </select>
            </div>
          </div>

          {formaPagamento === 'pix' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Chave PIX
              </label>
              <input
                type="text"
                value={chavePix}
                onChange={(e) => setChavePix(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100"
              />
            </div>
          )}

          {/* Botões */}
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
              className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold shadow-lg shadow-indigo-600/40 active:scale-95 transition-all"
            >
              Salvar Alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
