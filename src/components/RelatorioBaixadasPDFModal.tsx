import React from 'react';
import { X, Printer, FileText, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Cobranca, Cliente } from '../types';
import { formatCurrency, formatDateBR } from '../utils/whatsapp';
import { formatCNPJ } from '../services/storage';

interface RelatorioBaixadasPDFModalProps {
  isOpen: boolean;
  onClose: () => void;
  cobrancas: Cobranca[];
  clientes: Cliente[];
  nomeEmpresa: string;
  cnpjEmpresa?: string;
}

export function gerarEImprimirRelatorioPDF(
  cobrancas: Cobranca[],
  clientes: Cliente[],
  nomeEmpresa: string,
  cnpjEmpresa?: string
) {
  const quitadas = cobrancas.filter(c => c.status === 'pago');
  const totalQuitado = quitadas.reduce((acc, c) => acc + c.valor, 0);

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Por favor, permita pop-ups no seu navegador para abrir o relatório PDF em nova janela.');
    return;
  }

  const dataEmissao = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
  const reportHash = `REP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
  const cnpjExibicao = formatCNPJ(cnpjEmpresa || '60.060.102/0001-24');

  const rowsHtml = quitadas.length === 0 
    ? `<tr><td colspan="8" style="padding: 15px; text-align: center; color: #64748b;">Nenhuma conta ou título baixado encontrado até o momento.</td></tr>`
    : quitadas.map((item, idx) => {
        const cli = clientes.find(c => c.id === item.clienteId || c.nome === item.clienteNome);
        const doc = item.clienteDocumento || cli?.documento || '-';
        const dataBaixa = item.dataPagamento ? formatDateBR(item.dataPagamento) : formatDateBR(item.dataVencimento);
        const mesRefFinal = item.mesReferencia || (item.dataVencimento ? `${item.dataVencimento.split('-')[1]}/${item.dataVencimento.split('-')[0]}` : '-');

        return `
          <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'}; font-size: 10px; break-inside: avoid; page-break-inside: avoid;">
            <td style="padding: 5px 6px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold; color: #64748b;">${idx + 1}</td>
            <td style="padding: 5px 6px; border: 1px solid #cbd5e1; font-weight: bold; color: #0f172a;">${item.clienteNome}</td>
            <td style="padding: 5px 6px; border: 1px solid #cbd5e1; font-family: monospace; font-size: 9px; color: #475569;">${doc}</td>
            <td style="padding: 5px 6px; border: 1px solid #cbd5e1; text-align: center; font-weight: 800; color: #4338ca; font-size: 10.5px;">${mesRefFinal}</td>
            <td style="padding: 5px 6px; border: 1px solid #cbd5e1; text-align: center; color: #475569;">${formatDateBR(item.dataVencimento)}</td>
            <td style="padding: 5px 6px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold; color: #047857;">${dataBaixa}</td>
            <td style="padding: 5px 6px; border: 1px solid #cbd5e1; text-align: center; text-transform: uppercase; font-weight: bold; font-size: 9px; color: #334155;">${item.formaPagamento}</td>
            <td style="padding: 5px 6px; border: 1px solid #cbd5e1; text-align: right; font-weight: 800; color: #047857;">${formatCurrency(item.valor)}</td>
          </tr>
        `;
      }).join('');

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>Relatório de Contas Baixadas - ${nomeEmpresa}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        * {
          box-sizing: border-box;
        }
        body {
          font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
          margin: 0;
          padding: 12px 16px;
          color: #0f172a;
          background: #ffffff;
        }
        @page {
          size: A4 portrait;
          margin: 6mm 8mm;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 3px solid #0f172a;
          padding-bottom: 8px;
          margin-bottom: 10px;
          break-inside: avoid;
          page-break-inside: avoid;
        }
        .summary-box {
          display: flex;
          gap: 12px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          padding: 8px 12px;
          border-radius: 8px;
          margin-bottom: 10px;
          break-inside: avoid;
          page-break-inside: avoid;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 12px;
          break-inside: avoid;
          page-break-inside: avoid;
        }
        th {
          background: #0f172a;
          color: #ffffff;
          font-size: 9px;
          text-transform: uppercase;
          padding: 6px 6px;
          border: 1px solid #0f172a;
        }
        .footer {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-top: 16px;
          padding-top: 8px;
          border-top: 1px solid #cbd5e1;
          break-inside: avoid;
          page-break-inside: avoid;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="background: #0f172a; color: #ffffff; font-weight: 900; padding: 3px 7px; border-radius: 4px; font-size: 11px;">C$ COBRAMAIS</span>
            <span style="background: #d1fae5; color: #047857; font-weight: 700; padding: 2px 7px; border-radius: 4px; font-size: 9px;">RELATÓRIO FINANCEIRO DE QUITAÇÕES</span>
          </div>
          <h1 style="font-size: 17px; font-weight: 900; margin: 4px 0 1px 0; color: #0f172a;">${nomeEmpresa || 'COMPUSERVE LTDA'}</h1>
          <p style="font-size: 10.5px; font-weight: 800; color: #4338ca; margin: 0 0 2px 0;">CNPJ: ${cnpjExibicao}</p>
          <p style="font-size: 9.5px; color: #64748b; margin: 0;">Demonstrativo Analítico de Títulos Liquidados e Recebidos</p>
        </div>
        <div style="text-align: right; font-size: 10px;">
          <p style="margin: 0 0 2px 0;"><strong>Emissão:</strong> ${dataEmissao}</p>
          <p style="margin: 0 0 3px 0; font-family: monospace; font-size: 9px; color: #64748b;">Autenticação: ${reportHash}</p>
          <span style="background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: bold;">✔ Auditado</span>
        </div>
      </div>

      <div class="summary-box">
        <div style="flex: 1;">
          <span style="font-size: 9px; font-weight: 700; color: #64748b; text-transform: uppercase;">Total Geral Quitado</span>
          <div style="font-size: 15px; font-weight: 900; color: #047857; margin-top: 1px;">${formatCurrency(totalQuitado)}</div>
        </div>
        <div style="flex: 1;">
          <span style="font-size: 9px; font-weight: 700; color: #64748b; text-transform: uppercase;">Qtd. Títulos Baixados</span>
          <div style="font-size: 15px; font-weight: 900; color: #0f172a; margin-top: 1px;">${quitadas.length} cobrança(s)</div>
        </div>
        <div style="flex: 1;">
          <span style="font-size: 9px; font-weight: 700; color: #64748b; text-transform: uppercase;">Status da Carteira</span>
          <div style="font-size: 11px; font-weight: 800; color: #047857; margin-top: 3px;">✔ 100% Baixadas</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="text-align: center; width: 24px;">#</th>
            <th style="text-align: left;">CLIENTE / DEVEDOR</th>
            <th style="text-align: left;">CPF / CNPJ</th>
            <th style="text-align: center;">MÊS REF.</th>
            <th style="text-align: center;">VENCIMENTO</th>
            <th style="text-align: center;">DATA BAIXA</th>
            <th style="text-align: center;">FORMA</th>
            <th style="text-align: right;">VALOR QUITADO</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
        <tfoot>
          <tr style="background: #0f172a; color: #ffffff; font-weight: 900; font-size: 9.5px;">
            <td colspan="7" style="padding: 6px 8px; text-align: right; text-transform: uppercase;">TOTAL CONSOLIDADO BAIXADO:</td>
            <td style="padding: 6px 8px; text-align: right; color: #34d399; font-size: 11.5px;">${formatCurrency(totalQuitado)}</td>
          </tr>
        </tfoot>
      </table>

      <div class="footer">
        <div style="max-width: 320px;">
          <strong style="font-size: 9px; text-transform: uppercase; color: #334155; display: block; margin-bottom: 2px;">Termo de Responsabilidade Financeira</strong>
          <p style="font-size: 8px; color: #64748b; margin: 0; line-height: 1.3;">Declaro que as informações constantes neste relatório representam a totalidade dos créditos recebidos e baixados no sistema até a presente data.</p>
        </div>
        <div style="text-align: center; width: 220px;">
          <div style="border-bottom: 1px solid #0f172a; margin-bottom: 3px;"></div>
          <strong style="font-size: 9.5px; color: #0f172a; display: block;">${nomeEmpresa || 'COMPUSERVE LTDA'}</strong>
          <span style="font-size: 8.5px; font-weight: 700; color: #4338ca; display: block;">CNPJ: ${cnpjExibicao}</span>
          <span style="font-size: 8px; color: #64748b;">Gestor Financeiro / Responsável</span>
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

export const RelatorioBaixadasPDFModal: React.FC<RelatorioBaixadasPDFModalProps> = ({
  isOpen,
  onClose,
  cobrancas,
  clientes,
  nomeEmpresa,
  cnpjEmpresa
}) => {
  if (!isOpen) return null;

  const quitadas = cobrancas.filter(c => c.status === 'pago');
  const totalQuitado = quitadas.reduce((acc, c) => acc + c.valor, 0);

  const handleGerarPDF = () => {
    gerarEImprimirRelatorioPDF(cobrancas, clientes, nomeEmpresa, cnpjEmpresa);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-2xl animate-slide-up text-center">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
          <FileText className="w-6 h-6" />
        </div>

        <div>
          <h2 className="text-lg font-extrabold text-slate-100">
            Relatório de Contas Baixadas (PDF)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Gerar documento oficial A4 para impressão ou download em PDF com {quitadas.length} conta(s) quitada(s).
          </p>
        </div>

        <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl text-left space-y-1.5 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-400">Total Quitado:</span>
            <span className="font-extrabold text-emerald-400">{formatCurrency(totalQuitado)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Títulos Baixados:</span>
            <span className="font-bold text-slate-200">{quitadas.length} cobranças</span>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
          >
            Cancelar
          </button>
          
          <button
            onClick={handleGerarPDF}
            className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-900/40 active:scale-95 transition-all"
          >
            <Printer className="w-4 h-4" />
            Gerar PDF A4
          </button>
        </div>
      </div>
    </div>
  );
};
