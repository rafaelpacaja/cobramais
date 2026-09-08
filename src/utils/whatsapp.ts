import { Cobranca, WhatsAppTemplateType } from '../types';
import { getTodayString, parseDateToISO, formatCNPJ } from '../services/storage';

export type TipoWhatsAppTarget = 'seletor' | 'business' | 'normal';

export function formatPhoneForWhatsApp(phone: string): string {
  if (!phone) return '';
  const cleanNumber = phone.replace(/\D/g, '');
  if (!cleanNumber || cleanNumber.length < 8) return '';
  
  if (cleanNumber.length === 10 || cleanNumber.length === 11) {
    return `55${cleanNumber}`;
  }
  if (cleanNumber.length >= 12 && cleanNumber.startsWith('55')) {
    return cleanNumber;
  }
  return `55${cleanNumber}`;
}

export function formatDateBR(dateString: string): string {
  if (!dateString) return '';
  const parts = dateString.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateString;
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

export function generateWhatsAppMessage(
  cobrancaInput: Cobranca | Cobranca[], 
  template: WhatsAppTemplateType,
  nomeEmpresa: string = 'COMPUSERVE LTDA',
  chavePixPadrao: string = '60.060.102/0001-24',
  cnpjEmpresa: string = '60.060.102/0001-24'
): string {
  const cobrancas = Array.isArray(cobrancaInput) ? cobrancaInput : [cobrancaInput];
  if (cobrancas.length === 0) return '';

  const primeira = cobrancas[0];
  const nomeCliente = primeira.clienteNome.trim();
  const cnpjEmpresaFormat = formatCNPJ(cnpjEmpresa || '60.060.102/0001-24');

  let rawPix = primeira.chavePix || chavePixPadrao || '60.060.102/0001-24';
  if (rawPix.replace(/\D/g, '').length === 14) {
    rawPix = formatCNPJ(rawPix);
  }
  const chavePix = rawPix;

  const EMOJI_SMILE = '\uD83D\uDE0A'; // 😊
  const EMOJI_BELL = '\uD83D\uDD14';  // 🔔
  const EMOJI_MONEY = '\uD83D\uDCB8'; // 💸

  // Se for apenas 1 cobrança
  if (cobrancas.length === 1) {
    const cobranca = primeira;
    const valorFormatado = formatCurrency(cobranca.valor);
    const mesRef = cobranca.mesReferencia || (cobranca.dataVencimento ? `${cobranca.dataVencimento.split('-')[1]}/${cobranca.dataVencimento.split('-')[0]}` : '');
    
    let dataVencimentoBR = formatDateBR(cobranca.dataVencimento);
    if (mesRef && mesRef.includes('/') && mesRef.length === 7) {
      dataVencimentoBR = `05/${mesRef}`;
    }

    const parts = dataVencimentoBR.split('/');
    const isoVencEfetivo = parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : parseDateToISO(cobranca.dataVencimento);
    const todayStr = getTodayString();
    const verboVencer = isoVencEfetivo < todayStr ? 'venceu em' : 'vence em';

    switch (template) {
      case 'lembrete_amigavel':
        return `Olá, ${nomeCliente}! Tudo bem? ${EMOJI_SMILE}\n\nPassando para lembrar que a *${cobranca.descricao}* (Mês Ref: *${mesRef}*) no valor de *${valorFormatado}* ${verboVencer} *${dataVencimentoBR}*.\n\n📱 *Chave PIX (Toque para copiar):*\n\`${chavePix}\` \n\n(Caso já tenha efetuado o pagamento, por favor desconsidere esta mensagem). Muito obrigado! - _${nomeEmpresa}_`;

      case 'dia_vencimento':
        return `Olá, ${nomeCliente}! ${EMOJI_BELL}\n\nLembramos que a *${cobranca.descricao}* (Mês Ref: *${mesRef}*) no valor de *${valorFormatado}* vence *HOJE (${dataVencimentoBR})*.\n\n${EMOJI_MONEY} *Chave PIX (Toque para copiar):*\n\`${chavePix}\` \n\nApós o pagamento, gentileza enviar o comprovante por aqui. Muito obrigado! - _${nomeEmpresa}_`;

      case 'em_atraso':
        return `Olá, ${nomeCliente}.\n\nIdentificamos em nosso sistema uma pendência em aberto referente a *${cobranca.descricao}* (Mês Ref: *${mesRef}*) no valor de *${valorFormatado}*, vencida em *${dataVencimentoBR}*.\n\n📱 *Chave PIX (Toque para copiar):*\n\`${chavePix}\` \n\n(Caso já tenha efetuado o pagamento, por favor desconsidere esta mensagem). Muito obrigado! - _${nomeEmpresa}_`;

      case 'recibo': {
        const dataPagto = cobranca.dataPagamento ? formatDateBR(cobranca.dataPagamento) : formatDateBR(new Date().toISOString().split('T')[0]);
        const docPagador = cobranca.clienteDocumento ? ` (CPF/CNPJ: ${cobranca.clienteDocumento})` : '';
        const formaPagtoStr = cobranca.formaPagamento ? cobranca.formaPagamento.toUpperCase() : 'PIX';

        return `🧾 *RECIBO DE QUITAÇÃO* 🧾\n━━━━━━━━━━━━━━━━━━━━━\n\n🏢 *EMISSOR:* ${nomeEmpresa}\n📄 *CNPJ:* ${cnpjEmpresaFormat}\n\n👤 *PAGADOR:* ${cobranca.clienteNome}${docPagador}\n\n📌 *REFERENTE A:* ${cobranca.descricao}\n📅 *MÊS DE REFERÊNCIA:* ${mesRef}\n💵 *VALOR QUITADO:* *${valorFormatado}*\n🗓️ *DATA DO PAGAMENTO:* ${dataPagto}\n💳 *FORMA DE PAGAMENTO:* ${formaPagtoStr}\n🟢 *STATUS:* *QUITADO INTEGRALMENTE*\n\n━━━━━━━━━━━━━━━━━━━━━\n✍️ *DECLARAÇÃO:* _Declaramos para os devidos fins ter recebido a quantia acima discriminada, dando por este termo a devida e plena quitação._\n\n✨ _Agradecemos a sua preferência!_\n*${nomeEmpresa}*`;
      }

      default:
        return `Olá ${nomeCliente}, referente à cobrança de ${valorFormatado}.`;
    }
  }

  // Se forem MÚLTIPLAS cobranças (length > 1)
  const totalValor = cobrancas.reduce((sum, c) => sum + c.valor, 0);
  const totalValorFormatado = formatCurrency(totalValor);
  const descricaoGeral = primeira.descricao || 'Mensalidade do Sistema';

  const listaItensMsg = cobrancas.map(c => {
    const mesRef = c.mesReferencia || (c.dataVencimento ? `${c.dataVencimento.split('-')[1]}/${c.dataVencimento.split('-')[0]}` : '');
    let dataVencBR = formatDateBR(c.dataVencimento);
    if (mesRef && mesRef.includes('/') && mesRef.length === 7) {
      dataVencBR = `05/${mesRef}`;
    }
    const valFmt = formatCurrency(c.valor);
    const isAtrasado = c.status === 'atrasado';
    const statusTag = isAtrasado ? `Vencida em ${dataVencBR}` : `Vencimento: ${dataVencBR}`;
    return `• Mês Ref: *${mesRef}* - *${valFmt}* (${statusTag})`;
  }).join('\n');

  switch (template) {
    case 'lembrete_amigavel':
      return `Olá, ${nomeCliente}! Tudo bem? ${EMOJI_SMILE}\n\nPassando para lembrar referente às pendências em aberto de *${descricaoGeral}*:\n\n${listaItensMsg}\n\n💰 *VALOR TOTAL (${cobrancas.length} mensalidades):* *${totalValorFormatado}*\n\n📱 *Chave PIX (Toque para copiar):*\n\`${chavePix}\` \n\n(Caso já tenha efetuado o pagamento, por favor desconsidere esta mensagem). Muito obrigado! - _${nomeEmpresa}_`;

    case 'dia_vencimento':
      return `Olá, ${nomeCliente}! ${EMOJI_BELL}\n\nLembramos que consta em aberto as seguintes mensalidades de *${descricaoGeral}*:\n\n${listaItensMsg}\n\n💸 *VALOR TOTAL (${cobrancas.length} mensalidades):* *${totalValorFormatado}*\n\n📱 *Chave PIX (Toque para copiar):*\n\`${chavePix}\` \n\nApós o pagamento, gentileza enviar o comprovante por aqui. Muito obrigado! - _${nomeEmpresa}_`;

    case 'em_atraso':
      return `Olá, ${nomeCliente}.\n\nIdentificamos em nosso sistema *${cobrancas.length} mensalidades em aberto* referente a *${descricaoGeral}*:\n\n${listaItensMsg}\n\n💰 *VALOR TOTAL DOS DÉBITOS:* *${totalValorFormatado}*\n\n📱 *Chave PIX (Toque para copiar):*\n\`${chavePix}\` \n\n(Caso já tenha efetuado o pagamento, por favor desconsidere esta mensagem). Muito obrigado! - _${nomeEmpresa}_`;

    case 'recibo': {
      const docPagador = primeira.clienteDocumento ? ` (CPF/CNPJ: ${primeira.clienteDocumento})` : '';
      const dataPagto = primeira.dataPagamento ? formatDateBR(primeira.dataPagamento) : formatDateBR(new Date().toISOString().split('T')[0]);
      const formaPagtoStr = primeira.formaPagamento ? primeira.formaPagamento.toUpperCase() : 'PIX';

      const listaItensRecibo = cobrancas.map(c => {
        const mesRef = c.mesReferencia || (c.dataVencimento ? `${c.dataVencimento.split('-')[1]}/${c.dataVencimento.split('-')[0]}` : '');
        return `• Mês Ref: ${mesRef} - ${formatCurrency(c.valor)}`;
      }).join('\n');

      return `🧾 *RECIBO DE QUITAÇÃO MÚLTIPLA* 🧾\n━━━━━━━━━━━━━━━━━━━━━\n\n🏢 *EMISSOR:* ${nomeEmpresa}\n📄 *CNPJ:* ${cnpjEmpresaFormat}\n\n👤 *PAGADOR:* ${nomeCliente}${docPagador}\n\n📌 *REFERENTE A:* ${descricaoGeral} (${cobrancas.length} mensalidades)\n${listaItensRecibo}\n\n💵 *VALOR TOTAL QUITADO:* *${totalValorFormatado}*\n🗓️ *DATA DO PAGAMENTO:* ${dataPagto}\n💳 *FORMA DE PAGAMENTO:* ${formaPagtoStr}\n🟢 *STATUS:* *QUITADO INTEGRALMENTE*\n\n━━━━━━━━━━━━━━━━━━━━━\n✍️ *DECLARAÇÃO:* _Declaramos para os devidos fins ter recebido a quantia acima discriminada, dando por este termo a devida e plena quitação._\n\n✨ _Agradecemos a sua preferência!_\n*${nomeEmpresa}*`;
    }

    default:
      return `Olá ${nomeCliente}, referente a ${cobrancas.length} cobranças no total de ${totalValorFormatado}.`;
  }
}

export function openWhatsApp(phone: string, message: string, target: TipoWhatsAppTarget = 'seletor'): void {
  const formattedPhone = formatPhoneForWhatsApp(phone);
  const encodedMessage = encodeURIComponent(message);
  
  const isMobile = typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const isAndroid = typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent);

  let url = '';

  if (target === 'business' && isAndroid) {
    // Intent direto para WhatsApp Business (com.whatsapp.w4b)
    if (formattedPhone && formattedPhone.length >= 10) {
      url = `intent://send?phone=${formattedPhone}&text=${encodedMessage}#Intent;scheme=whatsapp;package=com.whatsapp.w4b;end`;
    } else {
      url = `intent://send?text=${encodedMessage}#Intent;scheme=whatsapp;package=com.whatsapp.w4b;end`;
    }
  } else if (target === 'normal' && isAndroid) {
    // Intent direto para WhatsApp Normal (com.whatsapp)
    if (formattedPhone && formattedPhone.length >= 10) {
      url = `intent://send?phone=${formattedPhone}&text=${encodedMessage}#Intent;scheme=whatsapp;package=com.whatsapp;end`;
    } else {
      url = `intent://send?text=${encodedMessage}#Intent;scheme=whatsapp;package=com.whatsapp;end`;
    }
  } else if (isMobile) {
    // Scheme universal que abre o seletor nativo do sistema Android/iOS ("Abrir com WhatsApp ou WhatsApp Business?")
    if (formattedPhone && formattedPhone.length >= 10) {
      url = `whatsapp://send?phone=${formattedPhone}&text=${encodedMessage}`;
    } else {
      url = `whatsapp://send?text=${encodedMessage}`;
    }
  } else {
    // No PC (Web Browser Desktop)
    if (formattedPhone && formattedPhone.length >= 10) {
      url = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodedMessage}`;
    } else {
      url = `https://api.whatsapp.com/send?text=${encodedMessage}`;
    }
  }

  window.open(url, '_blank');
}
