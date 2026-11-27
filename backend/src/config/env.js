require('dotenv').config();

const required = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'FRONTEND_URL',
  'APP_URL',
];

const missing = required.filter((name) => !process.env[name]);
if (missing.length > 0) {
  console.error('ERRO: faltam estas variáveis no .env:', missing.join(', '));
  process.exit(1);
}

module.exports = {
  port: process.env.PORT || 3000,
  isProd: process.env.NODE_ENV === 'production',
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  allowedOrigins: process.env.FRONTEND_URL.split(',').map((url) => url.trim()),
  appUrl: process.env.APP_URL.trim().replace(/\/$/, ''),
};