require('dotenv').config();

const express = require('express');
const { createClient } = require('@supabase/supabase-js');

const PORT = process.env.PORT || 3000;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('ERRO: configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no arquivo .env');
  process.exit(1);
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const app = express();

app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Servidor funcionando' });
});

app.get('/api/health/db', async (req, res) => {
  const { data, count, error, status } = await supabaseAdmin
    .from('profiles')
    .select('id', { count: 'exact' })
    .limit(10);

  if (error) {
    return res.status(500).json({ status: 'erro', message: error.message });
  }

  res.json({
    status: 'ok',
    message: 'Conectado ao Supabase',
    httpStatus: status,
    count: count,
    rowsReturned: data ? data.length : 0,
  });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});