const env = require('../config/env');

const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];

function checkOrigin(req, res, next) {
  if (SAFE_METHODS.includes(req.method)) return next();

  const origin = req.get('origin');
  if (origin && !env.allowedOrigins.includes(origin)) {
    return res.status(403).json({ error: 'Origem não permitida' });
  }
  next();
}

module.exports = checkOrigin;