import { Cliente, Cobranca, IndicadoresFinanceiros } from '../types';

const CLIENTES_STORAGE_KEY = 'cobranca_app_clientes_v1';
const COBRANCAS_STORAGE_KEY = 'cobranca_app_cobrancas_v1';
const CONFIG_STORAGE_KEY = 'cobranca_app_config_v1';

export interface AppConfig {
  nomeEmpresa: string;
  cnpjEmpresa: string;
  chavePixPadrao: string;
  diasAvisoVencimento: number;
}

export function formatCNPJ(cnpj: string): string {
  if (!cnpj) return '60.060.102/0001-24';
  const digits = cnpj.replace(/\D/g, '');
  if (digits.length === 14) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12, 14)}`;
  }
  return cnpj;
}

export function getTodayString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseDateToISO(dateStr: string): string {
  if (!dateStr) return getTodayString();
  if (dateStr.includes('/')) {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const day = parts[0].padStart(2, '0');
      const month = parts[1].padStart(2, '0');
      const year = parts[2];
      return `${year}-${month}-${day}`;
    }
  }
  return dateStr;
}

const defaultConfig: AppConfig = {
  nomeEmpresa: 'COMPUSERVE LTDA',
  cnpjEmpresa: '60.060.102/0001-24',
  chavePixPadrao: '60.060.102/0001-24',
  diasAvisoVencimento: 3
};

// Dados de demonstração inicial
const seedClientes: Cliente[] = [
  {
    id: 'cli-1',
    nome: 'Carlos Eduardo Silva',
    telefone: '(11) 98765-4321',
    email: 'carlos.silva@email.com',
    documento: '123.456.789-00',
    observacoes: 'Mensalidade do Sistema Compuserve',
    createdAt: '2026-07-01T10:00:00.000Z'
  },
  {
    id: 'cli-2',
    nome: 'Mariana Santos Fernandes',
    telefone: '(21) 99887-6655',
    email: 'mariana.santos@email.com',
    documento: '987.654.321-11',
    observacoes: 'Mensalidade do Sistema Compuserve',
    createdAt: '2026-07-15T14:30:00.000Z'
  }
];

const seedCobrancas: Cobranca[] = [
  {
    id: 'cob-1',
    clienteId: 'cli-1',
    clienteNome: 'Carlos Eduardo Silva',
    clienteTelefone: '(11) 98765-4321',
    descricao: 'Mensalidade do Sistema Compuserve',
    valor: 300.00,
    dataVencimento: '2026-08-05',
    status: 'atrasado',
    formaPagamento: 'pix',
    chavePix: '60.060.102/0001-24',
    categoria: 'Mensalidade',
    createdAt: '2026-07-01T10:00:00.000Z'
  }
];

export function updateOverdueStatuses(cobrancas: Cobranca[]): Cobranca[] {
  const currentDate = getTodayString();
  return cobrancas.map(c => {
    if (c.status === 'pago' || c.status === 'cancelado') return c;

    const isoVenc = parseDateToISO(c.dataVencimento);
    if (isoVenc <= currentDate) {
      return { ...c, status: 'atrasado' as const };
    } else {
      return { ...c, status: 'pendente' as const };
    }
  });
}

// Integramos sincronização com o Neon PostgreSQL (Vercel Serverless Function /api/db)
export async function syncWithNeonDatabase() {
  try {
    const res = await fetch('/api/db');
    if (!res.ok) return null;
    const data = await res.json();
    if (data && data.connected) {
      if (Array.isArray(data.clientes) && data.clientes.length > 0) {
        saveClientes(data.clientes, false);
      }
      if (Array.isArray(data.cobrancas) && data.cobrancas.length > 0) {
        saveCobrancas(data.cobrancas, false);
      }
      if (data.config) {
        saveConfig(data.config, false);
      }
      return data;
    }
  } catch (err) {
    // Ambiente local sem backend de produção
  }
  return null;
}

export async function pushToNeonDatabase() {
  try {
    const config = getConfig();
    const clientes = getClientes();
    const cobrancas = getCobrancas();

    await fetch('/api/db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ config, clientes, cobrancas })
    });
  } catch (err) {
    // Falha silenciosa em caso de offline
  }
}

export function getClientes(): Cliente[] {
  try {
    const data = localStorage.getItem(CLIENTES_STORAGE_KEY);
    if (!data) {
      localStorage.setItem(CLIENTES_STORAGE_KEY, JSON.stringify(seedClientes));
      return seedClientes;
    }
    return JSON.parse(data);
  } catch (err) {
    console.error('Erro ao ler clientes do LocalStorage:', err);
    return seedClientes;
  }
}

export function saveClientes(clientes: Cliente[], triggerSync = true): void {
  localStorage.setItem(CLIENTES_STORAGE_KEY, JSON.stringify(clientes));
  if (triggerSync) {
    pushToNeonDatabase();
  }
}

export function getCobrancas(): Cobranca[] {
  try {
    const data = localStorage.getItem(COBRANCAS_STORAGE_KEY);
    let list: Cobranca[] = seedCobrancas;
    if (data) {
      list = JSON.parse(data);
    } else {
      localStorage.setItem(COBRANCAS_STORAGE_KEY, JSON.stringify(seedCobrancas));
    }

    const updatedList = updateOverdueStatuses(list);
    if (JSON.stringify(updatedList) !== JSON.stringify(list)) {
      saveCobrancas(updatedList, false);
    }

    return updatedList;
  } catch (err) {
    console.error('Erro ao ler cobranças do LocalStorage:', err);
    return seedCobrancas;
  }
}

export function saveCobrancas(cobrancas: Cobranca[], triggerSync = true): void {
  localStorage.setItem(COBRANCAS_STORAGE_KEY, JSON.stringify(cobrancas));
  if (triggerSync) {
    pushToNeonDatabase();
  }
}

export function getConfig(): AppConfig {
  try {
    const data = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (!data) {
      localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(defaultConfig));
      return defaultConfig;
    }
    const parsed = JSON.parse(data);
    const cnpj = formatCNPJ(parsed.cnpjEmpresa || '60.060.102/0001-24');
    const updatedConfig = {
      nomeEmpresa: parsed.nomeEmpresa || 'COMPUSERVE LTDA',
      cnpjEmpresa: cnpj,
      chavePixPadrao: formatCNPJ(parsed.chavePixPadrao || '60.060.102/0001-24'),
      diasAvisoVencimento: parsed.diasAvisoVencimento || 3
    };
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(updatedConfig));
    return updatedConfig;
  } catch (err) {
    return defaultConfig;
  }
}

export function saveConfig(config: AppConfig, triggerSync = true): void {
  localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
  if (triggerSync) {
    pushToNeonDatabase();
  }
}

export function calcularIndicadores(cobrancas: Cobranca[]): IndicadoresFinanceiros {
  let totalAReceber = 0;
  let totalRecebido = 0;
  let totalEmAtraso = 0;
  let qtdPendentes = 0;
  let qtdPagos = 0;
  let qtdAtrasados = 0;

  cobrancas.forEach(c => {
    if (c.status === 'pago') {
      totalRecebido += c.valor;
      qtdPagos++;
    } else if (c.status === 'atrasado') {
      totalEmAtraso += c.valor;
      qtdAtrasados++;
    } else if (c.status === 'pendente') {
      totalAReceber += c.valor;
      qtdPendentes++;
    }
  });

  const totalGeral = qtdPendentes + qtdPagos + qtdAtrasados;
  const taxaInadimplencia = totalGeral > 0 ? (qtdAtrasados / totalGeral) * 100 : 0;

  return {
    totalAReceber,
    totalRecebido,
    totalEmAtraso,
    qtdPendentes,
    qtdPagos,
    qtdAtrasados,
    taxaInadimplencia
  };
}
