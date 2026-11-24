const express = require('express');
const { supabaseAdmin, createAuthClient } = require('../config/supabase');
const validate = require('../middlewares/validate');
const requireAuth = require('../middlewares/requireAuth');
const { authLimiter } = require('../middlewares/rateLimiters');
const { registerSchema, loginSchema } = require('../schemas/auth.schemas');
const {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  setAuthCookies,
  clearAuthCookies,
} = require('../utils/cookies');

const router = express.Router();

function publicUser(profile) {
  return {
    id: profile.id,
    email: profile.email,
    fullName: profile.full_name,
    role: profile.role,
  };
}

async function getProfile(userId) {
  const { data } = await supabaseAdmin
    .from('profiles')
    .select('id, email, full_name, role, is_active')
    .eq('id', userId)
    .single();
  return data;
}


router.post('/register', authLimiter, validate(registerSchema), async (req, res) => {
  const { email, password, fullName } = req.body;

  const { error } = await createAuthClient().auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });

  if (error) {
    console.error('Erro no cadastro:', error.message);
    if (error.status === 429) {
      return res.status(429).json({ error: 'Muitas tentativas. Tente novamente mais tarde.' });
    }
    
    return res.status(400).json({ error: 'Não foi possível concluir o cadastro. Verifique os dados.' });
  }

  res.status(201).json({ message: 'Cadastro realizado com sucesso. Agora é só entrar.' });
});


router.post('/login', authLimiter, validate(loginSchema), async (req, res) => {
  const { email, password } = req.body;

  const { data, error } = await createAuthClient().auth.signInWithPassword({ email, password });

  if (error || !data.session) {
    if (error && error.code === 'email_not_confirmed') {
      return res.status(403).json({ error: 'Confirme seu e-mail antes de entrar.' });
    }
    return res.status(401).json({ error: 'E-mail ou senha inválidos' });
  }

  const profile = await getProfile(data.user.id);
  if (!profile || !profile.is_active) {
    await supabaseAdmin.auth.admin.signOut(data.session.access_token, 'local');
    return res.status(403).json({ error: 'Conta desativada. Fale com o administrador.' });
  }

  setAuthCookies(res, data.session);
  res.json({ user: publicUser(profile) });
});


router.post('/refresh', async (req, res) => {
  const refreshToken = req.cookies[REFRESH_COOKIE];
  if (!refreshToken) {
    return res.status(401).json({ error: 'Não autenticado' });
  }

  const { data, error } = await createAuthClient().auth.refreshSession({
    refresh_token: refreshToken,
  });

  if (error || !data.session) {
    clearAuthCookies(res);
    return res.status(401).json({ error: 'Sessão expirada. Entre novamente.' });
  }

  const profile = await getProfile(data.user.id);
  if (!profile || !profile.is_active) {
    clearAuthCookies(res);
    return res.status(403).json({ error: 'Conta desativada' });
  }

  setAuthCookies(res, data.session);
  res.json({ user: publicUser(profile) });
});


router.post('/logout', async (req, res) => {
  const token = req.cookies[ACCESS_COOKIE];

  if (token) {
    await supabaseAdmin.auth.admin.signOut(token, 'local');
  }

  clearAuthCookies(res);
  res.json({ message: 'Sessão encerrada' });
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: publicUser(req.profile) });
});

module.exports = router;