export type StatusCobranca = 'pendente' | 'pago' | 'atrasado' | 'cancelado';

export type FormaPagamento = 'pix' | 'boleto' | 'cartao' | 'dinheiro';

export interface Cliente {
  id: string;
  nome: string;
  telefone: string;
  email?: string;
  documento?: string; // CPF ou CNPJ
  observacoes?: string;
  createdAt: string;
}

export interface Cobranca {
  id: string;
  clienteId: string;
  clienteNome: string;
  clienteTelefone: string;
  clienteDocumento?: string; // CPF ou CNPJ do cliente
  descricao: string;
  valor: number;
  dataVencimento: string; // ISO String (YYYY-MM-DD)
  dataPagamento?: string;
  mesReferencia?: string; // Ex: "07/2026", "08/2026" ou "Julho/2026"
  status: StatusCobranca;
  formaPagamento: FormaPagamento;
  chavePix?: string;
  categoria?: string;
  parcelaAtual?: number;
  totalParcelas?: number;
  createdAt: string;
}

export interface HistoricoPagamento {
  id: string;
  cobrancaId: string;
  valorPago: number;
  data: string;
  observacao?: string;
}

export type WhatsAppTemplateType = 
  | 'lembrete_amigavel'
  | 'dia_vencimento'   
  | 'em_atraso'        
  | 'recibo';          

export type TabType = 'dashboard' | 'cobrancas' | 'clientes' | 'relatorios' | 'config';

export interface IndicadoresFinanceiros {
  totalAReceber: number;
  totalRecebido: number;
  totalEmAtraso: number;
  qtdPendentes: number;
  qtdPagos: number;
  qtdAtrasados: number;
  taxaInadimplencia: number;
}
