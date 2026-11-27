const { createClient } = require('@supabase/supabase-js');
const env = require('./env');

const options = {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
};

const supabaseAdmin = createClient(env.supabaseUrl, env.supabaseServiceKey, options);

function createAuthClient() {
  return createClient(env.supabaseUrl, env.supabaseAnonKey, options);
}

function createUserClient(accessToken) {
  return createClient(env.supabaseUrl, env.supabaseAnonKey, {
    ...options,
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}

module.exports = { supabaseAdmin, createAuthClient, createUserClient };