import React, { useEffect } from 'react';
import { X, CheckCircle2, Printer, ShieldCheck, MessageSquare, Building2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Cobranca, Cliente } from '../types';
import { formatCurrency, formatDateBR, openWhatsApp, generateWhatsAppMessage } from '../utils/whatsapp';
import { formatCNPJ } from '../services/storage';

interface ReciboModalProps {
  isOpen: boolean;
  onClose: () => void;
  cobranca: Cobranca | null;
  clientes?: Cliente[];
  nomeEmpresa: string;
  cnpjEmpresa?: string;
  triggerConfetti?: boolean;
}

export function imprimirReciboDocumento(
  cobranca: Cobranca,
  documentoCliente: string | null,
  nomeEmpresa: string,
  cnpjEmpresa?: string
) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Por favor, permita pop-ups no seu navegador para emitir o recibo em PDF.');
    return;
  }

  const dataPagamento = cobranca.dataPagamento ? formatDateBR(cobranca.dataPagamento) : formatDateBR(new Date().toISOString().split('T')[0]);
  const docText = documentoCliente ? `(CPF/CNPJ: ${documentoCliente})` : '';

  let phoneClean = cobranca.clienteTelefone || '';
  if (phoneClean.includes(',') || phoneClean.includes('R$')) {
    phoneClean = '';
  }

  const mesRefFinal = cobranca.mesReferencia || (cobranca.dataVencimento ? `${cobranca.dataVencimento.split('-')[1]}/${cobranca.dataVencimento.split('-')[0]}` : '');
  const cnpjExibicao = formatCNPJ(cnpjEmpresa || '60.060.102/0001-24');

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>Recibo de Quitação - ${nomeEmpresa}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        body {
          font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
          margin: 0;
          padding: 40px;
          color: #0f172a;
          background: #ffffff;
        }
        @page {
          size: A4 portrait;
          margin: 15mm;
        }
        .header-border {
          border-bottom: 3px solid #0f172a;
          padding-bottom: 16px;
          margin-bottom: 24px;
        }
        .stamp {
          float: right;
          border: 3px solid #047857;
          color: #047857;
          background: #ecfdf5;
          font-weight: 900;
          font-size: 13px;
          padding: 6px 16px;
          border-radius: 8px;
          text-transform: uppercase;
        }
      </style>
    </head>
    <body>
      <div class="stamp">PAGO & QUITADO</div>

      <div class="header-border">
        <span style="font-size: 11px; font-weight: 800; color: #4338ca; text-transform: uppercase; letter-spacing: 1px;">
          Nº #${cobranca.id.slice(0, 10).toUpperCase()}
        </span>
        <h1 style="font-size: 26px; font-weight: 900; margin: 6px 0 2px 0; color: #0f172a; text-transform: uppercase;">
          RECIBO DE QUITAÇÃO
        </h1>
        <h2 style="font-size: 16px; font-weight: 800; color: #334155; margin: 0 0 2px 0;">
          ${nomeEmpresa || 'COMPUSERVE LTDA'}
        </h2>
        <p style="font-size: 12px; font-weight: 800; color: #4338ca; margin: 0 0 6px 0;">
          CNPJ: ${cnpjExibicao}
        </p>
        <p style="font-size: 12px; color: #64748b; margin: 0;">Data da Quitação: <strong>${dataPagamento}</strong></p>
      </div>

      <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 28px;">
        <span style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">Valor Total Quitado</span>
        <div style="font-size: 36px; font-weight: 900; color: #047857; margin-top: 4px;">${formatCurrency(cobranca.valor)}</div>
      </div>

      <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 28px;">
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 12px 0; color: #64748b; font-weight: 600; width: 160px;">Pagador / Cliente:</td>
          <td style="padding: 12px 0; text-align: right; font-weight: 800; color: #0f172a; font-size: 15px;">
            ${cobranca.clienteNome} ${docText ? `<br/><span style="font-size: 12px; color: #4338ca; font-weight: 700;">${docText}</span>` : ''}
          </td>
        </tr>
        ${phoneClean ? `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 12px 0; color: #64748b; font-weight: 600;">Telefone de Contato:</td>
          <td style="padding: 12px 0; text-align: right; font-weight: 700; color: #334155;">${phoneClean}</td>
        </tr>
        ` : ''}
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 12px 0; color: #64748b; font-weight: 600;">Referente a:</td>
          <td style="padding: 12px 0; text-align: right; font-weight: 700; color: #0f172a;">${cobranca.descricao}</td>
        </tr>
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 12px 0; color: #64748b; font-weight: 600;">Mês de Referência:</td>
          <td style="padding: 12px 0; text-align: right; font-weight: 800; color: #4338ca; font-size: 14px;">${mesRefFinal}</td>
        </tr>
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 12px 0; color: #64748b; font-weight: 600;">Forma de Pagamento:</td>
          <td style="padding: 12px 0; text-align: right; font-weight: 800; text-transform: uppercase; color: #047857;">${cobranca.formaPagamento}</td>
        </tr>
      </table>

      <div style="background: #f1f5f9; padding: 18px; border-radius: 12px; border-left: 4px solid #047857; font-size: 13px; line-height: 1.6; color: #334155; font-style: italic; margin-bottom: 40px;">
        "Recebemos de <strong>${cobranca.clienteNome}</strong> ${docText} a quantia de <strong>${formatCurrency(cobranca.valor)}</strong>, referente a <em>${cobranca.descricao}</em> <strong>(Mês de Referência: ${mesRefFinal})</strong>, dando por este recibo a devida e plena quitação."
      </div>

      <div style="display: flex; justify-content: space-between; align-items: flex-end; padding-top: 24px; border-top: 1px solid #cbd5e1;">
        <div style="font-size: 10px; color: #64748b;">
          ✔ Autenticado via CobraMais PWA<br/>
          HASH DE QUITAÇÃO: <span style="font-family: monospace;">${cobranca.id.toUpperCase()}</span>
        </div>
        <div style="text-align: center; width: 240px;">
          <div style="border-bottom: 1px solid #0f172a; margin-bottom: 6px;"></div>
          <strong style="font-size: 12px; color: #0f172a; display: block;">${nomeEmpresa || 'COMPUSERVE LTDA'}</strong>
          <span style="font-size: 10px; color: #64748b;">CNPJ: ${cnpjExibicao}</span>
        </div>
      </div>

      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 300);
        };
      </script>
    </body>
    </html>
  `);
  printWindow.document.close();
}

export function imprimirReciboCupomDocumento(
  cobranca: Cobranca,
  documentoCliente: string | null,
  nomeEmpresa: string,
  cnpjEmpresa?: string
) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Por favor, permita pop-ups no seu navegador para imprimir o recibo em cupom.');
    return;
  }

  const dataPagamento = cobranca.dataPagamento ? formatDateBR(cobranca.dataPagamento) : formatDateBR(new Date().toISOString().split('T')[0]);
  const docText = documentoCliente ? `(CPF/CNPJ: ${documentoCliente})` : '';

  let phoneClean = cobranca.clienteTelefone || '';
  if (phoneClean.includes(',') || phoneClean.includes('R$')) {
    phoneClean = '';
  }

  const mesRefFinal = cobranca.mesReferencia || (cobranca.dataVencimento ? `${cobranca.dataVencimento.split('-')[1]}/${cobranca.dataVencimento.split('-')[0]}` : '');
  const cnpjExibicao = formatCNPJ(cnpjEmpresa || '60.060.102/0001-24');
  const reciboId = cobranca.id.slice(0, 10).toUpperCase();

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>Cupom Recibo 40 Colunas - ${nomeEmpresa}</title>
      <style>
        @page {
          size: 80mm auto;
          margin: 0;
        }
        body {
          font-family: 'Courier New', Courier, monospace;
          width: 72mm;
          margin: 0 auto;
          padding: 8px 4px;
          font-size: 11px;
          color: #000000;
          background: #ffffff;
          line-height: 1.25;
        }
        .text-center { text-align: center; }
        .bold { font-weight: bold; }
        .dashed { border-bottom: 1px dashed #000000; margin: 6px 0; }
        .double-dashed { border-bottom: 2px dashed #000000; margin: 6px 0; }
        .title { font-size: 14px; font-weight: bold; margin: 4px 0; }
        .price { font-size: 16px; font-weight: bold; margin: 6px 0; }
      </style>
    </head>
    <body>
      <div class="text-center">
        <div class="title">${nomeEmpresa || 'COMPUSERVE LTDA'}</div>
        <div>CNPJ: ${cnpjExibicao}</div>
        <div class="double-dashed"></div>
        <div class="bold">*** RECIBO DE QUITAÇÃO ***</div>
        <div>RECIBO Nº #${reciboId}</div>
        <div>Data Pagto: ${dataPagamento}</div>
        <div class="dashed"></div>
      </div>

      <div><strong>PAGADOR:</strong> ${cobranca.clienteNome}</div>
      ${docText ? `<div><strong>CPF/CNPJ:</strong> ${docText}</div>` : ''}
      ${phoneClean ? `<div><strong>FONE:</strong> ${phoneClean}</div>` : ''}
      <div class="dashed"></div>
      <div><strong>REF:</strong> ${cobranca.descricao}</div>
      <div><strong>MÊS REF:</strong> ${mesRefFinal}</div>
      <div><strong>FORMA PGTO:</strong> ${cobranca.formaPagamento.toUpperCase()}</div>
      <div class="dashed"></div>
      
      <div class="text-center">
        <div>VALOR TOTAL QUITADO</div>
        <div class="price">${formatCurrency(cobranca.valor)}</div>
        <div class="dashed"></div>
      </div>

      <div style="font-size: 9.5px; text-align: justify; margin: 6px 0; line-height: 1.2;">
        Declaramos ter recebido a quantia acima discriminada, dando por este termo a devida e plena quitação.
      </div>
      
      <div class="dashed"></div>
      <div class="text-center" style="margin-top: 18px;">
        <div>___________________________________</div>
        <div style="font-size: 9.5px; font-weight: bold; margin-top: 2px;">${nomeEmpresa || 'COMPUSERVE LTDA'}</div>
        <div style="font-size: 8.5px;">CNPJ: ${cnpjExibicao}</div>
      </div>

      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 300);
        };
      </script>
    </body>
    </html>
  `);
  printWindow.document.close();
}

export const ReciboModal: React.FC<ReciboModalProps> = ({
  isOpen,
  onClose,
  cobranca,
  clientes = [],
  nomeEmpresa,
  cnpjEmpresa,
  triggerConfetti = false
}) => {
  useEffect(() => {
    if (isOpen && triggerConfetti) {
      confetti({
        particleCount: 90,
        spread: 80,
        origin: { y: 0.55 }
      });
    }
  }, [isOpen, triggerConfetti]);

  if (!isOpen || !cobranca) return null;

const clienteEncontrado = clientes.find(c => c.id === cobranca.clienteId || c.nome.toLowerCase() === cobranca.clienteNome.toLowerCase());
  const documentoCliente = cobranca.clienteDocumento || clienteEncontrado?.documento || null;
  const dataPagamento = cobranca.dataPagamento ? formatDateBR(cobranca.dataPagamento) : formatDateBR(new Date().toISOString().split('T')[0]);

  const mesRefFinal = cobranca.mesReferencia || (cobranca.dataVencimento ? `${cobranca.dataVencimento.split('-')[1]}/${cobranca.dataVencimento.split('-')[0]}` : '');
  const cnpjExibicao = formatCNPJ(cnpjEmpresa || '60.060.102/0001-24');

  const handlePrint = () => {
    imprimirReciboDocumento(cobranca, documentoCliente, nomeEmpresa, cnpjEmpresa);
  };

  const handlePrintCupom = () => {
    imprimirReciboCupomDocumento(cobranca, documentoCliente, nomeEmpresa, cnpjEmpresa);
  };

  const handleShareWhatsApp = (target: 'seletor' | 'business' | 'normal' = 'seletor') => {
    const cobrancaComDoc = { ...cobranca, clienteDocumento: documentoCliente || undefined, mesReferencia: mesRefFinal };
    const msg = generateWhatsAppMessage(cobrancaComDoc, 'recibo', nomeEmpresa, undefined, cnpjEmpresa);
    openWhatsApp(cobranca.clienteTelefone, msg, target);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl p-5 space-y-4 shadow-2xl animate-slide-up">
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-extrabold text-slate-100">
              RECIBO DE QUITAÇÃO
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Visual Document (Estilo Comprovante Oficial) */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4 relative overflow-hidden">
          {/* Carimbo Visual de Quitação */}
          <div className="absolute -right-3 top-3 rotate-12 bg-emerald-500/10 border-2 border-emerald-500 text-emerald-400 text-[11px] font-black px-3 py-1 rounded-md uppercase tracking-widest pointer-events-none">
            PAGO & QUITADO
          </div>

          {/* Cabeçalho do Recibo */}
          <div className="border-b border-slate-800/80 pb-4 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-400">
                RECIBO DE QUITAÇÃO Nº #{cobranca.id.slice(0, 10).toUpperCase()}
              </span>
              <span className="text-[10px] text-slate-500">
                Data: {dataPagamento}
              </span>
            </div>
            
            <h3 className="text-lg font-extrabold text-slate-100 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-slate-400" />
              {nomeEmpresa}
            </h3>
            <p className="text-xs font-bold text-indigo-300 pl-6">
              CNPJ: {cnpjExibicao}
            </p>
          </div>

          {/* Valor Principal em Destaque */}
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3.5 text-center space-y-0.5">
            <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">Valor Total Quitado</span>
            <div className="text-2xl font-black text-emerald-400">
              {formatCurrency(cobranca.valor)}
            </div>
          </div>

          {/* Dados do Cliente e Cobranca */}
          <div className="space-y-2 text-xs divide-y divide-slate-800/60">
            <div className="flex justify-between pt-1">
              <span className="text-slate-500 font-medium">Pagador:</span>
              <span className="text-slate-100 font-bold text-right">
                {cobranca.clienteNome}
                {documentoCliente && (
                  <span className="block text-[10px] text-indigo-300 font-semibold">
                    ({documentoCliente})
                  </span>
                )}
              </span>
            </div>

            <div className="flex justify-between pt-2">
              <span className="text-slate-500 font-medium">Referente a:</span>
              <span className="text-slate-200 font-bold text-right max-w-[220px] truncate">{cobranca.descricao}</span>
            </div>

            <div className="flex justify-between pt-2">
              <span className="text-slate-500 font-medium">Mês de Referência:</span>
              <span className="text-indigo-400 font-extrabold">{mesRefFinal}</span>
            </div>

            <div className="flex justify-between pt-2">
              <span className="text-slate-500 font-medium">Forma de Pagamento:</span>
              <span className="text-slate-200 uppercase font-bold">{cobranca.formaPagamento}</span>
            </div>

            {cobranca.categoria && (
              <div className="flex justify-between pt-2">
                <span className="text-slate-500 font-medium">Categoria:</span>
                <span className="text-slate-400">{cobranca.categoria}</span>
              </div>
            )}
          </div>

          {/* Declaração Formal de Quitação */}
          <p className="text-[11px] text-slate-400 leading-relaxed text-justify italic bg-slate-900/40 p-2.5 rounded-xl border border-slate-800/50">
            "Declaramos ter recebido de <strong>{cobranca.clienteNome}</strong>{documentoCliente ? ` (CPF/CNPJ: ${documentoCliente})` : ''} a quantia de <strong>{formatCurrency(cobranca.valor)}</strong>, referente a <em>{cobranca.descricao}</em> <strong>(Mês de Referência: {mesRefFinal})</strong>, dando por este recibo a devida e plena quitação."
          </p>

          {/* Autenticação Digital */}
          <div className="pt-2 flex items-center justify-between text-[10px] text-slate-500">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Autenticado via CobraMais PWA
            </span>
            <span className="font-mono text-[9px] text-slate-600">
              HASH: {cobranca.id.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Botões de Ação de Impressão (PDF A4, Cupom 40 Colunas, Whats) */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={handlePrint}
            className="py-3 px-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold shadow-lg shadow-indigo-900/40 flex items-center justify-center gap-1 active:scale-95 transition-all"
            title="Imprimir Recibo de Quitação em Folha Inteira A4 (80 Colunas)"
          >
            <Printer className="w-4 h-4" />
            <span>PDF A4 (80 Col)</span>
          </button>

          <button
            onClick={handlePrintCupom}
            className="py-3 px-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-extrabold shadow-lg shadow-purple-900/40 flex items-center justify-center gap-1 active:scale-95 transition-all"
            title="Imprimir Recibo em Cupom Térmico (40 Colunas / 58-80mm)"
          >
            <Printer className="w-4 h-4" />
            <span>Cupom (40 Col)</span>
          </button>

          <button
            onClick={() => handleShareWhatsApp('seletor')}
            className="py-3 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold shadow-lg shadow-emerald-900/40 flex items-center justify-center gap-1 active:scale-95 transition-all"
          >
            <MessageSquare className="w-4 h-4" />
            <span>WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  );
};
