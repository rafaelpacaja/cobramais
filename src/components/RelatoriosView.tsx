import React from 'react';
import { Download, TrendingUp, PieChart as PieChartIcon, CheckCircle2, Clock, AlertTriangle, Printer } from 'lucide-react';
import { Cobranca, IndicadoresFinanceiros } from '../types';
import { formatCurrency } from '../utils/whatsapp';
import { TipoRelatorioPDF } from './RelatorioBaixadasPDFModal';

interface RelatoriosViewProps {
  cobrancas: Cobranca[];
  indicadores: IndicadoresFinanceiros;
  onOpenRelatorioPDF: (tipo?: TipoRelatorioPDF) => void;
}

export const RelatoriosView: React.FC<RelatoriosViewProps> = ({ 
  cobrancas, 
  indicadores,
  onOpenRelatorioPDF
}) => {
  const handleExportCSV = () => {
    if (cobrancas.length === 0) {
      alert('Nenhuma cobrança para exportar.');
      return;
    }

    const headers = ['ID', 'Cliente', 'Telefone', 'CPF_CNPJ', 'Descricao', 'Valor', 'Vencimento', 'Pagamento', 'Status', 'FormaPgto', 'Categoria'];
    const rows = cobrancas.map(c => [
      c.id,
      `"${c.clienteNome}"`,
      `"${c.clienteTelefone}"`,
      `"${c.clienteDocumento || ''}"`,
      `"${c.descricao}"`,
      c.valor,
      c.dataVencimento,
      c.dataPagamento || '',
      c.status,
      c.formaPagamento,
      c.categoria || ''
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `relatorio_cobrancas_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Agrupamento por forma de pagamento
  const porFormaPgto = cobrancas.reduce((acc, c) => {
    acc[c.formaPagamento] = (acc[c.formaPagamento] || 0) + c.valor;
    return acc;
  }, {} as Record<string, number>);

  const totalGeral = Object.values(porFormaPgto).reduce((a, b) => a + b, 0);

  return (
    <div className="w-full min-h-[101vh] space-y-4 px-4 pt-3 pb-24 animate-fade-in">
      {/* Top Header Simplificado */}
      <div className="flex items-center justify-between gap-2 w-full">
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-extrabold text-slate-100 truncate">
            Relatórios e Métricas
          </h2>
          <p className="text-xs text-slate-400 truncate">
            Análise financeira e emissão de relatórios
          </p>
        </div>

        {/* Único Botão de PDF + Botão CSV */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onOpenRelatorioPDF('quitadas')}
            className="h-9 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md shadow-emerald-900/30 transition-all flex items-center justify-center gap-1.5 whitespace-nowrap active:scale-95 cursor-pointer"
            title="Abrir Central de Relatórios em PDF"
          >
            <Printer className="w-3.5 h-3.5 shrink-0" />
            <span>PDF Relatórios</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="h-9 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-extrabold text-xs transition-all flex items-center justify-center gap-1.5 whitespace-nowrap active:scale-95 cursor-pointer"
            title="Exportar planilha CSV"
          >
            <Download className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* Visão de Balanço em Cards */}
      <div className="glass-card w-full rounded-2xl p-4 space-y-4">
        <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-indigo-400" />
          Balanço Geral da Carteira
        </h3>

        <div className="space-y-3 text-xs w-full">
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-slate-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Total Quitado
              </span>
              <span className="font-bold text-emerald-400">{formatCurrency(indicadores.totalRecebido)}</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-emerald-500 h-full rounded-full" 
                style={{ width: `${(indicadores.totalRecebido / (totalGeral || 1)) * 100}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <span className="text-slate-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-400" /> A Receber
              </span>
              <span className="font-bold text-amber-400">{formatCurrency(indicadores.totalAReceber)}</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-amber-500 h-full rounded-full" 
                style={{ width: `${(indicadores.totalAReceber / (totalGeral || 1)) * 100}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <span className="text-slate-400 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" /> Em Atraso
              </span>
              <span className="font-bold text-rose-400">{formatCurrency(indicadores.totalEmAtraso)}</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-rose-500 h-full rounded-full" 
                style={{ width: `${(indicadores.totalEmAtraso / (totalGeral || 1)) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Distribuição por Meio de Pagamento */}
      <div className="glass-card w-full rounded-2xl p-4 space-y-3">
        <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
          <PieChartIcon className="w-4 h-4 text-indigo-400" />
          Volume por Método de Pagamento
        </h3>

        <div className="grid grid-cols-2 gap-2.5 pt-1 w-full">
          {Object.entries(porFormaPgto).map(([forma, valor]) => {
            const pct = totalGeral > 0 ? (valor / totalGeral) * 100 : 0;
            return (
              <div key={forma} className="p-3 rounded-xl bg-slate-900 border border-slate-800 w-full">
                <p className="text-[10px] uppercase font-bold text-slate-400">{forma}</p>
                <p className="text-sm font-extrabold text-slate-100 mt-0.5">{formatCurrency(valor)}</p>
                <p className="text-[10px] text-slate-500 mt-1">{pct.toFixed(1)}% do total</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
