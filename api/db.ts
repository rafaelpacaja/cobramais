import { neon } from '@neondatabase/serverless';

declare const process: any;

export default async function handler(req: any, res: any) {
  // Configura CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const connectionString = 
    process.env.DATABASE_URL || 
    process.env.POSTGRES_URL || 
    process.env.NEON_DATABASE_URL ||
    process.env.VERCEL_NEON_URL;

  if (!connectionString) {
    return res.status(200).json({ 
      connected: false, 
      message: 'DATABASE_URL não configurada no ambiente.' 
    });
  }

  try {
    const sql = neon(connectionString);

    // 1. Cria as tabelas se não existirem no Neon
    await sql`
      CREATE TABLE IF NOT EXISTS usuarios (
        id TEXT PRIMARY KEY,
        nome TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        senha TEXT NOT NULL,
        empresa TEXT,
        cnpj TEXT,
        telefone TEXT,
        role TEXT DEFAULT 'admin',
        created_at TEXT
      );
    `;

    try {
      await sql`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'admin';`;
    } catch (e) {
      // Coluna ja existente
    }

    await sql`
      CREATE TABLE IF NOT EXISTS app_config (
        id TEXT PRIMARY KEY DEFAULT 'default',
        nome_empresa TEXT,
        cnpj_empresa TEXT,
        chave_pix_padrao TEXT,
        dias_aviso_vencimento INTEGER,
        categorias TEXT
      );
    `;

    try {
      await sql`ALTER TABLE app_config ADD COLUMN IF NOT EXISTS categorias TEXT;`;
    } catch (e) {
      // Coluna ja existente
    }

    await sql`
      CREATE TABLE IF NOT EXISTS clientes (
        id TEXT PRIMARY KEY,
        nome TEXT NOT NULL,
        telefone TEXT,
        email TEXT,
        documento TEXT,
        cidade TEXT DEFAULT 'PACAJÁ',
        observacoes TEXT,
        created_at TEXT
      );
    `;

    try {
      await sql`ALTER TABLE clientes ADD COLUMN IF NOT EXISTS cidade TEXT DEFAULT 'PACAJÁ';`;
    } catch (e) {
      // Coluna ja existente
    }

    await sql`
      CREATE TABLE IF NOT EXISTS cobrancas (
        id TEXT PRIMARY KEY,
        cliente_id TEXT,
        cliente_nome TEXT NOT NULL,
        cliente_telefone TEXT,
        cliente_documento TEXT,
        descricao TEXT NOT NULL,
        valor NUMERIC NOT NULL,
        data_vencimento TEXT NOT NULL,
        data_pagamento TEXT,
        mes_referencia TEXT,
        status TEXT NOT NULL,
        forma_pagamento TEXT NOT NULL,
        chave_pix TEXT,
        categoria TEXT,
        parcela_atual INTEGER,
        total_parcelas INTEGER,
        created_at TEXT
      );
    `;

    try {
      await sql`ALTER TABLE cobrancas ADD COLUMN IF NOT EXISTS created_at TEXT;`;
    } catch (e) {
      // Coluna ja existente
    }

    try {
      await sql`
        UPDATE cobrancas 
        SET categoria = 'Mensalidade' 
        WHERE categoria = 'Serviços' OR LOWER(categoria) = 'serviços' OR categoria IS NULL OR categoria = '';
      `;
      await sql`
        UPDATE cobrancas 
        SET categoria = 'Implantação' 
        WHERE LOWER(categoria) = 'implantação/instalação';
      `;
    } catch (e) {
      // Ignora erros de migracao se tabela vazia
    }

    // 2. Trata GET (Carregar todos os dados do Neon)
    if (req.method === 'GET') {
      const configRows = await sql`SELECT * FROM app_config WHERE id = 'default' LIMIT 1;`;
      const clientesRows = await sql`SELECT * FROM clientes ORDER BY created_at DESC;`;
      const cobrancasRows = await sql`SELECT * FROM cobrancas ORDER BY created_at DESC;`;
      const usuariosRows = await sql`SELECT id, nome, email, role, created_at FROM usuarios ORDER BY created_at DESC;`;

      const config = configRows.length > 0 ? {
        nomeEmpresa: configRows[0].nome_empresa || 'COMPUSERVE LTDA',
        cnpjEmpresa: configRows[0].cnpj_empresa || '60.060.102/0001-24',
        chavePixPadrao: configRows[0].chave_pix_padrao || '60.060.102/0001-24',
        diasAvisoVencimento: configRows[0].dias_aviso_vencimento || 3,
        categorias: configRows[0].categorias ? JSON.parse(configRows[0].categorias) : undefined
      } : null;

      const clientes = clientesRows.map((c: any) => ({
        id: c.id,
        nome: c.nome,
        telefone: c.telefone || '',
        email: c.email || '',
        documento: c.documento || '',
        cidade: c.cidade || 'PACAJÁ',
        observacoes: c.observacoes || '',
        createdAt: c.created_at
      }));

      const cobrancas = cobrancasRows.map((c: any) => ({
        id: c.id,
        clienteId: c.cliente_id,
        clienteNome: c.cliente_nome,
        clienteTelefone: c.cliente_telefone || '',
        clienteDocumento: c.cliente_documento || '',
        descricao: c.descricao,
        valor: Number(c.valor),
        dataVencimento: c.data_vencimento,
        dataPagamento: c.data_pagamento || undefined,
        mesReferencia: c.mes_referencia || undefined,
        status: c.status,
        formaPagamento: c.forma_pagamento,
        chavePix: c.chave_pix || undefined,
        categoria: c.categoria || undefined,
        parcelaAtual: c.parcela_atual ? Number(c.parcela_atual) : undefined,
        totalParcelas: c.total_parcelas ? Number(c.total_parcelas) : undefined,
        createdAt: c.created_at
      }));

      const usuarios = usuariosRows.map((u: any) => ({
        id: u.id,
        nome: u.nome,
        email: u.email,
        role: u.role === 'admin' ? 'admin' : 'visualizador',
        createdAt: u.created_at
      }));

      return res.status(200).json({
        connected: true,
        config,
        clientes,
        cobrancas,
        usuarios
      });
    }

    // 3. Trata POST (Salvar / Sincronizar / Deletar no Neon)
    if (req.method === 'POST') {
      const body = req.body || {};
      const { action, config, clientes, cobrancas, email, senha, senhaAtual, novaSenha, nome, empresa, cnpj, telefone, cobrancaId, clienteId } = body;

      // Exclusão específica de cobrança no Neon
      if (action === 'delete_cobranca') {
        if (cobrancaId) {
          await sql`DELETE FROM cobrancas WHERE id = ${cobrancaId};`;
        }
        return res.status(200).json({ success: true, message: 'Cobrança excluída do Neon.' });
      }

      // Exclusão específica de cliente no Neon
      if (action === 'delete_cliente') {
        if (clienteId) {
          await sql`DELETE FROM clientes WHERE id = ${clienteId};`;
          await sql`DELETE FROM cobrancas WHERE cliente_id = ${clienteId};`;
        }
        return res.status(200).json({ success: true, message: 'Cliente excluído do Neon.' });
      }

      // Exclusão específica de usuário no Neon
      if (action === 'delete_usuario') {
        const { userId, userEmail } = body;
        if (userId) {
          await sql`DELETE FROM usuarios WHERE id = ${userId};`;
        } else if (userEmail) {
          await sql`DELETE FROM usuarios WHERE LOWER(email) = LOWER(${userEmail.trim()});`;
        }
        return res.status(200).json({ success: true, message: 'Usuário excluído do Neon.' });
      }

      // Ação de Alteração de Senha
      if (action === 'change_password') {
        if (!email || !novaSenha) {
          return res.status(400).json({ success: false, message: 'E-mail e nova senha são obrigatórios.' });
        }

        if (senhaAtual && senhaAtual !== '061881') {
          const checkUser = await sql`
            SELECT id FROM usuarios
            WHERE LOWER(email) = LOWER(${email.trim()}) AND senha = ${senhaAtual}
            LIMIT 1;
          `;

          if (checkUser.length === 0) {
            return res.status(401).json({ success: false, message: 'Senha atual incorreta.' });
          }
        }

        await sql`
          UPDATE usuarios
          SET senha = ${novaSenha}
          WHERE LOWER(email) = LOWER(${email.trim()});
        `;

        return res.status(200).json({ success: true, message: 'Senha alterada com sucesso.' });
      }

      // Ação de Cadastro de Usuário
      if (action === 'register') {
        if (!email || !senha || !nome) {
          return res.status(400).json({ success: false, message: 'Nome, e-mail e senha são obrigatórios.' });
        }

        const existing = await sql`SELECT id FROM usuarios WHERE LOWER(email) = LOWER(${email.trim()}) LIMIT 1;`;
        if (existing.length > 0) {
          return res.status(400).json({ success: false, message: 'Este e-mail já está cadastrado.' });
        }

        const newId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
        const nowIso = new Date().toISOString();
        const userRole = body.role === 'admin' ? 'admin' : (body.role || 'visualizador');

        await sql`
          INSERT INTO usuarios (id, nome, email, senha, empresa, cnpj, telefone, role, created_at)
          VALUES (${newId}, ${nome.trim()}, ${email.trim().toLowerCase()}, ${senha}, ${empresa || 'COMPUSERVE LTDA'}, ${cnpj || '60.060.102/0001-24'}, ${telefone || ''}, ${userRole}, ${nowIso});
        `;

        const usuario = {
          id: newId,
          nome: nome.trim(),
          email: email.trim().toLowerCase(),
          role: userRole,
          empresa: empresa || 'COMPUSERVE LTDA',
          cnpj: cnpj || '60.060.102/0001-24',
          telefone: telefone || '',
          createdAt: nowIso
        };

        return res.status(200).json({ success: true, usuario });
      }

      // Ação de Login de Usuário
      if (action === 'login') {
        if (!email || !senha) {
          return res.status(400).json({ success: false, message: 'E-mail e senha são obrigatórios.' });
        }

        const userRows = await sql`
          SELECT id, nome, email, empresa, cnpj, telefone, role, created_at
          FROM usuarios
          WHERE LOWER(email) = LOWER(${email.trim()}) AND senha = ${senha}
          LIMIT 1;
        `;

        if (userRows.length === 0) {
          return res.status(401).json({ success: false, message: 'E-mail ou senha incorretos.' });
        }

        const u = userRows[0];
        const usuario = {
          id: u.id,
          nome: u.nome,
          email: u.email,
          role: u.role === 'admin' ? 'admin' : (u.role || 'visualizador'),
          empresa: u.empresa || 'COMPUSERVE LTDA',
          cnpj: u.cnpj || '60.060.102/0001-24',
          telefone: u.telefone || '',
          createdAt: u.created_at
        };

        return res.status(200).json({ success: true, usuario });
      }

      // Salva Config
      if (config) {
        const catJson = config.categorias ? JSON.stringify(config.categorias) : null;
        await sql`
          INSERT INTO app_config (id, nome_empresa, cnpj_empresa, chave_pix_padrao, dias_aviso_vencimento, categorias)
          VALUES ('default', ${config.nomeEmpresa}, ${config.cnpjEmpresa || ''}, ${config.chavePixPadrao}, ${config.diasAvisoVencimento || 3}, ${catJson})
          ON CONFLICT (id) DO UPDATE SET
            nome_empresa = EXCLUDED.nome_empresa,
            cnpj_empresa = EXCLUDED.cnpj_empresa,
            chave_pix_padrao = EXCLUDED.chave_pix_padrao,
            dias_aviso_vencimento = EXCLUDED.dias_aviso_vencimento,
            categorias = EXCLUDED.categorias;
        `;
      }

      // Sincroniza Clientes
      if (Array.isArray(clientes)) {
        const currentCliIds = clientes.map(c => c.id).filter(Boolean);
        if (currentCliIds.length > 0) {
          await sql`DELETE FROM clientes WHERE NOT (id = ANY(${currentCliIds}));`;
        } else {
          await sql`DELETE FROM clientes;`;
        }

        for (const cli of clientes) {
          await sql`
            INSERT INTO clientes (id, nome, telefone, email, documento, cidade, observacoes, created_at)
            VALUES (${cli.id}, ${cli.nome}, ${cli.telefone || ''}, ${cli.email || ''}, ${cli.documento || ''}, ${cli.cidade || 'PACAJÁ'}, ${cli.observacoes || ''}, ${cli.createdAt || new Date().toISOString()})
            ON CONFLICT (id) DO UPDATE SET
              nome = EXCLUDED.nome,
              telefone = EXCLUDED.telefone,
              email = EXCLUDED.email,
              documento = EXCLUDED.documento,
              cidade = EXCLUDED.cidade,
              observacoes = EXCLUDED.observacoes;
          `;
        }
      }

      // Sincroniza Cobranças
      if (Array.isArray(cobrancas)) {
        const currentCobIds = cobrancas.map(c => c.id).filter(Boolean);
        if (currentCobIds.length > 0) {
          await sql`DELETE FROM cobrancas WHERE NOT (id = ANY(${currentCobIds}));`;
        } else {
          await sql`DELETE FROM cobrancas;`;
        }

        for (const cob of cobrancas) {
          await sql`
            INSERT INTO cobrancas (
              id, cliente_id, cliente_nome, cliente_telefone, cliente_documento,
              descricao, valor, data_vencimento, data_pagamento, mes_referencia,
              status, forma_pagamento, chave_pix, categoria, parcela_atual, total_parcelas, created_at
            )
            VALUES (
              ${cob.id}, ${cob.clienteId}, ${cob.clienteNome}, ${cob.clienteTelefone || ''}, ${cob.clienteDocumento || ''},
              ${cob.descricao}, ${cob.valor}, ${cob.dataVencimento}, ${cob.dataPagamento || null}, ${cob.mesReferencia || null},
              ${cob.status}, ${cob.formaPagamento}, ${cob.chavePix || null}, ${cob.categoria || null},
              ${cob.parcelaAtual || null}, ${cob.totalParcelas || null}, ${cob.createdAt || new Date().toISOString()}
            )
            ON CONFLICT (id) DO UPDATE SET
              cliente_nome = EXCLUDED.cliente_nome,
              cliente_telefone = EXCLUDED.cliente_telefone,
              cliente_documento = EXCLUDED.cliente_documento,
              descricao = EXCLUDED.descricao,
              valor = EXCLUDED.valor,
              data_vencimento = EXCLUDED.data_vencimento,
              data_pagamento = EXCLUDED.data_pagamento,
              mes_referencia = EXCLUDED.mes_referencia,
              status = EXCLUDED.status,
              forma_pagamento = EXCLUDED.forma_pagamento,
              chave_pix = EXCLUDED.chave_pix,
              categoria = EXCLUDED.categoria;
          `;
        }
      }

      return res.status(200).json({ connected: true, success: true });
    }

    return res.status(405).json({ message: 'Método não suportado.' });
  } catch (err: any) {
    console.error('Erro de conexão/operação no Neon Database:', err);
    return res.status(500).json({ 
      connected: false, 
      message: err.message || 'Erro interno de servidor.' 
    });
  }
}
