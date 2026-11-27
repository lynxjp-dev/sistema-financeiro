const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const env = require('./config/env');
const { globalLimiter } = require('./middlewares/rateLimiters');
const checkOrigin = require('./middlewares/checkOrigin');
const authRoutes = require('./routes/auth.routes');
const transactionRoutes = require('./routes/transactions.routes');

const app = express();

// Em produção (Vercel), o servidor fica atrás de um proxy
if (env.isProd) app.set('trust proxy', 1);

// 1) Cabeçalhos de segurança
app.use(helmet());

// 2) CORS restritivo: só o seu front-end pode chamar a API pelo navegador
app.use(
  cors({
    origin(origin, callback) {
      // Sem "origin" = ferramentas como Thunder Client/curl (não são navegadores)
      if (!origin || env.allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      callback(new Error('Origem não permitida pelo CORS'));
    },
    credentials: true, // permite enviar/receber cookies
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type'],
  })
);

// 3) Limite geral de requisições
app.use(globalLimiter);

// 4) Leitura de JSON (máx. 10 KB) e de cookies
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

// 5) Confere a origem em ações que alteram dados
app.use(checkOrigin);

// Rotas
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Servidor funcionando' });
});
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);

// Rota inexistente
app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// Tratamento de erros (nunca mostra detalhes internos ao usuário)
app.use((err, req, res, next) => {
  console.error('Erro:', err.message);

  if (err.message && err.message.includes('CORS')) {
    return res.status(403).json({ error: 'Origem não permitida' });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'JSON inválido' });
  }
  res.status(500).json({ error: 'Erro interno do servidor' });
});

module.exports = app;