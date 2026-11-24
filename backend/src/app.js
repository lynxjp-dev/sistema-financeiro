const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const env = require('./config/env');
const { globalLimiter } = require('./middlewares/rateLimiters');
const checkOrigin = require('./middlewares/checkOrigin');
const authRoutes = require('./routes/auth.routes');

const app = express();

if (env.isProd) app.set('trust proxy', 1);

app.use(helmet());

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || env.allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      callback(new Error('Origem não permitida pelo CORS'));
    },
    credentials: true, 
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type'],
  })
);

app.use(globalLimiter);

app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

app.use(checkOrigin);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Servidor funcionando' });
});
app.use('/api/auth', authRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

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