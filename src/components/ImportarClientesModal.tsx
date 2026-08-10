import React, { useState } from 'react';
import { X, Upload, FileSpreadsheet, Download, HelpCircle } from 'lucide-react';
import { Cliente, Cobranca } from '../types';
import { formatCurrency } from '../utils/whatsapp';

interface ImportarClientesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportarSucesso: (novosClientes: Omit<Cliente, 'id' | 'createdAt'>[], novasCobrancas: Omit<Cobranca, 'id' | 'createdAt'>[]) => void;
}

interface ItemPreview {
  nome: string;
  telefone: string;
  documento?: string;
  valor?: number;
  dataVencimento?: string;
  descricao?: string;
  valido: boolean;
  erro?: string;
}

export const ImportarClientesModal: React.FC<ImportarClientesModalProps> = ({
  isOpen,
  onClose,
  onImportarSucesso
}) => {
  if (!isOpen) return null;

  const [previewList, setPreviewList] = useState<ItemPreview[]>([]);
  const [nomeArquivo, setNomeArquivo] = useState<string>('');

  const parseCSV = (content: string) => {
    const lines = content.split(/\r\n|\n/).filter(line => line.trim() !== '');
    if (lines.length === 0) return [];

    const firstLine = lines[0];
    let separator = ',';
    if (firstLine.includes(';')) separator = ';';
    else if (firstLine.includes('\t')) separator = '\t';

    const headers = lines[0].split(separator).map(h => h.trim().toLowerCase().replace(/["']/g, ''));

    const idxNome = headers.findIndex(h => h.includes('nome') || h.includes('cliente') || h.includes('razao') || h.includes('devedor'));
    const idxTelefone = headers.findIndex(h => h.includes('tel') || h.includes('whats') || h.includes('cel') || h.includes('fone') || h.includes('contato'));
    const idxDoc = headers.findIndex(h => h.includes('cpf') || h.includes('cnpj') || h.includes('doc'));
    const idxValor = headers.findIndex(h => h.includes('valor') || h.includes('quantia') || h.includes('debito') || h.includes('total'));
    const idxVenc = headers.findIndex(h => h.includes('venc') || h.includes('data'));
    const idxDesc = headers.findIndex(h => h.includes('desc') || h.includes('servico') || h.includes('obs'));

    const parsed: ItemPreview[] = [];

    for (let i = 1; i < lines.length; i++) {
      const row = lines[i].split(separator).map(col => col.trim().replace(/^["']|["']$/g, ''));
      if (row.length === 0 || (row.length === 1 && !row[0])) continue;

      const nome = idxNome !== -1 ? row[idxNome] : row[0] || '';
      const telefone = idxTelefone !== -1 ? row[idxTelefone] : row[1] || '';
      const documento = idxDoc !== -1 ? row[idxDoc] : row[2] || '';
      const valorStr = idxValor !== -1 ? row[idxValor] : '';
      const vencStr = idxVenc !== -1 ? row[idxVenc] : '';
      const descStr = idxDesc !== -1 ? row[idxDesc] : '';

      let valorNum: number | undefined = undefined;
      if (valorStr) {
        const cleanVal = valorStr.replace('R$', '').replace(/\./g, '').replace(',', '.').trim();
        const n = parseFloat(cleanVal);
        if (!isNaN(n) && n > 0) valorNum = n;
      }

      let dataVenc: string | undefined = undefined;
      if (vencStr) {
        if (vencStr.includes('/')) {
          const parts = vencStr.split('/');
          if (parts.length === 3) {
            dataVenc = `${parts[2].padStart(4, '20')}-${parts[1].padStart(2, '0')}-05`;
          }
        } else if (vencStr.includes('-')) {
          const parts = vencStr.split('-');
          if (parts.length === 3) {
            dataVenc = `${parts[0]}-${parts[1]}-05`;
          }
        }
      }

      const itemValido = nome.length >= 2;
      const today = new Date();
      const defaultVenc05 = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-05`;

      parsed.push({
        nome: nome || 'Sem Nome',
        telefone: telefone || '(00) 00000-0000',
        documento: documento || undefined,
        valor: valorNum,
        dataVencimento: dataVenc || defaultVenc05,
        descricao: descStr || (valorNum ? 'Mensalidade do Sistema Compuserve' : undefined),
        valido: itemValido,
        erro: !itemValido ? 'Nome do cliente é obrigatório' : undefined
      });
    }

    return parsed;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setNomeArquivo(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      const parsed = parseCSV(text);
      setPreviewList(parsed);
    };
    reader.readAsText(file, 'ISO-8859-1');
  };

  const handleBaixarExemploCSV = () => {
    const csvTemplate = "Nome;Telefone;CPF_CNPJ;Valor;DataVencimento;Descricao\n" +
      "Mariana Souza;(11) 98888-7777;123.456.789-00;150,00;20/08/2026;Mensalidade do Sistema Compuserve\n" +
      "Empresa Exemplo Ltda;(21) 99999-1111;12.345.678/0001-90;500,00;25/08/2026;Mensalidade do Sistema Compuserve\n" +
      "Carlos Ribeiro;(31) 97777-2222;987.654.321-11;;;";

    const blob = new Blob(['\uFEFF' + csvTemplate], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'modelo_importacao_clientes.csv';
    link.click();
  };

  const handleConfirmarImportacao = () => {
    const validos = previewList.filter(p => p.valido);
    if (validos.length === 0) {
      alert('Nenhum item válido para importar.');
      return;
    }

    const novosClientes: Omit<Cliente, 'id' | 'createdAt'>[] = [];
    const novasCobrancas: Omit<Cobranca, 'id' | 'createdAt'>[] = [];

    validos.forEach(item => {
      novosClientes.push({
        nome: item.nome,
        telefone: item.telefone,
        documento: item.documento,
        observacoes: 'Mensalidade do Sistema Compuserve'
      });

      if (item.valor && item.valor > 0) {
        novasCobrancas.push({
          clienteId: '',
          clienteNome: item.nome,
          clienteTelefone: item.telefone,
          descricao: item.descricao || 'Mensalidade do Sistema Compuserve',
          valor: item.valor,
          dataVencimento: item.dataVencimento || new Date().toISOString().split('T')[0],
          status: 'pendente',
          formaPagamento: 'pix',
          categoria: 'Mensalidade'
        });
      }
    });

    onImportarSucesso(novosClientes, novasCobrancas);
    onClose();
  };

  const qtdValidos = previewList.filter(p => p.valido).length;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl p-5 space-y-4 shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto">
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="text-lg font-extrabold text-slate-100 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
            Importar Clientes do Excel (.csv)
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Instruções & Modelo Exemplo */}
        <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-indigo-300 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-indigo-400" />
              Como importar do Excel?
            </span>
            <button
              onClick={handleBaixarExemploCSV}
              className="text-[11px] font-bold text-emerald-400 hover:underline flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" />
              Baixar Planilha Modelo (.csv)
            </button>
          </div>
          <p className="text-slate-300 text-[11px] leading-relaxed">
            No Excel, clique em **Salvar Como** e escolha o formato **CSV (Separado por vírgulas ou ponto e vírgula)**. A planilha pode ter colunas com **Nome**, **Telefone**, **CPF/CNPJ**, **Valor** e **Data de Vencimento**.
          </p>
        </div>

        {/* Upload Button */}
        <div>
          <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-700 hover:border-emerald-500 rounded-2xl cursor-pointer bg-slate-950/60 hover:bg-slate-950 transition-all">
            <Upload className="w-8 h-8 text-emerald-400 mb-2" />
            <span className="text-sm font-bold text-slate-200">
              {nomeArquivo ? nomeArquivo : 'Clique para selecionar o arquivo Excel (.csv)'}
            </span>
            <span className="text-xs text-slate-500 mt-1">
              Suporta arquivos .csv exportados do Excel ou Google Sheets
            </span>
            <input
              type="file"
              accept=".csv,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>

        {/* Prévia da Importação */}
        {previewList.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-200">
                Prévia dos dados identificados ({qtdValidos} válidos)
              </span>
              <span className="text-slate-400 text-[11px]">
                {previewList.length} linhas lidas
              </span>
            </div>

            <div className="max-h-48 overflow-y-auto border border-slate-800 rounded-xl bg-slate-950 p-2 space-y-1.5 text-xs">
              {previewList.map((item, idx) => (
                <div 
                  key={idx} 
                  className={`p-2 rounded-lg border flex items-center justify-between ${
                    item.valido 
                      ? 'bg-slate-900 border-slate-800 text-slate-200' 
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  }`}
                >
                  <div className="space-y-0.5 max-w-[280px] truncate">
                    <p className="font-bold truncate">{item.nome}</p>
                    <p className="text-[11px] text-slate-400 truncate">
                      {item.telefone} {item.documento ? `• ${item.documento}` : ''}
                    </p>
                  </div>

                  <div className="text-right">
                    {item.valor ? (
                      <span className="font-bold text-emerald-400 text-xs">
                        {formatCurrency(item.valor)}
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-500">Sem valor</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Botões de Ação */}
        <div className="pt-2 flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
          >
            Cancelar
          </button>

          <button
            type="button"
            disabled={qtdValidos === 0}
            onClick={handleConfirmarImportacao}
            className={`flex-1 py-3 px-4 rounded-xl font-extrabold text-xs shadow-lg transition-all ${
              qtdValidos > 0 
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/40 active:scale-95' 
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            Confirmar Importação de {qtdValidos} Cliente(s)
          </button>
        </div>
      </div>
    </div>
  );
};
