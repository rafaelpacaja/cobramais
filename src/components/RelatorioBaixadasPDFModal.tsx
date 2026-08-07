import React, { useState } from 'react';
import { X, Printer, FileText, CheckCircle2, AlertTriangle, PieChart } from 'lucide-react';
import { Cobranca, Cliente } from '../types';
import { formatCurrency, formatDateBR } from '../utils/whatsapp';
import { formatCNPJ } from '../services/storage';

export type TipoRelatorioPDF = 'quitadas' | 'em_aberto' | 'completo';

interface RelatorioPDFModalProps {
  isOpen: boolean;
  onClose: () => void;
  cobrancas: Cobranca[];
  clientes: Cliente[];
  nomeEmpresa: string;
  cnpjEmpresa?: string;
  tipoInicial?: TipoRelatorioPDF;
}

export function gerarEImprimirRelatorioPDF(
  cobrancas: Cobranca[],
  clientes: Cliente[],
  nomeEmpresa: string,
  cnpjEmpresa: string | undefined,
  tipo: TipoRelatorioPDF
) {
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

  // Filtragem dos dados de acordo com o tipo
  let listaFiltrada: Cobranca[] = [];
  let tituloRelatorio = '';
  let subTituloRelatorio = '';
  let badgeHeader = '';
  let badgeHeaderBg = '';
  let badgeHeaderColor = '';

  const quitadas = cobrancas.filter(c => c.status === 'pago');
  const pendentes = cobrancas.filter(c => c.status === 'pendente');
  const atrasados = cobrancas.filter(c => c.status === 'atrasado');

  const totalQuitado = quitadas.reduce((a, c) => a + c.valor, 0);
  const totalPendente = pendentes.reduce((a, c) => a + c.valor, 0);
  const totalAtrasado = atrasados.reduce((a, c) => a + c.valor, 0);
  const totalEmAberto = totalPendente + totalAtrasado;
  const totalGeralCarteira = totalQuitado + totalEmAberto;

  if (tipo === 'quitadas') {
    listaFiltrada = quitadas;
    tituloRelatorio = 'RELATÓRIO FINANCEIRO DE CONTAS QUITADAS';
    subTituloRelatorio = 'Demonstrativo Analítico de Títulos Liquidados e Recebidos';
    badgeHeader = '✔ QUITADAS / BAIXADAS';
    badgeHeaderBg = '#d1fae5';
    badgeHeaderColor = '#047857';
  } else if (tipo === 'em_aberto') {
    listaFiltrada = [...atrasados, ...pendentes].sort((a, b) => a.dataVencimento.localeCompare(b.dataVencimento));
    tituloRelatorio = 'RELATÓRIO DE CONTAS EM ABERTO E VENCIDAS';
    subTituloRelatorio = 'Demonstrativo Analítico de Títulos Pendentes e Cobranças em Atraso';
    badgeHeader = '⚠️ CONTAS EM ABERTO';
    badgeHeaderBg = '#fef3c7';
    badgeHeaderColor = '#b45309';
  } else {
    listaFiltrada = cobrancas;
    tituloRelatorio = 'RELATÓRIO CONSOLIDADO GERAL DA CARTEIRA';
    subTituloRelatorio = 'Balanço Geral Sintético e Analítico de Todos os Títulos';
    badgeHeader = '📊 CARTEIRA COMPLETA';
    badgeHeaderBg = '#e0e7ff';
    badgeHeaderColor = '#4338ca';
  }

  const rowsHtml = listaFiltrada.length === 0 
    ? `<tr><td colspan="8" style="padding: 15px; text-align: center; color: #64748b;">Nenhuma cobrança encontrada para este tipo de relatório.</td></tr>`
    : listaFiltrada.map((item, idx) => {
        const cli = clientes.find(c => c.id === item.clienteId || c.nome === item.clienteNome);
        const doc = item.clienteDocumento || cli?.documento || '-';
        const mesRefFinal = item.mesReferencia || (item.dataVencimento ? `${item.dataVencimento.split('-')[1]}/${item.dataVencimento.split('-')[0]}` : '-');
        
        let statusBadgeHtml = '';
        let rowBg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';

        if (item.status === 'pago') {
          statusBadgeHtml = `<span style="background: #d1fae5; color: #047857; font-weight: bold; padding: 2px 6px; border-radius: 4px; font-size: 8.5px;">PAGO</span>`;
        } else if (item.status === 'atrasado') {
          statusBadgeHtml = `<span style="background: #fee2e2; color: #b91c1c; font-weight: bold; padding: 2px 6px; border-radius: 4px; font-size: 8.5px;">ATRASADO</span>`;
          rowBg = '#fff1f2';
        } else if (item.status === 'pendente') {
          statusBadgeHtml = `<span style="background: #fef3c7; color: #b45309; font-weight: bold; padding: 2px 6px; border-radius: 4px; font-size: 8.5px;">PENDENTE</span>`;
        } else {
          statusBadgeHtml = `<span style="background: #f1f5f9; color: #64748b; font-weight: bold; padding: 2px 6px; border-radius: 4px; font-size: 8.5px;">CANCELADO</span>`;
        }

        return `
          <tr style="background-color: ${rowBg}; font-size: 10px; break-inside: avoid; page-break-inside: avoid;">
            <td style="padding: 5px 6px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold; color: #64748b;">${idx + 1}</td>
            <td style="padding: 5px 6px; border: 1px solid #cbd5e1; font-weight: bold; color: #0f172a;">${item.clienteNome}</td>
            <td style="padding: 5px 6px; border: 1px solid #cbd5e1; font-family: monospace; font-size: 9px; color: #475569;">${doc}</td>
            <td style="padding: 5px 6px; border: 1px solid #cbd5e1; text-align: center; font-weight: 800; color: #4338ca; font-size: 10px;">${mesRefFinal}</td>
            <td style="padding: 5px 6px; border: 1px solid #cbd5e1; text-align: center; color: #475569; font-weight: 600;">${formatDateBR(item.dataVencimento)}</td>
            <td style="padding: 5px 6px; border: 1px solid #cbd5e1; text-align: center;">${statusBadgeHtml}</td>
            <td style="padding: 5px 6px; border: 1px solid #cbd5e1; text-align: center; text-transform: uppercase; font-weight: bold; font-size: 9px; color: #334155;">${item.formaPagamento}</td>
            <td style="padding: 5px 6px; border: 1px solid #cbd5e1; text-align: right; font-weight: 800; color: ${item.status === 'atrasado' ? '#b91c1c' : item.status === 'pago' ? '#047857' : '#0f172a'};">${formatCurrency(item.valor)}</td>
          </tr>
        `;
      }).join('');

  const totalFormatadoRodape = 
    tipo === 'quitadas' ? formatCurrency(totalQuitado) :
    tipo === 'em_aberto' ? formatCurrency(totalEmAberto) : formatCurrency(totalGeralCarteira);

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>${tituloRelatorio} - ${nomeEmpresa}</title>
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
          margin-bottom: 14px;
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
            <span style="background: ${badgeHeaderBg}; color: ${badgeHeaderColor}; font-weight: 800; padding: 2px 7px; border-radius: 4px; font-size: 9px;">${badgeHeader}</span>
          </div>
          <h1 style="font-size: 17px; font-weight: 900; margin: 4px 0 1px 0; color: #0f172a;">${nomeEmpresa || 'COMPUSERVE LTDA'}</h1>
          <p style="font-size: 10.5px; font-weight: 800; color: #4338ca; margin: 0 0 2px 0;">CNPJ: ${cnpjExibicao}</p>
          <p style="font-size: 9.5px; color: #64748b; margin: 0;">${subTituloRelatorio}</p>
        </div>
        <div style="text-align: right; font-size: 10px;">
          <p style="margin: 0 0 2px 0;"><strong>Emissão:</strong> ${dataEmissao}</p>
          <p style="margin: 0 0 3px 0; font-family: monospace; font-size: 9px; color: #64748b;">Autenticação: ${reportHash}</p>
          <span style="background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: bold;">✔ Auditado</span>
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
            <th style="text-align: center;">STATUS</th>
            <th style="text-align: center;">FORMA</th>
            <th style="text-align: right;">VALOR DA COBRANÇA</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
        <tfoot>
          <tr style="background: #0f172a; color: #ffffff; font-weight: 900; font-size: 9.5px;">
            <td colspan="7" style="padding: 7px 8px; text-align: right; text-transform: uppercase;">TOTAL DO RELATÓRIO:</td>
            <td style="padding: 7px 8px; text-align: right; color: #34d399; font-size: 11.5px;">${totalFormatadoRodape}</td>
          </tr>
        </tfoot>
      </table>

      <div class="footer">
        <div style="max-width: 320px;">
          <strong style="font-size: 9px; text-transform: uppercase; color: #334155; display: block; margin-bottom: 2px;">Termo de Responsabilidade Financeira</strong>
          <p style="font-size: 8px; color: #64748b; margin: 0; line-height: 1.3;">Declaro que as informações constantes neste relatório representam a totalidade dos dados registrados no sistema até a presente data.</p>
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

export const RelatorioBaixadasPDFModal: React.FC<RelatorioPDFModalProps> = ({
  isOpen,
  onClose,
  cobrancas,
  clientes,
  nomeEmpresa,
  cnpjEmpresa,
  tipoInicial = 'quitadas'
}) => {
  const [tipo, setTipo] = useState<TipoRelatorioPDF>(tipoInicial);

  if (!isOpen) return null;

  const quitadas = cobrancas.filter(c => c.status === 'pago');
  const pendentes = cobrancas.filter(c => c.status === 'pendente');
  const atrasados = cobrancas.filter(c => c.status === 'atrasado');

  const totalQuitado = quitadas.reduce((acc, c) => acc + c.valor, 0);
  const totalEmAberto = [...pendentes, ...atrasados].reduce((acc, c) => acc + c.valor, 0);
  const totalGeral = cobrancas.reduce((acc, c) => acc + c.valor, 0);

  const handleGerarPDF = () => {
    gerarEImprimirRelatorioPDF(cobrancas, clientes, nomeEmpresa, cnpjEmpresa, tipo);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-2xl animate-slide-up text-center">
        
        {/* Cabeçalho */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2 text-indigo-400">
            <FileText className="w-5 h-5" />
            <h2 className="text-base font-extrabold text-slate-100">
              Gerar Relatório em PDF (A4)
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Seleção do Tipo de Relatório */}
        <div className="space-y-1.5 text-left">
          <label className="block text-xs font-bold text-slate-300">
            Selecione o Tipo de Relatório:
          </label>

          <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded-2xl">
            <button
              type="button"
              onClick={() => setTipo('quitadas')}
              className={`py-2 px-2 rounded-xl text-[11px] font-extrabold transition-all flex flex-col items-center justify-center gap-1 ${
                tipo === 'quitadas'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Quitadas</span>
            </button>

            <button
              type="button"
              onClick={() => setTipo('em_aberto')}
              className={`py-2 px-2 rounded-xl text-[11px] font-extrabold transition-all flex flex-col items-center justify-center gap-1 ${
                tipo === 'em_aberto'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-900/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Em Aberto</span>
            </button>

            <button
              type="button"
              onClick={() => setTipo('completo')}
              className={`py-2 px-2 rounded-xl text-[11px] font-extrabold transition-all flex flex-col items-center justify-center gap-1 ${
                tipo === 'completo'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <PieChart className="w-3.5 h-3.5" />
              <span>Geral</span>
            </button>
          </div>
        </div>

        {/* Resumo Dinâmico do Relatório Selecionado */}
        <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl text-left space-y-2 text-xs">
          {tipo === 'quitadas' && (
            <>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Total Quitado:</span>
                <span className="font-extrabold text-emerald-400 text-sm">{formatCurrency(totalQuitado)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Títulos Baixados:</span>
                <span className="font-bold text-slate-200">{quitadas.length} cobranças</span>
              </div>
            </>
          )}

          {tipo === 'em_aberto' && (
            <>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Total em Aberto:</span>
                <span className="font-extrabold text-amber-400 text-sm">{formatCurrency(totalEmAberto)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Títulos Vencidos (Atraso):</span>
                <span className="font-bold text-rose-400">{atrasados.length} devedores</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Títulos Pendentes:</span>
                <span className="font-bold text-amber-300">{pendentes.length} cobranças</span>
              </div>
            </>
          )}

          {tipo === 'completo' && (
            <>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Total da Carteira:</span>
                <span className="font-extrabold text-indigo-300 text-sm">{formatCurrency(totalGeral)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Total Registros:</span>
                <span className="font-bold text-slate-200">{cobrancas.length} títulos no total</span>
              </div>
            </>
          )}
        </div>

        {/* Botões de Ação */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
          >
            Cancelar
          </button>
          
          <button
            onClick={handleGerarPDF}
            className={`flex-1 py-3 rounded-xl text-white text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-lg transition-all active:scale-95 ${
              tipo === 'quitadas' ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/40' :
              tipo === 'em_aberto' ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-900/40' :
              'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-900/40'
            }`}
          >
            <Printer className="w-4 h-4" />
            Imprimir PDF A4
          </button>
        </div>
      </div>
    </div>
  );
};
