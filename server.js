require('dotenv').config();
const express = require('express');
const { isSessionSaved } = require('./browser');
const { startLogin, completeLogin } = require('./auth');
const { checkCodPendency, checkRiderDetails } = require('./support');
const { setRiderIP } = require('./rms');

const app = express();
app.use(express.json());

// Simple secret key auth — all requests must include x-secret header
const SECRET = process.env.SERVER_SECRET;
app.use((req, res, next) => {
  if (req.path === '/health') return next();
  if (SECRET && req.headers['x-secret'] !== SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
});

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', session_saved: isSessionSaved() });
});

// ── Step 1: Trigger OTP to your mobile ───────────────────────────────────────
app.post('/login/start', async (req, res) => {
  try {
    const result = await startLogin();
    res.json(result);
  } catch (e) {
    console.error('Login start error:', e.message);
    res.status(500).json({ success: false, error: e.message });
  }
});

// ── Step 2: Submit OTP and save session ──────────────────────────────────────
app.post('/login/complete', async (req, res) => {
  const { otp } = req.body;
  if (!otp) return res.status(400).json({ error: 'otp is required' });
  try {
    const result = await completeLogin(otp);
    res.json(result);
  } catch (e) {
    console.error('Login complete error:', e.message);
    res.status(500).json({ success: false, error: e.message });
  }
});

// ── COD Deduction: check COD Pendency in support portal ──────────────────────
app.post('/check-cod-pendency', async (req, res) => {
  const { rider_id } = req.body;
  if (!rider_id) return res.status(400).json({ error: 'rider_id is required' });
  try {
    const result = await checkCodPendency(rider_id);
    res.json(result);
  } catch (e) {
    console.error('COD pendency check error:', e.message);
    res.status(500).json({ success: false, error: e.message });
  }
});

// ── COD Hold: check rider Group/Status/Client in support portal ──────────────
app.post('/check-rider-details', async (req, res) => {
  const { rider_id } = req.body;
  if (!rider_id) return res.status(400).json({ error: 'rider_id is required' });
  try {
    const result = await checkRiderDetails(rider_id);
    res.json(result);
  } catch (e) {
    console.error('Rider details check error:', e.message);
    res.status(500).json({ success: false, error: e.message });
  }
});

// ── IP Ticket: change rider to IP in RMS ─────────────────────────────────────
app.post('/rms-set-ip', async (req, res) => {
  const { rider_id } = req.body;
  if (!rider_id) return res.status(400).json({ error: 'rider_id is required' });
  try {
    const result = await setRiderIP(rider_id);
    res.json(result);
  } catch (e) {
    console.error('RMS set IP error:', e.message);
    res.status(500).json({ success: false, error: e.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Shadowfax Portal Bot running on port ${PORT}`);
  console.log(`Session saved: ${isSessionSaved()}`);
});
