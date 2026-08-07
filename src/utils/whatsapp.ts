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
  cobranca: Cobranca, 
  template: WhatsAppTemplateType,
  nomeEmpresa: string = 'COMPUSERVE LTDA',
  chavePixPadrao: string = '60.060.102/0001-24',
  cnpjEmpresa: string = '60.060.102/0001-24'
): string {
  // Nome completo do cliente para a saudação
  const nomeCliente = cobranca.clienteNome.trim();
  const valorFormatado = formatCurrency(cobranca.valor);
  
  // Mês de referência e data de vencimento garantida dia 05
  const mesRef = cobranca.mesReferencia || (cobranca.dataVencimento ? `${cobranca.dataVencimento.split('-')[1]}/${cobranca.dataVencimento.split('-')[0]}` : '');
  
  let dataVencimentoBR = formatDateBR(cobranca.dataVencimento);
  if (mesRef && mesRef.includes('/') && mesRef.length === 7) {
    dataVencimentoBR = `05/${mesRef}`;
  }

  // Converte a data exibida (05/MM/AAAA) em formato ISO para comparar com a data atual
  const parts = dataVencimentoBR.split('/');
  const isoVencEfetivo = parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : parseDateToISO(cobranca.dataVencimento);
  const todayStr = getTodayString();

  const verboVencer = isoVencEfetivo < todayStr ? 'venceu em' : 'vence em';

  let rawPix = cobranca.chavePix || chavePixPadrao || '60.060.102/0001-24';
  if (rawPix.replace(/\D/g, '').length === 14) {
    rawPix = formatCNPJ(rawPix);
  }
  const chavePix = rawPix;
  const cnpjEmpresaFormat = formatCNPJ(cnpjEmpresa || '60.060.102/0001-24');

  const EMOJI_SMILE = '\uD83D\uDE0A'; // 😊
  const EMOJI_BELL = '\uD83D\uDD14';  // 🔔
  const EMOJI_MONEY = '\uD83D\uDCB8'; // 💸

  switch (template) {
    case 'lembrete_amigavel':
      return `Olá, ${nomeCliente}! Tudo bem? ${EMOJI_SMILE}\n\nPassando para lembrar que a *${cobranca.descricao}* (Mês Ref: *${mesRef}*) no valor de *${valorFormatado}* ${verboVencer} *${dataVencimentoBR}*.\n\n📱 *Chave PIX para pagamento:*\n${chavePix}\n\n(Caso já tenha efetuado o pagamento, por favor desconsidere esta mensagem). Muito obrigado! - _${nomeEmpresa}_`;

    case 'dia_vencimento':
      return `Olá, ${nomeCliente}! ${EMOJI_BELL}\n\nLembramos que a *${cobranca.descricao}* (Mês Ref: *${mesRef}*) no valor de *${valorFormatado}* vence *HOJE (${dataVencimentoBR})*.\n\n${EMOJI_MONEY} *Chave PIX para pagamento:*\n${chavePix}\n\nApós o pagamento, gentileza enviar o comprovante por aqui. Muito obrigado! - _${nomeEmpresa}_`;

    case 'em_atraso':
      return `Olá, ${nomeCliente}.\n\nIdentificamos em nosso sistema uma pendência em aberto referente a *${cobranca.descricao}* (Mês Ref: *${mesRef}*) no valor de *${valorFormatado}*, vencida em *${dataVencimentoBR}*.\n\n📱 *Chave PIX para pagamento:*\n${chavePix}\n\n(Caso já tenha efetuado o pagamento, por favor desconsidere esta mensagem). Muito obrigado! - _${nomeEmpresa}_`;

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
