const crypto = require('crypto');

const ADMIN_TOKEN = 'ml_admin_token_secret';
const TOKEN_SECRET = process.env.AUTH_TOKEN_SECRET || process.env.ADMIN_PASSWORD || 'masterliqours-dev-secret';

function base64Url(input) {
  return Buffer.from(input).toString('base64url');
}

function signPayload(payload) {
  return crypto.createHmac('sha256', TOKEN_SECRET).update(payload).digest('base64url');
}

function createAuthToken(user) {
  const payload = base64Url(JSON.stringify({
    email: user.email,
    role: user.role || 'staff',
    name: user.name || user.email,
    iat: Date.now(),
  }));
  return `ml.${payload}.${signPayload(payload)}`;
}

function verifyAuthToken(token) {
  if (!token) return null;

  if (token === ADMIN_TOKEN) {
    const email = process.env.ADMIN_EMAIL || 'admin@masterliquors.my';
    return { email, role: 'admin', name: 'Admin' };
  }

  const parts = token.split('.');
  if (parts.length !== 3 || parts[0] !== 'ml') return null;

  const [, payload, signature] = parts;
  if (signature !== signPayload(payload)) return null;

  try {
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
}

function getBearerUser(req) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  return verifyAuthToken(token);
}

function requireAuth(req, res, next) {
  const user = getBearerUser(req);
  if (!user) return res.status(401).json({ detail: 'Unauthorized' });
  req.user = user;
  next();
}

module.exports = { ADMIN_TOKEN, createAuthToken, verifyAuthToken, getBearerUser, requireAuth };
