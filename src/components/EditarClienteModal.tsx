import React, { useState, useEffect } from 'react';
import { X, Edit3 } from 'lucide-react';
import { Cliente } from '../types';

interface EditarClienteModalProps {
  isOpen: boolean;
  onClose: () => void;
  cliente: Cliente | null;
  onSalvarEdicaoCliente: (clienteAtualizado: Cliente) => void;
}

function formatCpfCnpjInput(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 14);
  if (digits.length <= 11) {
    return digits
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  } else {
    return digits
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
  }
}

function formatTelefoneInput(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 10) {
    return digits
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  }
  return digits
    .replace(/^(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2');
}

export const EditarClienteModal: React.FC<EditarClienteModalProps> = ({
  isOpen,
  onClose,
  cliente,
  onSalvarEdicaoCliente
}) => {
  if (!isOpen || !cliente) return null;

  const [nome, setNome] = useState(cliente.nome);
  const [telefone, setTelefone] = useState(cliente.telefone);
  const [email, setEmail] = useState(cliente.email || '');
  const [documento, setDocumento] = useState(cliente.documento || '');
  const [cidade, setCidade] = useState(cliente.cidade || 'PACAJÁ');
  const [observacoes, setObservacoes] = useState(cliente.observacoes || '');

  useEffect(() => {
    if (cliente) {
      setNome(cliente.nome);
      setTelefone(cliente.telefone);
      setEmail(cliente.email || '');
      setDocumento(cliente.documento || '');
      setCidade(cliente.cidade || 'PACAJÁ');
      setObservacoes(cliente.observacoes || '');
    }
  }, [cliente]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!nome.trim()) {
      alert('Informe o nome do cliente.');
      return;
    }

    if (!telefone.trim()) {
      alert('Informe o número de telefone/WhatsApp.');
      return;
    }

    const clienteAtualizado: Cliente = {
      ...cliente,
      nome: nome.trim(),
      telefone: telefone.trim(),
      email: email.trim() || undefined,
      documento: documento.trim() || undefined,
      cidade: cidade.trim() || 'PACAJÁ',
      observacoes: observacoes.trim() || undefined
    };

    onSalvarEdicaoCliente(clienteAtualizado);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl p-5 space-y-4 shadow-2xl animate-slide-up">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="text-lg font-extrabold text-slate-100 flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-indigo-400" />
            Editar Cadastro do Cliente
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Nome Completo / Razão Social *
            </label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: João da Silva ou Empresa X Ltda"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:border-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Telefone / WhatsApp (Com DDD) *
            </label>
            <input
              type="text"
              value={telefone}
              onChange={(e) => setTelefone(formatTelefoneInput(e.target.value))}
              placeholder="(11) 99999-8888"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 font-medium focus:border-indigo-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                E-mail (Opcional)
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="cliente@email.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                CPF ou CNPJ (Opcional)
              </label>
              <input
                type="text"
                value={documento}
                onChange={(e) => setDocumento(formatCpfCnpjInput(e.target.value))}
                maxLength={18}
                placeholder="CPF ou CNPJ completo"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 font-medium focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Cidade
            </label>
            <input
              type="text"
              value={cidade}
              onChange={(e) => setCidade(e.target.value)}
              placeholder="Ex: PACAJÁ"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 font-medium focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Observações / Notas Internas
            </label>
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Preferência de horário, histórico..."
              rows={2}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 focus:border-indigo-500"
            />
          </div>

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
