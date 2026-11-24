const { z } = require('zod');

const emailField = z
  .string({ error: 'E-mail é obrigatório' })
  .trim()
  .toLowerCase()
  .max(254, 'E-mail muito longo')
  .email('E-mail inválido');

const registerSchema = z.object({
  fullName: z
    .string({ error: 'Nome é obrigatório' })
    .trim()
    .min(2, 'Nome deve ter ao menos 2 caracteres')
    .max(100, 'Nome muito longo'),
  email: emailField,
  password: z
    .string({ error: 'Senha é obrigatória' })
    .min(8, 'A senha deve ter ao menos 8 caracteres')
    .max(72, 'A senha deve ter no máximo 72 caracteres')
    .regex(/[A-Za-z]/, 'A senha deve ter ao menos uma letra')
    .regex(/[0-9]/, 'A senha deve ter ao menos um número'),
});

const loginSchema = z.object({
  email: emailField,
  password: z
    .string({ error: 'Senha é obrigatória' })
    .min(1, 'Senha é obrigatória')
    .max(72, 'Senha inválida'),
});

module.exports = { registerSchema, loginSchema };