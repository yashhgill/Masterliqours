const express = require('express');
const router = express.Router();
const { createAuthToken, getBearerUser } = require('../services/authTokens');
const {
  frontendUrl,
  getGoogleAuthUrl,
  decodeState,
  exchangeCode,
  verifyIdToken,
  findAllowedUser,
  saveGoogleRefreshToken,
} = require('../services/googleAuth');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@masterliquors.my';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    const user = { email, role: 'admin', name: 'Admin' };
    return res.json({
      token: createAuthToken(user),
      user,
    });
  }
  res.status(401).json({ detail: 'Invalid email or password' });
});

router.get('/google/start', (req, res) => {
  try {
    res.redirect(getGoogleAuthUrl(req.query.redirect || '/admin'));
  } catch (err) {
    res.redirect(`${frontendUrl()}/admin/login?error=${encodeURIComponent(err.message)}`);
  }
});

router.get('/google/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    if (!code) throw new Error('Google did not return a login code');

    const { returnTo = '/admin' } = decodeState(state);
    const token = await exchangeCode(code);
    const identity = await verifyIdToken(token.id_token);
    const allowedUser = findAllowedUser(identity.email);

    if (!allowedUser) {
      return res.redirect(`${frontendUrl()}/admin/login?error=${encodeURIComponent('This Google account is not allowed')}`);
    }

    await saveGoogleRefreshToken(identity.email, token.refresh_token);

    const user = {
      email: identity.email,
      role: allowedUser.role,
      name: allowedUser.name || identity.name,
      staffNumber: allowedUser.staffNumber,
    };
    const appToken = createAuthToken(user);
    res.redirect(`${frontendUrl()}${returnTo}?token=${encodeURIComponent(appToken)}`);
  } catch (err) {
    res.redirect(`${frontendUrl()}/admin/login?error=${encodeURIComponent(err.message)}`);
  }
});

router.get('/me', (req, res) => {
  const user = getBearerUser(req);
  if (user) return res.json(user);
  res.status(401).json({ detail: 'Unauthorized' });
});

router.post('/logout', (req, res) => res.json({ ok: true }));

module.exports = router;
