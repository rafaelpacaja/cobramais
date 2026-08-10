import React, { useState, useMemo } from 'react';
import { 
  Download, 
  TrendingUp, 
  PieChart as PieChartIcon, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Printer,
  Calendar,
  Filter,
  Layers,
  CalendarDays
} from 'lucide-react';
import { Cobranca, IndicadoresFinanceiros } from '../types';
import { formatCurrency, formatDateBR } from '../utils/whatsapp';
import { TipoRelatorioPDF } from './RelatorioBaixadasPDFModal';

export type TipoFiltroPeriodo = 'todos' | 'mes_atual' | 'mes_especifico' | 'personalizado';

interface RelatoriosViewProps {
  cobrancas: Cobranca[];
  indicadores: IndicadoresFinanceiros;
  onOpenRelatorioPDF: (tipo?: TipoRelatorioPDF, cobrancasFiltradas?: Cobranca[], subtituloPeriodo?: string) => void;
}

export const RelatoriosView: React.FC<RelatoriosViewProps> = ({ 
  cobrancas, 
  indicadores: indicadoresGlobais,
  onOpenRelatorioPDF
}) => {
  const [tipoFiltro, setTipoFiltro] = useState<TipoFiltroPeriodo>('todos');

  // Mês Atual Automático (ex: "08/2026")
  const now = new Date();
  const currentMesRef = `${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
  const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // Extrai lista única de Meses de Referência das cobranças cadastradas
  const mesesDisponiveis = useMemo(() => {
    const setMeses = new Set<string>();
    cobrancas.forEach(c => {
      if (c.mesReferencia && c.mesReferencia.includes('/')) {
        setMeses.add(c.mesReferencia.trim());
      } else if (c.dataVencimento && c.dataVencimento.includes('-')) {
        const parts = c.dataVencimento.split('-');
        if (parts.length === 3) {
          setMeses.add(`${parts[1]}/${parts[0]}`);
        }
      }
    });
    return Array.from(setMeses).sort((a, b) => {
      const [mA, yA] = a.split('/').map(Number);
      const [mB, yB] = b.split('/').map(Number);
      return (yB * 12 + mB) - (yA * 12 + mA);
    });
  }, [cobrancas]);

  const [mesEspecificoSel, setMesEspecificoSel] = useState<string>(mesesDisponiveis[0] || currentMesRef);
  const [dataInicio, setDataInicio] = useState<string>(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`);
  const [dataFim, setDataFim] = useState<string>(now.toISOString().split('T')[0]);

  // Filtragem dinâmica de cobranças por período
  const cobrancasFiltradas = useMemo(() => {
    return cobrancas.filter(c => {
      if (tipoFiltro === 'todos') return true;

      if (tipoFiltro === 'mes_atual') {
        return c.mesReferencia === currentMesRef || c.dataVencimento.startsWith(currentYearMonth);
      }

      if (tipoFiltro === 'mes_especifico') {
        if (!mesEspecificoSel) return true;
        const parts = mesEspecificoSel.split('/');
        const isoPrefix = parts.length === 2 ? `${parts[1]}-${parts[0]}` : '';
        return c.mesReferencia === mesEspecificoSel || (isoPrefix && c.dataVencimento.startsWith(isoPrefix));
      }

      if (tipoFiltro === 'personalizado') {
        const dataTarget = c.dataPagamento || c.dataVencimento;
        if (dataInicio && dataTarget < dataInicio) return false;
        if (dataFim && dataTarget > dataFim) return false;
        return true;
      }

      return true;
    });
  }, [cobrancas, tipoFiltro, mesEspecificoSel, dataInicio, dataFim, currentMesRef, currentYearMonth]);

  // Recalcula indicadores para o período filtrado
  const totalRecebido = cobrancasFiltradas.filter(c => c.status === 'pago').reduce((a, c) => a + c.valor, 0);
  const totalAReceber = cobrancasFiltradas.filter(c => c.status === 'pendente').reduce((a, c) => a + c.valor, 0);
  const totalEmAtraso = cobrancasFiltradas.filter(c => c.status === 'atrasado').reduce((a, c) => a + c.valor, 0);
  const totalGeralFiltrado = totalRecebido + totalAReceber + totalEmAtraso;

  // Agrupamento por forma de pagamento no período
  const porFormaPgto = cobrancasFiltradas.reduce((acc, c) => {
    acc[c.formaPagamento] = (acc[c.formaPagamento] || 0) + c.valor;
    return acc;
  }, {} as Record<string, number>);

  // Monta subtítulo descritivo do período para o PDF e CSV
  const subtituloPeriodoStr = useMemo(() => {
    if (tipoFiltro === 'todos') return 'Período: Geral (Todos os registros)';
    if (tipoFiltro === 'mes_atual') return `Período: Mês Atual (${currentMesRef})`;
    if (tipoFiltro === 'mes_especifico') return `Período: Mês ${mesEspecificoSel}`;
    if (tipoFiltro === 'personalizado') {
      const iniBR = dataInicio ? formatDateBR(dataInicio) : 'Início';
      const fimBR = dataFim ? formatDateBR(dataFim) : 'Hoje';
      return `Período: De ${iniBR} até ${fimBR}`;
    }
    return '';
  }, [tipoFiltro, currentMesRef, mesEspecificoSel, dataInicio, dataFim]);

  const handleExportCSV = () => {
    if (cobrancasFiltradas.length === 0) {
      alert('Nenhuma cobrança encontrada no período selecionado para exportar.');
      return;
    }

    const headers = ['ID', 'Cliente', 'Telefone', 'CPF_CNPJ', 'Descricao', 'Valor', 'Vencimento', 'Pagamento', 'Status', 'FormaPgto', 'Categoria'];
    const rows = cobrancasFiltradas.map(c => [
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

  const handleOpenPDF = () => {
    onOpenRelatorioPDF('quitadas', cobrancasFiltradas, subtituloPeriodoStr);
  };

  return (
    <div className="w-full min-h-[101vh] space-y-4 px-4 pt-3 pb-24 animate-fade-in">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-2 w-full">
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-extrabold text-slate-100 truncate">
            Relatórios e Métricas
          </h2>
          <p className="text-xs text-slate-400 truncate">
            Análise financeira e emissão por período
          </p>
        </div>

        {/* Botão de PDF + Botão CSV */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleOpenPDF}
            className="h-9 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md shadow-emerald-900/30 transition-all flex items-center justify-center gap-1.5 whitespace-nowrap active:scale-95 cursor-pointer"
            title="Abrir Central de Relatórios em PDF no Período Selecionado"
          >
            <Printer className="w-3.5 h-3.5 shrink-0" />
            <span>PDF Relatórios</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="h-9 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-extrabold text-xs transition-all flex items-center justify-center gap-1.5 whitespace-nowrap active:scale-95 cursor-pointer"
            title="Exportar planilha CSV do Período"
          >
            <Download className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* Card de Filtro de Período */}
      <div className="glass-card w-full rounded-2xl p-4 space-y-3 border-indigo-500/20">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-slate-200 flex items-center gap-2">
            <Filter className="w-4 h-4 text-indigo-400" />
            Filtrar por Período
          </h3>
          <span className="text-[11px] font-bold text-indigo-300 bg-indigo-500/10 px-2.5 py-0.5 rounded-lg border border-indigo-500/20">
            {cobrancasFiltradas.length} cobrança(s) no período
          </span>
        </div>

        {/* Abas Rápidas de Período */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded-2xl text-xs">
          <button
            type="button"
            onClick={() => setTipoFiltro('todos')}
            className={`py-2 px-2 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 ${
              tipoFiltro === 'todos'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Geral (Todos)</span>
          </button>

          <button
            type="button"
            onClick={() => setTipoFiltro('mes_atual')}
            className={`py-2 px-2 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 ${
              tipoFiltro === 'mes_atual'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Mês Atual ({currentMesRef})</span>
          </button>

          <button
            type="button"
            onClick={() => setTipoFiltro('mes_especifico')}
            className={`py-2 px-2 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 ${
              tipoFiltro === 'mes_especifico'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-900/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>Selecionar Mês</span>
          </button>

          <button
            type="button"
            onClick={() => setTipoFiltro('personalizado')}
            className={`py-2 px-2 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 ${
              tipoFiltro === 'personalizado'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-900/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Personalizado</span>
          </button>
        </div>

        {/* Controles Dinâmicos conforme Período Selecionado */}
        {tipoFiltro === 'mes_especifico' && (
          <div className="pt-2 animate-fade-in space-y-1">
            <label className="block text-xs font-bold text-slate-300">
              Selecione o Mês/Ano de Referência:
            </label>
            <select
              value={mesEspecificoSel}
              onChange={(e) => setMesEspecificoSel(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-extrabold text-amber-300 focus:border-amber-500"
            >
              {mesesDisponiveis.map(m => (
                <option key={m} value={m}>
                  Mês de Referência {m}
                </option>
              ))}
            </select>
          </div>
        )}

        {tipoFiltro === 'personalizado' && (
          <div className="grid grid-cols-2 gap-2 pt-2 animate-fade-in">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Data Inicial:
              </label>
              <input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-100 focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Data Final:
              </label>
              <input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-100 focus:border-purple-500"
              />
            </div>
          </div>
        )}

        {/* Rótulo Informativo do Período */}
        <p className="text-[11px] font-bold text-slate-400 italic">
          📌 {subtituloPeriodoStr}
        </p>
      </div>

      {/* Visão de Balanço em Cards */}
      <div className="glass-card w-full rounded-2xl p-4 space-y-4">
        <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-indigo-400" />
          Balanço da Carteira no Período
        </h3>

        <div className="space-y-3 text-xs w-full">
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-slate-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Total Quitado
              </span>
              <span className="font-bold text-emerald-400">{formatCurrency(totalRecebido)}</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-emerald-500 h-full rounded-full transition-all" 
                style={{ width: `${(totalRecebido / (totalGeralFiltrado || 1)) * 100}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <span className="text-slate-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-400" /> A Receber
              </span>
              <span className="font-bold text-amber-400">{formatCurrency(totalAReceber)}</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-amber-500 h-full rounded-full transition-all" 
                style={{ width: `${(totalAReceber / (totalGeralFiltrado || 1)) * 100}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <span className="text-slate-400 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" /> Em Atraso
              </span>
              <span className="font-bold text-rose-400">{formatCurrency(totalEmAtraso)}</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-rose-500 h-full rounded-full transition-all" 
                style={{ width: `${(totalEmAtraso / (totalGeralFiltrado || 1)) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Distribuição por Meio de Pagamento */}
      <div className="glass-card w-full rounded-2xl p-4 space-y-3">
        <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
          <PieChartIcon className="w-4 h-4 text-indigo-400" />
          Volume por Método de Pagamento no Período
        </h3>

        <div className="grid grid-cols-2 gap-2.5 pt-1 w-full">
          {Object.keys(porFormaPgto).length === 0 ? (
            <p className="col-span-2 text-xs text-slate-500 text-center py-4">
              Nenhuma movimentação para o período selecionado.
            </p>
          ) : (
            Object.entries(porFormaPgto).map(([forma, valor]) => {
              const pct = totalGeralFiltrado > 0 ? (valor / totalGeralFiltrado) * 100 : 0;
              return (
                <div key={forma} className="p-3 rounded-xl bg-slate-900 border border-slate-800 w-full">
                  <p className="text-[10px] uppercase font-bold text-slate-400">{forma}</p>
                  <p className="text-sm font-extrabold text-slate-100 mt-0.5">{formatCurrency(valor)}</p>
                  <p className="text-[10px] text-slate-500 mt-1">{pct.toFixed(1)}% do total no período</p>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
