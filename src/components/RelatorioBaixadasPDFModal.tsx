import React, { useState } from 'react';
import { X, Printer, FileText, CheckCircle2, PieChart, Clock, ShieldAlert, Users, List } from 'lucide-react';
import { Cobranca, Cliente } from '../types';
import { formatCurrency, formatDateBR } from '../utils/whatsapp';
import { formatCNPJ } from '../services/storage';

export type TipoRelatorioPDF = 'quitadas' | 'em_aberto' | 'atrasados' | 'completo';

interface RelatorioPDFModalProps {
  isOpen: boolean;
  onClose: () => void;
  cobrancas: Cobranca[];
  clientes: Cliente[];
  nomeEmpresa: string;
  cnpjEmpresa?: string;
  tipoInicial?: TipoRelatorioPDF;
  subtituloPeriodo?: string;
}

export function gerarEImprimirRelatorioPDF(
  cobrancas: Cobranca[],
  clientes: Cliente[],
  nomeEmpresa: string,
  cnpjEmpresa: string | undefined,
  tipo: TipoRelatorioPDF,
  subtituloPeriodo?: string,
  agruparPorCliente: boolean = false
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

  // Define se exibe a coluna de Forma de Pagamento (somente em contas que envolvem liquidação ou geral)
  const exibirForma = tipo === 'quitadas' || tipo === 'completo';

  if (tipo === 'quitadas') {
    listaFiltrada = [...quitadas];
    tituloRelatorio = 'RELATÓRIO FINANCEIRO DE CONTAS QUITADAS';
    subTituloRelatorio = 'Demonstrativo Analítico de Títulos Liquidados e Recebidos';
    badgeHeader = '✔ QUITADAS / BAIXADAS';
    badgeHeaderBg = '#d1fae5';
    badgeHeaderColor = '#047857';
  } else if (tipo === 'em_aberto') {
    listaFiltrada = [...pendentes];
    tituloRelatorio = 'RELATÓRIO DE CONTAS A VENCER (PENDENTES)';
    subTituloRelatorio = 'Demonstrativo Analítico de Títulos Pendentes A Vencer';
    badgeHeader = '⏳ A VENCER (PENDENTES)';
    badgeHeaderBg = '#fef3c7';
    badgeHeaderColor = '#b45309';
  } else if (tipo === 'atrasados') {
    listaFiltrada = [...atrasados];
    tituloRelatorio = 'RELATÓRIO DE CONTAS VENCIDAS EM ATRASO';
    subTituloRelatorio = 'Demonstrativo Analítico de Títulos Vencidos e Inadimplentes';
    badgeHeader = '🚨 VENCIDAS EM ATRASO';
    badgeHeaderBg = '#fee2e2';
    badgeHeaderColor = '#b91c1c';
  } else {
    listaFiltrada = [...cobrancas];
    tituloRelatorio = 'RELATÓRIO CONSOLIDADO GERAL DA CARTEIRA';
    subTituloRelatorio = 'Balanço Geral Sintético e Analítico de Todos os Títulos';
    badgeHeader = '📊 CARTEIRA COMPLETA';
    badgeHeaderBg = '#e0e7ff';
    badgeHeaderColor = '#4338ca';
  }

  // Ordenação Estrita em Ordem Alfabética (A a Z) por Nome de Cliente
  listaFiltrada.sort((a, b) => 
    a.clienteNome.trim().localeCompare(b.clienteNome.trim(), 'pt-BR', { sensitivity: 'base' })
  );

  const colsCount = exibirForma ? 8 : 7;
  const footerColspan = exibirForma ? 7 : 6;

  let rowsHtml = '';

  if (listaFiltrada.length === 0) {
    rowsHtml = `<tr><td colspan="${colsCount}" style="padding: 15px; text-align: center; color: #64748b;">Nenhuma cobrança encontrada para este tipo de relatório.</td></tr>`;
  } else if (agruparPorCliente) {
    // Agrupamento por Cliente com Subtotais e em Ordem Alfabética (A-Z)
    const grupos: Record<string, { clienteNome: string; documento: string; fone: string; cidade: string; itens: Cobranca[] }> = {};

    listaFiltrada.forEach(item => {
      const key = item.clienteNome.trim().toLowerCase();
      const cli = clientes.find(c => c.id === item.clienteId || c.nome.toLowerCase() === key);
      const doc = item.clienteDocumento || cli?.documento || '-';
      const fone = item.clienteTelefone || cli?.telefone || '-';
      const cidade = cli?.cidade || 'PACAJÁ';

      if (!grupos[key]) {
        grupos[key] = {
          clienteNome: item.clienteNome.trim(),
          documento: doc,
          fone: fone,
          cidade: cidade,
          itens: []
        };
      }
      grupos[key].itens.push(item);
    });

    // Ordena os grupos em Ordem Alfabética (A a Z)
    const gruposOrdenados = Object.values(grupos).sort((a, b) => 
      a.clienteNome.trim().localeCompare(b.clienteNome.trim(), 'pt-BR', { sensitivity: 'base' })
    );

    let globalCounter = 0;

    rowsHtml = gruposOrdenados.map(grupo => {
      // Ordena os títulos do cliente por vencimento
      grupo.itens.sort((a, b) => a.dataVencimento.localeCompare(b.dataVencimento));
      const subtotalCliente = grupo.itens.reduce((sum, item) => sum + item.valor, 0);

      const headerRow = `
        <tr style="background: #e0e7ff; color: #3730a3; font-weight: 900; font-size: 10px; page-break-after: avoid; break-after: avoid;">
          <td colspan="${colsCount}" style="padding: 6px 8px; border: 1px solid #c7d2fe; text-transform: uppercase; letter-spacing: 0.5px;">
            👤 CLIENTE: <strong>${grupo.clienteNome}</strong> &nbsp;&bull;&nbsp; CPF/CNPJ: <strong>${grupo.documento}</strong> &nbsp;&bull;&nbsp; CIDADE: <strong>${grupo.cidade}</strong> &nbsp;&bull;&nbsp; FONE: <strong>${grupo.fone}</strong>
          </td>
        </tr>
      `;

      const itemRows = grupo.itens.map((item, idx) => {
        globalCounter++;
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
          <tr style="background-color: ${rowBg}; font-size: 9px; page-break-inside: avoid; break-inside: avoid;">
            <td style="padding: 3.5px 5px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold; color: #64748b; white-space: nowrap;">${globalCounter}</td>
            <td style="padding: 3.5px 5px; border: 1px solid #cbd5e1; font-weight: bold; color: #0f172a; word-break: break-word;">${item.clienteNome}</td>
            <td style="padding: 3.5px 5px; border: 1px solid #cbd5e1; font-family: monospace; font-size: 8.5px; color: #475569; white-space: nowrap;">${grupo.documento}</td>
            <td style="padding: 3.5px 5px; border: 1px solid #cbd5e1; text-align: center; font-weight: 800; color: #4338ca; font-size: 9px; white-space: nowrap;">${mesRefFinal}</td>
            <td style="padding: 3.5px 5px; border: 1px solid #cbd5e1; text-align: center; color: #475569; font-weight: 600; white-space: nowrap;">${formatDateBR(item.dataVencimento)}</td>
            <td style="padding: 3.5px 5px; border: 1px solid #cbd5e1; text-align: center; white-space: nowrap;">${statusBadgeHtml}</td>
            ${exibirForma ? `<td style="padding: 3.5px 5px; border: 1px solid #cbd5e1; text-align: center; text-transform: uppercase; font-weight: bold; font-size: 8.5px; color: #334155; white-space: nowrap;">${item.formaPagamento}</td>` : ''}
            <td style="padding: 3.5px 5px; border: 1px solid #cbd5e1; text-align: right; font-weight: 800; color: ${item.status === 'atrasado' ? '#b91c1c' : item.status === 'pago' ? '#047857' : '#0f172a'}; white-space: nowrap;">${formatCurrency(item.valor)}</td>
          </tr>
        `;
      }).join('');

      const subtotalRow = `
        <tr style="background: #f1f5f9; font-weight: 800; font-size: 9px; page-break-inside: avoid; break-inside: avoid;">
          <td colspan="${footerColspan}" style="padding: 4px 6px; border: 1px solid #cbd5e1; text-align: right; color: #334155; text-transform: uppercase; white-space: nowrap;">
            SUB-TOTAL: ${grupo.itens.length} TÍTULO(S) DE ${grupo.clienteNome}:
          </td>
          <td style="padding: 4px 6px; border: 1px solid #cbd5e1; text-align: right; font-weight: 900; color: ${tipo === 'atrasados' ? '#b91c1c' : '#047857'}; font-size: 10px; white-space: nowrap;">
            ${formatCurrency(subtotalCliente)}
          </td>
        </tr>
      `;

      return headerRow + itemRows + subtotalRow;
    }).join('');

  } else {
    // Lista plana sequencial em Ordem Alfabética (A-Z)
    rowsHtml = listaFiltrada.map((item, idx) => {
      const cli = clientes.find(c => c.id === item.clienteId || c.nome.toLowerCase() === item.clienteNome.trim().toLowerCase());
      const doc = item.clienteDocumento || cli?.documento || '-';
      const city = cli?.cidade || 'PACAJÁ';
      const mesRefFinal = item.mesReferencia || (item.dataVencimento ? `${item.dataVencimento.split('-')[1]}/${item.dataVencimento.split('-')[0]}` : '-');
      
      let statusBadgeHtml = '';
      let rowBg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';

      if (item.status === 'pago') {
        statusBadgeHtml = `<span style="background: #d1fae5; color: #047857; font-weight: bold; padding: 1.5px 5px; border-radius: 4px; font-size: 8px;">PAGO</span>`;
      } else if (item.status === 'atrasado') {
        statusBadgeHtml = `<span style="background: #fee2e2; color: #b91c1c; font-weight: bold; padding: 1.5px 5px; border-radius: 4px; font-size: 8px;">ATRASADO</span>`;
        rowBg = '#fff1f2';
      } else if (item.status === 'pendente') {
        statusBadgeHtml = `<span style="background: #fef3c7; color: #b45309; font-weight: bold; padding: 1.5px 5px; border-radius: 4px; font-size: 8px;">PENDENTE</span>`;
      } else {
        statusBadgeHtml = `<span style="background: #f1f5f9; color: #64748b; font-weight: bold; padding: 1.5px 5px; border-radius: 4px; font-size: 8px;">CANCELADO</span>`;
      }

      return `
        <tr style="background-color: ${rowBg}; font-size: 9px; page-break-inside: avoid; break-inside: avoid;">
          <td style="padding: 3.5px 5px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold; color: #64748b; white-space: nowrap;">${idx + 1}</td>
          <td style="padding: 3.5px 5px; border: 1px solid #cbd5e1; font-weight: bold; color: #0f172a; word-break: break-word;">${item.clienteNome} <span style="font-size: 8px; font-weight: normal; color: #64748b;">(${city})</span></td>
          <td style="padding: 3.5px 5px; border: 1px solid #cbd5e1; font-family: monospace; font-size: 8.5px; color: #475569; white-space: nowrap;">${doc}</td>
          <td style="padding: 3.5px 5px; border: 1px solid #cbd5e1; text-align: center; font-weight: 800; color: #4338ca; font-size: 9px; white-space: nowrap;">${mesRefFinal}</td>
          <td style="padding: 3.5px 5px; border: 1px solid #cbd5e1; text-align: center; color: #475569; font-weight: 600; white-space: nowrap;">${formatDateBR(item.dataVencimento)}</td>
          <td style="padding: 3.5px 5px; border: 1px solid #cbd5e1; text-align: center; white-space: nowrap;">${statusBadgeHtml}</td>
          ${exibirForma ? `<td style="padding: 3.5px 5px; border: 1px solid #cbd5e1; text-align: center; text-transform: uppercase; font-weight: bold; font-size: 8.5px; color: #334155; white-space: nowrap;">${item.formaPagamento}</td>` : ''}
          <td style="padding: 3.5px 5px; border: 1px solid #cbd5e1; text-align: right; font-weight: 800; color: ${item.status === 'atrasado' ? '#b91c1c' : item.status === 'pago' ? '#047857' : '#0f172a'}; white-space: nowrap;">${formatCurrency(item.valor)}</td>
        </tr>
      `;
    }).join('');
  }

  const totalFormatadoRodape = 
    tipo === 'quitadas' ? formatCurrency(totalQuitado) :
    tipo === 'em_aberto' ? formatCurrency(totalPendente) :
    tipo === 'atrasados' ? formatCurrency(totalAtrasado) : formatCurrency(totalGeralCarteira);

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
          padding: 8px 12px;
          color: #0f172a;
          background: #ffffff;
        }
        @page {
          size: A4 portrait;
          margin: 5mm 6mm;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 3px solid #0f172a;
          padding-bottom: 6px;
          margin-bottom: 10px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 8px;
        }
        thead {
          display: table-header-group;
        }
        tfoot {
          display: table-footer-group;
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
        tr {
          break-inside: avoid !important;
          page-break-inside: avoid !important;
        }
        th {
          background: #0f172a;
          color: #ffffff;
          font-size: 8.5px;
          text-transform: uppercase;
          padding: 4px 5px;
          border: 1px solid #0f172a;
          white-space: nowrap;
        }
        .footer {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-top: 12px;
          padding-top: 6px;
          border-top: 1px solid #cbd5e1;
          break-inside: avoid !important;
          page-break-inside: avoid !important;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="background: #0f172a; color: #ffffff; font-weight: 900; padding: 2px 6px; border-radius: 4px; font-size: 10px;">C$ COBRAMAIS</span>
            <span style="background: ${badgeHeaderBg}; color: ${badgeHeaderColor}; font-weight: 800; padding: 2px 6px; border-radius: 4px; font-size: 8.5px;">${badgeHeader}</span>
          </div>
          <h1 style="font-size: 16px; font-weight: 900; margin: 3px 0 1px 0; color: #0f172a;">${nomeEmpresa || 'COMPUSERVE LTDA'}</h1>
          <p style="font-size: 10px; font-weight: 800; color: #4338ca; margin: 0 0 2px 0;">CNPJ: ${cnpjExibicao} ${subtituloPeriodo ? ` &bull; <span style="color: #047857; font-weight: 900;">${subtituloPeriodo}</span>` : ''}</p>
          <p style="font-size: 9px; color: #64748b; margin: 0;">${subTituloRelatorio}</p>
        </div>
        <div style="text-align: right; font-size: 9.5px;">
          <p style="margin: 0 0 2px 0;"><strong>Emissão:</strong> ${dataEmissao}</p>
          <p style="margin: 0 0 3px 0; font-family: monospace; font-size: 8.5px; color: #64748b;">Autenticação: ${reportHash}</p>
          <span style="background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; padding: 1.5px 5px; border-radius: 4px; font-size: 8.5px; font-weight: bold;">✔ Auditado (Ordem Alfabética)</span>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="text-align: center; width: 22px;">#</th>
            <th style="text-align: left;">CLIENTE / DEVEDOR</th>
            <th style="text-align: left; width: 105px;">CPF / CNPJ</th>
            <th style="text-align: center; width: 68px;">MÊS REF.</th>
            <th style="text-align: center; width: 75px;">VENCIMENTO</th>
            <th style="text-align: center; width: 64px;">STATUS</th>
            ${exibirForma ? `<th style="text-align: center; width: 55px;">FORMA</th>` : ''}
            <th style="text-align: right; width: 95px;">VALOR DA COBRANÇA</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
        <tfoot>
          <tr style="background: #0f172a; color: #ffffff; font-weight: 900; font-size: 9px;">
            <td colspan="${footerColspan}" style="padding: 5px 6px; text-align: right; text-transform: uppercase;">TOTAL GERAL DO RELATÓRIO:</td>
            <td style="padding: 5px 6px; text-align: right; color: ${tipo === 'atrasados' ? '#f87171' : '#34d399'}; font-size: 10.5px; white-space: nowrap;">${totalFormatadoRodape}</td>
          </tr>
        </tfoot>
      </table>

      <div class="footer">
        <div style="max-width: 320px;">
          <strong style="font-size: 9px; text-transform: uppercase; color: #334155; display: block; margin-bottom: 2px;">Termo de Responsabilidade Financeira</strong>
          <p style="font-size: 8px; color: #64748b; margin: 0; line-height: 1.3;">Declaro que as informações constantes neste relatório representam a totalidade dos dados registrados no sistema até a presente data.</p>
        </div>
        <div style="text-align: center; width: 240px;">
          <div style="height: 50px;"></div>
          <div style="border-bottom: 1.5px solid #0f172a; margin-bottom: 5px;"></div>
          <strong style="font-size: 9.5px; color: #0f172a; display: block;">${nomeEmpresa || 'COMPUSERVE LTDA'}</strong>
          <span style="font-size: 8.5px; font-weight: 700; color: #4338ca; display: block;">CNPJ: ${cnpjExibicao}</span>
          <span style="font-size: 8px; color: #64748b;">Assinatura do Gestor / Responsável</span>
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
  tipoInicial = 'quitadas',
  subtituloPeriodo
}) => {
  const [tipo, setTipo] = useState<TipoRelatorioPDF>(tipoInicial);
  const [agruparPorCliente, setAgruparPorCliente] = useState<boolean>(false);

  if (!isOpen) return null;

  const quitadas = cobrancas.filter(c => c.status === 'pago');
  const pendentes = cobrancas.filter(c => c.status === 'pendente');
  const atrasados = cobrancas.filter(c => c.status === 'atrasado');

  const totalQuitado = quitadas.reduce((acc, c) => acc + c.valor, 0);
  const totalPendente = pendentes.reduce((acc, c) => acc + c.valor, 0);
  const totalAtrasado = atrasados.reduce((acc, c) => acc + c.valor, 0);
  const totalGeral = cobrancas.reduce((acc, c) => acc + c.valor, 0);

  const handleGerarPDF = () => {
    gerarEImprimirRelatorioPDF(cobrancas, clientes, nomeEmpresa, cnpjEmpresa, tipo, subtituloPeriodo, agruparPorCliente);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-2xl animate-slide-up text-center">
        
        {/* Cabeçalho */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2 text-indigo-400">
            <FileText className="w-5 h-5" />
            <div>
              <h2 className="text-base font-extrabold text-slate-100 text-left">
                Gerar Relatório em PDF (A4)
              </h2>
              {subtituloPeriodo && (
                <p className="text-[11px] font-bold text-emerald-400 text-left">
                  {subtituloPeriodo}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Seleção de 4 Tipos de Relatório */}
        <div className="space-y-1.5 text-left">
          <label className="block text-xs font-bold text-slate-300">
            Selecione o Tipo de Relatório:
          </label>

          <div className="grid grid-cols-4 gap-1 p-1 bg-slate-950 border border-slate-800 rounded-2xl">
            <button
              type="button"
              onClick={() => setTipo('quitadas')}
              className={`py-2 px-1 rounded-xl text-[10px] sm:text-[11px] font-extrabold transition-all flex flex-col items-center justify-center gap-1 ${
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
              className={`py-2 px-1 rounded-xl text-[10px] sm:text-[11px] font-extrabold transition-all flex flex-col items-center justify-center gap-1 ${
                tipo === 'em_aberto'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-900/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>A Vencer</span>
            </button>

            <button
              type="button"
              onClick={() => setTipo('atrasados')}
              className={`py-2 px-1 rounded-xl text-[10px] sm:text-[11px] font-extrabold transition-all flex flex-col items-center justify-center gap-1 ${
                tipo === 'atrasados'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-900/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Atrasadas</span>
            </button>

            <button
              type="button"
              onClick={() => setTipo('completo')}
              className={`py-2 px-1 rounded-xl text-[10px] sm:text-[11px] font-extrabold transition-all flex flex-col items-center justify-center gap-1 ${
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

        {/* Escolha do Modo de Organização (Agrupado por Cliente vs Lista) */}
        <div className="space-y-1.5 text-left">
          <label className="block text-xs font-bold text-slate-300">
            Organização dos Títulos no PDF:
          </label>

          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded-2xl">
            <button
              type="button"
              onClick={() => setAgruparPorCliente(true)}
              className={`py-2 px-2 rounded-xl text-[11px] font-extrabold transition-all flex items-center justify-center gap-1.5 ${
                agruparPorCliente
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Agrupar por Cliente (A-Z)</span>
            </button>

            <button
              type="button"
              onClick={() => setAgruparPorCliente(false)}
              className={`py-2 px-2 rounded-xl text-[11px] font-extrabold transition-all flex items-center justify-center gap-1.5 ${
                !agruparPorCliente
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Lista Sequencial (A-Z)</span>
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
                <span className="text-slate-400">Total A Vencer (Pendentes):</span>
                <span className="font-extrabold text-amber-400 text-sm">{formatCurrency(totalPendente)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Títulos Pendentes:</span>
                <span className="font-bold text-amber-300">{pendentes.length} cobranças</span>
              </div>
            </>
          )}

          {tipo === 'atrasados' && (
            <>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Total Em Atraso (Vencidos):</span>
                <span className="font-extrabold text-rose-400 text-sm">{formatCurrency(totalAtrasado)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Títulos Inadimplentes:</span>
                <span className="font-bold text-rose-300">{atrasados.length} devedores</span>
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
              tipo === 'atrasados' ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-900/40' :
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
