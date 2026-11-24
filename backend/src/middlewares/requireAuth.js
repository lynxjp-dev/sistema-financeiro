const { supabaseAdmin } = require('../config/supabase');
const { ACCESS_COOKIE } = require('../utils/cookies');

async function requireAuth(req, res, next) {
  const token = req.cookies[ACCESS_COOKIE];
  if (!token) {
    return res.status(401).json({ error: 'Não autenticado' });
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) {
    return res.status(401).json({ error: 'Sessão inválida ou expirada' });
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('id, email, full_name, role, is_active')
    .eq('id', data.user.id)
    .single();

  if (profileError || !profile) {
    return res.status(401).json({ error: 'Perfil não encontrado' });
  }

  if (!profile.is_active) {
    return res.status(403).json({ error: 'Conta desativada' });
  }

  req.user = data.user;
  req.profile = profile;
  req.accessToken = token;
  next();
}

module.exports = requireAuth;