const express = require('express');
const env = require('../config/env');
const { supabaseAdmin, createAuthClient } = require('../config/supabase');
const validate = require('../middlewares/validate');
const requireAuth = require('../middlewares/requireAuth');
const { authLimiter, emailLimiter } = require('../middlewares/rateLimiters');
const {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  confirmEmailSchema,
  resetPasswordSchema,
} = require('../schemas/auth.schemas');
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

  const { data, error } = await createAuthClient().auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${env.appUrl}/confirm-email.html`,
    },
  });

  if (error) {
    console.error('Erro no cadastro:', error.message);
    if (error.status === 429) {
      return res.status(429).json({ error: 'Muitas tentativas. Tente novamente mais tarde.' });
    }
    
    return res.status(400).json({ error: 'Não foi possível concluir o cadastro. Verifique os dados.' });
  }

  const needsConfirmation = !data.session;
  res.status(201).json({
    message: needsConfirmation
      ? 'Cadastro realizado! Enviamos um e-mail de confirmação. Clique no link para ativar sua conta.'
      : 'Cadastro realizado com sucesso. Agora é só entrar.',
  });
});

router.post('/confirm-email', emailLimiter, validate(confirmEmailSchema), async (req, res) => {
  const { tokenHash } = req.body;
  const client = createAuthClient();

  let confirmed = null;
  for (const type of ['email', 'signup']) {
    const { data, error } = await client.auth.verifyOtp({ token_hash: tokenHash, type });
    if (!error && data.session) {
      confirmed = data;
      break;
    }
  }

  if (!confirmed) {
    return res.status(400).json({ error: 'Link inválido ou expirado. Faça o cadastro novamente ou peça um novo link.' });
  }

  await supabaseAdmin.auth.admin.signOut(confirmed.session.access_token, 'local');
  res.json({ message: 'E-mail confirmado! Agora você já pode entrar.' });
});

router.post('/forgot-password', emailLimiter, validate(forgotPasswordSchema), async (req, res) => {
  const { email } = req.body;

  const { error } = await createAuthClient().auth.resetPasswordForEmail(email, {
    redirectTo: `${env.appUrl}/reset-password.html`,
  });

  if (error) {
    console.error('Erro ao pedir recuperação:', error.message);
    if (error.status === 429) {
      return res.status(429).json({ error: 'Muitos pedidos. Tente novamente mais tarde.' });
    }
  }

  // Resposta SEMPRE igual: não revela se o e-mail existe
  res.json({ message: 'Se o e-mail estiver cadastrado, enviaremos um link para redefinir a senha.' });
});

router.post('/reset-password', emailLimiter, validate(resetPasswordSchema), async (req, res) => {
  
  const { tokenHash, password } = req.body;

  const { data, error } = await createAuthClient().auth.verifyOtp({
    token_hash: tokenHash,
    type: 'recovery',
  });

  if (error || !data.user || !data.session) {
    return res.status(400).json({ error: 'Link inválido ou expirado. Peça um novo link de recuperação.' });
  }

  const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(data.user.id, {
    password,
  });

  if (updateError) {
    console.error('Erro ao trocar a senha:', updateError.message);
    return res.status(400).json({
      error: 'Não foi possível trocar a senha. Use uma senha diferente da anterior e peça um novo link.',
    });
  }

  await supabaseAdmin.auth.admin.signOut(data.session.access_token, 'global');
  clearAuthCookies(res);

  res.json({ message: 'Senha alterada com sucesso! Entre com a nova senha.' });
});

// ---------- LOGIN ----------
router.post('/login', authLimiter, validate(loginSchema), async (req, res) => {
  const { email, password } = req.body;

  const { data, error } = await createAuthClient().auth.signInWithPassword({ email, password });

  if (error || !data.session) {
    if (error && error.code === 'email_not_confirmed') {
      return res.status(403).json({ error: 'Confirme seu e-mail antes de entrar. Veja sua caixa de entrada.' });
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