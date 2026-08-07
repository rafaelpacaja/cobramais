import React, { useState } from 'react';
import { X, Calendar, DollarSign, Sparkles, Repeat, TrendingUp, CheckCircle2 } from 'lucide-react';
import { Cliente, Cobranca } from '../types';
import { formatCurrency } from '../utils/whatsapp';

interface GerarMensalidadesRecorrentesModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientes: Cliente[];
  cobrancasExistentes: Cobranca[];
  onGerarMensalidades: (novasCobrancas: Omit<Cobranca, 'id' | 'createdAt'>[]) => void;
}

const MESES = [
  { val: 1, label: 'Janeiro' },
  { val: 2, label: 'Fevereiro' },
  { val: 3, label: 'Março' },
  { val: 4, label: 'Abril' },
  { val: 5, label: 'Maio' },
  { val: 6, label: 'Junho' },
  { val: 7, label: 'Julho' },
  { val: 8, label: 'Agosto' },
  { val: 9, label: 'Setembro' },
  { val: 10, label: 'Outubro' },
  { val: 11, label: 'Novembro' },
  { val: 12, label: 'Dezembro' }
];

export const GerarMensalidadesRecorrentesModal: React.FC<GerarMensalidadesRecorrentesModalProps> = ({
  isOpen,
  onClose,
  clientes,
  cobrancasExistentes,
  onGerarMensalidades
}) => {
  if (!isOpen) return null;

  const anoAtual = new Date().getFullYear();
  const mesAtual = new Date().getMonth() + 1;

  const [anoDestino, setAnoDestino] = useState<number>(anoAtual);
  const [mesInicio, setMesInicio] = useState<number>(mesAtual <= 12 ? mesAtual : 1);
  const [mesFim, setMesFim] = useState<number>(12);
  const [diaVencimento, setDiaVencimento] = useState<number>(5);
  const [porcentagemReajuste, setPorcentagemReajuste] = useState<string>('0');
  const [descricao, setDescricao] = useState<string>('Mensalidade do Sistema Compuserve');
  const [mesReferenciaManual, setMesReferenciaManual] = useState<string>('');

  // Calcula prévia dos títulos que serão gerados
  const reajusteNum = parseFloat(porcentagemReajuste.replace(',', '.')) || 0;
  const fatorReajuste = 1 + (reajusteNum / 100);

  let totalTitulosPrevistos = 0;
  let totalDuplicadosIgnorados = 0;
  let valorTotalPrevisto = 0;

  const cobrancasAGerar: Omit<Cobranca, 'id' | 'createdAt'>[] = [];

  // Mapeia o último valor conhecido de cada cliente
  clientes.forEach(cli => {
    const cobsDoCliente = cobrancasExistentes.filter(c => c.clienteId === cli.id || c.clienteNome === cli.nome);
    let valorBase = 300;

    if (cobsDoCliente.length > 0) {
      valorBase = cobsDoCliente[0].valor;
    }

    const valorReajustado = Math.round(valorBase * fatorReajuste * 100) / 100;

    for (let m = mesInicio; m <= mesFim; m++) {
      const mesStr = String(m).padStart(2, '0');
      // Formato estrito MM/AAAA para cada mensalidade gerada
      const mesRefAuto = `${mesStr}/${anoDestino}`;
      
      const mesRefFinal = mesReferenciaManual.trim() ? mesReferenciaManual.trim() : mesRefAuto;

      const diaStr = String(diaVencimento).padStart(2, '0');
      const dataVencStr = `${anoDestino}-${mesStr}-${diaStr}`;

      const jaExiste = cobrancasExistentes.some(c => 
        (c.clienteId === cli.id || c.clienteNome.toLowerCase() === cli.nome.toLowerCase()) &&
        (c.mesReferencia === mesRefFinal || c.dataVencimento.startsWith(`${anoDestino}-${mesStr}`))
      );

      if (jaExiste) {
        totalDuplicadosIgnorados++;
      } else {
        totalTitulosPrevistos++;
        valorTotalPrevisto += valorReajustado;

        cobrancasAGerar.push({
          clienteId: cli.id,
          clienteNome: cli.nome,
          clienteTelefone: cli.telefone,
          clienteDocumento: cli.documento,
          descricao,
          valor: valorReajustado,
          dataVencimento: dataVencStr,
          mesReferencia: mesRefFinal,
          status: 'pendente',
          formaPagamento: 'pix',
          categoria: 'Mensalidade'
        });
      }
    }
  });

  const handleGerar = (e: React.FormEvent) => {
    e.preventDefault();

    if (cobrancasAGerar.length === 0) {
      alert('Nenhuma cobrança nova para gerar no período selecionado (todas já foram geradas previamente).');
      return;
    }

    const confirmou = window.confirm(
      `Confirma a geração de ${cobrancasAGerar.length} mensalidades no valor total de ${formatCurrency(valorTotalPrevisto)}?`
    );

    if (confirmou) {
      onGerarMensalidades(cobrancasAGerar);
      onClose();
    }
  };

  const mesExemplo = `${String(mesInicio).padStart(2, '0')}/${anoDestino}`;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl p-5 space-y-4 shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto">
        
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="text-lg font-extrabold text-slate-100 flex items-center gap-2">
            <Repeat className="w-5 h-5 text-indigo-400" />
            Gerar Mensalidades em Lote
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Descrição Informativa */}
        <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-xs text-indigo-200 space-y-1">
          <p className="font-bold flex items-center gap-1 text-indigo-300">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            Automação de Recorrência Mensal
          </p>
          <p className="text-[11px] text-slate-300">
            Gere automaticamente as mensalidades do sistema para todos os <strong>{clientes.length} clientes</strong> com vencimento todo <strong>dia {diaVencimento}</strong> no formato estrito <strong>MM/AAAA</strong>.
          </p>
        </div>

        <form onSubmit={handleGerar} className="space-y-4">
          
          {/* Seleção do Ano & Dia Vencimento */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Ano das Mensalidades
              </label>
              <select
                value={anoDestino}
                onChange={(e) => setAnoDestino(parseInt(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-100 focus:border-indigo-500"
              >
                {[anoAtual, anoAtual + 1, anoAtual + 2].map(ano => (
                  <option key={ano} value={ano}>
                    Ano de {ano} {ano === anoAtual ? '(Atual)' : '(Próximo Ano)'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Dia do Vencimento
              </label>
              <input
                type="number"
                min="1"
                max="31"
                value={diaVencimento}
                onChange={(e) => setDiaVencimento(parseInt(e.target.value) || 5)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-100 focus:border-indigo-500"
                required
              />
            </div>
          </div>

          {/* Período (Mês Inicial até Mês Final) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Mês Inicial
              </label>
              <select
                value={mesInicio}
                onChange={(e) => setMesInicio(parseInt(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs font-medium text-slate-100"
              >
                {MESES.map(m => (
                  <option key={m.val} value={m.val}>
                    {m.val} - {m.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Mês Final
              </label>
              <select
                value={mesFim}
                onChange={(e) => setMesFim(parseInt(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs font-medium text-slate-100"
              >
                {MESES.map(m => (
                  <option key={m.val} value={m.val}>
                    {m.val} - {m.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Formatação do Mês de Referência MM/AAAA */}
          <div className="p-3 bg-slate-950 border border-indigo-500/30 rounded-2xl space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                Formato do Mês de Referência (MM/AAAA)
              </label>
              <span className="text-[10px] font-extrabold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                {mesReferenciaManual.trim() || mesExemplo}
              </span>
            </div>
            
            <input
              type="text"
              value={mesReferenciaManual}
              onChange={(e) => setMesReferenciaManual(e.target.value)}
              placeholder={`Padrão automático: ${mesExemplo} (ex: 09/2026)`}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-bold text-indigo-300 placeholder-slate-500 focus:border-indigo-400"
            />
            <p className="text-[10px] text-slate-400">
              ✔ Cada mensalidade individual será salva com a sua referência estrita no formato <strong>MM/AAAA</strong> (ex: 08/2026, 09/2026, 10/2026).
            </p>
          </div>

          {/* Reajuste Anual (%) */}
          <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-amber-300 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-amber-400" />
                Reajuste Anual (%)
              </label>
              <span className="text-[10px] text-slate-400">
                {reajusteNum > 0 ? `+${reajusteNum}% aplicado` : 'Sem reajuste'}
              </span>
            </div>

            <input
              type="text"
              value={porcentagemReajuste}
              onChange={(e) => setPorcentagemReajuste(e.target.value)}
              placeholder="Ex: 8.5 ou 10"
              className="w-full bg-slate-900 border border-amber-500/40 rounded-xl px-3.5 py-2.5 text-sm font-extrabold text-amber-300 focus:border-amber-400"
            />
            <p className="text-[10px] text-slate-400 leading-tight">
              Informe a porcentagem de aumento anual (ex: <strong>10%</strong>). O sistema reajustará o valor das mensalidades automaticamente a partir do período selecionado.
            </p>
          </div>

          {/* Descrição Padrão */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Descrição dos Títulos
            </label>
            <input
              type="text"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:border-indigo-500"
              required
            />
          </div>

          {/* Painel de Prévia dos Resultados */}
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl space-y-1.5 text-xs">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Resumo da Geração em Lote
            </span>

            <div className="flex justify-between">
              <span className="text-slate-400">Total de Clientes Ativos:</span>
              <span className="font-bold text-slate-200">{clientes.length} clientes</span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-400">Mês Ref. Exemplo:</span>
              <span className="font-bold text-indigo-300">{mesReferenciaManual.trim() || mesExemplo}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-400">Novos Títulos a Criar:</span>
              <span className="font-extrabold text-emerald-400">{totalTitulosPrevistos} cobranças</span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-400">Já Existentes (Ignorados):</span>
              <span className="font-medium text-slate-500">{totalDuplicadosIgnorados} ignoradas</span>
            </div>

            <div className="flex justify-between pt-1 border-t border-slate-800">
              <span className="text-slate-300 font-bold">Valor Total a Faturar:</span>
              <span className="font-black text-indigo-400 text-sm">{formatCurrency(valorTotalPrevisto)}</span>
            </div>
          </div>

          {/* Botões de Ação */}
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
              disabled={cobrancasAGerar.length === 0}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 disabled:opacity-50 text-white text-xs font-extrabold shadow-lg shadow-indigo-600/40 hover:opacity-95 active:scale-95 transition-all flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              Gerar {totalTitulosPrevistos} Mensalidades
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
