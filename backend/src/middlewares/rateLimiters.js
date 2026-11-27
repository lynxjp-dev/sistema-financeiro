const rateLimit = require('express-rate-limit');

// Limite geral: 300 requisições por IP a cada 15 minutos
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Muitas requisições. Tente novamente em alguns minutos.' },
});

// Limite rígido para login e cadastro: 10 tentativas a cada 15 minutos
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Muitas tentativas. Tente novamente em 15 minutos.' },
});

// Limite para e-mails e códigos (recuperar senha, confirmar e-mail): 5 por hora
const emailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Muitos pedidos. Tente novamente em 1 hora.' },
});

module.exports = { globalLimiter, authLimiter, emailLimiter };