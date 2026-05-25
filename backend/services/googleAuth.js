const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { STAFF } = require('../config');

const TOKEN_STORE = path.resolve(__dirname, '../data/google_tokens.json');
const GOOGLE_SCOPES = [
  'openid',
  'email',
  'profile',
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file',
];

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

function backendUrl() {
  return (process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 3001}`).replace(/\/$/, '');
}

function frontendUrl() {
  return (process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:3000').replace(/\/$/, '');
}

function redirectUri() {
  return `${backendUrl()}/api/auth/google/callback`;
}

function encodeState(data) {
  const json = Buffer.from(JSON.stringify(data)).toString('base64url');
  const secret = process.env.AUTH_TOKEN_SECRET || process.env.ADMIN_PASSWORD || 'masterliqours-dev-secret';
  const sig = crypto.createHmac('sha256', secret).update(json).digest('base64url');
  return `${json}.${sig}`;
}

function decodeState(state) {
  const [json, sig] = String(state || '').split('.');
  if (!json || !sig) throw new Error('Invalid Google login state');
  const secret = process.env.AUTH_TOKEN_SECRET || process.env.ADMIN_PASSWORD || 'masterliqours-dev-secret';
  const expected = crypto.createHmac('sha256', secret).update(json).digest('base64url');
  if (sig !== expected) throw new Error('Invalid Google login state');
  return JSON.parse(Buffer.from(json, 'base64url').toString('utf8'));
}

function getGoogleAuthUrl(returnTo = '/admin') {
  const params = new URLSearchParams({
    client_id: requiredEnv('GOOGLE_CLIENT_ID'),
    redirect_uri: redirectUri(),
    response_type: 'code',
    scope: GOOGLE_SCOPES.join(' '),
    access_type: 'offline',
    prompt: 'consent',
    state: encodeState({ returnTo, nonce: crypto.randomUUID() }),
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

async function exchangeCode(code) {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: requiredEnv('GOOGLE_CLIENT_ID'),
      client_secret: requiredEnv('GOOGLE_CLIENT_SECRET'),
      redirect_uri: redirectUri(),
      grant_type: 'authorization_code',
    }),
  });

  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function verifyIdToken(idToken) {
  const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
  if (!res.ok) throw new Error('Could not verify Google account');

  const info = await res.json();
  if (info.aud !== requiredEnv('GOOGLE_CLIENT_ID')) throw new Error('Google OAuth client mismatch');
  if (!info.email || info.email_verified !== 'true') throw new Error('Google email is not verified');

  return {
    email: info.email.toLowerCase(),
    name: info.name || info.email,
  };
}

function allowedGoogleUsers() {
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@masterliquors.my').toLowerCase();
  const extraAdmins = (process.env.GOOGLE_ADMIN_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  const users = [
    { email: adminEmail, role: 'admin', name: 'Admin' },
    ...extraAdmins.map((email) => ({ email, role: 'admin', name: email })),
    ...STAFF
      .filter((staff) => staff.email)
      .map((staff) => ({
        email: staff.email.toLowerCase(),
        role: 'staff',
        name: staff.name,
        staffNumber: staff.number,
      })),
  ];

  return users;
}

function findAllowedUser(email) {
  return allowedGoogleUsers().find((user) => user.email === email.toLowerCase()) || null;
}

async function readTokenStore() {
  try {
    return JSON.parse(await fs.readFile(TOKEN_STORE, 'utf8'));
  } catch {
    return {};
  }
}

async function writeTokenStore(tokens) {
  await fs.mkdir(path.dirname(TOKEN_STORE), { recursive: true });
  await fs.writeFile(TOKEN_STORE, JSON.stringify(tokens, null, 2));
}

async function saveGoogleRefreshToken(email, refreshToken) {
  if (!refreshToken) return;
  const tokens = await readTokenStore();
  tokens[email.toLowerCase()] = {
    refreshToken,
    updatedAt: new Date().toISOString(),
  };
  await writeTokenStore(tokens);
}

async function getGoogleAccessToken(email) {
  const tokens = await readTokenStore();
  const refreshToken = tokens[email.toLowerCase()]?.refreshToken;
  if (!refreshToken) throw new Error('This account has not granted Google Sheets access yet. Sign in with Google again.');

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: requiredEnv('GOOGLE_CLIENT_ID'),
      client_secret: requiredEnv('GOOGLE_CLIENT_SECRET'),
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  return data.access_token;
}

module.exports = {
  backendUrl,
  frontendUrl,
  redirectUri,
  getGoogleAuthUrl,
  decodeState,
  exchangeCode,
  verifyIdToken,
  findAllowedUser,
  saveGoogleRefreshToken,
  getGoogleAccessToken,
};
