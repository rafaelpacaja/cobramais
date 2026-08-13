import React, { useState, useEffect } from 'react';
import { X, MessageSquare, Send, Copy, Check, Sparkles, Phone, Users, Briefcase, Smartphone } from 'lucide-react';
import { Cobranca, Cliente, WhatsAppTemplateType } from '../types';
import { 
  generateWhatsAppMessage, 
  openWhatsApp, 
  formatCurrency, 
  TipoWhatsAppTarget 
} from '../utils/whatsapp';

interface WhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  cobranca: Cobranca | null;
  clientes?: Cliente[];
  nomeEmpresa: string;
  chavePixPadrao: string;
  cnpjEmpresa?: string;
}

export const WhatsAppModal: React.FC<WhatsAppModalProps> = ({
  isOpen,
  onClose,
  cobranca,
  clientes = [],
  nomeEmpresa,
  chavePixPadrao,
  cnpjEmpresa
}) => {
  if (!isOpen || !cobranca) return null;

  // Seleciona template padrão inteligente com base no status
  const defaultTemplate: WhatsAppTemplateType = 
    cobranca.status === 'pago' ? 'recibo' :
    cobranca.status === 'atrasado' ? 'em_atraso' :
    cobranca.dataVencimento === new Date().toISOString().split('T')[0] ? 'dia_vencimento' : 'lembrete_amigavel';

  const [selectedTemplate, setSelectedTemplate] = useState<WhatsAppTemplateType>(defaultTemplate);
  const [targetApp, setTargetApp] = useState<TipoWhatsAppTarget>('business');
  const [customMessage, setCustomMessage] = useState<string>('');
  const [phoneInput, setPhoneInput] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [copiedPix, setCopiedPix] = useState<boolean>(false);

  const rawPixKey = cobranca?.chavePix || chavePixPadrao || '60.060.102/0001-24';

  useEffect(() => {
    if (cobranca) {
      const msg = generateWhatsAppMessage(cobranca, selectedTemplate, nomeEmpresa, chavePixPadrao, cnpjEmpresa);
      setCustomMessage(msg);

      let rawTel = cobranca.clienteTelefone || '';
      if (!rawTel || rawTel.includes(',') || rawTel.includes('R$') || rawTel.replace(/\D/g, '').length < 8) {
        const matchedCli = clientes.find(c => c.id === cobranca.clienteId || c.nome.toLowerCase() === cobranca.clienteNome.toLowerCase());
        if (matchedCli && matchedCli.telefone && !matchedCli.telefone.includes(',') && matchedCli.telefone.replace(/\D/g, '').length >= 8) {
          rawTel = matchedCli.telefone;
        } else {
          rawTel = '';
        }
      }
      setPhoneInput(rawTel);
    }
  }, [cobranca, selectedTemplate, nomeEmpresa, chavePixPadrao, cnpjEmpresa, clientes]);

  const handleCopyPixKeyOnly = () => {
    try {
      navigator.clipboard.writeText(rawPixKey);
      setCopiedPix(true);
      setTimeout(() => setCopiedPix(false), 2000);
    } catch (e) {}
  };

  const handleSendWhatsApp = (app: TipoWhatsAppTarget = targetApp) => {
    try {
      navigator.clipboard.writeText(rawPixKey);
    } catch (e) {}
    openWhatsApp(phoneInput, customMessage, app);
    onClose();
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(customMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const templatesList: { id: WhatsAppTemplateType; label: string; desc: string }[] = [
    { id: 'lembrete_amigavel', label: 'Lembrete Amigável', desc: 'Antes do vencimento' },
    { id: 'dia_vencimento', label: 'Vence Hoje', desc: 'Lembrete do dia' },
    { id: 'em_atraso', label: 'Cobrança em Atraso', desc: 'Vencimento ultrapassado' },
    { id: 'recibo', label: 'Comprovante / Recibo', desc: 'Após quitação' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl p-5 space-y-4 shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <MessageSquare className="w-5 h-5 fill-emerald-400/20" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-100">
                Enviar Lembrete no WhatsApp
              </h2>
              <p className="text-xs text-slate-400">
                {cobranca.clienteNome} • {formatCurrency(cobranca.valor)}
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

        {/* Escolha do Aplicativo WhatsApp (Business, Normal ou Seletor) */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-300">
            Enviar pelo Aplicativo:
          </label>
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded-2xl">
            <button
              type="button"
              onClick={() => setTargetApp('business')}
              className={`py-2 px-2 rounded-xl text-[11px] font-extrabold transition-all flex flex-col items-center justify-center gap-1 ${
                targetApp === 'business'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Whats Business</span>
            </button>

            <button
              type="button"
              onClick={() => setTargetApp('seletor')}
              className={`py-2 px-2 rounded-xl text-[11px] font-extrabold transition-all flex flex-col items-center justify-center gap-1 ${
                targetApp === 'seletor'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Perguntar Celular</span>
            </button>

            <button
              type="button"
              onClick={() => setTargetApp('normal')}
              className={`py-2 px-2 rounded-xl text-[11px] font-extrabold transition-all flex flex-col items-center justify-center gap-1 ${
                targetApp === 'normal'
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-900/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Whats Normal</span>
            </button>
          </div>
        </div>

        {/* Telefone do Cliente & Aviso */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              Número do WhatsApp (Opcional)
            </span>
            <span className="text-[10px] text-slate-500 font-bold">
              {phoneInput.trim() ? '✓ Envio Direto para o Cliente' : '⚡ Abrir Lista de Contatos'}
            </span>
          </label>

          <input
            type="text"
            value={phoneInput}
            onChange={(e) => setPhoneInput(e.target.value)}
            placeholder="Digite o número com DDD ou deixe em branco para escolher o contato no Whats"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:border-emerald-500 font-bold"
          />

          {!phoneInput.trim() ? (
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[11px] text-emerald-300 flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Sem número cadastrado: O WhatsApp abrirá a sua lista de contatos para você escolher quem vai receber!</span>
            </div>
          ) : (
            <div className="p-2 bg-slate-950 border border-slate-800 rounded-xl text-[10px] text-slate-400">
              📲 Abrirá a conversa <strong>diretamente no WhatsApp de {cobranca.clienteNome}</strong> ({phoneInput}).
            </div>
          )}
        </div>

        {/* Template Picker */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Escolher Modelo de Mensagem:
          </label>
          <div className="grid grid-cols-2 gap-2">
            {templatesList.map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelectedTemplate(t.id)}
                className={`p-2.5 rounded-xl text-left border transition-all ${
                  selectedTemplate === t.id 
                    ? 'bg-emerald-600/20 border-emerald-500/50 text-emerald-300 shadow-md' 
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <p className="text-xs font-bold">{t.label}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">{t.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Card Chave PIX Rápida */}
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-between gap-2 shadow-inner">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-extrabold text-emerald-400 flex items-center gap-1.5 truncate">
              <span>📱 Chave PIX:</span>
              <code className="px-2 py-0.5 rounded bg-slate-950 text-emerald-300 font-mono text-[11px] border border-emerald-500/30 truncate">
                {rawPixKey}
              </code>
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">
              💡 <strong>Dica:</strong> Cole no Whats como 2ª mensagem para gerar o cartão verde <strong>"Copiar chave Pix"</strong>!
            </p>
          </div>

          <button
            type="button"
            onClick={handleCopyPixKeyOnly}
            className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md shadow-emerald-900/40 flex items-center gap-1.5 shrink-0 active:scale-95 transition-all cursor-pointer"
          >
            {copiedPix ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedPix ? 'Copiada!' : 'Copiar PIX'}</span>
          </button>
        </div>

        {/* Text Area / Preview */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-slate-300">
              Prévia da Mensagem (Editável)
            </label>
            <button
              onClick={handleCopyText}
              className="text-[11px] font-medium text-slate-400 hover:text-indigo-300 flex items-center gap-1"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copiado!' : 'Copiar Texto'}
            </button>
          </div>
          <textarea
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            rows={5}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 font-sans leading-relaxed focus:border-emerald-500 focus:outline-none"
          />
        </div>

        {/* Botão Principal de Disparo */}
        <div className="pt-1 flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
          >
            Voltar
          </button>

          <button
            type="button"
            onClick={() => handleSendWhatsApp(targetApp)}
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-extrabold shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <Send className="w-4 h-4 fill-white/20" />
            <span>
              {targetApp === 'business' ? 'Abrir no Whats Business' : targetApp === 'normal' ? 'Abrir no Whats Normal' : 'Abrir Seletor do Celular'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
