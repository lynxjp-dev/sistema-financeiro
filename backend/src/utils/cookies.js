const env = require('../config/env');

const ACCESS_COOKIE = 'sb-access-token';
const REFRESH_COOKIE = 'sb-refresh-token';

const baseOptions = {
  httpOnly: true,      
  secure: env.isProd,  
  sameSite: 'lax',     
};

function setAuthCookies(res, session) {
  res.cookie(ACCESS_COOKIE, session.access_token, {
    ...baseOptions,
    path: '/',
    maxAge: session.expires_in * 1000, 
  });

  res.cookie(REFRESH_COOKIE, session.refresh_token, {
    ...baseOptions,
    path: '/api/auth', 
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
  });
}

function clearAuthCookies(res) {
  res.clearCookie(ACCESS_COOKIE, { ...baseOptions, path: '/' });
  res.clearCookie(REFRESH_COOKIE, { ...baseOptions, path: '/api/auth' });
}

module.exports = { ACCESS_COOKIE, REFRESH_COOKIE, setAuthCookies, clearAuthCookies };