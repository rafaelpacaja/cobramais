import React, { useState, useEffect } from 'react';
import { 
  getClientes, 
  saveClientes, 
  getCobrancas, 
  saveCobrancas, 
  getConfig, 
  saveConfig, 
  calcularIndicadores,
  updateOverdueStatuses,
  syncWithNeonDatabase,
  pushToNeonDatabase,
  getUsuarioLogado,
  saveUsuarioLogado,
  logoutUsuario,
  deleteCobrancaFromNeon,
  deleteClienteFromNeon,
  AppConfig 
} from './services/storage';
import { Cliente, Cobranca, FormaPagamento, TabType, Usuario } from './types';
import { formatCurrency } from './utils/whatsapp';

// Componentes
import { Header } from './components/Header';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { CobrancaList } from './components/CobrancaList';
import { ClienteList } from './components/ClienteList';
import { RelatoriosView } from './components/RelatoriosView';
import { ConfigView } from './components/ConfigView';
import { AuthScreen } from './components/AuthScreen';

// Modais
import { NovaCobrancaModal } from './components/NovaCobrancaModal';
import { NovoClienteModal } from './components/NovoClienteModal';
import { EditarClienteModal } from './components/EditarClienteModal';
import { EditarCobrancaModal } from './components/EditarCobrancaModal';
import { BaixarCobrancaModal } from './components/BaixarCobrancaModal';
import { GerarMensalidadesRecorrentesModal } from './components/GerarMensalidadesRecorrentesModal';
import { WhatsAppModal } from './components/WhatsAppModal';
import { ReciboModal } from './components/ReciboModal';
import { ImportarClientesModal } from './components/ImportarClientesModal';
import { RelatorioBaixadasPDFModal, TipoRelatorioPDF } from './components/RelatorioBaixadasPDFModal';
import { ExcluirCobrancasModal } from './components/ExcluirCobrancasModal';
import { ReciboAvulsoModal } from './components/ReciboAvulsoModal';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  
  // Estado do Usuário Logado
  const [usuario, setUsuario] = useState<Usuario | null>(getUsuarioLogado());

  // Estado dos Dados
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [cobrancas, setCobrancas] = useState<Cobranca[]>([]);
  const [config, setConfig] = useState<AppConfig>(getConfig());

  // Modais State
  const [isNovaCobrancaOpen, setIsNovaCobrancaOpen] = useState(false);
  const [isGerarMensalidadesOpen, setIsGerarMensalidadesOpen] = useState(false);
  const [isNovoClienteOpen, setIsNovoClienteOpen] = useState(false);
  const [clienteParaEditar, setClienteParaEditar] = useState<Cliente | null>(null);
  const [isImportarExcelOpen, setIsImportarExcelOpen] = useState(false);
  const [cobrancaParaEditar, setCobrancaParaEditar] = useState<Cobranca | null>(null);
  const [cobrancaParaBaixar, setCobrancaParaBaixar] = useState<Cobranca | null>(null);
  const [whatsAppCobranca, setWhatsAppCobranca] = useState<Cobranca | null>(null);
  const [reciboCobranca, setReciboCobranca] = useState<Cobranca | null>(null);
  const [clientePreSelecionado, setClientePreSelecionado] = useState<Cliente | null>(null);
  const [reciboConfetti, setReciboConfetti] = useState(false);
  const [isRelatorioPDFOpen, setIsRelatorioPDFOpen] = useState(false);
  const [tipoRelatorioPDF, setTipoRelatorioPDF] = useState<TipoRelatorioPDF>('quitadas');
  const [cobrancasParaPDF, setCobrancasParaPDF] = useState<Cobranca[]>([]);
  const [subtituloPeriodoPDF, setSubtituloPeriodoPDF] = useState<string>('');
  const [cobrancaParaExcluir, setCobrancaParaExcluir] = useState<Cobranca | null>(null);
  const [isReciboAvulsoOpen, setIsReciboAvulsoOpen] = useState(false);

  // Carrega dados iniciais do LocalStorage e sincroniza com o Neon Database
  useEffect(() => {
    const listClientes = getClientes();
    const updatedClientes = listClientes.map(cli => {
      const nomeLimpo = cli.nome.replace(/\s*\([^)]*\)/g, '').trim();
      let tel = cli.telefone;
      if (tel && (tel.includes(',') || tel.includes('R$'))) {
        tel = '';
      }
      return {
        ...cli,
        nome: nomeLimpo,
        telefone: tel,
        observacoes: cli.observacoes || 'Mensalidade do Sistema Compuserve'
      };
    });

    const listCobrancas = getCobrancas();
    const updatedCobrancas = updateOverdueStatuses(listCobrancas.map(c => {
      let modified = false;
      let newDesc = c.descricao;
      let newCat = c.categoria;
      const nomeLimpo = c.clienteNome.replace(/\s*\([^)]*\)/g, '').trim();

      if (c.clienteNome !== nomeLimpo) {
        modified = true;
      }
      if (c.descricao === 'Cobrança Importada' || c.descricao === 'Serviços Prestados') {
        newDesc = 'Mensalidade do Sistema Compuserve';
        modified = true;
      }
      if (c.categoria === 'Importado') {
        newCat = 'Mensalidade';
        modified = true;
      }

      return modified ? { ...c, clienteNome: nomeLimpo, descricao: newDesc, categoria: newCat } : c;
    }));

    setClientes(updatedClientes);
    setCobrancas(updatedCobrancas);
    saveClientes(updatedClientes, false);
    saveCobrancas(updatedCobrancas, false);
    setConfig(getConfig());

    // Sincroniza em segundo plano com o banco Neon no Vercel
    syncWithNeonDatabase().then(neonRes => {
      if (neonRes && neonRes.connected) {
        setClientes(getClientes());
        setCobrancas(getCobrancas());
        setConfig(getConfig());
      } else {
        pushToNeonDatabase();
      }
    });
  }, []);

  const handleLoginSuccess = (userObj: Usuario) => {
    saveUsuarioLogado(userObj);
    setUsuario(userObj);

    if (userObj.empresa) {
      const cfg = getConfig();
      const updatedConfig = {
        ...cfg,
        nomeEmpresa: userObj.empresa,
        cnpjEmpresa: userObj.cnpj || cfg.cnpjEmpresa
      };
      setConfig(updatedConfig);
      saveConfig(updatedConfig);
    }
  };

  const handleLogout = () => {
    if (confirm('Deseja realmente sair da sua conta no CobraMais?')) {
      logoutUsuario();
      setUsuario(null);
    }
  };

  if (!usuario) {
    return <AuthScreen onLoginSuccess={handleLoginSuccess} />;
  }

  const indicadores = calcularIndicadores(cobrancas);

  const handleSalvarCobranca = (novas: Omit<Cobranca, 'id' | 'createdAt'>[]) => {
    const listToSave: Cobranca[] = [...cobrancas];
    novas.forEach((item, index) => {
      const selectedCli = clientes.find(c => c.id === item.clienteId);
      const uniqueId = `cob-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 6)}`;
      const nova: Cobranca = {
        ...item,
        clienteNome: item.clienteNome.replace(/\s*\([^)]*\)/g, '').trim(),
        clienteDocumento: selectedCli?.documento || item.clienteDocumento,
        id: uniqueId,
        createdAt: new Date().toISOString()
      };
      listToSave.unshift(nova);
    });
    const updated = updateOverdueStatuses(listToSave);
    setCobrancas(updated);
    saveCobrancas(updated);
    setClientePreSelecionado(null);
  };

  const handleGerarMensalidadesLote = (novasData: Omit<Cobranca, 'id' | 'createdAt'>[]) => {
    const listToSave: Cobranca[] = [...cobrancas];
    novasData.forEach((item, index) => {
      const selectedCli = clientes.find(c => c.id === item.clienteId || c.nome === item.clienteNome);
      const uniqueId = `cob-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 6)}`;
      const nova: Cobranca = {
        ...item,
        clienteNome: item.clienteNome.replace(/\s*\([^)]*\)/g, '').trim(),
        clienteDocumento: selectedCli?.documento || item.clienteDocumento,
        id: uniqueId,
        createdAt: new Date().toISOString()
      };
      listToSave.unshift(nova);
    });
    const updated = updateOverdueStatuses(listToSave);
    setCobrancas(updated);
    saveCobrancas(updated);
    alert(`Sucesso! ${novasData.length} mensalidade(s) recorrente(s) foram geradas!`);
  };

  const handleSalvarEdicaoCobranca = (cobrancaAtualizada: Cobranca) => {
    const selectedCli = clientes.find(c => c.id === cobrancaAtualizada.clienteId);
    const itemComDoc: Cobranca = {
      ...cobrancaAtualizada,
      clienteNome: cobrancaAtualizada.clienteNome.replace(/\s*\([^)]*\)/g, '').trim(),
      clienteDocumento: selectedCli?.documento || cobrancaAtualizada.clienteDocumento
    };
    const updated = updateOverdueStatuses(cobrancas.map(c => c.id === itemComDoc.id ? itemComDoc : c));
    setCobrancas(updated);
    saveCobrancas(updated);
    setCobrancaParaEditar(null);
  };

  const handleConfirmarBaixaComMesRef = (
    cobrancaIds: string[], 
    dadosBaixa: { mesReferencia?: string; dataPagamento: string; formaPagamento: FormaPagamento }
  ) => {
    let cobrancasQuitadas: Cobranca[] = [];
    const updated = cobrancas.map(c => {
      if (cobrancaIds.includes(c.id)) {
        const mesRefFinal = dadosBaixa.mesReferencia || c.mesReferencia || (c.dataVencimento ? `${c.dataVencimento.split('-')[1]}/${c.dataVencimento.split('-')[0]}` : '');
        const item: Cobranca = {
          ...c,
          status: 'pago' as const,
          mesReferencia: mesRefFinal,
          dataPagamento: dadosBaixa.dataPagamento,
          formaPagamento: dadosBaixa.formaPagamento
        };
        cobrancasQuitadas.push(item);
        return item;
      }
      return c;
    });

    setCobrancas(updated);
    saveCobrancas(updated);

    if (cobrancasQuitadas.length > 0) {
      const ultimaQuitada = cobrancasQuitadas[0];
      const selectedCli = clientes.find(cli => cli.id === ultimaQuitada.clienteId || cli.nome === ultimaQuitada.clienteNome);
      const targetUpdated: Cobranca = {
        ...ultimaQuitada,
        clienteDocumento: ultimaQuitada.clienteDocumento || selectedCli?.documento
      };
      setReciboCobranca(targetUpdated);
      setReciboConfetti(true);
    }
  };

  const handleSalvarCliente = (novoClienteData: Omit<Cliente, 'id' | 'createdAt'>) => {
    const novo: Cliente = {
      ...novoClienteData,
      nome: novoClienteData.nome.replace(/\s*\([^)]*\)/g, '').trim(),
      id: `cli-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      createdAt: new Date().toISOString()
    };
    const updated = [novo, ...clientes];
    setClientes(updated);
    saveClientes(updated);
  };

  const handleSalvarEdicaoCliente = (clienteAtualizado: Cliente) => {
    const nomeLimpo = clienteAtualizado.nome.replace(/\s*\([^)]*\)/g, '').trim();
    const cliLimpo = { ...clienteAtualizado, nome: nomeLimpo };

    const updatedClientes = clientes.map(c => c.id === cliLimpo.id ? cliLimpo : c);
    setClientes(updatedClientes);
    saveClientes(updatedClientes);

    const updatedCobrancas = cobrancas.map(cob => {
      if (cob.clienteId === cliLimpo.id || cob.clienteNome.toLowerCase() === cliLimpo.nome.toLowerCase()) {
        return {
          ...cob,
          clienteNome: cliLimpo.nome,
          clienteTelefone: cliLimpo.telefone,
          clienteDocumento: cliLimpo.documento
        };
      }
      return cob;
    });
    setCobrancas(updatedCobrancas);
    saveCobrancas(updatedCobrancas);

    setClienteParaEditar(null);
  };

  const handleImportarSucesso = (
    novosClientesData: Omit<Cliente, 'id' | 'createdAt'>[],
    novasCobrancasData: Omit<Cobranca, 'id' | 'createdAt'>[]
  ) => {
    const novosClientes: Cliente[] = [];
    const clienteIdMap: Record<string, string> = {};
    const clienteDocMap: Record<string, string | undefined> = {};

    novosClientesData.forEach((item, idx) => {
      const nomeLimpo = item.nome.replace(/\s*\([^)]*\)/g, '').trim();
      const id = `cli-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 5)}`;
      clienteIdMap[nomeLimpo] = id;
      clienteDocMap[nomeLimpo] = item.documento;
      novosClientes.push({
        ...item,
        nome: nomeLimpo,
        id,
        createdAt: new Date().toISOString()
      });
    });

    const novasCobrancas: Cobranca[] = [];
    novasCobrancasData.forEach((cob, idx) => {
      const nomeLimpo = cob.clienteNome.replace(/\s*\([^)]*\)/g, '').trim();
      const matchedId = clienteIdMap[nomeLimpo] || '';
      const matchedDoc = clienteDocMap[nomeLimpo] || cob.clienteDocumento;
      novasCobrancas.push({
        ...cob,
        clienteNome: nomeLimpo,
        id: `cob-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 5)}`,
        clienteId: matchedId,
        clienteDocumento: matchedDoc,
        createdAt: new Date().toISOString()
      });
    });

    const updatedClientes = [...novosClientes, ...clientes];
    const updatedCobrancas = updateOverdueStatuses([...novasCobrancas, ...cobrancas]);

    setClientes(updatedClientes);
    setCobrancas(updatedCobrancas);
    saveClientes(updatedClientes);
    saveCobrancas(updatedCobrancas);
  };

  const handleMarcarComoPago = (cobrancaId: string) => {
    const target = cobrancas.find(c => c.id === cobrancaId);
    if (target) {
      setCobrancaParaBaixar(target);
    }
  };

  const handleMarcarComoCancelado = (cobrancaId: string) => {
    const updated = cobrancas.map(c => c.id === cobrancaId ? { ...c, status: 'cancelado' as const } : c);
    setCobrancas(updated);
    saveCobrancas(updated);
  };

  const handleDeletarCobranca = (cobrancaId: string) => {
    const cob = cobrancas.find(c => c.id === cobrancaId);
    if (cob) {
      setCobrancaParaExcluir(cob);
    }
  };

  const handleConfirmarExclusaoMultipla = (cobrancaIds: string[]) => {
    const updated = cobrancas.filter(c => !cobrancaIds.includes(c.id));
    setCobrancas(updated);
    saveCobrancas(updated);
    cobrancaIds.forEach(id => deleteCobrancaFromNeon(id));
    setCobrancaParaExcluir(null);
  };

  const handleLimparDuplicadas = () => {
    const idsVistos = new Set<string>();
    const chavesVistas = new Set<string>();
    const cobrancasUnicas: Cobranca[] = [];

    cobrancas.forEach(c => {
      const chave = `${c.clienteNome}-${c.valor}-${c.descricao}-${c.dataVencimento}`;
      if (!idsVistos.has(c.id) && !chavesVistas.has(chave)) {
        idsVistos.add(c.id);
        chavesVistas.add(chave);
        cobrancasUnicas.push(c);
      }
    });

    const rem = cobrancas.length - cobrancasUnicas.length;
    setCobrancas(cobrancasUnicas);
    saveCobrancas(cobrancasUnicas);
    alert(`${rem} cobrança(s) duplicada(s) foram removidas com sucesso!`);
  };

  const handleDeletarCliente = (clienteId: string) => {
    const cli = clientes.find(c => c.id === clienteId);
    if (!cli) return;

    const keyNome = cli.nome.trim().toLowerCase();
    const pendencias = cobrancas.filter(c => 
      (c.clienteId === clienteId || c.clienteNome.trim().toLowerCase() === keyNome) &&
      (c.status === 'pendente' || c.status === 'atrasado')
    );

    if (pendencias.length > 0) {
      const totalDebitos = pendencias.reduce((sum, item) => sum + item.valor, 0);
      alert(
        `⛔ NÃO É POSSÍVEL EXCLUIR O CLIENTE "${cli.nome.toUpperCase()}"!\n\n` +
        `Este cliente possui ${pendencias.length} débito(s) em aberto no valor total de ${formatCurrency(totalDebitos)}.\n\n` +
        `Por favor, dê baixa (quite) ou exclua as cobranças pendentes antes de remover o cadastro do cliente.`
      );
      return;
    }

    if (confirm(`Tem certeza que deseja excluir o cadastro de "${cli.nome}"?`)) {
      const updatedClientes = clientes.filter(c => c.id !== clienteId);
      setClientes(updatedClientes);
      saveClientes(updatedClientes);
      deleteClienteFromNeon(clienteId);
    }
  };

  const handleSalvarConfig = (novaConfig: AppConfig) => {
    setConfig(novaConfig);
    saveConfig(novaConfig);
  };

  const handleRestaurarDados = (novosClientes: Cliente[], novasCobrancas: Cobranca[]) => {
    setClientes(novosClientes);
    setCobrancas(novasCobrancas);
    saveClientes(novosClientes);
    saveCobrancas(novasCobrancas);
  };

  const handleResetSeedData = () => {
    localStorage.clear();
    setClientes(getClientes());
    setCobrancas(getCobrancas());
    setConfig(getConfig());
  };

  return (
    <div className="app-container">
      {/* Top Header */}
      <Header
        nomeEmpresa={config.nomeEmpresa}
        qtdAtrasados={indicadores.qtdAtrasados}
        usuario={usuario}
        onLogout={handleLogout}
        onOpenNotifications={() => setActiveTab('cobrancas')}
      />

      {/* Conteúdo Principal */}
      <main className="flex-1">
        {activeTab === 'dashboard' && (
          <Dashboard
            indicadores={indicadores}
            cobrancas={cobrancas}
            onOpenNovaCobranca={() => setIsNovaCobrancaOpen(true)}
            onOpenWhatsAppModal={(cob) => setWhatsAppCobranca(cob)}
            onVerTodasCobrancas={() => setActiveTab('cobrancas')}
            onSelectCobranca={(cob) => setCobrancaParaEditar(cob)}
          />
        )}

        {activeTab === 'cobrancas' && (
          <CobrancaList
            cobrancas={cobrancas}
            onOpenNovaCobranca={() => setIsNovaCobrancaOpen(true)}
            onOpenGerarMensalidades={() => setIsGerarMensalidadesOpen(true)}
            onOpenWhatsAppModal={(cob) => setWhatsAppCobranca(cob)}
            onOpenReciboModal={(cob) => {
              setReciboCobranca(cob);
              setReciboConfetti(false);
            }}
            onOpenEditarModal={(cob) => setCobrancaParaEditar(cob)}
            onOpenBaixarModal={(cob) => setCobrancaParaBaixar(cob)}
            onMarcarComoPago={handleMarcarComoPago}
            onMarcarComoCancelado={handleMarcarComoCancelado}
            onDeletarCobranca={handleDeletarCobranca}
            onLimparDuplicadas={handleLimparDuplicadas}
          />
        )}

        {activeTab === 'clientes' && (
          <ClienteList
            clientes={clientes}
            cobrancas={cobrancas}
            onOpenNovoCliente={() => setIsNovoClienteOpen(true)}
            onOpenImportarExcel={() => setIsImportarExcelOpen(true)}
            onOpenEditarCliente={(cliente) => setClienteParaEditar(cliente)}
            onDeletarCliente={handleDeletarCliente}
            onNovaCobrancaParaCliente={(cliente) => {
              setClientePreSelecionado(cliente);
              setIsNovaCobrancaOpen(true);
            }}
          />
        )}

        {activeTab === 'relatorios' && (
          <RelatoriosView
            cobrancas={cobrancas}
            indicadores={indicadores}
            onOpenRelatorioPDF={(tipo = 'quitadas', cobrancasFiltradas, subtitulo) => {
              setTipoRelatorioPDF(tipo);
              setCobrancasParaPDF(cobrancasFiltradas || cobrancas);
              setSubtituloPeriodoPDF(subtitulo || '');
              setIsRelatorioPDFOpen(true);
            }}
            onOpenReciboAvulso={() => setIsReciboAvulsoOpen(true)}
          />
        )}

        {activeTab === 'config' && (
          <ConfigView
            config={config}
            onSalvarConfig={handleSalvarConfig}
            clientes={clientes}
            cobrancas={cobrancas}
            onRestaurarDados={handleRestaurarDados}
            onResetSeedData={handleResetSeedData}
          />
        )}
      </main>

      {/* Bottom Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        qtdAtrasados={indicadores.qtdAtrasados}
      />

      {/* Modais */}
      <NovaCobrancaModal
        isOpen={isNovaCobrancaOpen}
        onClose={() => {
          setIsNovaCobrancaOpen(false);
          setClientePreSelecionado(null);
        }}
        clientes={clientes}
        clientePreSelecionado={clientePreSelecionado}
        onSalvarCobranca={handleSalvarCobranca}
        onOpenNovoClienteModal={() => {
          setIsNovoClienteOpen(true);
        }}
        chavePixPadrao={config.chavePixPadrao}
      />

      <GerarMensalidadesRecorrentesModal
        isOpen={isGerarMensalidadesOpen}
        onClose={() => setIsGerarMensalidadesOpen(false)}
        clientes={clientes}
        cobrancasExistentes={cobrancas}
        onGerarMensalidades={handleGerarMensalidadesLote}
      />

      <EditarCobrancaModal
        isOpen={!!cobrancaParaEditar}
        onClose={() => setCobrancaParaEditar(null)}
        cobranca={cobrancaParaEditar}
        clientes={clientes}
        onSalvarEdicao={handleSalvarEdicaoCobranca}
      />

      <BaixarCobrancaModal
        isOpen={!!cobrancaParaBaixar}
        onClose={() => setCobrancaParaBaixar(null)}
        cobranca={cobrancaParaBaixar}
        todasCobrancas={cobrancas}
        onConfirmarBaixa={handleConfirmarBaixaComMesRef}
      />

      <EditarClienteModal
        isOpen={!!clienteParaEditar}
        onClose={() => setClienteParaEditar(null)}
        cliente={clienteParaEditar}
        onSalvarEdicaoCliente={handleSalvarEdicaoCliente}
      />

      <NovoClienteModal
        isOpen={isNovoClienteOpen}
        onClose={() => setIsNovoClienteOpen(false)}
        onSalvarCliente={handleSalvarCliente}
      />

      <ImportarClientesModal
        isOpen={isImportarExcelOpen}
        onClose={() => setIsImportarExcelOpen(false)}
        onImportarSucesso={handleImportarSucesso}
      />

      <WhatsAppModal
        isOpen={!!whatsAppCobranca}
        onClose={() => setWhatsAppCobranca(null)}
        cobranca={whatsAppCobranca}
        clientes={clientes}
        nomeEmpresa={config.nomeEmpresa}
        chavePixPadrao={config.chavePixPadrao}
        cnpjEmpresa={config.cnpjEmpresa}
      />

      <ReciboModal
        isOpen={!!reciboCobranca}
        onClose={() => {
          setReciboCobranca(null);
          setReciboConfetti(false);
        }}
        cobranca={reciboCobranca}
        clientes={clientes}
        nomeEmpresa={config.nomeEmpresa}
        cnpjEmpresa={config.cnpjEmpresa}
        triggerConfetti={reciboConfetti}
      />

      <RelatorioBaixadasPDFModal
        isOpen={isRelatorioPDFOpen}
        onClose={() => setIsRelatorioPDFOpen(false)}
        cobrancas={cobrancasParaPDF.length > 0 ? cobrancasParaPDF : cobrancas}
        clientes={clientes}
        nomeEmpresa={config.nomeEmpresa}
        cnpjEmpresa={config.cnpjEmpresa}
        tipoInicial={tipoRelatorioPDF}
        subtituloPeriodo={subtituloPeriodoPDF}
      />

      <ExcluirCobrancasModal
        isOpen={!!cobrancaParaExcluir}
        onClose={() => setCobrancaParaExcluir(null)}
        cobranca={cobrancaParaExcluir}
        todasCobrancas={cobrancas}
        onConfirmarExclusao={handleConfirmarExclusaoMultipla}
      />

      <ReciboAvulsoModal
        isOpen={isReciboAvulsoOpen}
        onClose={() => setIsReciboAvulsoOpen(false)}
        clientes={clientes}
        nomeEmpresa={config.nomeEmpresa}
        cnpjEmpresa={config.cnpjEmpresa}
      />
    </div>
  );
};
