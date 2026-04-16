import type { Locale } from '@/lib/domain/types';

export type Messages = {
  locale: Locale;
  page: {
    invoice: { eyebrow: string; title: string; subtitle: string };
    cancellation: { eyebrow: string; title: string; subtitle: string };
  };
  documentType: { invoice: string; cancellation: string; ariaLabel: string };
  sections: {
    issuer: { title: string; description: string; useDefaults: string; saveAsDefault: string };
    payer: { title: string; description: string };
    contract: { title: string; description: string };
    timesheet: {
      title: string;
      description: string;
    };
    fx: {
      title: string;
      description: string;
      rateLabel: string;
      fetching: string;
      autoFetched: string;
      cached: string;
      error: string;
      refresh: string;
      showSource: string;
      hideSource: string;
    };
    cancellation: { title: string; description: string };
    numbering: { title: string; description: string; currentIdentifier: string };
    notes: { title: string; description: string };
    bank: { title: string; description: string; savedHint: string };
  };
  fields: {
    party: {
      legalName: string;
      taxId: string;
      taxIdHint: string;
      country: string;
      address: string;
      billingEmail: string;
      companyPlaceholder: string;
      emailPlaceholder: string;
      addressPlaceholder: string;
      optional: string;
    };
    contract: {
      serviceDescription: string;
      serviceDescriptionPlaceholder: string;
      hourlyRate: string;
      payoutMethod: string;
      payoutMethodPlaceholder: string;
      contractCurrency: string;
      contractCurrencyHint: string;
      payoutCurrency: string;
      payoutCurrencyHint: string;
    };
    timesheet: {
      periodStart: string;
      periodEnd: string;
      totalHours: string;
    };
    fx: {
      provider: string;
      providerPlaceholder: string;
      referenceDate: string;
      sourceUrl: string;
      notes: string;
      notesPlaceholder: string;
    };
    cancellation: {
      invoiceNumber: string;
      invoiceNumberPlaceholder: string;
      issueDate: string;
      contractualAmount: string;
      payoutAmount: string;
      payoutAmountHint: string;
      currency: string;
    };
    numbering: {
      invoiceNumber: string;
      invoiceNumberHint: string;
      invoiceNumberPlaceholder: string;
      cancellationNumberPlaceholder: string;
      locale: string;
      issueDate: string;
      dueDate: string;
    };
    notes: {
      label: string;
      hint: string;
      placeholder: string;
    };
    bank: {
      payoutMethod: string;
      payoutMethodPlaceholder: string;
      bankName: string;
      bankNamePlaceholder: string;
      accountType: string;
      accountTypePlaceholder: string;
      accountHolder: string;
      accountHolderPlaceholder: string;
      accountNumber: string;
      accountNumberPlaceholder: string;
      routingNumber: string;
      routingNumberPlaceholder: string;
      bankAddress: string;
      bankAddressPlaceholder: string;
    };
  };
  actions: {
    preview: string;
    download: string;
    reset: string;
    suggest: string;
    useDefaults: string;
    saveAsDefault: string;
    confirmReset: string;
    exportError: string;
  };
  errorSummary: {
    single: string;
    many: string;
  };
  toast: {
    corruptedReset: string;
    savedDefaults: string;
    dismiss: string;
  };
  bugReport: {
    trigger: string;
    triggerAria: string;
    dialogTitle: string;
    dialogDescription: string;
    titleLabel: string;
    titlePlaceholder: string;
    descriptionLabel: string;
    descriptionPlaceholder: string;
    includeContextLabel: string;
    includeContextHint: string;
    cancel: string;
    submit: string;
    cooldown: string;
    popupBlocked: string;
    copyUrl: string;
    copied: string;
    errors: {
      titleTooShort: string;
      titleTooLong: string;
      descriptionTooShort: string;
      descriptionTooLong: string;
    };
    issue: {
      descriptionHeading: string;
      contextHeading: string;
      contextAppVersion: string;
      contextLocale: string;
      contextTheme: string;
      contextTimezone: string;
      contextUserAgent: string;
      contextUrl: string;
      signature: string;
    };
  };
};

export const en: Messages = {
  locale: 'en',
  page: {
    invoice: {
      eyebrow: 'Invoice',
      title: 'Create a professional invoice.',
      subtitle:
        'Local-first. Offline-capable. Your draft stays on this device. Export a branded PDF the moment you are ready.',
    },
    cancellation: {
      eyebrow: 'Cancellation invoice',
      title: 'Void a previous invoice.',
      subtitle:
        'Reference the original invoice and render a document with explicitly negative totals.',
    },
  },
  documentType: {
    invoice: 'Invoice',
    cancellation: 'Cancellation',
    ariaLabel: 'Document type',
  },
  sections: {
    issuer: {
      title: 'Issuer',
      description: 'Your details as the person or company issuing the invoice.',
      useDefaults: 'Use my defaults',
      saveAsDefault: 'Save as default',
    },
    payer: {
      title: 'Payer',
      description: 'The party you are invoicing. Usually your direct contracting partner.',
    },
    contract: {
      title: 'Contract terms',
      description: 'Service description, rate, and the currencies for invoicing and payout.',
    },
    timesheet: {
      title: 'Timesheet',
      description: 'The billing period and the total hours delivered.',
    },
    fx: {
      title: 'FX reference',
      description:
        'Auto-fetched from frankfurter.dev (ECB-sourced). Override the rate if you need to.',
      rateLabel: 'Rate (1 {from} = X {to})',
      fetching: 'Fetching the latest reference rate…',
      autoFetched: 'Auto-fetched 1 {from} = {rate} {to} on {date} · ECB via frankfurter.dev',
      cached: 'Using cached rate 1 {from} = {rate} {to} from {date} · ECB via frankfurter.dev',
      error: 'Auto-fetch failed: {message}. Enter the rate manually.',
      refresh: 'Refresh',
      showSource: 'Show source',
      hideSource: 'Hide source',
    },
    cancellation: {
      title: 'Original invoice',
      description:
        'The invoice that this cancellation voids. Totals will be rendered as negatives on the PDF.',
    },
    numbering: {
      title: 'Numbering and dates',
      description: 'Numbering is a local suggestion. Adjust to match your own sequence.',
      currentIdentifier: 'Current identifier: {number}',
    },
    notes: {
      title: 'Notes',
      description: 'Optional message rendered at the bottom of the PDF.',
    },
    bank: {
      title: 'Bank details',
      description:
        'Where the payer should send the money. Saved as defaults and reused on every invoice.',
      savedHint: 'Saved automatically. Leave fields blank to omit them from the PDF.',
    },
  },
  fields: {
    party: {
      legalName: 'Legal name',
      taxId: 'Tax ID',
      taxIdHint: 'CNPJ, VAT, EIN, etc.',
      country: 'Country',
      address: 'Address',
      billingEmail: 'Billing email',
      companyPlaceholder: 'Company or individual name',
      emailPlaceholder: 'billing@company.com',
      addressPlaceholder: 'Street, city, postal code',
      optional: 'Optional',
    },
    contract: {
      serviceDescription: 'Service description',
      serviceDescriptionPlaceholder: 'Software engineering services - April 2026',
      hourlyRate: 'Hourly rate',
      payoutMethod: 'Payout method',
      payoutMethodPlaceholder: 'SEPA, Wise, bank wire, ...',
      contractCurrency: 'Contract currency',
      contractCurrencyHint: 'ISO code (EUR, USD, BRL)',
      payoutCurrency: 'Payout currency',
      payoutCurrencyHint: 'Same as contract unless paid in a different currency.',
    },
    timesheet: {
      periodStart: 'Period start',
      periodEnd: 'Period end',
      totalHours: 'Total hours',
    },
    fx: {
      provider: 'Provider',
      providerPlaceholder: 'ECB, Banco Central, Wise, ...',
      referenceDate: 'Reference date',
      sourceUrl: 'Source URL',
      notes: 'Notes',
      notesPlaceholder: 'Any context for the recipient',
    },
    cancellation: {
      invoiceNumber: 'Invoice number',
      invoiceNumberPlaceholder: 'INV-2026-001',
      issueDate: 'Issue date',
      contractualAmount: 'Contractual amount',
      payoutAmount: 'Payout amount',
      payoutAmountHint: 'Only needed if the original had a payout currency conversion.',
      currency: 'Currency',
    },
    numbering: {
      invoiceNumber: 'Invoice number',
      invoiceNumberHint: 'Format INV-YYYY-NNN or CN-YYYY-NNN.',
      invoiceNumberPlaceholder: 'INV-2026-001',
      cancellationNumberPlaceholder: 'CN-2026-001',
      locale: 'Document language',
      issueDate: 'Issue date',
      dueDate: 'Due date',
    },
    notes: {
      label: 'Notes',
      hint: 'Up to 2000 characters.',
      placeholder: 'Payment terms, thanks, escalation contact, etc.',
    },
    bank: {
      payoutMethod: 'Preferred payout method',
      payoutMethodPlaceholder: 'ACH, SEPA, Wise, ...',
      bankName: 'Bank name',
      bankNamePlaceholder: 'Your bank',
      accountType: 'Account type',
      accountTypePlaceholder: 'Checking, savings, ...',
      accountHolder: 'Account holder',
      accountHolderPlaceholder: 'Legal name on the account',
      accountNumber: 'Account number',
      accountNumberPlaceholder: '0000000000',
      routingNumber: 'Routing number',
      routingNumberPlaceholder: 'ACH routing, IBAN, SWIFT',
      bankAddress: 'Bank address',
      bankAddressPlaceholder: 'Street, city, postal code, country',
    },
  },
  actions: {
    preview: 'Preview',
    download: 'Download PDF',
    reset: 'Reset',
    suggest: 'Suggest',
    useDefaults: 'Use my defaults',
    saveAsDefault: 'Save as default',
    confirmReset: 'This replaces your current draft with a blank one. Continue?',
    exportError: 'Could not export the PDF: {message}.',
  },
  errorSummary: {
    single: 'Fix 1 issue before export',
    many: 'Fix {count} issues before export',
  },
  toast: {
    corruptedReset: 'Your previous draft could not be read and was reset to a clean state.',
    savedDefaults: 'Issuer saved as default.',
    dismiss: 'Dismiss',
  },
  bugReport: {
    trigger: 'Report a bug',
    triggerAria: 'Report a bug on GitHub',
    dialogTitle: 'Report a bug',
    dialogDescription: 'Opens a public GitHub issue. Do not include sensitive data.',
    titleLabel: 'Title',
    titlePlaceholder: 'Briefly summarise what went wrong',
    descriptionLabel: 'What happened?',
    descriptionPlaceholder: 'Steps to reproduce, what you expected, what you saw.',
    includeContextLabel: 'Include technical context',
    includeContextHint: 'App version, locale, theme, timezone, browser. Helps reproduce the bug.',
    cancel: 'Cancel',
    submit: 'Open on GitHub',
    cooldown: 'Try again in {seconds} s',
    popupBlocked: 'Pop-up blocker stopped the new tab. Copy the URL and open it manually.',
    copyUrl: 'Copy URL',
    copied: 'Copied',
    errors: {
      titleTooShort: 'At least 5 characters',
      titleTooLong: 'At most 120 characters',
      descriptionTooShort: 'At least 20 characters',
      descriptionTooLong: 'At most 4000 characters',
    },
    issue: {
      descriptionHeading: 'Description',
      contextHeading: 'Technical context',
      contextAppVersion: 'App version',
      contextLocale: 'Locale',
      contextTheme: 'Theme',
      contextTimezone: 'Timezone',
      contextUserAgent: 'User agent',
      contextUrl: 'URL',
      signature: 'Reported via the Invoice Generator built-in bug report.',
    },
  },
};

export const ptBR: Messages = {
  locale: 'pt-BR',
  page: {
    invoice: {
      eyebrow: 'Fatura',
      title: 'Crie uma fatura profissional.',
      subtitle:
        'Local-first. Funciona offline. Seu rascunho fica neste dispositivo. Exporte um PDF com a sua marca quando quiser.',
    },
    cancellation: {
      eyebrow: 'Fatura de cancelamento',
      title: 'Cancelar uma fatura anterior.',
      subtitle:
        'Referencie a fatura original e gere um documento com valores explicitamente negativos.',
    },
  },
  documentType: {
    invoice: 'Fatura',
    cancellation: 'Cancelamento',
    ariaLabel: 'Tipo de documento',
  },
  sections: {
    issuer: {
      title: 'Emissor',
      description: 'Seus dados como pessoa ou empresa que emite a fatura.',
      useDefaults: 'Usar meus padrões',
      saveAsDefault: 'Salvar como padrão',
    },
    payer: {
      title: 'Pagador',
      description: 'A parte para a qual você está faturando. Normalmente o contratante direto.',
    },
    contract: {
      title: 'Termos do contrato',
      description: 'Descrição do serviço, taxa e moedas de contrato e pagamento.',
    },
    timesheet: {
      title: 'Apontamento de horas',
      description: 'O período de faturamento e o total de horas entregues.',
    },
    fx: {
      title: 'Câmbio de referência',
      description:
        'Buscado automaticamente em frankfurter.dev (fonte ECB). Sobrescreva a taxa se precisar.',
      rateLabel: 'Taxa (1 {from} = X {to})',
      fetching: 'Buscando a taxa de referência mais recente…',
      autoFetched: 'Buscado: 1 {from} = {rate} {to} em {date} · ECB via frankfurter.dev',
      cached: 'Cache: 1 {from} = {rate} {to} em {date} · ECB via frankfurter.dev',
      error: 'Falha ao buscar: {message}. Informe a taxa manualmente.',
      refresh: 'Atualizar',
      showSource: 'Mostrar fonte',
      hideSource: 'Ocultar fonte',
    },
    cancellation: {
      title: 'Fatura original',
      description:
        'A fatura que este cancelamento anula. Os totais serão exibidos como negativos no PDF.',
    },
    numbering: {
      title: 'Numeração e datas',
      description: 'A numeração é uma sugestão local. Ajuste para a sua sequência.',
      currentIdentifier: 'Identificador atual: {number}',
    },
    notes: {
      title: 'Observações',
      description: 'Mensagem opcional exibida no rodapé do PDF.',
    },
    bank: {
      title: 'Dados bancários',
      description:
        'Para onde o pagador deve enviar o dinheiro. Salvo como padrão e reutilizado em todas as faturas.',
      savedHint: 'Salvo automaticamente. Deixe campos em branco para omiti-los do PDF.',
    },
  },
  fields: {
    party: {
      legalName: 'Razão social',
      taxId: 'CNPJ / VAT',
      taxIdHint: 'CNPJ, VAT, EIN etc.',
      country: 'País',
      address: 'Endereço',
      billingEmail: 'E-mail de faturamento',
      companyPlaceholder: 'Empresa ou pessoa física',
      emailPlaceholder: 'faturamento@empresa.com',
      addressPlaceholder: 'Rua, cidade, CEP',
      optional: 'Opcional',
    },
    contract: {
      serviceDescription: 'Descrição do serviço',
      serviceDescriptionPlaceholder: 'Serviços de engenharia de software - abril 2026',
      hourlyRate: 'Valor por hora',
      payoutMethod: 'Método de pagamento',
      payoutMethodPlaceholder: 'SEPA, Wise, TED, ...',
      contractCurrency: 'Moeda do contrato',
      contractCurrencyHint: 'Código ISO (EUR, USD, BRL)',
      payoutCurrency: 'Moeda do pagamento',
      payoutCurrencyHint: 'Igual à do contrato, salvo se pago em outra moeda.',
    },
    timesheet: {
      periodStart: 'Início do período',
      periodEnd: 'Fim do período',
      totalHours: 'Total de horas',
    },
    fx: {
      provider: 'Fonte',
      providerPlaceholder: 'BCB, ECB, Wise, ...',
      referenceDate: 'Data de referência',
      sourceUrl: 'URL da fonte',
      notes: 'Observações',
      notesPlaceholder: 'Contexto útil para o destinatário',
    },
    cancellation: {
      invoiceNumber: 'Número da fatura',
      invoiceNumberPlaceholder: 'INV-2026-001',
      issueDate: 'Data de emissão',
      contractualAmount: 'Valor contratual',
      payoutAmount: 'Valor de pagamento',
      payoutAmountHint: 'Necessário apenas se a original teve conversão de moeda.',
      currency: 'Moeda',
    },
    numbering: {
      invoiceNumber: 'Número da fatura',
      invoiceNumberHint: 'Formato INV-AAAA-NNN ou CN-AAAA-NNN.',
      invoiceNumberPlaceholder: 'INV-2026-001',
      cancellationNumberPlaceholder: 'CN-2026-001',
      locale: 'Idioma do documento',
      issueDate: 'Data de emissão',
      dueDate: 'Data de vencimento',
    },
    notes: {
      label: 'Observações',
      hint: 'Até 2000 caracteres.',
      placeholder: 'Condições de pagamento, agradecimentos, contato etc.',
    },
    bank: {
      payoutMethod: 'Forma de pagamento preferida',
      payoutMethodPlaceholder: 'PIX, TED, ACH, SEPA, Wise, ...',
      bankName: 'Banco',
      bankNamePlaceholder: 'Seu banco',
      accountType: 'Tipo de conta',
      accountTypePlaceholder: 'Corrente, poupança, ...',
      accountHolder: 'Titular da conta',
      accountHolderPlaceholder: 'Nome legal do titular',
      accountNumber: 'Número da conta',
      accountNumberPlaceholder: '0000000000',
      routingNumber: 'Agência ou roteamento',
      routingNumberPlaceholder: 'Agência, IBAN, SWIFT',
      bankAddress: 'Endereço do banco',
      bankAddressPlaceholder: 'Rua, cidade, CEP, país',
    },
  },
  actions: {
    preview: 'Pré-visualizar',
    download: 'Baixar PDF',
    reset: 'Limpar',
    suggest: 'Sugerir',
    useDefaults: 'Usar meus padrões',
    saveAsDefault: 'Salvar como padrão',
    confirmReset: 'Isso substitui o rascunho atual por um em branco. Continuar?',
    exportError: 'Não foi possível exportar o PDF: {message}.',
  },
  errorSummary: {
    single: 'Corrija 1 problema antes de exportar',
    many: 'Corrija {count} problemas antes de exportar',
  },
  toast: {
    corruptedReset:
      'Seu rascunho anterior não pôde ser lido e foi restaurado para um estado limpo.',
    savedDefaults: 'Emissor salvo como padrão.',
    dismiss: 'Fechar',
  },
  bugReport: {
    trigger: 'Relatar bug',
    triggerAria: 'Relatar um bug no GitHub',
    dialogTitle: 'Relatar bug',
    dialogDescription: 'Abre uma issue pública no GitHub. Não inclua dados sensíveis.',
    titleLabel: 'Título',
    titlePlaceholder: 'Resuma rapidamente o que deu errado',
    descriptionLabel: 'O que aconteceu?',
    descriptionPlaceholder: 'Passos para reproduzir, o que você esperava, o que aconteceu.',
    includeContextLabel: 'Incluir contexto técnico',
    includeContextHint: 'Versão do app, idioma, tema, fuso, navegador. Ajuda a reproduzir.',
    cancel: 'Cancelar',
    submit: 'Abrir no GitHub',
    cooldown: 'Tente novamente em {seconds} s',
    popupBlocked: 'O bloqueador de pop-ups impediu a nova aba. Copie o URL e abra manualmente.',
    copyUrl: 'Copiar URL',
    copied: 'Copiado',
    errors: {
      titleTooShort: 'No mínimo 5 caracteres',
      titleTooLong: 'No máximo 120 caracteres',
      descriptionTooShort: 'No mínimo 20 caracteres',
      descriptionTooLong: 'No máximo 4000 caracteres',
    },
    issue: {
      descriptionHeading: 'Descrição',
      contextHeading: 'Contexto técnico',
      contextAppVersion: 'Versão do app',
      contextLocale: 'Idioma',
      contextTheme: 'Tema',
      contextTimezone: 'Fuso',
      contextUserAgent: 'User agent',
      contextUrl: 'URL',
      signature: 'Reportado pelo formulário de bug do Invoice Generator.',
    },
  },
};

export const messages: Record<Locale, Messages> = {
  en,
  'pt-BR': ptBR,
};
