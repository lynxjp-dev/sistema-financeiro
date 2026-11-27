const { z } = require('zod');

const CATEGORIES = [
  'Alimentação',
  'Transporte',
  'Moradia',
  'Saúde',
  'Educação',
  'Lazer',
  'Compras',
  'Salário',
  'Investimentos',
  'Outros',
];

function isRealDate(value) {
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

const dateField = z
  .string({ error: 'Data é obrigatória' })
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida (use AAAA-MM-DD)')
  .refine(isRealDate, 'Data inválida');

// Criar e editar uma transação
const transactionSchema = z.object({
  description: z
    .string({ error: 'Descrição é obrigatória' })
    .trim()
    .min(1, 'Descrição é obrigatória')
    .max(200, 'Descrição muito longa (máx. 200)'),
  amount: z
    .number({ error: 'Valor deve ser um número' })
    .positive('O valor deve ser maior que zero')
    .max(999999999.99, 'Valor muito alto')
    .refine((value) => Math.round(value * 100) / 100 === value, 'Use no máximo 2 casas decimais'),
  type: z.enum(['income', 'expense'], { error: 'Tipo deve ser income ou expense' }),
  category: z.enum(CATEGORIES, { error: 'Categoria inválida' }),
  transactionDate: dateField,
});

const listQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(10),
    type: z.enum(['income', 'expense']).optional(),
    category: z.enum(CATEGORIES).optional(),
    search: z.string().trim().min(1).max(100).optional(),
    from: dateField.optional(),
    to: dateField.optional(),
    sort: z.enum(['date_desc', 'date_asc', 'amount_desc', 'amount_asc']).default('date_desc'),
  })
  .refine((data) => !data.from || !data.to || data.from <= data.to, {
    message: 'A data inicial não pode ser maior que a final',
    path: ['from'],
  });

const summaryQuerySchema = z.object({
  from: dateField.optional(),
  to: dateField.optional(),
});

const idParamSchema = z.object({
  id: z.string().uuid('ID inválido'),
});

module.exports = {
  CATEGORIES,
  transactionSchema,
  listQuerySchema,
  summaryQuerySchema,
  idParamSchema,
};