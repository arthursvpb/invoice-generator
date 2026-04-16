import { z } from 'zod';
import { isPositive, isValidDecimal } from './amounts';

const trimmed = z
  .string()
  .transform((s) => s.trim())
  .pipe(z.string());

const optionalTrimmed = z
  .string()
  .transform((s) => s.trim())
  .transform((s) => (s.length === 0 ? undefined : s))
  .optional();

const decimalString = z
  .string()
  .transform((s) => s.trim())
  .refine(isValidDecimal, { message: 'Must be a valid decimal number' });

const positiveDecimalString = decimalString.refine(isPositive, {
  message: 'Must be greater than zero',
});

const optionalPositiveDecimal = z
  .string()
  .transform((s) => s.trim())
  .transform((s) => (s.length === 0 ? undefined : s))
  .optional()
  .refine((v) => v === undefined || (isValidDecimal(v) && isPositive(v)), {
    message: 'Must be a positive decimal',
  });

function isRealCalendarDate(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return false;
  return d.toISOString().slice(0, 10) === s;
}

const isoDate = z
  .string()
  .transform((s) => s.trim())
  .pipe(
    z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, {
        message: 'Must be a valid date (YYYY-MM-DD)',
      })
      .refine(isRealCalendarDate, { message: 'Must be a real calendar date' }),
  );

const optionalIsoDate = z
  .string()
  .transform((s) => s.trim())
  .transform((s) => (s.length === 0 ? undefined : s))
  .optional()
  .refine((v) => v === undefined || isRealCalendarDate(v), {
    message: 'Must be a real calendar date',
  });

const currencyCode = z
  .string()
  .transform((s) => s.trim().toUpperCase())
  .pipe(
    z.string().regex(/^[A-Z]{3}$/, {
      message: 'Must be a 3-letter currency code',
    }),
  );

const localeEnum = z.enum(['pt-BR', 'en']);

const documentTypeEnum = z.enum(['invoice', 'cancellation']);

const partySchema = z.object({
  legalName: trimmed.refine((s) => s.length > 0, { message: 'Required' }),
  taxId: optionalTrimmed,
  address: optionalTrimmed,
  country: optionalTrimmed,
  billingEmail: z
    .string()
    .transform((s) => s.trim())
    .refine((s) => s.length === 0 || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s), {
      message: 'Must be a valid email',
    })
    .transform((s) => (s.length === 0 ? undefined : s))
    .optional(),
});

const contractSchema = z.object({
  serviceDescription: trimmed.refine((s) => s.length > 0, { message: 'Required' }),
  hourlyRate: positiveDecimalString,
  contractCurrency: currencyCode,
  payoutCurrency: currencyCode,
  payoutMethod: optionalTrimmed,
});

const timesheetSchema = z
  .object({
    periodStart: isoDate,
    periodEnd: isoDate,
    totalHours: positiveDecimalString,
  })
  .refine((v) => v.periodStart <= v.periodEnd, {
    message: 'Period end must be on or after period start',
    path: ['periodEnd'],
  });

const fxReferenceSchema = z.object({
  providerLabel: trimmed.refine((s) => s.length > 0, { message: 'Required' }),
  referenceDate: isoDate,
  rate: positiveDecimalString,
  sourceUrl: z
    .string()
    .transform((s) => s.trim())
    .refine((s) => s.length === 0 || /^https?:\/\/\S+$/.test(s), {
      message: 'Must be a valid URL',
    })
    .transform((s) => (s.length === 0 ? undefined : s))
    .optional(),
  notes: optionalTrimmed,
});

const originalInvoiceSchema = z.object({
  invoiceNumber: trimmed.refine((s) => /^INV-\d{4}-\d{3,}$/.test(s), {
    message: 'Must match INV-YYYY-NNN',
  }),
  issueDate: isoDate,
  contractualAmount: positiveDecimalString,
  payoutAmount: optionalPositiveDecimal,
  currency: currencyCode,
});

const invoiceBaseShape = {
  invoiceNumber: trimmed.refine((s) => /^(INV|CN)-\d{4}-\d{3,}$/.test(s), {
    message: 'Must match INV-YYYY-NNN or CN-YYYY-NNN',
  }),
  issueDate: isoDate,
  dueDate: optionalIsoDate,
  locale: localeEnum,
  issuer: partySchema,
  payer: partySchema,
  contract: contractSchema,
  timesheet: timesheetSchema,
  fxReference: fxReferenceSchema.optional(),
  notes: z
    .string()
    .transform((s) => s.trim())
    .refine((s) => s.length <= 2000, { message: 'Must be 2000 characters or fewer' })
    .transform((s) => (s.length === 0 ? undefined : s))
    .optional(),
};

const invoiceBranch = z.object({
  ...invoiceBaseShape,
  documentType: z.literal('invoice'),
});

const cancellationBranch = z.object({
  ...invoiceBaseShape,
  documentType: z.literal('cancellation'),
  originalInvoice: originalInvoiceSchema,
});

export const invoiceDraftSchema = z
  .discriminatedUnion('documentType', [invoiceBranch, cancellationBranch])
  .superRefine((draft, ctx) => {
    if (draft.contract.contractCurrency !== draft.contract.payoutCurrency && !draft.fxReference) {
      ctx.addIssue({
        code: 'custom',
        message: 'FX reference is required when contract and payout currencies differ',
        path: ['fxReference'],
      });
    }

    if (draft.documentType === 'cancellation' && !draft.invoiceNumber.startsWith('CN-')) {
      ctx.addIssue({
        code: 'custom',
        message: 'Cancellation invoice number must start with CN-',
        path: ['invoiceNumber'],
      });
    }

    if (draft.documentType === 'invoice' && !draft.invoiceNumber.startsWith('INV-')) {
      ctx.addIssue({
        code: 'custom',
        message: 'Invoice number must start with INV-',
        path: ['invoiceNumber'],
      });
    }

    if (draft.dueDate && draft.dueDate < draft.issueDate) {
      ctx.addIssue({
        code: 'custom',
        message: 'Due date must be on or after issue date',
        path: ['dueDate'],
      });
    }

    if (
      draft.documentType === 'cancellation' &&
      draft.originalInvoice.issueDate > draft.issueDate
    ) {
      ctx.addIssue({
        code: 'custom',
        message: 'Original invoice issue date must be on or before cancellation issue date',
        path: ['originalInvoice', 'issueDate'],
      });
    }
  });

export { documentTypeEnum, localeEnum };
export type InvoiceDraftInput = z.input<typeof invoiceDraftSchema>;
export type InvoiceDraftParsed = z.output<typeof invoiceDraftSchema>;
