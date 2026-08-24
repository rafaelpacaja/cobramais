import { Cliente, Cobranca, IndicadoresFinanceiros, Usuario } from '../types';

const CLIENTES_STORAGE_KEY = 'cobranca_app_clientes_v1';
const COBRANCAS_STORAGE_KEY = 'cobranca_app_cobrancas_v1';
const CONFIG_STORAGE_KEY = 'cobranca_app_config_v1';
const USUARIO_STORAGE_KEY = 'cobranca_app_usuario_v1';

export interface AppConfig {
  nomeEmpresa: string;
  cnpjEmpresa: string;
  chavePixPadrao: string;
  diasAvisoVencimento: number;
  categorias?: string[];
}

export const DEFAULT_CATEGORIAS: string[] = [
  'Serviços',
  'Vendas de Produtos',
  'Consultoria',
  'Mensalidade',
  'Semestre',
  'Anuidade',
  'Outros'
];

export function getUsuarioLogado(): Usuario | null {
  try {
    const data = localStorage.getItem(USUARIO_STORAGE_KEY);
    if (!data) return null;
    return JSON.parse(data);
  } catch (err) {
    return null;
  }
}

export function saveUsuarioLogado(usuario: Usuario): void {
  localStorage.setItem(USUARIO_STORAGE_KEY, JSON.stringify(usuario));
}

export function logoutUsuario(): void {
  localStorage.removeItem(USUARIO_STORAGE_KEY);
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
  diasAvisoVencimento: 3,
  categorias: DEFAULT_CATEGORIAS
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
    let venc = c.dataVencimento;
    // As mensalidades vencem rigorosamente no dia 05 de cada mês
    if (venc && venc.includes('-')) {
      const parts = venc.split('-');
      if (parts.length === 3 && parts[2] !== '05') {
        venc = `${parts[0]}-${parts[1]}-05`;
      }
    }

    const itemCorrigido = venc !== c.dataVencimento ? { ...c, dataVencimento: venc } : c;

    if (itemCorrigido.status === 'pago' || itemCorrigido.status === 'cancelado') return itemCorrigido;

    const isoVenc = parseDateToISO(itemCorrigido.dataVencimento);
    if (isoVenc <= currentDate) {
      return { ...itemCorrigido, status: 'atrasado' as const };
    } else {
      return { ...itemCorrigido, status: 'pendente' as const };
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
        const localConfig = getConfig();
        const mergedCatMap = new Map<string, string>();
        [...DEFAULT_CATEGORIAS, ...(localConfig.categorias || []), ...(data.config.categorias || [])].forEach(c => {
          if (typeof c === 'string') {
            const trimmed = c.trim();
            if (trimmed && !mergedCatMap.has(trimmed.toLowerCase())) {
              mergedCatMap.set(trimmed.toLowerCase(), trimmed);
            }
          }
        });
        const mergedConfig: AppConfig = {
          ...data.config,
          categorias: Array.from(mergedCatMap.values())
        };
        saveConfig(mergedConfig, false);
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

export async function deleteCobrancaFromNeon(cobrancaId: string) {
  try {
    await fetch('/api/db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete_cobranca', cobrancaId })
    });
  } catch (err) {
    // Falha silenciosa em caso de offline
  }
}

export async function deleteClienteFromNeon(clienteId: string) {
  try {
    await fetch('/api/db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete_cliente', clienteId })
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
    
    // Processa categorias
    let categorias: string[] = Array.isArray(parsed.categorias) && parsed.categorias.length > 0 
      ? parsed.categorias 
      : DEFAULT_CATEGORIAS;

    // Garantir que categorias padrão não se percam e não hajam duplicatas
    const catMap = new Map<string, string>();
    [...DEFAULT_CATEGORIAS, ...categorias].forEach(c => {
      const trimmed = c.trim();
      if (trimmed && !catMap.has(trimmed.toLowerCase())) {
        catMap.set(trimmed.toLowerCase(), trimmed);
      }
    });
    categorias = Array.from(catMap.values());

    const updatedConfig: AppConfig = {
      nomeEmpresa: parsed.nomeEmpresa || 'COMPUSERVE LTDA',
      cnpjEmpresa: cnpj,
      chavePixPadrao: formatCNPJ(parsed.chavePixPadrao || '60.060.102/0001-24'),
      diasAvisoVencimento: parsed.diasAvisoVencimento || 3,
      categorias
    };
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(updatedConfig));
    return updatedConfig;
  } catch (err) {
    return defaultConfig;
  }
}

export function saveConfig(config: AppConfig, triggerSync = true): void {
  let categoriasToSave = config.categorias;
  if (!Array.isArray(categoriasToSave) || categoriasToSave.length === 0) {
    try {
      const existing = localStorage.getItem(CONFIG_STORAGE_KEY);
      if (existing) {
        const parsed = JSON.parse(existing);
        if (Array.isArray(parsed.categorias) && parsed.categorias.length > 0) {
          categoriasToSave = parsed.categorias;
        }
      }
    } catch (e) {}
  }

  if (!Array.isArray(categoriasToSave) || categoriasToSave.length === 0) {
    categoriasToSave = DEFAULT_CATEGORIAS;
  }

  const fullConfig: AppConfig = {
    ...config,
    categorias: categoriasToSave
  };

  localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(fullConfig));
  if (triggerSync) {
    pushToNeonDatabase();
  }
}

export function addCategoriaToConfig(novaCategoria: string): AppConfig {
  const currentConfig = getConfig();
  const trimmed = novaCategoria.trim();
  if (!trimmed) return currentConfig;

  const list = currentConfig.categorias || DEFAULT_CATEGORIAS;
  if (!list.some(c => c.toLowerCase() === trimmed.toLowerCase())) {
    const updatedCategorias = [...list, trimmed];
    const updatedConfig = { ...currentConfig, categorias: updatedCategorias };
    saveConfig(updatedConfig);
    return updatedConfig;
  }
  return currentConfig;
}

export function renomearCategoriaInConfig(categoriaAntiga: string, categoriaNova: string): AppConfig {
  const currentConfig = getConfig();
  const list = currentConfig.categorias || DEFAULT_CATEGORIAS;
  const antigaTrim = categoriaAntiga.trim().toLowerCase();
  const novaTrim = categoriaNova.trim();

  if (!novaTrim || antigaTrim === novaTrim.toLowerCase()) return currentConfig;

  const updatedCategorias = list.map(c => 
    c.trim().toLowerCase() === antigaTrim ? novaTrim : c
  );

  const updatedConfig = { ...currentConfig, categorias: updatedCategorias };
  saveConfig(updatedConfig);

  // Renomeia também nas cobranças existentes
  try {
    const cobrancas = getCobrancas();
    let modified = false;
    const updatedCobrancas = cobrancas.map(cob => {
      if (cob.categoria && cob.categoria.trim().toLowerCase() === antigaTrim) {
        modified = true;
        return { ...cob, categoria: novaTrim };
      }
      return cob;
    });

    if (modified) {
      saveCobrancas(updatedCobrancas);
    }
  } catch (err) {
    console.error('Erro ao renomear categoria nas cobranças:', err);
  }

  return updatedConfig;
}

export function removeCategoriaFromConfig(categoriaParaRemover: string): AppConfig {
  const currentConfig = getConfig();
  const list = currentConfig.categorias || DEFAULT_CATEGORIAS;
  const updatedCategorias = list.filter(c => c.toLowerCase() !== categoriaParaRemover.trim().toLowerCase());
  const updatedConfig = { ...currentConfig, categorias: updatedCategorias.length > 0 ? updatedCategorias : DEFAULT_CATEGORIAS };
  saveConfig(updatedConfig);
  return updatedConfig;
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
