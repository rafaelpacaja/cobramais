import React, { useState, useEffect } from 'react';
import { X, Receipt, Printer, MessageSquare, User, Calendar, DollarSign, CreditCard, Building2, Smartphone, FileText } from 'lucide-react';
import { Cliente, FormaPagamento } from '../types';
import { formatCurrency, formatDateBR, openWhatsApp, TipoWhatsAppTarget } from '../utils/whatsapp';
import { formatCNPJ } from '../services/storage';

interface ReciboAvulsoModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientes: Cliente[];
  nomeEmpresa: string;
  cnpjEmpresa?: string;
}

export function imprimirReciboA4Avulso(
  clienteNome: string,
  documentoCliente: string,
  clienteTelefone: string,
  descricao: string,
  mesReferencia: string,
  valor: number,
  dataPagamento: string,
  formaPagamento: string,
  nomeEmpresa: string,
  cnpjEmpresa?: string
) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Por favor, permita pop-ups no seu navegador para imprimir o recibo em A4.');
    return;
  }

  const reciboId = `AV-${Date.now().toString(36).toUpperCase().slice(-6)}`;
  const dataPagtoBR = formatDateBR(dataPagamento);
  const docText = documentoCliente ? `(CPF/CNPJ: ${documentoCliente})` : '';
  const cnpjExibicao = formatCNPJ(cnpjEmpresa || '60.060.102/0001-24');

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>Recibo Avulso A4 - ${nomeEmpresa}</title>
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
          Nº #${reciboId} (RECIBO AVULSO)
        </span>
        <h1 style="font-size: 24px; font-weight: 900; margin: 6px 0 2px 0; color: #0f172a; text-transform: uppercase;">
          RECIBO DE QUITAÇÃO
        </h1>
        <h2 style="font-size: 16px; font-weight: 800; color: #334155; margin: 0 0 2px 0;">
          ${nomeEmpresa || 'COMPUSERVE LTDA'}
        </h2>
        <p style="font-size: 12px; font-weight: 800; color: #4338ca; margin: 0 0 6px 0;">
          CNPJ: ${cnpjExibicao}
        </p>
        <p style="font-size: 12px; color: #64748b; margin: 0;">Data da Quitação: <strong>${dataPagtoBR}</strong></p>
      </div>

      <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 28px;">
        <span style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">Valor Total Quitado</span>
        <div style="font-size: 36px; font-weight: 900; color: #047857; margin-top: 4px;">${formatCurrency(valor)}</div>
      </div>

      <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 28px;">
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 12px 0; color: #64748b; font-weight: 600; width: 160px;">Pagador / Cliente:</td>
          <td style="padding: 12px 0; text-align: right; font-weight: 800; color: #0f172a; font-size: 15px;">
            ${clienteNome} ${docText ? `<br/><span style="font-size: 12px; color: #4338ca; font-weight: 700;">${docText}</span>` : ''}
          </td>
        </tr>
        ${clienteTelefone ? `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 12px 0; color: #64748b; font-weight: 600;">Telefone de Contato:</td>
          <td style="padding: 12px 0; text-align: right; font-weight: 700; color: #334155;">${clienteTelefone}</td>
        </tr>
        ` : ''}
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 12px 0; color: #64748b; font-weight: 600;">Referente a:</td>
          <td style="padding: 12px 0; text-align: right; font-weight: 700; color: #0f172a;">${descricao}</td>
        </tr>
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 12px 0; color: #64748b; font-weight: 600;">Mês de Referência:</td>
          <td style="padding: 12px 0; text-align: right; font-weight: 800; color: #4338ca; font-size: 14px;">${mesReferencia}</td>
        </tr>
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 12px 0; color: #64748b; font-weight: 600;">Forma de Pagamento:</td>
          <td style="padding: 12px 0; text-align: right; font-weight: 800; text-transform: uppercase; color: #047857;">${formaPagamento}</td>
        </tr>
      </table>

      <div style="background: #f1f5f9; padding: 18px; border-radius: 12px; border-left: 4px solid #047857; font-size: 13px; line-height: 1.6; color: #334155; font-style: italic; margin-bottom: 40px;">
        "Recebemos de <strong>${clienteNome}</strong> ${docText} a quantia de <strong>${formatCurrency(valor)}</strong>, referente a <em>${descricao}</em> <strong>(Mês de Referência: ${mesReferencia})</strong>, dando por este recibo a devida e plena quitação."
      </div>

      <div style="display: flex; justify-content: space-between; align-items: flex-end; padding-top: 24px; border-top: 1px solid #cbd5e1;">
        <div style="font-size: 10px; color: #64748b;">
          ✔ Autenticado via CobraMais PWA (Recibo Avulso)<br/>
          HASH DE QUITAÇÃO: <span style="font-family: monospace;">${reciboId}</span>
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

export function imprimirReciboCupomAvulso(
  clienteNome: string,
  documentoCliente: string,
  clienteTelefone: string,
  descricao: string,
  mesReferencia: string,
  valor: number,
  dataPagamento: string,
  formaPagamento: string,
  nomeEmpresa: string,
  cnpjEmpresa?: string
) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Por favor, permita pop-ups no seu navegador para imprimir o cupom térmico.');
    return;
  }

  const reciboId = `AV-${Date.now().toString(36).toUpperCase().slice(-6)}`;
  const dataPagtoBR = formatDateBR(dataPagamento);
  const cnpjExibicao = formatCNPJ(cnpjEmpresa || '60.060.102/0001-24');

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
        .text-right { text-align: right; }
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
        <div>Data Pagto: ${dataPagtoBR}</div>
        <div class="dashed"></div>
      </div>

      <div><strong>PAGADOR:</strong> ${clienteNome}</div>
      ${documentoCliente ? `<div><strong>CPF/CNPJ:</strong> ${documentoCliente}</div>` : ''}
      ${clienteTelefone ? `<div><strong>FONE:</strong> ${clienteTelefone}</div>` : ''}
      <div class="dashed"></div>
      <div><strong>REF:</strong> ${descricao}</div>
      <div><strong>MÊS REF:</strong> ${mesReferencia}</div>
      <div><strong>FORMA PGTO:</strong> ${formaPagamento.toUpperCase()}</div>
      <div class="dashed"></div>
      
      <div class="text-center">
        <div>VALOR TOTAL QUITADO</div>
        <div class="price">${formatCurrency(valor)}</div>
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

export const ReciboAvulsoModal: React.FC<ReciboAvulsoModalProps> = ({
  isOpen,
  onClose,
  clientes,
  nomeEmpresa,
  cnpjEmpresa
}) => {
  if (!isOpen) return null;

  const now = new Date();
  const currentMesRef = `${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
  const todayIso = now.toISOString().split('T')[0];

  const [selectedClienteId, setSelectedClienteId] = useState<string>('');
  const [clienteNome, setClienteNome] = useState<string>('');
  const [clienteDocumento, setClienteDocumento] = useState<string>('');
  const [clienteTelefone, setClienteTelefone] = useState<string>('');
  const [descricao, setDescricao] = useState<string>('Mensalidade do Sistema Compuserve');
  const [mesReferencia, setMesReferencia] = useState<string>(currentMesRef);
  const [valorStr, setValorStr] = useState<string>('300,00');
  const [dataPagamento, setDataPagamento] = useState<string>(todayIso);
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento>('pix');
  const [targetApp, setTargetApp] = useState<TipoWhatsAppTarget>('business');

  // Ao selecionar um cliente da lista cadastrada, auto-preenche dados
  const handleSelectClienteChange = (id: string) => {
    setSelectedClienteId(id);
    if (!id) {
      setClienteNome('');
      setClienteDocumento('');
      setClienteTelefone('');
      return;
    }

    const found = clientes.find(c => c.id === id);
    if (found) {
      setClienteNome(found.nome.replace(/\s*\([^)]*\)/g, '').trim());
      setClienteDocumento(found.documento || '');
      setClienteTelefone(found.telefone || '');
    }
  };

  const valorNum = parseFloat(valorStr.replace('R$', '').replace(/\./g, '').replace(',', '.').trim()) || 0;

  const handlePrintA4 = () => {
    if (!clienteNome.trim()) {
      alert('Por favor, informe o nome do cliente pagador.');
      return;
    }
    if (valorNum <= 0) {
      alert('Por favor, informe um valor válido para o recibo.');
      return;
    }
    imprimirReciboA4Avulso(
      clienteNome.trim(), clienteDocumento.trim(), clienteTelefone.trim(),
      descricao.trim(), mesReferencia.trim(), valorNum, dataPagamento,
      formaPagamento, nomeEmpresa, cnpjEmpresa
    );
  };

  const handlePrintCupom = () => {
    if (!clienteNome.trim()) {
      alert('Por favor, informe o nome do cliente pagador.');
      return;
    }
    if (valorNum <= 0) {
      alert('Por favor, informe um valor válido para o recibo.');
      return;
    }
    imprimirReciboCupomAvulso(
      clienteNome.trim(), clienteDocumento.trim(), clienteTelefone.trim(),
      descricao.trim(), mesReferencia.trim(), valorNum, dataPagamento,
      formaPagamento, nomeEmpresa, cnpjEmpresa
    );
  };

  const handleSendWhatsApp = () => {
    if (!clienteNome.trim()) {
      alert('Por favor, informe o nome do cliente pagador.');
      return;
    }
    const cnpjExibicao = formatCNPJ(cnpjEmpresa || '60.060.102/0001-24');
    const dataPagtoBR = formatDateBR(dataPagamento);
    const docText = clienteDocumento ? ` (CPF/CNPJ: ${clienteDocumento})` : '';

    const msg = `🧾 *RECIBO DE QUITAÇÃO AVULSO* 🧾\n━━━━━━━━━━━━━━━━━━━━━\n\n🏢 *EMISSOR:* ${nomeEmpresa || 'COMPUSERVE LTDA'}\n📄 *CNPJ:* ${cnpjExibicao}\n\n👤 *PAGADOR:* ${clienteNome}${docText}\n\n📌 *REFERENTE A:* ${descricao}\n📅 *MÊS DE REFERÊNCIA:* ${mesReferencia}\n💵 *VALOR QUITADO:* *${formatCurrency(valorNum)}*\n🗓️ *DATA DO PAGAMENTO:* ${dataPagtoBR}\n💳 *FORMA DE PAGAMENTO:* ${formaPagamento.toUpperCase()}\n🟢 *STATUS:* *QUITADO INTEGRALMENTE*\n\n━━━━━━━━━━━━━━━━━━━━━\n✍️ *DECLARAÇÃO:* _Declaramos para os devidos fins ter recebido a quantia acima discriminada, dando por este termo a devida e plena quitação._\n\n✨ _Agradecemos a sua preferência!_\n*${nomeEmpresa || 'COMPUSERVE LTDA'}*`;

    openWhatsApp(clienteTelefone, msg, targetApp);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl p-5 space-y-4 shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto">
        
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2 text-emerald-400">
            <Receipt className="w-5 h-5" />
            <div>
              <h2 className="text-base font-extrabold text-slate-100">
                Emitir Recibo Avulso
              </h2>
              <p className="text-xs text-slate-400">
                Sem necessidade de dar baixa em cobranças registradas
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

        {/* Seleção de Cliente Cadastrado (Para não precisar digitar novamente) */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-indigo-300 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-indigo-400" />
            Selecione o Cliente Cadastrado:
          </label>
          <select
            value={selectedClienteId}
            onChange={(e) => handleSelectClienteChange(e.target.value)}
            className="w-full bg-slate-950 border border-indigo-500/40 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-100 focus:border-indigo-500"
          >
            <option value="">-- Escolher Cliente da Lista (ou Digitar Manual) --</option>
            {clientes.map(c => {
              const nomeLimpo = c.nome.replace(/\s*\([^)]*\)/g, '').trim();
              return (
                <option key={c.id} value={c.id}>
                  {nomeLimpo} {c.documento ? `(${c.documento})` : ''}
                </option>
              );
            })}
          </select>
        </div>

        {/* Campos de Dados do Pagador */}
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Nome do Pagador
            </label>
            <input
              type="text"
              value={clienteNome}
              onChange={(e) => setClienteNome(e.target.value)}
              placeholder="Nome completo do cliente"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-100 focus:border-emerald-500"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              CPF / CNPJ (Opcional)
            </label>
            <input
              type="text"
              value={clienteDocumento}
              onChange={(e) => setClienteDocumento(e.target.value)}
              placeholder="000.000.000-00"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-medium text-slate-100 focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Descrição & Telefone */}
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Descrição / Referente a
            </label>
            <input
              type="text"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:border-emerald-500"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Mês de Referência (MM/AAAA)
            </label>
            <input
              type="text"
              value={mesReferencia}
              onChange={(e) => setMesReferencia(e.target.value)}
              placeholder="08/2026"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-indigo-300 focus:border-emerald-500"
              required
            />
          </div>
        </div>

        {/* Valor, Data & Forma de Pagamento */}
        <div className="grid grid-cols-3 gap-2.5">
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Valor (R$)
            </label>
            <input
              type="text"
              value={valorStr}
              onChange={(e) => setValorStr(e.target.value)}
              placeholder="300,00"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-extrabold text-emerald-400 focus:border-emerald-500"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Data Pagto
            </label>
            <input
              type="date"
              value={dataPagamento}
              onChange={(e) => setDataPagamento(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2 py-2 text-[11px] text-slate-100 font-bold"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Forma Pgto
            </label>
            <select
              value={formaPagamento}
              onChange={(e) => setFormaPagamento(e.target.value as FormaPagamento)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2 py-2 text-xs font-bold text-slate-100"
            >
              <option value="pix">PIX</option>
              <option value="boleto">Boleto</option>
              <option value="cartao">Cartão</option>
              <option value="dinheiro">Dinheiro</option>
            </select>
          </div>
        </div>

        {/* Seleção do Whats App Target (se for enviar por Whats) */}
        <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl space-y-1.5 text-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
            Opção para Envio via WhatsApp:
          </span>
          <div className="grid grid-cols-3 gap-1">
            <button
              type="button"
              onClick={() => setTargetApp('business')}
              className={`py-1.5 px-1 rounded-xl text-[10px] font-bold ${
                targetApp === 'business' ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-slate-400'
              }`}
            >
              Whats Business
            </button>
            <button
              type="button"
              onClick={() => setTargetApp('seletor')}
              className={`py-1.5 px-1 rounded-xl text-[10px] font-bold ${
                targetApp === 'seletor' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400'
              }`}
            >
              Perguntar Celular
            </button>
            <button
              type="button"
              onClick={() => setTargetApp('normal')}
              className={`py-1.5 px-1 rounded-xl text-[10px] font-bold ${
                targetApp === 'normal' ? 'bg-teal-600 text-white' : 'bg-slate-900 text-slate-400'
              }`}
            >
              Whats Normal
            </button>
          </div>
        </div>

        {/* Botões de Ação de Impressão (PDF A4, Cupom Térmico 40 Colunas, WhatsApp) */}
        <div className="pt-2 grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={handlePrintA4}
            className="py-3 px-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold shadow-lg shadow-indigo-900/40 flex flex-col items-center justify-center gap-1 active:scale-95 transition-all"
          >
            <FileText className="w-4 h-4" />
            <span>PDF A4 (80 Col)</span>
          </button>

          <button
            type="button"
            onClick={handlePrintCupom}
            className="py-3 px-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-extrabold shadow-lg shadow-purple-900/40 flex flex-col items-center justify-center gap-1 active:scale-95 transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>Cupom (40 Col)</span>
          </button>

          <button
            type="button"
            onClick={handleSendWhatsApp}
            className="py-3 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold shadow-lg shadow-emerald-900/40 flex flex-col items-center justify-center gap-1 active:scale-95 transition-all"
          >
            <MessageSquare className="w-4 h-4" />
            <span>WhatsApp</span>
          </button>
        </div>

      </div>
    </div>
  );
};
